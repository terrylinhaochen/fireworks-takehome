# Fireworks Switchboard: Design Overview

## Problem

Migrating from closed AI models (GPT, Claude) to open models on Fireworks is mechanically simple — change the base URL, API key, and model ID. But **behavioral compatibility** is uncertain. Tool calling semantics, JSON output formats, argument handling, and response patterns can differ enough to break production workflows. Engineers need confidence before switching.

## Solution

Fireworks Switchboard is an **agent skills + test harness** package — modeled after Stripe's agent skills approach. It gives coding agents (Claude Code, Codex, Cursor) the knowledge and tools to help developers migrate safely.

**Fat Skills**: Markdown files containing migration playbooks — which models to use, what code to change, known behavioral differences, and validation checklists. Agents read these to understand the migration context.

**Thin Harness**: A test runner that loads migration cases (JSON), auto-detects the source provider, validates model outputs against expectations, and prints a compatibility report. No scoring — just pass/partial/fail per dimension with actionable notes.

## Key Choices

1. **Agent-first, not UI-first.** The tool is designed to be consumed by coding agents, not operated through a dashboard. Skills are plain markdown (like Stripe's `.well-known/skills/`). The harness is a CLI script. This matches how developers actually migrate — with an AI agent in their IDE.

2. **Real API calls.** The harness calls the Fireworks API directly with each target model, validates real responses against expectations, and reports latency. This tests actual behavioral compatibility, not simulated results.

3. **Report, not scores.** Each dimension gets pass/partial/fail with a human-readable explanation. No weighted scoring or numeric grades. The goal is actionable clarity: what works, what breaks, and what to fix.

4. **Real model recommendations.** The skills reference actual Fireworks model data (from docs.fireworks.ai/guides/recommended-models) so the migration advice is grounded, not generic.

## How It Works

```bash
$ node harness/run.js cases/openai-tool-calling.json
# Auto-detects OpenAI, tests against Kimi K2.6 + DeepSeek V3.2 + Qwen 3 8B,
# prints per-model compatibility report with pass/partial/fail dimensions
```

## What Would Come Next

- **Custom case builder**: Let agents generate case files from existing codebases automatically
- **More provider skills**: Claude-to-Fireworks, Gemini-to-Fireworks
- **npx install**: `npx skills add fireworks-switchboard` (like Stripe's model)
- **MCP server**: Expose the harness as MCP tools so agents can run checks programmatically
- **Regression testing**: Re-run cases after model updates to catch behavioral changes
