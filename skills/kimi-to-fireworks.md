# Skill: Migrate Kimi (Moonshot) to Fireworks

## When to use

You are helping a developer migrate code that calls the Kimi/Moonshot API to use Fireworks AI instead. Kimi uses an OpenAI-compatible API format, so migration is straightforward.

## Detection signals

Look for these patterns in the codebase:
- Base URL containing `api.moonshot.cn` or `moonshot`
- Model strings starting with `moonshot-v1` (e.g., `moonshot-v1-8k`, `moonshot-v1-32k`)
- Environment variable references to `KIMI_API_KEY` or `MOONSHOT_API_KEY`
- `openai.OpenAI(base_url="https://api.moonshot.cn/v1")`

## Migration steps

### 1. Change base URL and API key

```python
# Before (Kimi/Moonshot)
client = OpenAI(
    api_key=os.environ["KIMI_API_KEY"],
    base_url="https://api.moonshot.cn/v1",
)

# After (Fireworks)
client = OpenAI(
    api_key=os.environ["FIREWORKS_API_KEY"],
    base_url="https://api.fireworks.ai/inference/v1",
)
```

Both Kimi and Fireworks use the OpenAI SDK — only the URL and key change.

### 2. Change model identifier

| Kimi Model | Fireworks Equivalent | Notes |
|---|---|---|
| moonshot-v1-8k | `accounts/fireworks/models/kimi-k2p6` | Kimi K2.6 on Fireworks — same model family, better infra |
| moonshot-v1-32k | `accounts/fireworks/models/kimi-k2p6` | K2.6 supports long context natively |
| moonshot-v1-128k | `accounts/fireworks/models/kimi-k2p6` | K2.6 handles extended context |

**Why Kimi on Fireworks?** Running Kimi models through Fireworks gives you the same model quality with Fireworks' optimized inference infrastructure (lower latency, better scaling, unified billing).

### 3. Feature compatibility

#### JSON mode / Structured output
- `response_format: { "type": "json_object" }` works identically on Fireworks
- **Known difference**: Some Fireworks models may return extra fields or use different value ranges. Add explicit constraints in the system prompt.
- **Best practice**: Include the exact JSON schema with field types and allowed values in your system prompt.

#### System prompts
- System messages work identically
- Classification and extraction prompts transfer directly

#### Context window
- Kimi's moonshot-v1 models have fixed context windows (8k, 32k, 128k)
- Fireworks Kimi K2.6 supports flexible context — no need to pick a context-window variant

### 4. Validation checklist

After migration, verify:
- [ ] JSON output parses without error
- [ ] All expected fields are present in output
- [ ] Field values match expected types and ranges (e.g., confidence is 0-1, not 0-100)
- [ ] No extra unexpected fields that break downstream parsing
- [ ] System prompt instructions are followed consistently
- [ ] Multi-turn conversation context works correctly

## Running the test harness

Use the Switchboard harness to validate your migration:

```bash
# Test with the sample Kimi structured-output case
node harness/run.js cases/kimi-structured-output.json

# Or create your own case file following the schema in cases/
```
