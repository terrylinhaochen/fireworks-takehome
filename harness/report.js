/**
 * Report formatter.
 * Takes validation results and prints a formatted migration compatibility report.
 */

import chalk from "chalk";

const STATUS_ICONS = {
  pass: chalk.green("✓ pass"),
  partial: chalk.yellow("◐ partial"),
  fail: chalk.red("✗ fail"),
};

const OVERALL_STATUS = {
  ready: chalk.green.bold("READY"),
  "needs-work": chalk.yellow.bold("NEEDS WORK"),
  "not-recommended": chalk.red.bold("NOT RECOMMENDED"),
};

function getOverallStatus(results) {
  const hasFail = results.some((r) => r.status === "fail");
  const hasPartial = results.some((r) => r.status === "partial");

  if (hasFail) return "not-recommended";
  if (hasPartial) return "needs-work";
  return "ready";
}

function getMigrationNotes(results, overallStatus) {
  const notes = [];
  const fixes = [];

  if (overallStatus === "ready") {
    notes.push("Drop-in compatible. Change base_url and model string only.");
  }

  for (const r of results) {
    if (r.status === "partial") {
      if (r.detail.includes("unrequested parameter")) {
        fixes.push({
          issue: "Model adds arguments not in tool schema",
          fix: 'Add to system prompt: "Only include parameters explicitly listed in the tool schema. Do not add extra parameters."',
          alt: "Add post-processing to strip unknown keys from tool_call arguments before passing to your function.",
        });
      }
      if (r.detail.includes("Extra fields")) {
        fixes.push({
          issue: "Model returns extra JSON fields not in expected schema",
          fix: "Add the exact JSON schema to your system prompt, e.g.: 'Return JSON with exactly these fields and no others: ...'",
          alt: "Add post-processing to pick only expected keys from the parsed JSON.",
        });
      }
      if (r.detail.includes("not in allowed values")) {
        fixes.push({
          issue: "Model returns values outside the allowed set",
          fix: 'Enumerate valid values in system prompt: "sentiment must be one of: positive, negative, neutral"',
          alt: "Add a validation layer that maps unexpected values to the nearest allowed value.",
        });
      }
      if (r.detail.includes("expected number")) {
        fixes.push({
          issue: "Model returns numbers in wrong range (e.g., 82 instead of 0.82)",
          fix: 'Specify range in system prompt: "confidence must be a float between 0.0 and 1.0"',
          alt: "Add post-processing: if value > 1, divide by 100.",
        });
      }
    }
    if (r.status === "fail") {
      if (r.detail.includes("did not produce any tool calls")) {
        fixes.push({
          issue: "Model ignores tools and responds with plain text",
          fix: 'Set tool_choice="required" to force tool use, or try a larger model (this model may lack tool calling support).',
          alt: "Fall back to a prompt-based approach: ask the model to output a JSON object matching the tool schema.",
        });
      }
      if (r.detail.includes("not valid JSON")) {
        fixes.push({
          issue: "Model output is not valid JSON despite json_object mode",
          fix: "Try a larger model — small models often struggle with strict JSON mode. Add explicit format instructions to system prompt.",
          alt: "Wrap the response in a try/catch and retry with a stronger prompt on parse failure.",
        });
      }
    }
  }

  return { notes, fixes };
}

export function printDetection(detection) {
  console.log();
  console.log(chalk.blue("🔍 Detecting source provider..."));
  console.log(
    `   Provider: ${chalk.bold(detection.provider.charAt(0).toUpperCase() + detection.provider.slice(1))} (${detection.confidence} confidence)`
  );
  console.log(`   Signals: ${detection.signals.join(", ")}`);
  console.log();
}

export function printModelResult(model, results, latencyMs) {
  const overallStatus = getOverallStatus(results);
  const { notes, fixes } = getMigrationNotes(results, overallStatus);

  const header = `  ${model.displayName}`;
  const latencyStr = latencyMs ? chalk.dim(` (${latencyMs}ms)`) : "";
  const statusLabel = OVERALL_STATUS[overallStatus];
  const padding = Math.max(2, 50 - header.length - overallStatus.length);

  console.log(chalk.dim("  " + "─".repeat(50)));
  console.log(`${header}${latencyStr}${" ".repeat(padding)}${statusLabel}`);
  console.log(chalk.dim("  " + "─".repeat(50)));

  for (const r of results) {
    console.log(`  ${r.dimension.padEnd(22)} ${STATUS_ICONS[r.status]}`);
    if (r.status !== "pass") {
      console.log(chalk.dim(`${"".padEnd(4)}${r.detail}`));
    }
  }

  if (notes.length > 0) {
    console.log();
    for (const note of notes) {
      console.log(chalk.dim(`  ${note}`));
    }
  }

  if (fixes.length > 0) {
    console.log();
    console.log(chalk.yellow("  Fixes:"));
    for (const f of fixes) {
      console.log(chalk.yellow(`    → ${f.issue}`));
      console.log(chalk.white(`      Fix: ${f.fix}`));
      console.log(chalk.dim(`      Alt: ${f.alt}`));
    }
  }

  console.log();

  return { model, overallStatus, notes, fixes };
}

export function printRecommendation(caseData, modelReports) {
  const bestModel = modelReports.find((m) => m.overallStatus === "ready");
  const skillFile =
    caseData.sourceProvider === "openai"
      ? "skills/openai-to-fireworks/SKILL.md"
      : `skills/${caseData.sourceProvider}-to-fireworks/SKILL.md`;

  console.log(chalk.dim("─".repeat(54)));

  if (bestModel) {
    console.log(
      chalk.green(`📋 Recommendation: ${bestModel.model.displayName} is the best drop-in replacement.`)
    );
    console.log(chalk.dim(`   See ${skillFile} for migration steps.`));
  } else {
    const partial = modelReports.find((m) => m.overallStatus === "needs-work");
    if (partial) {
      console.log(
        chalk.yellow(
          `📋 Recommendation: ${partial.model.displayName} can work with prompt adjustments.`
        )
      );
      console.log(chalk.dim(`   See ${skillFile} for migration steps and workarounds.`));
    } else {
      console.log(
        chalk.red(
          "📋 Recommendation: No tested model is a direct replacement. Consider trying additional models."
        )
      );
    }
  }

  console.log();
}

export function printHeader(caseData) {
  console.log();
  console.log(chalk.bold(`🧪 Fireworks Switchboard: Migration Compatibility Check`));
  console.log(chalk.dim(`   Case: ${caseData.title}`));
  console.log(chalk.dim(`   Features: ${caseData.features.join(", ")}`));
  console.log(
    chalk.dim(`   Testing against ${caseData.targetModels.length} Fireworks model(s)...`)
  );
}
