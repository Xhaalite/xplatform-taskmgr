use serde::Serialize;
use sysinfo::System;
use std::sync::{Mutex, OnceLock};

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct CapabilityFlags {
    pub hostname: bool,
    pub os_version: bool,
    pub kernel_version: bool,
    pub cpu_usage: bool,
    pub memory_stats: bool,
    pub swap_stats: bool,
    pub process_listing: bool,
    pub scoped_filesystem: bool,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct MetricCapability {
    pub supported: bool,
    pub unit: Option<&'static str>,
    pub note: Option<&'static str>,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct CapabilityDetails {
    pub hostname: MetricCapability,
    pub os_version: MetricCapability,
    pub kernel_version: MetricCapability,
    pub cpu_usage: MetricCapability,
    pub memory_stats: MetricCapability,
    pub swap_stats: MetricCapability,
    pub process_listing: MetricCapability,
    pub scoped_filesystem: MetricCapability,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct NormalizationMetadata {
    pub memory_unit: &'static str,
    pub cpu_usage_unit: &'static str,
    pub timestamp_unit: &'static str,
    pub collector: &'static str,
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
    pub capability_details: CapabilityDetails,
    pub normalization: NormalizationMetadata,
    pub sampled_at_epoch_ms: u64,
}

#[derive(Debug, thiserror::Error)]
pub enum TelemetryError {
    #[error("system clock returned invalid value")]
    InvalidSystemTime,
    #[error("system telemetry collector unavailable")]
    CollectorUnavailable,
}

struct SystemSampler {
    system: System,
    cpu_warmed_up: bool,
}

impl SystemSampler {
    fn new() -> Self {
        let mut system = System::new_all();
        system.refresh_all();

        Self {
            system,
            cpu_warmed_up: false,
        }
    }

    fn snapshot(&mut self) -> Result<SystemSnapshot, TelemetryError> {
        if !self.cpu_warmed_up {
            // sysinfo CPU usage is delta-based; warm up once so Linux snapshots are non-zero.
            self.system.refresh_cpu_usage();
            std::thread::sleep(sysinfo::MINIMUM_CPU_UPDATE_INTERVAL);
            self.system.refresh_cpu_usage();
            self.cpu_warmed_up = true;
        } else {
            self.system.refresh_cpu_usage();
        }

        self.system.refresh_memory();

        let cpu_usage_percent = if self.system.cpus().is_empty() {
            0.0
        } else {
            let total: f32 = self.system.cpus().iter().map(|cpu| cpu.cpu_usage()).sum();
            clamp_percent(total / self.system.cpus().len() as f32)
        };

        let (total_memory_bytes, used_memory_bytes) =
            normalize_usage(self.system.total_memory(), self.system.used_memory());
        let (total_swap_bytes, used_swap_bytes) =
            normalize_usage(self.system.total_swap(), self.system.used_swap());

        let now = std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .map_err(|_| TelemetryError::InvalidSystemTime)?;

        Ok(SystemSnapshot {
            hostname: System::host_name().unwrap_or_else(|| "unknown-host".to_string()),
            os_name: System::name().unwrap_or_else(|| "unknown-os".to_string()),
            os_version: System::long_os_version().unwrap_or_else(|| "unknown-version".to_string()),
            kernel_version: System::kernel_version().unwrap_or_else(|| "unknown-kernel".to_string()),
            uptime_seconds: System::uptime(),
            cpu_usage_percent,
            total_memory_bytes,
            used_memory_bytes,
            total_swap_bytes,
            used_swap_bytes,
            capabilities: build_capabilities(),
            capability_details: build_capability_details(),
            normalization: build_normalization_metadata(),
            sampled_at_epoch_ms: now.as_millis() as u64,
        })
    }
}

fn global_sampler() -> &'static Mutex<SystemSampler> {
    static SAMPLER: OnceLock<Mutex<SystemSampler>> = OnceLock::new();
    SAMPLER.get_or_init(|| Mutex::new(SystemSampler::new()))
}

fn metric_capability(
    supported: bool,
    unit: Option<&'static str>,
    note: Option<&'static str>,
) -> MetricCapability {
    MetricCapability {
        supported,
        unit,
        note,
    }
}

fn build_capabilities() -> CapabilityFlags {
    CapabilityFlags {
        hostname: true,
        os_version: true,
        kernel_version: true,
        cpu_usage: true,
        memory_stats: true,
        swap_stats: true,
        process_listing: true,
        scoped_filesystem: true,
    }
}

fn build_capability_details() -> CapabilityDetails {
    CapabilityDetails {
        hostname: metric_capability(true, None, Some("system hostname via sysinfo")),
        os_version: metric_capability(true, None, Some("long OS version when available")),
        kernel_version: metric_capability(true, None, Some("kernel release string")),
        cpu_usage: metric_capability(true, Some("percent"), Some("system-wide average across CPUs")),
        memory_stats: metric_capability(true, Some("bytes"), Some("normalized to bytes")),
        swap_stats: metric_capability(true, Some("bytes"), Some("normalized to bytes")),
        process_listing: metric_capability(true, None, Some("paged process inspection is available")),
        scoped_filesystem: metric_capability(
            true,
            None,
            Some("scoped filesystem validation is available before directory reads"),
        ),
    }
}

fn build_normalization_metadata() -> NormalizationMetadata {
    NormalizationMetadata {
        memory_unit: "bytes",
        cpu_usage_unit: "percent",
        timestamp_unit: "unixEpochMs",
        collector: "sysinfo",
    }
}

fn clamp_percent(value: f32) -> f32 {
    value.clamp(0.0, 100.0)
}

fn normalize_usage(total: u64, used: u64) -> (u64, u64) {
    (total, used.min(total))
}

pub fn collect_system_snapshot() -> Result<SystemSnapshot, TelemetryError> {
    let sampler = global_sampler();
    let mut sampler = sampler
        .lock()
        .map_err(|_| TelemetryError::CollectorUnavailable)?;
    sampler.snapshot()
}

#[cfg(test)]
mod tests {
    use super::{
        build_capabilities,
        build_normalization_metadata,
        clamp_percent,
        normalize_usage,
    };

    #[test]
    fn cpu_percent_is_clamped_into_expected_range() {
        assert_eq!(clamp_percent(-4.0), 0.0);
        assert_eq!(clamp_percent(42.5), 42.5);
        assert_eq!(clamp_percent(160.0), 100.0);
    }

    #[test]
    fn memory_usage_is_never_reported_above_total() {
        assert_eq!(normalize_usage(100, 40), (100, 40));
        assert_eq!(normalize_usage(100, 160), (100, 100));
    }

    #[test]
    fn expanded_capabilities_and_normalization_metadata_are_present() {
        let capabilities = build_capabilities();
        let normalization = build_normalization_metadata();

        assert!(capabilities.cpu_usage);
        assert!(capabilities.process_listing);
        assert!(capabilities.scoped_filesystem);
        assert_eq!(normalization.memory_unit, "bytes");
        assert_eq!(normalization.cpu_usage_unit, "percent");
    }
}
