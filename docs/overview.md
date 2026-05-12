# Fireworks Switchboard

## The Problem

Companies evaluating Fireworks already know the API migration is easy — change the base URL, swap the key, pick a model. Fireworks has done a good job making this feel familiar with OpenAI-compatible endpoints.

But teams with production AI workflows don't switch because **the API working isn't the same as the workflow working.** Their real fear: "My GPT pipeline handles tool calls, parses structured JSON, and follows specific system prompt patterns. Will Kimi or DeepSeek do the same thing, or will something subtle break in production?"

This behavioral uncertainty — not the mechanical migration — is what keeps teams on closed models. They can't justify the risk of shipping a model swap without testing it against their actual workflows first. And right now, there's no good way to do that short of manually rewriting code and hoping for the best.

## Why This Is the Right Wedge

I chose **tool calling and structured output compatibility** as the migration wedge because:

1. **It's where "OpenAI-compatible" breaks down.** The API shape looks the same, but models disagree on argument formatting, JSON schema adherence, and whether to call a tool at all. Our harness caught Qwen 3 8B returning plain text instead of a tool call, and MiniMax returning `confidence: 82` instead of `0.82`. These are production-breaking differences invisible from the docs.

2. **It's the highest-stakes workflow type.** Agentic tool-use and structured-output pipelines are exactly the workloads Fireworks wants to win — they're high-volume, cost-sensitive, and the most likely to migrate from GPT/Claude. But they're also the hardest to migrate because they have the most behavioral surface area.

3. **It's testable.** Unlike "does the response feel right?" (subjective), tool call correctness and JSON schema adherence are deterministic — you can validate them automatically without an LLM judge.

## The Solution

**Fireworks Switchboard** is an agent skills package + test harness, modeled after [Stripe's agent skills approach](https://docs.stripe.com/building-with-ai). Two layers:

- **Skills** (the knowledge): Migration playbooks that coding agents read to understand how to swap providers, which Fireworks models map to which closed models, and what behavioral differences to expect. Installed with one command: `npx skills add terrylinhaochen/fireworks-takehome -y`

- **Harness** (the test): A CLI that calls the real Fireworks API with a developer's workflow definition, validates the response against their expectations, and reports what passes, what breaks, and what to fix.

## Key Design Choices

**Agent-first, not dashboard-first.** Developers migrate code with coding agents in their IDE — not by uploading files to a web dashboard. The skills are plain markdown that Claude Code and Codex read directly. This matches how migration actually happens today.

**Real API calls, not simulations.** The harness hits the live Fireworks API. This is important because model behavior changes with updates. Mock data would give false confidence. Real calls surface real differences.

**Pass/fail, not scores.** A weighted compatibility score sounds sophisticated but doesn't help an engineer decide. "Tool call format: pass. Argument extraction: partial — adds unrequested parameters" is actionable. A score of 78% is not.

## If This Were a Real Project

**Immediate next steps**: Auto-generate test cases from existing codebases (the agent reads your OpenAI code and creates the case file), add Claude-to-Fireworks and Gemini-to-Fireworks skills, expose the harness as an MCP server so agents can run checks programmatically during migration.

**Longer term**: Integrate into the Fireworks onboarding flow. When a new user signs up and says "I'm migrating from GPT," Switchboard runs their workflow against candidate models and recommends one with evidence. This turns model selection from a docs problem into a product experience.
