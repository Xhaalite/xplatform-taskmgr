use serde::{Deserialize, Serialize};

use crate::security::validation::{
    validate_process_page,
    validate_process_query,
    validate_refresh_interval,
    validate_scope_path_text,
    validate_scope_root_request,
};
use crate::telemetry::fs::{list_scoped_directory, ScopedDirectoryListing};
use crate::telemetry::process::{
    collect_process_page,
    ProcessListOptions,
    ProcessPage,
    ProcessSortBy,
    SortDirection,
};
use crate::telemetry::network::collect_network_snapshot;
use crate::telemetry::system::collect_system_snapshot;

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SnapshotRequest {
    pub min_refresh_ms: u64,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ProcessPageRequest {
    pub page: u32,
    pub page_size: u32,
    pub filter_query: Option<String>,
    pub sort_by: Option<ProcessSortBy>,
    pub sort_direction: Option<SortDirection>,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ScopedDirectoryRequest {
    pub root_path: String,
    pub relative_path: Option<String>,
}

#[derive(Debug, Serialize)]
pub struct CommandError {
    message: String,
}

impl CommandError {
    fn from_message(message: impl Into<String>) -> Self {
        Self {
            message: message.into(),
        }
    }
}

#[tauri::command]
pub fn get_system_snapshot(request: SnapshotRequest) -> Result<crate::telemetry::system::SystemSnapshot, CommandError> {
    validate_refresh_interval(request.min_refresh_ms)
        .map_err(CommandError::from_message)?;

    collect_system_snapshot().map_err(|err| CommandError::from_message(err.to_string()))
}

#[tauri::command]
pub fn get_network_snapshot() -> Result<crate::telemetry::network::NetworkSnapshot, CommandError> {
    collect_network_snapshot().map_err(|err| CommandError::from_message(err.to_string()))
}

#[tauri::command]
pub fn get_process_page(request: ProcessPageRequest) -> Result<ProcessPage, CommandError> {
    validate_process_page(request.page, request.page_size)
        .map_err(CommandError::from_message)?;

    let filter_query = request.filter_query.unwrap_or_default();
    validate_process_query(&filter_query).map_err(CommandError::from_message)?;

    let options = ProcessListOptions {
        page: request.page,
        page_size: request.page_size,
        sort_by: request.sort_by.unwrap_or(ProcessSortBy::CpuUsagePercent),
        sort_direction: request.sort_direction.unwrap_or(SortDirection::Desc),
        filter_query,
    };

    Ok(collect_process_page(options))
}

#[tauri::command]
pub fn list_scoped_directory_command(
    request: ScopedDirectoryRequest,
) -> Result<ScopedDirectoryListing, CommandError> {
    validate_scope_root_request(&request.root_path).map_err(CommandError::from_message)?;

    if let Some(relative_path) = request.relative_path.as_deref() {
        validate_scope_path_text(relative_path).map_err(CommandError::from_message)?;
    }

    list_scoped_directory(&request.root_path, request.relative_path.as_deref())
        .map_err(|error| CommandError::from_message(error.to_string()))
}
