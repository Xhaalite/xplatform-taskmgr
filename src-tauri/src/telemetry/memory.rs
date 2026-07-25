use serde::Serialize;

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct MemorySupport {
    pub available: bool,
    pub notes: String,
}

pub fn memory_support() -> MemorySupport {
    MemorySupport {
        available: true,
        notes: "Dedicated memory module planned; system snapshot currently exposes memory usage.".to_string(),
    }
}
