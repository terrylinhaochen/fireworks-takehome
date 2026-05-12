# Fireworks Switchboard

**A test harness that verifies model behavior when switching from closed models to open models on Fireworks.**

## The Problem and the User

Switching from a closed model to an open model on Fireworks is trivial at the API level — same SDK, same endpoint shape, swap the base URL and model ID. Configuration isn't the bottleneck. The bottleneck is behavioral reliability. When an engineer swaps GPT for Kimi or MiniMax, the API call succeeds but the model may behave differently in ways that break production — adding arguments a tool schema didn't ask for, returning values in the wrong range, or responding with plain text when a tool call was expected.

The person dealing with this is the engineer responsible for an AI-powered feature that's already in production. They're running a GPT or Claude workflow that handles tool calls, parses structured JSON, or follows specific system prompt patterns. They want to move to Fireworks for lower cost, lower latency, or open-model control, but they can't justify shipping a model swap without evidence that their existing behavior will be preserved. They're working in Claude Code or Codex for most of their day-to-day engineering, and they want to test and compare models without leaving their editor.

I focused on tool calling and structured output because this is where "OpenAI-compatible" most visibly stops being "behavior-compatible." Tool call correctness and JSON schema adherence are deterministic — you can validate them automatically without a subjective LLM judge. The prototype tests against Fireworks' serverless models — Kimi K2.6, DeepSeek V3.2, MiniMax 2.5, and Qwen 3 8B. In testing, Kimi K2.6 was consistently the most reliable drop-in for both tool calling and JSON mode, while Qwen 3 8B failed to produce valid JSON output entirely.

## The Approach

Switchboard has two layers. The harness is a small, deterministic test runner — it loads a test case, calls the Fireworks API with each candidate model, validates the response against the engineer's expectations, and reports what passed, what broke, and how to fix it. The skills are markdown files containing the migration knowledge the agent needs: model mapping tables, detection patterns for identifying which provider a codebase currently uses, behavioral difference checklists, and remediation steps.

The separation matters because the knowledge layer scales independently of the test infrastructure. Adding support for a new source provider means writing a new skill file, not modifying the runner. Updating model recommendations when Fireworks launches a new model means editing one markdown table. And because skills are plain text, they stay lightweight in the agent's context — unlike heavier tool integrations that can overwhelm the conversation window. The engineer installs everything into their coding agent with one command: `npx skills add terrylinhaochen/fireworks-takehome -y`

## Design Choices and What Comes Next

I designed for the coding agent rather than a playground or dashboard because it matches how migration work actually happens today — an engineer in their editor, working through code changes with an AI assistant. A visual tool would require context switching and manual data entry for information the agent already has access to. The harness hits the live Fireworks serverless API rather than mocked data, because model behavior changes with updates and simulated results would give false confidence.

When a behavioral gap is detected, the harness doesn't just report it — it explains the specific issue, suggests a prompt-level fix, and offers a code-level alternative. For example: "model returns confidence on 0-100 scale instead of 0-1 — fix: specify range in system prompt — alt: if value > 1, divide by 100." The engineer can apply the fix and re-run the check in the same session.

The immediate next step is closing this loop end-to-end: when the harness detects a gap, the agent applies the suggested fix automatically, re-runs the harness, and verifies the issue is resolved. The second priority is auto-generating test cases from existing codebases, so engineers don't write case files by hand — the agent reads their current OpenAI or Claude code and generates the case file automatically.
