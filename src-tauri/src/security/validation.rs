const MIN_REFRESH_MS: u64 = 500;
const MAX_REFRESH_MS: u64 = 60_000;
const MIN_PROCESS_PAGE: u32 = 1;
const MAX_PROCESS_PAGE_SIZE: u32 = 200;
const MIN_PROCESS_PAGE_SIZE: u32 = 1;
const MAX_PROCESS_QUERY_LEN: usize = 120;

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
