# Fireworks Switchboard

## The Problem

Switching from a closed model to an open model on Fireworks is trivial at the API level — same SDK, same endpoint shape, swap the base URL and model ID. Configuration isn't the bottleneck. The bottleneck is behavioral reliability. When an engineer swaps GPT for Kimi or MiniMax, the API call succeeds but the model may behave differently in ways that break production — adding arguments a tool schema didn't ask for, returning values in the wrong range, or responding with plain text when a tool call was expected.

## Who This Is For

The engineer responsible for an AI-powered feature that's already in production. They're running a GPT or Claude workflow that handles tool calls, parses structured JSON, or follows specific system prompt patterns. They want to move to Fireworks for lower cost, lower latency, or open-model control, but they can't justify shipping a model swap without evidence that their existing behavior will be preserved. They're working in Claude Code or Codex for most of their day-to-day engineering, and they want to test and compare models without leaving their editor.

## The Use Case

I focused on tool calling and structured output because this is where "OpenAI-compatible" most visibly stops being "behavior-compatible." Tool call correctness and JSON schema adherence are deterministic — you can validate them automatically without a subjective LLM judge. This makes them the right starting point for a migration confidence tool.

The prototype tests against Fireworks' serverless models — Kimi K2.6, DeepSeek V3.2, MiniMax 2.5, and Qwen 3 8B — using the OpenAI-compatible API. In testing, Kimi K2.6 was consistently the most reliable drop-in for both tool calling and JSON mode, while Qwen 3 8B failed to produce valid JSON output entirely.

## The Approach

Switchboard is a concierge experience for the coding agent, modeled after Stripe's agent skills. The engineer installs migration skills into their agent with one command (`npx skills add terrylinhaochen/fireworks-takehome -y`), and the agent gains knowledge of how to detect the current provider, which Fireworks models to test, what behavioral differences to expect, and how to fix them.

The design follows the "thin harness, fat skills" principle. The harness is a small, deterministic test runner — it loads a case, calls the Fireworks API, validates the response, and reports what passed, what broke, and how to fix it. The skills are the heavy layer: plain markdown files containing model mappings, detection patterns, behavioral checklists, and remediation steps. Because skills are just text, they don't bloat the agent's context the way heavier integrations would, and they scale naturally — adding a new provider means writing a new skill file, not modifying the harness.

## Key Design Choices

**Agent-first.** The engineer's coding agent reads the skills, runs the harness, interprets results, and proposes fixes — all inside the IDE. I chose this over a playground or dashboard because it matches how migration work actually happens today: an engineer working through code changes with an AI assistant. A visual tool would require context switching and manual data entry for information the agent already has access to.

**Real API calls against Fireworks serverless.** The harness hits the live Fireworks API, not mocked data. Model behavior changes with updates, and simulated results would give false confidence. The serverless deployment path is the lowest-friction entry point for evaluation — no infrastructure setup, just an API key.

**Remediation, not just reporting.** When a behavioral gap is detected, the harness explains the specific issue, suggests a prompt-level fix, and offers a code-level alternative. For example: "model returns confidence on 0-100 scale instead of 0-1 — fix: specify range in system prompt — alt: if value > 1, divide by 100." The engineer can apply the fix and re-run the check in the same session.

## What Comes Next

The immediate next step is closing the loop end-to-end: when the harness detects a behavioral gap, the agent applies the suggested fix automatically, re-runs the harness, and verifies the issue is resolved. This turns Switchboard from a diagnostic into a migration assistant that can walk an engineer from "I want to try Fireworks" to "my workflow passes on Kimi K2.6" in a single session.

The second priority is auto-generating test cases from existing codebases, so engineers don't have to write case files by hand. The agent reads their current OpenAI or Claude code, detects the tools, expected schemas, and system prompts, and generates the case file automatically.
