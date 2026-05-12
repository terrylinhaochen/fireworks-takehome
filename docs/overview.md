# Fireworks Switchboard

## The Problem

Switching from a closed model to an open model on Fireworks is trivial at the API level. The models are interchangeable in terms of configuration — same SDK, same endpoint shape, swap the base URL and model ID. Fireworks has already solved this. Documentation isn't the bottleneck. Configuration isn't the bottleneck.

**The bottleneck is behavioral reliability.**

Teams running GPT or Claude in production have already tuned their workflows around a specific model's behavior — how it calls tools, how it formats JSON, what it does with ambiguous instructions, how it handles edge cases. These are brownfield systems: real products serving real users, with months of prompt engineering baked in.

When an engineer swaps in Kimi or MiniMax, the API call succeeds but the behavior may not match. A model might add arguments the tool schema didn't ask for. It might return `confidence: 82` instead of `0.82`. It might respond with plain text when a tool call was expected. These differences are invisible from the docs and only surface in production.

The promise of switching to Fireworks is compelling — lower cost, lower latency, open-model control. But teams can't capture that value unless they can verify that their workflows will behave the same way. Right now, there's no good way to test that short of shipping the swap and watching what breaks.

## Why Tool Calling and Structured Output

I chose this as the wedge because it's where "OpenAI-compatible" most visibly stops being "behavior-compatible":

- **It's deterministically testable.** Tool call correctness and JSON schema adherence can be validated automatically — no subjective LLM judge needed. "Did the model call the right function with the right arguments?" has a clear answer.
- **It's the highest-value workflow type.** Agentic tool-use and structured-output pipelines are exactly the workloads Fireworks wants to capture — high-volume, cost-sensitive, and the most likely to migrate from GPT/Claude.
- **It surfaces real differences.** In our prototype, Qwen 3 8B returned plain text instead of a tool call. MiniMax returned confidence values on a 0-100 scale instead of 0-1. These are production-breaking behavioral gaps that no amount of documentation would prevent.

## The Approach

Engineers doing model migrations today are working inside coding agents — Claude Code, Codex, Cursor. They aren't looking for a playground or a dashboard. They want to stay in their workflow and get reliable guidance on what to swap, what will break, and how to fix it.

Switchboard is designed as a **concierge experience for the coding agent**, modeled after [Stripe's agent skills](https://docs.stripe.com/building-with-ai). Two layers:

**Fat skills** — migration knowledge that the agent reads directly. Model mapping tables, behavioral difference checklists, detection patterns, remediation steps. Installed in one command:

```
npx skills add terrylinhaochen/fireworks-takehome -y
```

**Thin harness** — a test runner that calls the real Fireworks API with the developer's workflow, validates the response against their expectations, and surfaces where behavior diverges. The agent runs the harness, reads the results, and uses the skills to guide the engineer through fixes.

The skills are the heavy layer. They scale to new providers, new models, and new failure patterns without changing the harness. The harness stays small and deterministic.

## Key Design Choices

**Agent-first.** The engineer's coding agent reads the skills, runs the harness, interprets the results, and proposes fixes — all inside the IDE. No context switching to a separate tool. This matches how migration work actually happens today.

**Real API calls.** The harness hits the live Fireworks API, not mocked data. Model behavior changes with updates. Real calls surface real differences.

**Pass/fail with remediation, not scores.** "Argument extraction: partial — adds unrequested parameters. Fix: add 'only use required parameters' to system prompt" is actionable. A compatibility score of 78% is not.

## What Comes Next

**Surface a concrete failure, then fix it.** The harness already reports where behavior diverges. The next step is closing the loop: when a dimension fails, the agent uses the skills to propose a specific code or prompt change, re-runs the harness, and verifies the fix. This turns Switchboard from a diagnostic tool into an end-to-end migration assistant.

**Auto-generate cases from codebases.** Instead of writing test cases manually, the agent reads the engineer's existing OpenAI/Claude code and generates the case file automatically — detecting tools, expected schemas, and system prompts.

**MCP server.** Expose the harness as MCP tools so agents can run compatibility checks programmatically during migration, not as a separate CLI step.

**Embed in Fireworks onboarding.** When a new user signs up and says "I'm migrating from GPT," Switchboard runs their workflow against candidate models and recommends one with evidence — turning model selection from a research problem into a guided product experience.
