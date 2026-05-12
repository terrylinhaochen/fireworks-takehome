/**
 * Provider auto-detection engine.
 * Identifies the source AI provider from a code snippet using pattern matching.
 * In production, a coding agent would do this with full AST awareness;
 * here we demonstrate the detection contract.
 */

const PROVIDER_PATTERNS = {
  openai: [
    { pattern: /from openai import|import openai/i, signal: "imports openai SDK" },
    { pattern: /api\.openai\.com/, signal: "OpenAI API base URL" },
    { pattern: /model\s*[=:]\s*["']gpt-/i, signal: "GPT model identifier" },
    { pattern: /tool_choice/, signal: "tool_choice parameter (OpenAI-style)" },
    { pattern: /openai\.OpenAI\(\)/, signal: "default OpenAI client (no custom base_url)" },
  ],
  kimi: [
    { pattern: /moonshot\.cn/, signal: "Moonshot/Kimi API base URL" },
    { pattern: /moonshot-v1/, signal: "Moonshot model identifier" },
    { pattern: /KIMI_API_KEY/i, signal: "Kimi API key reference" },
    { pattern: /api\.moonshot/, signal: "Moonshot API domain" },
  ],
  anthropic: [
    { pattern: /from anthropic import|import anthropic/i, signal: "imports Anthropic SDK" },
    { pattern: /api\.anthropic\.com/, signal: "Anthropic API base URL" },
    { pattern: /model\s*[=:]\s*["']claude-/i, signal: "Claude model identifier" },
    { pattern: /anthropic\.Anthropic/, signal: "Anthropic client constructor" },
  ],
  gemini: [
    { pattern: /generativelanguage\.googleapis/, signal: "Gemini API endpoint" },
    { pattern: /google\.generativeai/i, signal: "Google AI SDK import" },
    { pattern: /model\s*[=:]\s*["']gemini-/i, signal: "Gemini model identifier" },
  ],
};

export function detectProvider(code) {
  const results = {};

  for (const [provider, patterns] of Object.entries(PROVIDER_PATTERNS)) {
    const matchedSignals = patterns
      .filter(({ pattern }) => pattern.test(code))
      .map(({ signal }) => signal);

    if (matchedSignals.length > 0) {
      results[provider] = matchedSignals;
    }
  }

  // Pick the provider with the most signals
  const entries = Object.entries(results);
  if (entries.length === 0) {
    return {
      provider: "unknown",
      confidence: "low",
      signals: [],
    };
  }

  entries.sort((a, b) => b[1].length - a[1].length);
  const [provider, signals] = entries[0];

  return {
    provider,
    confidence: signals.length >= 3 ? "high" : signals.length >= 2 ? "medium" : "low",
    signals,
  };
}
