use serde::Serialize;

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct NetworkSupport {
    pub available: bool,
    pub notes: String,
}

pub fn network_support() -> NetworkSupport {
    NetworkSupport {
        available: false,
        notes: "Network interface and connection telemetry is planned for a later phase.".to_string(),
    }
}
