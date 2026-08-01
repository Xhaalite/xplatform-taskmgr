use serde::Serialize;
use std::sync::{Mutex, OnceLock};

#[derive(Debug, Serialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct NetworkInterfaceSnapshot {
    pub name: String,
    pub received_bytes: u64,
    pub transmitted_bytes: u64,
}

#[derive(Debug, Serialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct NetworkSnapshot {
    pub supported: bool,
    pub note: Option<String>,
    pub interfaces: Vec<NetworkInterfaceSnapshot>,
    pub total_received_bytes: u64,
    pub total_transmitted_bytes: u64,
    pub delta_received_bytes: u64,
    pub delta_transmitted_bytes: u64,
    pub sampled_at_epoch_ms: u64,
}

#[derive(Debug, thiserror::Error)]
pub enum NetworkTelemetryError {
    #[error("system clock returned invalid value")]
    InvalidSystemTime,
    #[error("failed to read /proc/net/dev")]
    ProcReadFailed,
    #[error("network telemetry collector unavailable")]
    CollectorUnavailable,
}

#[derive(Debug, Clone)]
struct NetworkTotals {
    interfaces: Vec<NetworkInterfaceSnapshot>,
    total_received_bytes: u64,
    total_transmitted_bytes: u64,
}

struct NetworkSampler {
    previous_totals: Option<NetworkTotals>,
}

impl NetworkSampler {
    fn new() -> Self {
        Self {
            previous_totals: None,
        }
    }

    fn snapshot(&mut self) -> Result<NetworkSnapshot, NetworkTelemetryError> {
        #[cfg(target_os = "linux")]
        {
            let totals = read_linux_network_totals()?;
            let (delta_received_bytes, delta_transmitted_bytes) =
                if let Some(previous) = &self.previous_totals {
                    (
                        totals
                            .total_received_bytes
                            .saturating_sub(previous.total_received_bytes),
                        totals
                            .total_transmitted_bytes
                            .saturating_sub(previous.total_transmitted_bytes),
                    )
                } else {
                    (0, 0)
                };

            self.previous_totals = Some(totals.clone());

            return Ok(NetworkSnapshot {
                supported: true,
                note: None,
                interfaces: totals.interfaces,
                total_received_bytes: totals.total_received_bytes,
                total_transmitted_bytes: totals.total_transmitted_bytes,
                delta_received_bytes,
                delta_transmitted_bytes,
                sampled_at_epoch_ms: now_epoch_ms()?,
            });
        }

        #[cfg(not(target_os = "linux"))]
        {
            Ok(NetworkSnapshot {
                supported: false,
                note: Some("Network telemetry currently reads Linux /proc/net/dev only.".to_string()),
                interfaces: Vec::new(),
                total_received_bytes: 0,
                total_transmitted_bytes: 0,
                delta_received_bytes: 0,
                delta_transmitted_bytes: 0,
                sampled_at_epoch_ms: now_epoch_ms()?,
            })
        }
    }
}

fn now_epoch_ms() -> Result<u64, NetworkTelemetryError> {
    let now = std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .map_err(|_| NetworkTelemetryError::InvalidSystemTime)?;
    Ok(now.as_millis() as u64)
}

#[cfg(target_os = "linux")]
fn read_linux_network_totals() -> Result<NetworkTotals, NetworkTelemetryError> {
    let content = std::fs::read_to_string("/proc/net/dev")
        .map_err(|_| NetworkTelemetryError::ProcReadFailed)?;

    let mut interfaces = Vec::new();
    let mut total_received_bytes = 0_u64;
    let mut total_transmitted_bytes = 0_u64;

    for line in content.lines().skip(2) {
        let trimmed = line.trim();
        if trimmed.is_empty() {
            continue;
        }

        let Some((name_part, stats_part)) = trimmed.split_once(':') else {
            continue;
        };

        let name = name_part.trim().to_string();
        let stats: Vec<&str> = stats_part.split_whitespace().collect();
        if stats.len() < 16 {
            continue;
        }

        let received_bytes = stats[0].parse::<u64>().unwrap_or(0);
        let transmitted_bytes = stats[8].parse::<u64>().unwrap_or(0);

        total_received_bytes = total_received_bytes.saturating_add(received_bytes);
        total_transmitted_bytes = total_transmitted_bytes.saturating_add(transmitted_bytes);

        interfaces.push(NetworkInterfaceSnapshot {
            name,
            received_bytes,
            transmitted_bytes,
        });
    }

    interfaces.sort_by(|left, right| left.name.cmp(&right.name));

    Ok(NetworkTotals {
        interfaces,
        total_received_bytes,
        total_transmitted_bytes,
    })
}

fn global_network_sampler() -> &'static Mutex<NetworkSampler> {
    static SAMPLER: OnceLock<Mutex<NetworkSampler>> = OnceLock::new();
    SAMPLER.get_or_init(|| Mutex::new(NetworkSampler::new()))
}

pub fn collect_network_snapshot() -> Result<NetworkSnapshot, NetworkTelemetryError> {
    let sampler = global_network_sampler();
    let mut sampler = sampler
        .lock()
        .map_err(|_| NetworkTelemetryError::CollectorUnavailable)?;

    sampler.snapshot()
}
