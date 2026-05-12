#!/usr/bin/env node

/**
 * Fireworks Switchboard — Migration Compatibility Harness
 *
 * Usage: node harness/run.js <case-file.json>
 *
 * Loads a migration case, auto-detects the source provider,
 * calls the Fireworks API with each target model,
 * validates responses against expectations,
 * and prints a migration compatibility report.
 *
 * Requires FIREWORKS_API_KEY environment variable.
 */

import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import OpenAI from "openai";
import chalk from "chalk";
import { detectProvider } from "./detect.js";
import { validateCase } from "./validate.js";
import { printHeader, printDetection, printModelResult, printRecommendation } from "./report.js";

// --- Load case file ---

const caseFile = process.argv[2];

if (!caseFile) {
  console.error("Usage: node harness/run.js <case-file.json>");
  console.error("Example: node harness/run.js cases/openai-tool-calling.json");
  process.exit(1);
}

const casePath = resolve(process.cwd(), caseFile);
let caseData;

try {
  caseData = JSON.parse(readFileSync(casePath, "utf-8"));
} catch (err) {
  console.error(`Error loading case file: ${casePath}`);
  console.error(err.message);
  process.exit(1);
}

// --- Check for API key ---

const apiKey = process.env.FIREWORKS_API_KEY;

if (!apiKey) {
  console.error(chalk.red("Error: FIREWORKS_API_KEY environment variable is not set."));
  console.error(chalk.dim("Get your API key at https://fireworks.ai and run:"));
  console.error(chalk.dim("  export FIREWORKS_API_KEY=your-key-here"));
  process.exit(1);
}

const client = new OpenAI({
  apiKey,
  baseURL: "https://api.fireworks.ai/inference/v1",
});

// --- Call Fireworks API ---

async function callModel(model, request) {
  const params = {
    model: model.id,
    messages: request.messages,
  };

  // Add tools if present
  if (request.tools) {
    params.tools = request.tools;
    if (request.tool_choice) {
      params.tool_choice = request.tool_choice;
    }
  }

  // Add response_format if present
  if (request.response_format) {
    params.response_format = request.response_format;
  }

  const startTime = Date.now();

  try {
    const response = await client.chat.completions.create(params);
    const latencyMs = Date.now() - startTime;

    return {
      success: true,
      response: {
        choices: response.choices.map((c) => ({
          message: {
            role: c.message.role,
            content: c.message.content,
            tool_calls: c.message.tool_calls
              ? c.message.tool_calls.map((tc) => ({
                  id: tc.id,
                  type: tc.type,
                  function: {
                    name: tc.function.name,
                    arguments: tc.function.arguments,
                  },
                }))
              : null,
          },
          finish_reason: c.finish_reason,
        })),
      },
      latencyMs,
    };
  } catch (err) {
    return {
      success: false,
      error: err.message,
      latencyMs: Date.now() - startTime,
    };
  }
}

// --- Run the harness ---

async function run() {
  // Step 1: Print header
  printHeader(caseData);

  // Step 2: Auto-detect source provider
  const detection = detectProvider(caseData.sourceCode);
  printDetection(detection);

  // Step 3: Call each target model and validate
  const modelReports = [];

  for (const model of caseData.targetModels) {
    console.log(chalk.dim(`  Calling ${model.displayName}...`));

    const result = await callModel(model, caseData.request);

    if (!result.success) {
      console.log(chalk.red(`  Error: ${result.error}`));
      console.log();
      modelReports.push({
        model,
        overallStatus: "not-recommended",
        notes: [`API error: ${result.error}`],
      });
      continue;
    }

    console.log(chalk.dim(`  Response received (${result.latencyMs}ms)`));

    const validationResults = validateCase(caseData, result.response);
    const report = printModelResult(model, validationResults, result.latencyMs);
    modelReports.push(report);
  }

  // Step 4: Print recommendation
  printRecommendation(caseData, modelReports);
}

run().catch((err) => {
  console.error(chalk.red(`Fatal error: ${err.message}`));
  process.exit(1);
});
