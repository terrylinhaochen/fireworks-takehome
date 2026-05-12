# Fireworks Switchboard: Migration Compatibility Harness

## 1. Executive Summary

Fireworks has already made the basic API migration from closed models to open models feel familiar. For many OpenAI-based applications, the first mechanical step is only changing the API key, base URL, and model ID. That means the hard customer problem is not "I cannot read the docs" or "I do not know how to call Fireworks." The hard problem is: "My GPT or Claude workflow already works. Which Fireworks model can preserve the same behavior at lower cost or lower latency, and what changes do I need before I can ship safely?"

Fireworks Switchboard is an agent-guided migration compatibility harness. It replays a customer's existing AI workflow traces against candidate Fireworks models, scores behavioral compatibility, identifies where the migration breaks down, and recommends the best model/configuration plus minimal fixes.

The prototype should focus on one high-signal wedge: tool-calling and structured-output workflows. These workflows are where "OpenAI-compatible" most visibly stops being the same as "behavior-compatible." The API payload may look similar, but tool call timing, argument validity, JSON shape, retries, hidden reasoning state, and schema adherence can change enough to break production workflows.

## 2. Problem Definition

### Customer Context

The target user is an engineer or AI product engineer at a company that already has a working GPT/Claude-based workflow. They are considering Fireworks because they want some combination of:

- lower inference cost
- lower latency
- open-model control
- less dependency on closed model providers
- model customization or fine-tuning later
- better economics for high-volume agentic workloads

The user is not starting from a blank prompt. They already have prompts, tool schemas, traces, retry logic, validation logic, and expected output behavior. Their fear is not "how do I call Kimi?" Their fear is "will Kimi or MiniMax behave enough like my existing model that my product does not regress?"

### Core Pain

The API migration is easy, but the behavior migration is uncertain.

Existing AI workflows are usually tuned around a provider-specific behavioral contract:

- GPT-specific or Claude-specific prompt idioms
- provider-specific tool calling assumptions
- expected JSON structure and formatting
- expected response length and tone
- expected refusal or safety behavior
- hidden retry logic that assumes certain failure modes
- output parsers that were only tested against one model family
- cost assumptions based on one tokenizer and one average response shape

When a team switches to an open model on Fireworks, the same prompt and code may still run, but the workflow may fail in production because the new model calls tools differently, produces invalid JSON, returns a different final answer shape, requires different sampling settings, loops more, or needs fallback on edge cases.

### Product Thesis

Fireworks should not only help users choose a model from a documentation table. It should help users test their own workflows and produce a migration recommendation.

In one sentence:

> Fireworks Switchboard turns "which open model should I switch to?" from a documentation/research problem into a concrete compatibility test against the customer's own traces.

## 3. Evidence And Source Grounding

### Fireworks Already Solves The Basic API Surface

Fireworks supports OpenAI-compatible API usage and publishes guidance for querying text models. This means the basic API-call migration is intentionally familiar.

Relevant docs:

- Fireworks text querying guide: https://docs.fireworks.ai/guides/querying-text-models
- Fireworks recommended models guide: https://docs.fireworks.ai/guides/recommended-models

### Fireworks Already Knows Model Selection Is A Migration Problem

The Fireworks recommended models guide maps use cases and closed-model alternatives to candidate open models. That is useful, but it is still a generic recommendation layer. It cannot answer whether a specific customer's prompt, tool schema, and agent loop will preserve behavior.

The gap is not "which models exist?" It is "which model works for my traces?"

### Tool And Agentic Behavior Is The Sharpest Migration Risk

Fireworks' Kimi K2.5 production post is especially useful because it highlights that subtle quality and reliability problems show up in layered agentic tests, including tool-calling behavior and inference settings:

- Fireworks Kimi K2.5 production lessons: https://fireworks.ai/blog/quality-first-with-kimi-k2p5

MiniMax's own writing on interleaved thinking also points to the same class of issue: agent reliability depends on preserving state across tool turns, and the API shape can affect that:

- MiniMax interleaved thinking: https://www.minimax.io/news/why-is-interleaved-thinking-important-for-m2

Public migration writeups and GitHub issues also show that "OpenAI-compatible" endpoints can still break when an agent framework sends provider-specific metadata, expects exact tool-call semantics, or handles finish reasons incorrectly.

### Thin Harness, Fat Skills Relevance

The Garry Tan / Steve Yegge "thin harness, fat skills" idea is useful here, but the prototype should apply it concretely rather than name-drop it.

Principle:

