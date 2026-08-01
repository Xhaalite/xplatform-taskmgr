# OS Capability Matrix (Initial)

| Capability          | Windows | Linux | macOS   | Notes                                                                    |
| ------------------- | ------- | ----- | ------- | ------------------------------------------------------------------------ |
| Hostname            | Yes     | Yes   | Yes     | Provided by `sysinfo`.                                                   |
| OS version          | Yes     | Yes   | Yes     | Human-readable long version if available.                                |
| CPU usage percent   | Yes     | Yes   | Yes     | Snapshot sampling based on `sysinfo`.                                    |
| Total memory        | Yes     | Yes   | Yes     | Normalized to bytes.                                                     |
| Used memory         | Yes     | Yes   | Yes     | Normalized to bytes.                                                     |
| Swap totals         | Yes     | Yes   | Yes     | Availability can vary by environment/container.                          |
| Process detail      | Yes     | Yes   | Yes     | Paged list with sorting/filtering and CPU/memory stats.                  |
| Network connections | Partial | Yes   | Partial | Linux support reads `/proc/net/dev`; non-Linux returns unsupported note. |
