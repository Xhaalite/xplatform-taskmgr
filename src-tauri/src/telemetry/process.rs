use std::borrow::Cow;
use std::sync::{Mutex, OnceLock};

use serde::{Deserialize, Serialize};
use sysinfo::{ProcessesToUpdate, System};

#[derive(Debug, Clone, Copy, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub enum ProcessSortBy {
    Pid,
    Name,
    CpuUsagePercent,
    MemoryBytes,
}

#[derive(Debug, Clone, Copy, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub enum SortDirection {
    Asc,
    Desc,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ProcessItem {
    pub pid: String,
    pub name: String,
    pub cpu_usage_percent: f32,
    pub memory_bytes: u64,
    pub virtual_memory_bytes: u64,
    pub status: String,
    pub started_at_epoch_s: u64,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ProcessPage {
    pub items: Vec<ProcessItem>,
    pub total_count: u64,
    pub page: u32,
    pub page_size: u32,
    pub sort_by: ProcessSortBy,
    pub sort_direction: SortDirection,
    pub filter_query: String,
}

#[derive(Debug)]
pub struct ProcessListOptions {
    pub page: u32,
    pub page_size: u32,
    pub sort_by: ProcessSortBy,
    pub sort_direction: SortDirection,
    pub filter_query: String,
}

struct ProcessSampler {
    system: System,
    cpu_warmed_up: bool,
}

impl ProcessSampler {
    fn new() -> Self {
        let mut system = System::new_all();
        system.refresh_all();

        Self {
            system,
            cpu_warmed_up: false,
        }
    }

    fn refresh(&mut self) {
        if !self.cpu_warmed_up {
            // Process CPU percentages are delta-based, so prime a baseline once.
            self.system.refresh_processes(ProcessesToUpdate::All);
            std::thread::sleep(sysinfo::MINIMUM_CPU_UPDATE_INTERVAL);
            self.system.refresh_processes(ProcessesToUpdate::All);
            self.cpu_warmed_up = true;
        } else {
            self.system.refresh_processes(ProcessesToUpdate::All);
        }
    }
}

fn process_sampler() -> &'static Mutex<ProcessSampler> {
    static SAMPLER: OnceLock<Mutex<ProcessSampler>> = OnceLock::new();
    SAMPLER.get_or_init(|| Mutex::new(ProcessSampler::new()))
}

fn os_to_string(value: Cow<'_, str>) -> String {
    value.trim().to_string()
}

fn sort_processes(items: &mut [ProcessItem], sort_by: ProcessSortBy, direction: SortDirection) {
    items.sort_by(|left, right| {
        let order = match sort_by {
            ProcessSortBy::Pid => {
                let left_pid = left.pid.parse::<u64>().unwrap_or(0);
                let right_pid = right.pid.parse::<u64>().unwrap_or(0);
                left_pid.cmp(&right_pid)
            }
            ProcessSortBy::Name => left.name.to_lowercase().cmp(&right.name.to_lowercase()),
            ProcessSortBy::CpuUsagePercent => left
                .cpu_usage_percent
                .partial_cmp(&right.cpu_usage_percent)
                .unwrap_or(std::cmp::Ordering::Equal),
            ProcessSortBy::MemoryBytes => left.memory_bytes.cmp(&right.memory_bytes),
        };

        match direction {
            SortDirection::Asc => order,
            SortDirection::Desc => order.reverse(),
        }
    });
}

pub fn collect_process_page(options: ProcessListOptions) -> ProcessPage {
    let sampler = process_sampler();
    let mut sampler = sampler
        .lock()
        .expect("process telemetry collector lock poisoned");
    sampler.refresh();

    let normalized_query = options.filter_query.trim().to_lowercase();

    let mut items = sampler
        .system
        .processes()
        .iter()
        .filter_map(|(pid, process)| {
            let name = os_to_string(process.name().to_string_lossy());
            let pid_text = pid.to_string();
            let command = process
                .cmd()
                .iter()
                .map(|value| value.to_string_lossy().to_string())
                .collect::<Vec<_>>()
                .join(" ");

            let haystack = format!("{} {} {}", pid_text, name.to_lowercase(), command.to_lowercase());
            if !normalized_query.is_empty() && !haystack.contains(&normalized_query) {
                return None;
            }

            Some(ProcessItem {
                pid: pid_text,
                name,
                cpu_usage_percent: process.cpu_usage(),
                memory_bytes: process.memory(),
                virtual_memory_bytes: process.virtual_memory(),
                status: format!("{:?}", process.status()),
                started_at_epoch_s: process.start_time(),
            })
        })
        .collect::<Vec<_>>();

    sort_processes(&mut items, options.sort_by, options.sort_direction);

    let total_count = items.len() as u64;
    let start = ((options.page - 1) as usize).saturating_mul(options.page_size as usize);
    let end = (start + options.page_size as usize).min(items.len());
    let paged_items = if start >= items.len() {
        Vec::new()
    } else {
        items[start..end].to_vec()
    };

    ProcessPage {
        items: paged_items,
        total_count,
        page: options.page,
        page_size: options.page_size,
        sort_by: options.sort_by,
        sort_direction: options.sort_direction,
        filter_query: options.filter_query,
    }
}