- Keep the runner small and deterministic.
- Put model/provider migration judgment into editable skill files.
- Let the agent use those skills to diagnose failures and propose fixes.

Reference:

- Thin harness/fat skills explainer: https://yage.ai/share/thin-harness-fat-skills-en-20260414.html

## 4. Target User And Job-To-Be-Done

### Primary Persona

AI product engineer / full-stack engineer responsible for a production AI workflow.

They may have:

- an OpenAI or Claude implementation already live
- a few saved traces from production or staging
- tool/function calling
- structured JSON output requirements
- retry/fallback logic
- pressure from leadership to reduce inference spend

### Job-To-Be-Done

When I am considering moving a working GPT/Claude workflow to Fireworks, I want to run my real traces against candidate Fireworks models, so I can identify the best model/configuration and know what will break before I ship.

### What They Do Not Want

- A generic model playground
- A long documentation hunt
- A benchmark leaderboard detached from their use case
- A vague answer like "Kimi is good for agents"
- A large SDK/framework rewrite
- A manual eval harness project

## 5. Product Scope

### Prototype Focus

The prototype should focus on:

1. tool-calling compatibility
2. structured-output compatibility
3. model/config recommendation
4. cost per successful workflow

Do not try to cover every kind of migration. Avoid broad "compare any prompt across any model" behavior. That becomes a generic playground.

### Prototype Name

Working name: Fireworks Switchboard

Alternate names:

- Fireworks Migration Fit Test
- Fireworks Model Match
- Fireworks Agent Switchboard
- Fireworks Compatibility Runner

Recommended: Fireworks Switchboard, because it implies routing a working workflow to the right open model.

## 6. User Flow

### Ideal Full Product Flow

1. User installs or opens Switchboard.
2. User selects current provider: OpenAI or Anthropic.
3. User provides one of:
   - uploaded trace file
   - pasted request payload
   - sample prompt + tool schema
   - SDK instrumentation snippet that records traces
4. User picks migration goal:
   - lowest cost with same behavior
   - lowest latency with same behavior
   - best behavioral match
   - best tool-calling reliability
5. Switchboard suggests candidate Fireworks models.
6. Switchboard runs the traces against those candidates.
7. Switchboard validates tool calls and structured outputs.
8. Switchboard uses deterministic checks plus LLM judgment to compare behavior.
9. Switchboard ranks model/config combinations.
10. Switchboard generates a migration report with recommended model, settings, risks, and minimal patches.

### 2-Hour Prototype Flow

For the take-home, keep the flow smaller:

1. User opens a local web app or CLI.
2. User loads a sample "existing GPT/Claude workflow" trace or pastes their own.
3. User selects target models: Kimi K2.6, MiniMax M2.5, DeepSeek V3.2.
4. App shows simulated or live-ready test results.
5. App produces a ranked migration report.

The prototype can use mock model outputs for reliability and speed, as long as the architecture makes clear where live Fireworks calls plug in.

## 7. Core Concept: Migration Case

The central data object should be a migration case, not just a prompt.

Example:

```json
{
  "id": "billing_update_001",
  "name": "Update customer billing plan",
  "baseline_provider": "openai",
  "baseline_model": "gpt-5.5",
  "goal": "preserve tool behavior at lower cost",
  "messages": [
    {
      "role": "system",
      "content": "You are a billing support agent. Use tools before making account changes."
    },
    {
      "role": "user",
      "content": "Move Acme Corp to the annual pro plan starting next month."
    }
  ],
  "tools": [
    {
      "name": "lookup_customer",
      "description": "Find a customer by name.",
      "schema": {
        "type": "object",
        "properties": {
          "customer_name": { "type": "string" }
        },
        "required": ["customer_name"]
      }
    },
    {
      "name": "update_plan",
      "description": "Update a customer's billing plan.",
      "schema": {
        "type": "object",
        "properties": {
          "customer_id": { "type": "string" },
          "plan": { "type": "string", "enum": ["free", "pro_monthly", "pro_annual"] },
          "effective_date": { "type": "string" }
        },
        "required": ["customer_id", "plan", "effective_date"]
      }
    }
  ],
  "baseline_behavior": {
    "tool_sequence": ["lookup_customer", "update_plan"],
    "final_answer_style": "brief confirmation",
    "must_not": ["ask for customer id", "skip lookup_customer"]
  },
  "success_criteria": [
    "Calls lookup_customer before update_plan",
    "Uses pro_annual as the plan value",
    "Does not invent a customer_id before lookup",
    "Final answer is concise and confirms the scheduled change"
  ]
}
```

