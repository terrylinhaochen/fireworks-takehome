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

  if (overallStatus === "ready") {
    notes.push("Drop-in compatible. Change base_url and model string only.");
  }

  for (const r of results) {
    if (r.status === "partial") {
      // Extract actionable advice from the detail
      if (r.detail.includes("unrequested parameter")) {
        notes.push('Add "only use required parameters" to system prompt.');
      }
      if (r.detail.includes("Extra fields")) {
        notes.push("Add explicit JSON schema in system prompt to constrain output fields.");
      }
      if (r.detail.includes("not in allowed values")) {
        notes.push("Enumerate allowed values in system prompt for stricter adherence.");
      }
      if (r.detail.includes("expected number")) {
        notes.push("Specify value range constraints explicitly in prompt.");
      }
    }
    if (r.status === "fail") {
      if (r.detail.includes("did not produce any tool calls")) {
        notes.push("This model may not support tool calling. Try a larger model or use tool_choice=\"required\".");
      }
    }
  }

  return notes;
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
  const notes = getMigrationNotes(results, overallStatus);

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
    console.log(chalk.dim("  Notes:"));
    for (const note of notes) {
      console.log(chalk.dim(`    • ${note}`));
    }
  }

  console.log();

  return { model, overallStatus, notes };
}

export function printRecommendation(caseData, modelReports) {
  const bestModel = modelReports.find((m) => m.overallStatus === "ready");
  const skillFile =
    caseData.sourceProvider === "openai"
      ? "skills/openai-to-fireworks.md"
      : `skills/${caseData.sourceProvider}-to-fireworks.md`;

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
