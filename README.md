# Fireworks Switchboard

Agent skills + test harness for migrating AI workflows from closed models (GPT, Claude, Kimi) to open models on [Fireworks AI](https://fireworks.ai).

Inspired by [Stripe's agent skills](https://docs.stripe.com/building-with-ai) — a container of knowledge files and a runnable harness that coding agents (Claude Code, Codex, Cursor) pick up to guide developers through model migration.

## Quick Start

```bash
npm install
export FIREWORKS_API_KEY=your-key-here
node harness/run.js cases/openai-tool-calling.json
node harness/run.js cases/kimi-structured-output.json
```

Get your API key at [fireworks.ai](https://fireworks.ai).

## What's Inside

```
skills/              → Fat skills layer (agent-consumable migration knowledge)
  index.json         → Skill manifest
  recommended-models.md → Fireworks model recommendations by use case
  openai-to-fireworks.md → OpenAI migration playbook
  kimi-to-fireworks.md   → Kimi/Moonshot migration playbook

cases/               → Sample migration test cases
  openai-tool-calling.json     → OpenAI function calling → Fireworks
  kimi-structured-output.json  → Kimi JSON mode → Fireworks

harness/             → Thin harness (test runner)
  run.js             → Entry point: calls Fireworks API + validates
  detect.js          → Auto-detect source provider from code
  validate.js        → Validate model outputs against expectations
  report.js          → Format terminal report

docs/
  overview.md        → 1-page design doc
```

## How It Works

1. Load a migration case (JSON file defining source code, target models, expectations)
2. Auto-detect the source provider from the code snippet
3. Call the Fireworks API with each target model using the case's request parameters
4. Validate real model responses against expectations (tool call correctness, JSON schema adherence)
5. Print a migration compatibility report with pass/partial/fail per dimension and latency

## Design Doc

See [docs/overview.md](docs/overview.md) for the 1-page design overview.
