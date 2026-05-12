#!/usr/bin/env node

/**
 * Fireworks Switchboard — Migration Compatibility Harness
 *
 * Usage: node harness/run.js <case-file.json>
 *
 * Loads a migration case, auto-detects the source provider,
 * validates mock model outputs against expectations,
 * and prints a migration compatibility report.
 */

import { readFileSync } from "node:fs";
import { resolve } from "node:path";
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

// --- Run the harness ---

// Step 1: Print header
printHeader(caseData);

// Step 2: Auto-detect source provider
const detection = detectProvider(caseData.sourceCode);
printDetection(detection);

// Step 3: Validate each target model
const modelReports = [];

for (const model of caseData.targetModels) {
  const results = validateCase(caseData, model.id);
  const report = printModelResult(model, results);
  modelReports.push(report);
}

// Step 4: Print recommendation
printRecommendation(caseData, modelReports);
