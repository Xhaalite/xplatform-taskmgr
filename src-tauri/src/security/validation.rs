use std::collections::HashMap;
use std::sync::{Mutex, OnceLock};
use std::time::{Duration, Instant};

const MIN_REFRESH_MS: u64 = 500;
const MAX_REFRESH_MS: u64 = 60_000;
const MIN_PROCESS_PAGE: u32 = 1;
const MAX_PROCESS_PAGE_SIZE: u32 = 200;
const MIN_PROCESS_PAGE_SIZE: u32 = 1;
const MAX_PROCESS_QUERY_LEN: usize = 120;
const MAX_SCOPE_PATH_LEN: usize = 1024;
const MAX_PROCESS_PID_LEN: usize = 24;

pub fn validate_refresh_interval(value: u64) -> Result<(), String> {
    if value < MIN_REFRESH_MS {
        return Err(format!(
            "refresh interval too low; expected >= {MIN_REFRESH_MS}ms"
        ));
    }

    if value > MAX_REFRESH_MS {
        return Err(format!(
            "refresh interval too high; expected <= {MAX_REFRESH_MS}ms"
        ));
    }

    Ok(())
}

pub fn validate_process_page(page: u32, page_size: u32) -> Result<(), String> {
    if page < MIN_PROCESS_PAGE {
        return Err("process page must be >= 1".to_string());
    }

    if !(MIN_PROCESS_PAGE_SIZE..=MAX_PROCESS_PAGE_SIZE).contains(&page_size) {
        return Err(format!(
            "process page size out of bounds; expected {MIN_PROCESS_PAGE_SIZE}..={MAX_PROCESS_PAGE_SIZE}"
        ));
    }

    Ok(())
}

pub fn validate_process_query(query: &str) -> Result<(), String> {
    if query.len() > MAX_PROCESS_QUERY_LEN {
        return Err(format!(
            "process filter too long; expected <= {MAX_PROCESS_QUERY_LEN} chars"
        ));
    }

    Ok(())
}

pub fn validate_scope_root_request(root_path: &str) -> Result<(), String> {
    let trimmed = root_path.trim();

    if trimmed.is_empty() {
        return Err("scope root path is required".to_string());
    }

    validate_scope_path_text(trimmed)
}

pub fn validate_scope_path_text(path: &str) -> Result<(), String> {
    if path.len() > MAX_SCOPE_PATH_LEN {
        return Err(format!(
            "scope path too long; expected <= {MAX_SCOPE_PATH_LEN} chars"
        ));
    }

    if path.contains('\0') {
        return Err("scope path contains invalid null byte".to_string());
    }

    Ok(())
}

pub fn validate_process_pid(pid: &str) -> Result<(), String> {
    let trimmed = pid.trim();

    if trimmed.is_empty() {
        return Err("process pid is required".to_string());
    }

    if trimmed.len() > MAX_PROCESS_PID_LEN {
        return Err(format!(
            "process pid too long; expected <= {MAX_PROCESS_PID_LEN} chars"
        ));
    }

    if !trimmed.chars().all(|ch| ch.is_ascii_digit()) {
        return Err("process pid must be numeric".to_string());
    }

    Ok(())
}

pub fn validate_command_rate(command_key: &'static str, min_interval_ms: u64) -> Result<(), String> {
    static LAST_SEEN: OnceLock<Mutex<HashMap<&'static str, Instant>>> = OnceLock::new();
    let tracker = LAST_SEEN.get_or_init(|| Mutex::new(HashMap::new()));

    let mut tracker = tracker
        .lock()
        .map_err(|_| "command rate tracker unavailable".to_string())?;

    let now = Instant::now();
    if let Some(last_seen) = tracker.get(command_key) {
        let elapsed = now.saturating_duration_since(*last_seen);
        let min_interval = Duration::from_millis(min_interval_ms);
        if elapsed < min_interval {
            let remaining = min_interval.saturating_sub(elapsed).as_millis();
            return Err(format!(
                "command rate limited; retry in {remaining}ms"
            ));
        }
    }

    tracker.insert(command_key, now);
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::{
        validate_command_rate,
        validate_process_page,
        validate_process_pid,
        validate_process_query,
        validate_scope_path_text,
        validate_scope_root_request,
    };

    #[test]
    fn process_page_bounds_are_enforced() {
        assert!(validate_process_page(1, 25).is_ok());
        assert!(validate_process_page(0, 25).is_err());
        assert!(validate_process_page(1, 500).is_err());
    }

    #[test]
    fn process_query_length_is_enforced() {
        assert!(validate_process_query("shell").is_ok());
        assert!(validate_process_query(&"x".repeat(121)).is_err());
    }

    #[test]
    fn scope_root_must_be_present() {
        assert!(validate_scope_root_request("C:/temp").is_ok());
        assert!(validate_scope_root_request("   ").is_err());
    }

    #[test]
    fn scope_path_rejects_invalid_bytes_and_length() {
        assert!(validate_scope_path_text("logs/session").is_ok());
        assert!(validate_scope_path_text("bad\0path").is_err());
        assert!(validate_scope_path_text(&"x".repeat(1025)).is_err());
    }

    #[test]
    fn process_pid_validation_enforces_shape() {
        assert!(validate_process_pid("1234").is_ok());
        assert!(validate_process_pid("").is_err());
        assert!(validate_process_pid("abc123").is_err());
        assert!(validate_process_pid(&"1".repeat(25)).is_err());
    }

    #[test]
    fn command_rate_limit_rejects_back_to_back_calls() {
        let key = "validation_test_command_rate_limit";
        assert!(validate_command_rate(key, 1).is_ok());
        assert!(validate_command_rate(key, 50).is_err());
    }
}
