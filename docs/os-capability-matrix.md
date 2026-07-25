# OS Capability Matrix (Initial)

| Capability          | Windows | Linux   | macOS   | Notes                                           |
| ------------------- | ------- | ------- | ------- | ----------------------------------------------- |
| Hostname            | Yes     | Yes     | Yes     | Provided by `sysinfo`.                          |
| OS version          | Yes     | Yes     | Yes     | Human-readable long version if available.       |
| CPU usage percent   | Yes     | Yes     | Yes     | Snapshot sampling based on `sysinfo`.           |
| Total memory        | Yes     | Yes     | Yes     | Normalized to bytes.                            |
| Used memory         | Yes     | Yes     | Yes     | Normalized to bytes.                            |
| Swap totals         | Yes     | Yes     | Yes     | Availability can vary by environment/container. |
| Process detail      | Planned | Planned | Planned | Phase 5.                                        |
| Network connections | Planned | Planned | Planned | Phase 5 with OS-specific fallbacks.             |