This object is what lets the system test behavior instead of merely testing text similarity.

## 8. Scoring Model

### Overall Score

Each model/config run receives a score from 0 to 100.

Recommended weighting for the prototype:

- 35 percent tool-call correctness
- 25 percent structured-output validity
- 20 percent behavioral match
- 10 percent latency
- 10 percent cost per successful task

For agentic workflows, tool-call correctness should matter more than prose similarity. A model that writes a plausible final answer but skips the required tool call is not compatible.

### Deterministic Checks

These should be implemented in code, not left to an LLM judge:

- valid JSON parse
- schema validation passes
- required fields present
- enum values are valid
- expected tool name is called
- forbidden tool is not called
- tool sequence matches requirement
- no duplicate destructive tool call
- no missing final answer
- retry count under threshold

### LLM/Judge Checks

Use model judgment only where deterministic checks are insufficient:

- Does the response preserve user intent?
- Is the answer semantically equivalent to baseline?
- Did the model ask an unnecessary clarification?
- Did tone or verbosity drift materially?
- Did the model follow the domain policy?

The judge should explain failures in plain English so the engineer can act on them.

### Cost Per Successful Task

Do not rank only by token price. Rank by:

```text
cost_per_success = total_run_cost / successful_cases
```

A cheaper model that requires retries, emits verbose outputs, or fails high-value cases may be worse than a more expensive model that succeeds first try.

## 9. Candidate Model Selection

### Input Signals

Switchboard should use a small resolver to choose candidate models based on workflow traits:

- tool-heavy agentic workflow
- structured output / JSON workflow
- long context workflow
- coding workflow
- summarization/classification workflow
- low-latency workflow
- low-cost high-volume workflow

### Prototype Candidates

For the prototype, hardcode 3-4 candidates:

- Kimi K2.6 for agentic/tool/coding style workloads
- MiniMax M2.5 for agentic/reasoning workloads where interleaved thinking may matter
- DeepSeek V3.2 for broad reasoning/cost-sensitive tasks
- smaller Qwen or GLM model as low-latency/low-cost option if useful

The point is not to perfectly cover Fireworks' catalog. The point is to show model selection is driven by workflow evidence.

### Recommendation Output

Example:

```text
Recommended: Kimi K2.6
Config: temperature 0.2, max_tokens 1200, tool_choice auto
Why: Highest tool-call correctness and best cost per successful task.
Risk: Case billing_update_004 failed because the model skipped lookup before update.
Fix: Add explicit instruction: "Never call update_plan before lookup_customer returns customer_id."
Fallback: Keep GPT-5.5 fallback for destructive billing updates until 50 production traces pass.
```

## 10. Skill Layer Design

### Why Skills

The thin harness should not hardcode every migration rule. Model and provider behavior changes quickly. Skill files let the migration knowledge evolve without turning the runner into a large framework.

### Suggested Skill Files

```text
skills/
  openai_to_fireworks.md
  claude_to_fireworks.md
  kimi_tool_calling.md
  minimax_interleaved_thinking.md
  structured_outputs.md
  cost_per_success.md
  migration_report.md
```

### Skill Responsibilities

`openai_to_fireworks.md`

- base URL and API compatibility notes
- common OpenAI-specific assumptions
- Responses API vs Chat Completions differences
- structured output and function calling migration notes

`claude_to_fireworks.md`

- XML prompt idioms
- Claude tool-use blocks
- prefill assumptions
- long context and instruction hierarchy differences

`kimi_tool_calling.md`

- good fit cases
- tool-call risk patterns
- recommended prompt/config patterns
- failure signatures

`minimax_interleaved_thinking.md`

- when interleaved reasoning state matters
- multi-turn tool use considerations
- prompt patterns for reliable tool continuation

`structured_outputs.md`

- schema complexity checks
- retry/repair pattern
- deterministic validation rules
- common JSON drift patterns

`cost_per_success.md`

- token price is not enough
- include retries and failures
- compare latency/cost only among acceptable behavior matches

`migration_report.md`

- report format
- recommendation language
- severity labels
- next-step patch format

## 11. Harness Architecture

### Thin Harness Responsibilities

The harness should do only a few deterministic things:

- load migration cases
- load model candidates
- call baseline/candidate providers
- capture output, tokens, latency, errors
- validate tool calls and JSON
- invoke judge where needed
- compute scores
- render report

### Out Of Scope For The Harness

Avoid building:

