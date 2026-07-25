use serde::Serialize;

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct FsSupport {
    pub available: bool,
    pub notes: String,
}

pub fn fs_support() -> FsSupport {
    FsSupport {
        available: false,
        notes: "Scoped filesystem traversal will be enabled after root-selection policy is implemented.".to_string(),
    }
}
