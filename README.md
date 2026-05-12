# Fireworks Switchboard

Migrating from GPT or Claude to open models on Fireworks is easy at the API level — change the base URL, key, and model ID. But **behavioral compatibility** is the real risk: will your tool calls still work? Will JSON output match your schema? Will the model follow your system prompt the same way?

Fireworks Switchboard answers that question before you ship. It's two things:

1. **Agent skills** — migration playbooks your coding agent (Claude Code, Cursor, Codex) reads to understand how to migrate your code
2. **A test harness** — a CLI that calls the Fireworks API with your workflow, validates the response, and tells you what works and what breaks

## Install the Agent Skills

Install the migration skills into your coding agent:

```bash
# Install for Claude Code + Codex (recommended)
npx skills add terrylinhaochen/fireworks-takehome -a claude-code -a codex -y

# Or install for all detected agents
npx skills add terrylinhaochen/fireworks-takehome -y
```

This gives your agent three skills:
- `fireworks-migration` — Model selection guide: which Fireworks model replaces GPT-4o, Claude Sonnet, etc.
- `openai-to-fireworks` — Step-by-step OpenAI migration playbook (tool calling, JSON mode, streaming)
- `kimi-to-fireworks` — Step-by-step Kimi/Moonshot migration playbook

After installing, your agent can help you migrate by reading these skills automatically.

## Run the Test Harness

The harness calls the real Fireworks API to test behavioral compatibility:

```bash
git clone https://github.com/terrylinhaochen/fireworks-takehome.git
cd fireworks-takehome
npm install
export FIREWORKS_API_KEY=your-key-here  # Get one at fireworks.ai
node harness/run.js cases/openai-tool-calling.json
```

## Demo: What It Looks Like

**Case 1: OpenAI tool calling → Fireworks**

Tests whether Fireworks models correctly handle `tool_calls` with a weather assistant that uses `get_weather`:

```
🧪 Fireworks Switchboard: Migration Compatibility Check
   Case: OpenAI Tool Calling → Fireworks
   Features: tool-calling
   Testing against 3 Fireworks model(s)...

🔍 Detecting source provider...
   Provider: Openai (high confidence)
   Signals: imports openai SDK, GPT model identifier, tool_choice parameter

  Calling Kimi K2.6...
  ──────────────────────────────────────────────────
  Kimi K2.6 (1552ms)                          READY
  ──────────────────────────────────────────────────
  Tool Call Format       ✓ pass
  Argument Extraction    ✓ pass
  JSON Validity          ✓ pass

  Notes:
    • Drop-in compatible. Change base_url and model string only.

  Calling DeepSeek V3.2...
  ──────────────────────────────────────────────────
  DeepSeek V3.2 (4927ms)                      READY
  ──────────────────────────────────────────────────
  Tool Call Format       ✓ pass
  Argument Extraction    ✓ pass
  JSON Validity          ✓ pass

  Notes:
    • Drop-in compatible. Change base_url and model string only.

  Calling Qwen 3 8B...
  ──────────────────────────────────────────────────
  Qwen 3 8B (1537ms)                          READY
  ──────────────────────────────────────────────────
  Tool Call Format       ✓ pass
  Argument Extraction    ✓ pass
  JSON Validity          ✓ pass

📋 Recommendation: Kimi K2.6 is the best drop-in replacement.
   See skills/openai-to-fireworks/SKILL.md for migration steps.
```

**Case 2: Kimi structured output → Fireworks**

Tests JSON schema adherence for a sentiment classifier migrating from Kimi to Fireworks:

```
🧪 Fireworks Switchboard: Migration Compatibility Check
   Case: Kimi Structured Output → Fireworks
   Features: structured-output, json-mode, system-prompt

  Kimi K2.6 (838ms)                           READY
  JSON Validity          ✓ pass
  Schema Adherence       ✓ pass
  Field Constraints      ✓ pass

  MiniMax 2.5 (1210ms)                        READY
  JSON Validity          ✓ pass
  Schema Adherence       ✓ pass
  Field Constraints      ✓ pass

  Qwen 3 8B (24169ms)               NOT RECOMMENDED
  JSON Validity          ✗ fail
    Output is not valid JSON.

📋 Recommendation: Kimi K2.6 is the best drop-in replacement.
```

The harness surfaces real behavioral differences — like Qwen 3 8B failing JSON mode — before they break production.

## How It Works

```
skills/                    "Fat" knowledge layer — what agents read
├── fireworks-migration/   Model selection guide + mapping tables
├── openai-to-fireworks/   OpenAI migration playbook
└── kimi-to-fireworks/     Kimi migration playbook

cases/                     Test case definitions
├── openai-tool-calling.json     Source code + API request + expectations
└── kimi-structured-output.json  Source code + API request + expectations

harness/                   "Thin" test runner
├── run.js                 Calls Fireworks API, validates, reports
├── detect.js              Auto-detects source provider from code
├── validate.js            Checks tool calls, JSON schema, field constraints
└── report.js              Formats terminal output
```

The design follows the **thin harness, fat skills** pattern: keep the runner small and deterministic, put the migration knowledge in editable skill files that agents can read and act on.

## Writing Your Own Case

Create a JSON file in `cases/` with:

```json
{
  "id": "my-migration-case",
  "title": "My Workflow → Fireworks",
  "sourceProvider": "openai",
  "sourceCode": "... your current code ...",
  "features": ["tool-calling"],
  "request": {
    "messages": [{"role": "user", "content": "..."}],
    "tools": [{ "type": "function", "function": { "name": "...", ... } }]
  },
  "expectations": {
    "tool_call_name": "expected_function_name",
    "required_args": ["arg1", "arg2"]
  },
  "targetModels": [
    { "id": "accounts/fireworks/models/kimi-k2p6", "displayName": "Kimi K2.6" }
  ]
}
```

Then run: `node harness/run.js cases/my-migration-case.json`

## Design Doc

See [docs/overview.md](docs/overview.md) for the 1-page design overview explaining key choices.
