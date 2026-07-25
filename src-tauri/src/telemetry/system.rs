use serde::Serialize;
use sysinfo::System;

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct CapabilityFlags {
    pub cpu_usage: bool,
    pub memory_stats: bool,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct SystemSnapshot {
    pub hostname: String,
    pub os_name: String,
    pub os_version: String,
    pub kernel_version: String,
    pub uptime_seconds: u64,
    pub cpu_usage_percent: f32,
    pub total_memory_bytes: u64,
    pub used_memory_bytes: u64,
    pub total_swap_bytes: u64,
    pub used_swap_bytes: u64,
    pub capabilities: CapabilityFlags,
    pub sampled_at_epoch_ms: u64,
}

#[derive(Debug, thiserror::Error)]
pub enum TelemetryError {
    #[error("system clock returned invalid value")]
    InvalidSystemTime,
}

pub fn collect_system_snapshot() -> Result<SystemSnapshot, TelemetryError> {
    let mut system = System::new_all();
    system.refresh_all();

    let cpu_usage_percent = if system.cpus().is_empty() {
        0.0
    } else {
        let total: f32 = system.cpus().iter().map(|cpu| cpu.cpu_usage()).sum();
        total / system.cpus().len() as f32
    };

    let now = std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .map_err(|_| TelemetryError::InvalidSystemTime)?;

    let snapshot = SystemSnapshot {
        hostname: System::host_name().unwrap_or_else(|| "unknown-host".to_string()),
        os_name: System::name().unwrap_or_else(|| "unknown-os".to_string()),
        os_version: System::long_os_version().unwrap_or_else(|| "unknown-version".to_string()),
        kernel_version: System::kernel_version().unwrap_or_else(|| "unknown-kernel".to_string()),
        uptime_seconds: System::uptime(),
        cpu_usage_percent,
        total_memory_bytes: system.total_memory(),
        used_memory_bytes: system.used_memory(),
        total_swap_bytes: system.total_swap(),
        used_swap_bytes: system.used_swap(),
        capabilities: CapabilityFlags {
            cpu_usage: true,
            memory_stats: true,
        },
        sampled_at_epoch_ms: now.as_millis() as u64,
    };

    Ok(snapshot)
}
