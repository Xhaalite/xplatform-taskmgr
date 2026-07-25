# Architecture

## Overview

The app is a local-first desktop dashboard with a strict trust boundary between the renderer and Rust backend.

## Module Boundaries

- UI shell (React): renders dashboard and history charts.
- API client: typed boundary for Tauri command calls.
- Command gateway (Rust): exposes explicitly registered commands only.
- Telemetry services (Rust): gather system/memory/cpu metrics.
- Security/validation (Rust): bounds checks and request hardening.

## Data Flow

1. UI triggers typed request.
2. API client calls Tauri command.
3. Command gateway validates input.
4. Telemetry service collects and normalizes values.
5. DTO response returns with capability flags.

## Non-Goals (v1)

- Remote telemetry aggregation.
- Privileged process termination.
- Unrestricted filesystem traversal.