- a full agent framework
- a full observability platform
- a generic model playground
- a replacement for LangChain/LlamaIndex
- a giant provider abstraction
- a custom eval DSL beyond what the prototype needs

### Runtime Shape

For the take-home, either of these is acceptable:

Option A: Local web app

- Vite/React or Next.js
- mock/live-ready API layer
- polished report UI
- easier to share visually

Option B: CLI plus generated HTML report

- Node or Python CLI
- reads JSON fixture
- outputs terminal summary and HTML/Markdown report
- feels more engineer-native

Recommended for this assignment: local web app with a "Load sample trace" button and generated exportable report. It is more shareable and easier for evaluators to understand quickly.

## 12. Prototype Feature Requirements

### Must Have

- User can load or paste a migration case.
- User can select candidate Fireworks models.
- Tool shows baseline behavior.
- Tool shows candidate model runs.
- Tool validates tool-call correctness.
- Tool validates structured output.
- Tool ranks candidates.
- Tool recommends one model/config.
- Tool explains failure cases.
- Tool estimates cost delta and cost per successful task.
- Tool exports or displays a concise migration report.

### Should Have

- A model/config matrix.
- Severity labels: blocker, warning, acceptable drift.
- Before/after patch suggestions.
- "Why this model won" explanation.
- "What to test next" section.

### Nice To Have

- Live Fireworks API key support.
- OpenAI/Anthropic baseline call support.
- Trace upload from JSONL.
- LLM-as-judge toggle.
- Generated prompt rewrite.
- Generated SDK patch.

## 13. UI Specification

### Screen Layout

One-screen dashboard with four major zones:

1. Migration Case Panel
   - current provider/model
   - workflow goal
   - messages
   - tools/schema
   - success criteria

2. Candidate Models Panel
   - model chips/cards
   - cost and latency assumptions
   - config controls: temperature, max tokens, tool choice

3. Results Matrix
   - rows: candidate models/configs
   - columns: behavior score, tool score, JSON score, latency, cost/success
   - highlighted winner

4. Migration Report
   - recommendation
   - blockers
   - warnings
   - minimal fixes
   - fallback guidance

### Interaction

Primary actions:

- Load sample trace
- Run migration test
- View failure details
- Generate migration report
- Export report

### Visual Direction

The design should feel like an engineering console, not a marketing page:

- dense but readable
- quiet neutral palette
- table/matrix-forward
- compact cards only for repeated model results
- clear severity colors
- no oversized hero
- no decorative gradient blobs

## 14. Example Prototype Dataset

Use one sample workflow: billing support agent with tool calls.

Baseline GPT behavior:

- calls `lookup_customer`
- calls `update_plan` with valid args
- returns concise confirmation

Candidate simulated results:

Kimi K2.6:

- calls both tools in correct order
- valid schema
- slightly verbose final answer
- low cost
- recommended winner

MiniMax M2.5:

- valid JSON
- calls `update_plan` before lookup in one case
- needs stronger tool-order instruction
- second place

DeepSeek V3.2:

- final answer is semantically good
- skips tool call in one case
- blocker for this workflow

Small low-cost model:

- invalid enum or missing required field
- cheapest but fails compatibility

This simulated dataset makes the product story legible without needing live API calls.

## 15. Generated Report Format

The report should be concise and executive-readable.

Example:

```text
Migration Recommendation

Use Kimi K2.6 with temperature 0.2 for this workflow.

Why:
- 96 percent tool-call correctness across the sample cases.
- 100 percent JSON schema validity.
- 5.8x estimated cost reduction versus GPT baseline.
- Lowest cost per successful workflow among tested models.

Main risk:
- The model sometimes adds extra explanatory text after confirmations.

Required fix:
- Add "Respond with one sentence after successful tool execution" to the system prompt.

Do not migrate yet:
- destructive billing updates should keep GPT fallback until 50 production traces pass.
```

## 16. One-Page Assignment Doc Draft

This section can be extracted as the required one-page overview.

### Fireworks Switchboard

Fireworks has made the API migration from closed models to open models relatively simple, but production teams are not only migrating API calls. They are migrating behavior. A workflow that works on GPT or Claude may depend on hidden assumptions around tool calls, JSON shape, response style, retries, or provider-specific prompt conventions. The customer question is not "how do I call Kimi?" It is "which Fireworks model preserves my existing workflow closely enough to ship?"

Fireworks Switchboard is a migration compatibility harness for engineers moving existing GPT/Claude workflows to Fireworks. The user provides a small set of real traces: prompts, tool schemas, current model outputs, and success criteria. Switchboard replays those cases against candidate Fireworks models, validates tool calls and structured outputs, estimates latency/cost, and produces a ranked migration report.

