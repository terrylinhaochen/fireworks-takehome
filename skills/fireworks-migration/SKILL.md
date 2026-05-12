---
name: fireworks-migration
description: Use when a developer wants to migrate from closed AI models (OpenAI GPT, Anthropic Claude, Google Gemini, Kimi) to open-source models on Fireworks AI. Provides model recommendations by use case, Fireworks model IDs, and links to provider-specific migration playbooks.
---

# Fireworks Migration: Model Selection Guide

You are helping a developer migrate from a closed-source AI model to an open-source model on Fireworks AI. Use this guide to recommend the right Fireworks model based on their current provider, use case, and latency requirements.

## Fireworks API Basics

Fireworks uses an **OpenAI-compatible API**. Migration typically requires only changing:
1. Base URL → `https://api.fireworks.ai/inference/v1`
2. API key → `FIREWORKS_API_KEY`
3. Model ID → `accounts/fireworks/models/MODEL_NAME`

The OpenAI Python/JS SDK works directly with Fireworks — no new SDK needed.

## Model Recommendations by Use Case

| Category | Use Case | Recommended Models |
|----------|----------|--------------------|
| Code & Development | Code generation & reasoning | Kimi K2.6, DeepSeek V3.2, MiniMax 2.5, GLM 4.7, GLM 5 (Large) / Qwen3 235B, Qwen2.5-32B-Coder (Medium) |
| Code & Development | Code completion & bug fixing | Kimi K2.6, MiniMax 2.5 (Large) / Qwen3 235B (Medium) / Qwen3 14B, Qwen3 8B (Small) |
| AI Applications | AI Agents with tool use | Kimi K2.6, DeepSeek V3.2, MiniMax 2.5, GLM 4.7, GLM 5 (Large) / Qwen 3 Family (All sizes) |
| AI Applications | General reasoning & planning | Kimi K2.6, DeepSeek V3.2, MiniMax 2.5, GLM 4.7, GLM 5 (Large) / Llama 3.3 70B (Medium) |
| AI Applications | Long context & summarization | Kimi K2.6, MiniMax 2.5, GLM 5 (Large) / GPT-OSS-120B (Medium) |
| Vision & Multimodal | Vision & document understanding | Kimi K2.6, Qwen2.5-VL 72B (Large) / Qwen3 VL 30B (Small) |

## Migration Mapping: Closed → Open

### From OpenAI GPT

| Closed Model | Use Case | Latency | Fireworks Alternative |
|-------------|----------|---------|----------------------|
| GPT-5 | Agentic, research | High | Kimi K2 Thinking, Kimi K2.6, DeepSeek V3.2, MiniMax 2.5, GLM 5 |
| GPT-5 mini & nano | Chatbots, classification | Low | Qwen 3 14B, Qwen 3 8B, GPT-OSS 120B |

### From Anthropic Claude

| Closed Model | Use Case | Latency | Fireworks Alternative |
|-------------|----------|---------|----------------------|
| Claude Sonnet 4.5 | Agentic, coding, research | High | DeepSeek V3.2, Kimi K2.6, MiniMax 2.5, GLM 4.7, GLM 5 |
| Claude Haiku 4.5 | Agentic, coding | Low | Qwen 3 14B, Qwen 3 8B, Mistral Codestral 22B |

### From Google Gemini

| Closed Model | Use Case | Latency | Fireworks Alternative |
|-------------|----------|---------|----------------------|
| Gemini 3 Pro | Agentic, research | High | Kimi K2 Thinking, Kimi K2.6, DeepSeek V3.2, MiniMax 2.5 |
| Gemini 3 Pro Flash | Chatbots, classification | Low | Qwen 3 4B, Qwen 3 8B, Llama 3.1 8B |

## Fireworks Model IDs

| Display Name | Model ID |
|-------------|----------|
| Kimi K2.6 | `accounts/fireworks/models/kimi-k2p6` |
| Kimi K2 0905 | `accounts/fireworks/models/kimi-k2-instruct-0905` |
| DeepSeek V3.2 | `accounts/fireworks/models/deepseek-v3p2` |
| MiniMax 2.5 | `accounts/fireworks/models/minimax-m2p5` |
| GLM 4.7 | `accounts/fireworks/models/glm-4p7` |
| GLM 5 | `accounts/fireworks/models/glm-5` |
| Qwen 3 8B | `accounts/fireworks/models/qwen3-8b` |
| Qwen 3 14B | `accounts/fireworks/models/qwen3-14b` |
| Qwen3 235B | `accounts/fireworks/models/qwen3-235b-a22b` |
| Llama 3.3 70B | `accounts/fireworks/models/llama-v3p3-70b-instruct` |

## Provider-Specific Playbooks

For step-by-step migration instructions, see:
- `openai-to-fireworks` skill — Tool calling, JSON mode, streaming, error handling
- `kimi-to-fireworks` skill — JSON mode, context windows, model mapping

## Latency Budget Guide

- **High latency**: Complex reasoning, multi-step agents, research — accuracy over speed
- **Low latency**: Chatbots, real-time search, classification — speed over depth

> Source: https://docs.fireworks.ai/guides/recommended-models
