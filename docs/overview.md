# Fireworks Switchboard

## The Problem

Switching from a closed model to an open model on Fireworks is trivial at the API level. The models are interchangeable in terms of configuration — same SDK, same endpoint shape, swap the base URL and model ID. Fireworks has already solved this. Documentation isn't the bottleneck. Configuration isn't the bottleneck.

The bottleneck is behavioral reliability. Teams running GPT or Claude in production have already tuned their workflows around a specific model's behavior — how it calls tools, how it formats JSON, what it does with ambiguous instructions, how it handles edge cases. These are brownfield systems with months of prompt engineering baked in. When an engineer swaps in Kimi or MiniMax, the API call succeeds but the behavior may not match. A model might add arguments the tool schema didn't ask for, return confidence as `82` instead of `0.82`, or respond with plain text when a tool call was expected. These differences are invisible from the docs and only surface in production.

The promise of switching to Fireworks is compelling — lower cost, lower latency, open-model control. But teams can't capture that value unless they can verify that their specific workflows will behave the same way on the new model.

## Why Tool Calling and Structured Output

I focused the prototype on tool calling and structured output because this is where "OpenAI-compatible" most visibly stops being "behavior-compatible." Unlike subjective quality differences ("does the response feel right?"), tool call correctness and JSON schema adherence are deterministic — you can validate them automatically without an LLM judge. Did the model call the right function? Are the arguments valid JSON matching the schema? Is the confidence field a float between 0 and 1? These have clear answers.

This is also the highest-value workflow type for Fireworks to capture. Agentic tool-use and structured-output pipelines are high-volume, cost-sensitive, and the most likely to migrate from GPT or Claude. But they're the hardest to migrate safely because they have the most behavioral surface area — every tool schema, every expected JSON field, every argument constraint is a potential point of divergence.

The prototype tests against Fireworks' serverless models — Kimi K2.6, DeepSeek V3.2, MiniMax 2.5, and Qwen 3 8B — using the OpenAI-compatible API. In testing, Kimi K2.6 was consistently the most reliable drop-in replacement for both tool calling and JSON mode workflows, while smaller models like Qwen 3 8B failed to produce valid JSON output entirely.

## The Approach

Engineers doing model migrations today are working inside coding agents — Claude Code, Codex, Cursor. They aren't looking for a playground or a visual dashboard. They want to stay in their IDE and get reliable guidance on what to swap, what will break, and how to fix it.

Switchboard is designed as a concierge experience for the coding agent, modeled after Stripe's agent skills approach. The key idea, drawn from the "thin harness, fat skills" framework, is to keep the runner small and deterministic while putting the real migration intelligence into editable knowledge files that the agent consumes. The skills contain model mapping tables, detection patterns for identifying which provider a codebase currently uses, behavioral difference checklists, and concrete remediation steps. The harness just loads a test case, calls the Fireworks API, and validates the response — the agent interprets the results and guides the engineer through fixes using the skills.

This matters because skills scale. Adding support for a new source provider (Gemini, Anthropic) means writing a new skill file, not modifying the harness. Updating model recommendations when Fireworks launches a new model means editing one markdown table. The knowledge layer evolves independently of the test infrastructure, and because skills are plain markdown, they don't bloat the agent's context the way heavier integrations would.

Installing the skills is one command: `npx skills add terrylinhaochen/fireworks-takehome -y`

## Key Design Choices

**Agent-first, not UI-first.** The engineer's coding agent reads the skills, runs the harness, interprets the results, and proposes fixes — all without leaving the IDE. I chose this over a web-based playground because it matches how migration work actually happens: an engineer in their editor, working through code changes with an AI assistant. A dashboard would require context switching and manual data entry for something the agent already has access to.

**Real API calls against Fireworks' serverless endpoint.** The harness hits the live Fireworks API, not mocked data. This is important because model behavior changes with updates, and simulated results would give false confidence. The prototype uses the serverless deployment path, which is the lowest-friction entry point for teams evaluating Fireworks — no infrastructure setup, just an API key.

**Remediation, not just reporting.** When a behavioral gap is detected, the harness doesn't just say "partial." It explains the specific issue ("model returns confidence on 0-100 scale instead of 0-1"), suggests a prompt-level fix ("specify range constraints explicitly"), and offers a code-level alternative ("if value > 1, divide by 100"). The goal is to close the loop from diagnosis to resolution, so the engineer can fix the gap and re-run the check in the same session.

## What Comes Next

The immediate next step is closing the diagnostic loop end-to-end. Right now the harness surfaces behavioral gaps and suggests fixes, but the engineer still applies the fix manually. The natural extension is having the agent apply the suggested prompt or code change, re-run the harness, and verify that the fix resolved the issue — turning Switchboard from a diagnostic into an automated migration assistant.

Beyond that, the highest-leverage improvement would be auto-generating test cases from existing codebases. Instead of writing case files by hand, the agent reads the engineer's current OpenAI or Claude integration, detects the tools, expected schemas, and system prompts, and generates the case file automatically. This removes the last manual step between "I want to try Fireworks" and getting a concrete compatibility report.