The prototype focuses on tool-calling and structured-output workflows because this is where API compatibility most often fails to guarantee behavior compatibility. A model can accept the same OpenAI-style request but still skip a required tool, call tools in the wrong order, produce invalid JSON, or require different sampling settings. Switchboard makes those risks visible before migration.

The tool uses a thin-harness, fat-skills design. The harness stays simple: load cases, run models, validate outputs, score results, and render the report. The migration intelligence lives in skills: OpenAI-to-Fireworks notes, Claude-to-Fireworks notes, Kimi tool-calling guidance, MiniMax interleaved-thinking guidance, structured-output checks, and cost-per-success scoring. This keeps the prototype small while making the knowledge layer easy to update as Fireworks models evolve.

The key output is a recommendation like: "Use Kimi K2.6 at temperature 0.2. It has the highest tool-call correctness and lowest cost per successful workflow. Add this one instruction to preserve concise confirmations. Keep GPT fallback for destructive billing updates until more traces pass." This turns model migration from a documentation/research exercise into an evidence-backed compatibility decision.

## 17. Implementation Plan

### Recommended Tech Stack

For a fast take-home build:

- Vite + React + TypeScript
- local mock data in JSON
- no backend required for first prototype
- optional Fireworks API integration behind an environment variable
- CSS modules or Tailwind if already available

If building as a CLI:

- Node.js TypeScript
- JSON fixture input
- terminal table output
- generated Markdown/HTML report

Recommended: Vite/React because the output is shareable and visually understandable.

### File Structure

```text
fireworks-switchboard/
  package.json
  index.html
  src/
    App.tsx
    data/sampleCases.ts
    data/modelCandidates.ts
    lib/scoring.ts
    lib/validators.ts
    lib/report.ts
    components/
      MigrationCasePanel.tsx
      CandidateModelPanel.tsx
      ResultsMatrix.tsx
      ReportPanel.tsx
      SeverityBadge.tsx
    styles.css
  docs/
    overview.md
  skills/
    openai_to_fireworks.md
    claude_to_fireworks.md
    kimi_tool_calling.md
    minimax_interleaved_thinking.md
    structured_outputs.md
```

### Build Steps

1. Scaffold app.
2. Add sample migration case data.
3. Add model candidate metadata.
4. Add simulated run outputs.
5. Implement deterministic scoring.
6. Implement results matrix.
7. Implement report generation.
8. Add concise docs/overview.md.
9. Polish UI and ensure it runs locally.

### Scoring Implementation Details

Types:

```ts
type MigrationCase = {
  id: string;
  name: string;
  baselineProvider: "openai" | "anthropic";
  baselineModel: string;
  messages: Message[];
  tools: ToolSpec[];
  successCriteria: string[];
  expectedToolSequence?: string[];
  expectedFinalAnswerStyle?: string;
};

type CandidateRun = {
  modelId: string;
  config: {
    temperature: number;
    maxTokens: number;
    toolChoice: "auto" | "required" | "none";
  };
  output: {
    toolCalls: ToolCall[];
    finalAnswer: string;
    jsonOutput?: unknown;
  };
  usage: {
    inputTokens: number;
    outputTokens: number;
    latencyMs: number;
    estimatedCostUsd: number;
  };
  errors: string[];
};

type ScoreBreakdown = {
  total: number;
  toolCall: number;
  structuredOutput: number;
  behaviorMatch: number;
  latency: number;
  costPerSuccess: number;
  blockers: Finding[];
  warnings: Finding[];
};
```

Validator examples:

```ts
function validateToolSequence(expected: string[], actual: ToolCall[]): Finding[] {
  const actualNames = actual.map((call) => call.name);
  if (expected.join(">") !== actualNames.join(">")) {
    return [{
      severity: "blocker",
      title: "Tool sequence drift",
      detail: `Expected ${expected.join(" -> ")}, got ${actualNames.join(" -> ")}.`
    }];
  }
  return [];
}

function validateRequiredArgs(toolSpec: ToolSpec, call: ToolCall): Finding[] {
  return toolSpec.required
    .filter((field) => call.arguments[field] == null)
    .map((field) => ({
      severity: "blocker",
      title: "Missing required tool argument",
      detail: `${call.name} is missing ${field}.`
    }));
}
```

### Model Candidate Metadata

