# Skill: Migrate OpenAI to Fireworks

## When to use

You are helping a developer migrate code that calls the OpenAI API to use Fireworks AI instead. The code uses the `openai` Python SDK or the OpenAI REST API directly.

## Detection signals

Look for these patterns in the codebase:
- `import openai` or `from openai import OpenAI`
- Base URL containing `api.openai.com` (or no base URL, which defaults to OpenAI)
- Model strings starting with `gpt-` (e.g., `gpt-4o`, `gpt-4o-mini`, `gpt-3.5-turbo`)
- `tool_choice`, `tools`, `response_format` parameters
- `openai.OpenAI()` constructor with no `base_url` argument

## Migration steps

### 1. Change base URL and API key

```python
# Before
client = openai.OpenAI()

# After
import os
client = openai.OpenAI(
    base_url="https://api.fireworks.ai/inference/v1",
    api_key=os.environ["FIREWORKS_API_KEY"],
)
```

The OpenAI Python SDK works directly with Fireworks — no new SDK needed.

### 2. Change model identifier

| OpenAI Model | Fireworks Equivalent | Notes |
|---|---|---|
| gpt-4o, gpt-5 | `accounts/fireworks/models/kimi-k2p6` | Best general replacement for agentic + tool use |
| gpt-4o, gpt-5 | `accounts/fireworks/models/deepseek-v3p2` | Strong alternative, especially for code |
| gpt-4o-mini | `accounts/fireworks/models/qwen3-14b` | Good balance of speed and capability |
| gpt-3.5-turbo | `accounts/fireworks/models/qwen3-8b` | Fast, good for classification and simple tasks |

See `skills/recommended-models.md` for the full mapping table.

### 3. Feature compatibility

#### Tool calling
- Fireworks supports OpenAI-compatible tool calling on most large models
- `tool_choice: "auto"` works as expected
- `tool_choice: "required"` works on most models
- Tool call arguments are returned as JSON strings (same as OpenAI)
- **Known difference**: Some models may add extra parameters not in the schema. Add explicit constraints in the system prompt if this occurs.

#### JSON mode / Structured output
- `response_format: { "type": "json_object" }` is supported
- `response_format: { "type": "json_schema", "json_schema": {...} }` is supported on select models
- **Best practice**: Repeat the expected JSON schema in the system prompt for more reliable adherence

#### Streaming
- SSE streaming is fully compatible with OpenAI's format
- `stream: true` works identically
- Fireworks returns usage stats in both streaming and non-streaming responses (OpenAI only returns them for non-streaming)

#### System prompts
- System messages work identically
- Multi-turn conversations are supported
- No changes needed for message format

### 4. Error handling differences

| OpenAI Error | Fireworks Equivalent | Action |
|---|---|---|
| `RateLimitError` | Same HTTP 429 | Same retry logic works |
| `APIError` | Same HTTP 5xx | Same retry logic works |
| Model not found | HTTP 404 | Check model ID format: `accounts/fireworks/models/MODEL_NAME` |

### 5. Validation checklist

After migration, verify:
- [ ] Tool calls parse without error
- [ ] Tool call function names match expected values
- [ ] Tool call arguments contain required fields
- [ ] JSON output matches expected schema
- [ ] System prompt behavior is preserved
- [ ] Multi-turn conversation context works correctly
- [ ] Streaming chunks arrive in expected format
- [ ] Error handling covers Fireworks-specific error codes

## Running the test harness

Use the Switchboard harness to validate your migration:

```bash
# Test with the sample OpenAI tool-calling case
node harness/run.js cases/openai-tool-calling.json

# Or create your own case file following the schema in cases/
```
