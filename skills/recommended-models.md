# Fireworks Recommended Models for Migration

> Source: https://docs.fireworks.ai/guides/recommended-models
> Use this guide to select which Fireworks models to test when migrating from closed-source providers.

## Documentation Index

Fetch the complete Fireworks documentation index at: https://docs.fireworks.ai/llms.txt

## Model Recommendations by Use Case

| Category | Use Case | Recommended Models |
|----------|----------|--------------------|
| Code & Development | Code generation & reasoning | Kimi K2.6, DeepSeek V3.2, MiniMax 2.5, GLM 4.7, GLM 5 (Large) / Qwen3 235B, Qwen2.5-32B-Coder (Medium) |
| Code & Development | Code completion & bug fixing | Kimi K2.6, MiniMax 2.5 (Large) / Qwen3 235B, Qwen2.5-32B-Coder (Medium) / Qwen3 14B, Qwen3 8B (Small) |
| AI Applications | AI Agents with tool use | Kimi K2.6, DeepSeek V3.2, MiniMax 2.5, GLM 4.7, GLM 5 (Large) / Qwen 3 Family (All sizes) |
| AI Applications | General reasoning & planning | Kimi K2.6, DeepSeek V3.2, MiniMax 2.5, Qwen3 235B, GLM 4.7, GLM 5 (Large) / Llama 3.3 70B (Medium) |
| AI Applications | Long context & summarization | Kimi K2.6, MiniMax 2.5, GLM 5 (Large) / GPT-OSS-120B (Medium) |
| AI Applications | Fast semantic search | GPT-OSS-120B (Medium) / Qwen3 8B, Llama 3.1 8B (Small) |
| Vision & Multimodal | Vision & document understanding | Kimi K2.6, Qwen2.5-VL 72B (Large) / Qwen3 VL 30B (Small) |

## Migration Mapping: Closed → Open

### From OpenAI GPT

| Closed Model | Use Case | Latency Budget | Fireworks Alternative |
|-------------|----------|----------------|----------------------|
| GPT-5 | Agentic, research | High | Kimi K2 Thinking, Kimi K2.6, DeepSeek V3.2, MiniMax 2.5, GLM 5 |
| GPT-5 mini & nano | Chatbots, classification, search | Low | Qwen 3 14B, Qwen 3 8B, GPT-OSS 120B, GPT-OSS 20B |

### From Anthropic Claude

| Closed Model | Use Case | Latency Budget | Fireworks Alternative |
|-------------|----------|----------------|----------------------|
| Claude Sonnet 4.5 | Agentic, coding, research | High | DeepSeek V3.2, Kimi K2.6, MiniMax 2.5, GLM 4.7, GLM 5 |
| Claude Haiku 4.5 | Agentic, coding, research | Low | Qwen 3 14B, Qwen 3 8B, Mistral Codestral 22B |

### From Google Gemini

| Closed Model | Use Case | Latency Budget | Fireworks Alternative |
|-------------|----------|----------------|----------------------|
| Gemini 3 Pro | Agentic, research | High | Kimi K2 Thinking, Kimi K2.6, DeepSeek V3.2, MiniMax 2.5, GLM 5 |
| Gemini 3 Pro Flash | Chatbots, classification | Low | Qwen 3 4B, Qwen 3 8B, Llama 3.1 8B, GPT-OSS 20B |

## Fireworks Model IDs

When using the Fireworks API, reference models with their full ID:

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
| GPT-OSS 120B | `accounts/fireworks/models/gpt-oss-120b` |

## Latency Budget Guide

- **High latency budget**: Best for complex reasoning, multi-step workflows, and research tasks where accuracy matters more than speed.
- **Low latency budget**: Best for user-facing applications like chatbots, real-time search, and high-throughput classification.

*Last updated: May 2026*
