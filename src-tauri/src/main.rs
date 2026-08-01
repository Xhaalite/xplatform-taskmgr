#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod commands;
mod security;
mod telemetry;

fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![
            commands::telemetry::get_system_snapshot,
            commands::telemetry::get_network_snapshot,
            commands::telemetry::get_process_page,
            commands::telemetry::get_process_detail,
            commands::telemetry::list_scoped_directory_command
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
