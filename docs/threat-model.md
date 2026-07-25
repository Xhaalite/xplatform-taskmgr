# Threat Model

## Trust Boundaries

- Renderer is treated as untrusted input source.
- Rust command layer is the authoritative enforcement point.
- OS data sources are read-only in v1.

## Primary Risks

1. Command abuse through malformed payloads.
2. Path traversal attempts in future filesystem modules.
3. Resource exhaustion through command flooding.
4. Update or package tampering in distribution.

## Mitigations in This Baseline

- Narrow command surface via explicit registration.
- Strongly typed DTOs and validation of polling bounds.
- No shell command execution.
- Capability flags for unavailable fields to avoid implicit assumptions.

## Planned Mitigations

- Rate limiting and per-command timeouts.
- Structured audit logging for sensitive operations.
- Signed builds and verified update channels.
