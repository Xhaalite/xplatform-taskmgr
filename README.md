# xplatform-taskmgr

Cross-platform local-first system dashboard built with Tauri (Rust backend + web frontend).

## Current Status

This repository contains the implementation baseline for:

- Architecture and threat-model documentation.
- Capability-first Tauri configuration.
- Rust telemetry services for system identity, CPU, and memory snapshots.
- A React dashboard shell with polling and short-term ring-buffer history.

## Quick Start

1. Install prerequisites:
   - Node.js 20+
   - Rust stable toolchain
   - Tauri build dependencies for your OS
2. Install frontend dependencies:

```bash
npm install
```

3. Run in development:

```bash
npm run tauri:dev
```

## Security Posture (v1)

- Least privilege: no shell execution, no unrestricted filesystem access.
- Read-only telemetry commands only.
- Input validation for command parameters.
- Explicit capability flags in payloads for fields that may be unavailable on some platforms.