```ts
const modelCandidates = [
  {
    id: "accounts/fireworks/models/kimi-k2p6",
    label: "Kimi K2.6",
    bestFor: ["agentic workflows", "tool use", "coding"],
    inputCostPerMillion: 0.95,
    outputCostPerMillion: 4.0,
    defaultConfig: { temperature: 0.2, maxTokens: 1200, toolChoice: "auto" }
  },
  {
    id: "accounts/fireworks/models/minimax-m2p5",
    label: "MiniMax M2.5",
    bestFor: ["agentic workflows", "long reasoning", "tool continuation"],
    inputCostPerMillion: 0.3,
    outputCostPerMillion: 1.2,
    defaultConfig: { temperature: 0.3, maxTokens: 1200, toolChoice: "auto" }
  }
];
```

Prices should be checked live before final submission if using exact numbers in the prototype.

## 18. Product Tradeoffs

### Why Not A Playground

A playground encourages manual exploration. The user still has to decide what to test, what counts as good, and which result is safe. That is too broad and too close to tools Fireworks already has.

Switchboard is better because it starts from the user's actual workflow and produces a decision.

### Why Not A Static Doc Helper

Docs can tell users Kimi is good for agentic coding or MiniMax is good for certain reasoning workflows. Docs cannot tell them whether their exact tool schema will pass or whether a cheaper model causes extra retries.

### Why Not Full Auto-Migration

Automatically rewriting the customer's whole AI stack is too ambitious for a 2-hour prototype and would be hard to trust. The better first step is recommendation and risk surfacing.

### Why Tool Calling First

Tool-calling failures are concrete, testable, and easy to explain. They also map to real production risk: wrong tool, missing argument, duplicate destructive action, invalid JSON, or skipped tool. This gives the prototype a sharper demo than general text comparison.

## 19. Demo Script

1. "This company has a working GPT billing-support agent, but wants to reduce inference cost on Fireworks."
2. Load the sample migration case.
3. Show baseline behavior: lookup customer, update billing plan, confirm briefly.
4. Click "Run Fit Test."
5. Show the model matrix.
6. Explain that the cheapest model failed because it skipped the lookup tool.
7. Explain that MiniMax was close but called tools in the wrong order in one case.
8. Show Kimi as the winner because it preserved tool behavior and reduced cost.
9. Open the generated report.
10. Point to the exact migration recommendation and minimal prompt fix.

## 20. Interview Defense

### If Asked "Why This Problem?"

Because Fireworks has already reduced the API switching cost. The remaining adoption blocker is confidence. Companies need to know whether open models preserve their production behavior, not just whether the endpoint accepts the request.

### If Asked "Why Tool Calling?"

Tool calling is where compatibility problems become objective. We can validate sequence, schema, arguments, and side effects. It is also where agentic production systems are most fragile.

### If Asked "Why Agent-Guided?"

The engineer should not manually read model cards, select candidate models, design evals, and interpret every failure. The system can guide that loop: choose candidates, run traces, score behavior, identify drift, and recommend fixes.

### If Asked "How Would This Become A Real Product?"

Next steps:

- ingest production traces from SDK instrumentation
- connect to live Fireworks models
- support OpenAI and Anthropic baselines
- add saved eval sets
- add regression monitoring after migration
- integrate with Fireworks fine-tuning when no model passes
- generate provider-specific code patches
- offer fallback routing policies based on failure class

### If Asked "How Does Fireworks Benefit?"

It turns Fireworks from a cheaper model provider into a migration partner. The tool reduces adoption risk, helps users choose models based on their own workflows, and creates a path from model selection to evals, routing, fine-tuning, and production optimization.

## 21. Open Questions

- Should the prototype use live Fireworks calls or simulated outputs?
- Should the first demo be CLI-native or web-native?
- Should the baseline be OpenAI, Claude, or both?
- Which exact Fireworks models should be included in the demo?
- Should the generated report include code patches or only recommendations?
- Should the one-page doc emphasize cost reduction or behavior preservation more heavily?

## 22. Recommended Final Scope

Build this:

> A polished local web prototype that loads a sample GPT/Claude tool-calling trace, runs a simulated migration fit test across 3 Fireworks candidate models, scores tool-call and JSON compatibility, estimates cost per successful workflow, and generates a migration recommendation report.

Do not build:

- full live model orchestration
- full trace ingestion
- full prompt translator
- full codebase scanner
- generic model playground

The prototype should prove one thing:

> Fireworks can make switching to open models feel safer by testing behavioral compatibility on the user's actual workflow before they migrate.

