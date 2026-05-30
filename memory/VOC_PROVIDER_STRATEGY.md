# VOC Provider Strategy

## Purpose

VOC will use Hermes as the runtime layer for model routing. The Command Center reports provider readiness through safe posture checks only. It must not print, log, commit, or display API key values.

## Provider Roles

| Provider | Role | Configuration Signal |
| --- | --- | --- |
| OpenAI | Premium fallback and general reasoning provider. Use when quality, broad capability, or final synthesis matters most. | `OPENAI_API_KEY` presence only |
| DeepSeek | Coding and reasoning provider. Use for implementation planning, code analysis, and engineering-heavy tasks. | `DEEPSEEK_API_KEY` presence only |
| Xiaomi MiMo | Alternate reasoning and coding provider. Use as a secondary remote path when provider diversity or fallback capacity is needed. | `MIMO_API_KEY` presence only |
| Ollama Cloud | Remote Ollama-compatible provider. Use when Hermes needs an Ollama-style remote endpoint rather than the local daemon. | `OLLAMA_API_KEY` presence only |
| Ollama Local | Private/local lightweight provider. Use for local, low-risk, privacy-sensitive, and inexpensive tasks that fit installed local models. | Local Ollama API reachability only |

## Status Rules

- Remote providers report `configured` only when the expected environment variable is present.
- Remote providers report `unconfigured` when the expected environment variable is absent.
- `planned` remains the posture for future Hermes routing work that is not yet wired to live model execution.
- Ollama Local reports only `online` or `offline` based on local API reachability.
- No provider status check may call an external model endpoint until explicitly authorized.
- No provider status output may include key values, key prefixes, derived fingerprints, or secret-bearing URLs.

## Runtime Policy

Hermes should remain the runtime abstraction between BERTHIER, specialist roles, and model providers. Provider choice should be policy-driven:

- Default to local Ollama for private or lightweight work when capable.
- Use DeepSeek for coding and technical reasoning when a remote model is appropriate.
- Use Xiaomi MiMo as an alternate coding/reasoning route.
- Use OpenAI as premium fallback, final synthesis, and broad general reasoning.
- Use Ollama Cloud when an Ollama-compatible remote provider is preferred.

All provider activation must preserve VOC approval discipline. Adding credentials is a secret-management action and must be handled outside committed files.
