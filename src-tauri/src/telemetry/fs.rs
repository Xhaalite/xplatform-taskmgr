use std::fs;
use std::path::{Component, Path, PathBuf};

use serde::Serialize;

use crate::security::validation::{validate_scope_path_text, validate_scope_root_request};

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct FsSupport {
    pub available: bool,
    pub notes: String,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ScopedFsPolicy {
    pub user_selected_roots_only: bool,
    pub canonicalization_required: bool,
    pub relative_paths_only: bool,
    pub write_operations_enabled: bool,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub enum DirectoryEntryKind {
    File,
    Directory,
    Symlink,
    Other,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct DirectoryEntry {
    pub name: String,
    pub relative_path: String,
    pub kind: DirectoryEntryKind,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ScopedDirectoryListing {
    pub root_path: String,
    pub current_relative_path: String,
    pub entries: Vec<DirectoryEntry>,
    pub policy: ScopedFsPolicy,
}

#[derive(Debug, thiserror::Error)]
pub enum FsPolicyError {
    #[error("scope root is required")]
    MissingRoot,
    #[error("scope root does not exist")]
    RootMissing,
    #[error("scope root must be a directory")]
    RootNotDirectory,
    #[error("requested scope path must be relative to the selected root")]
    AbsolutePathDenied,
    #[error("requested scope path cannot traverse upward")]
    ParentTraversalDenied,
    #[error("requested scope path does not exist")]
    RequestedPathMissing,
    #[error("requested scope path must resolve to a directory")]
    RequestedPathNotDirectory,
    #[error("requested scope path resolves outside of the selected root")]
    OutsideSelectedRoot,
    #[error("invalid scope request: {0}")]
    InvalidRequest(String),
    #[error("failed to read scoped directory: {0}")]
    ReadDirectory(String),
}

fn scoped_policy() -> ScopedFsPolicy {
    ScopedFsPolicy {
        user_selected_roots_only: true,
        canonicalization_required: true,
        relative_paths_only: true,
        write_operations_enabled: false,
    }
}

fn path_kind(path: &Path) -> DirectoryEntryKind {
    match fs::symlink_metadata(path) {
        Ok(metadata) if metadata.file_type().is_symlink() => DirectoryEntryKind::Symlink,
        Ok(metadata) if metadata.is_dir() => DirectoryEntryKind::Directory,
        Ok(metadata) if metadata.is_file() => DirectoryEntryKind::File,
        Ok(_) | Err(_) => DirectoryEntryKind::Other,
    }
}

pub fn fs_support() -> FsSupport {
    FsSupport {
        available: true,
        notes: "Scoped filesystem traversal is limited to user-selected roots and validated through canonicalized relative paths.".to_string(),
    }
}

pub fn canonicalize_scope_root(root_path: &str) -> Result<PathBuf, FsPolicyError> {
    let trimmed = root_path.trim();
    if trimmed.is_empty() {
        return Err(FsPolicyError::MissingRoot);
    }

    validate_scope_root_request(trimmed).map_err(FsPolicyError::InvalidRequest)?;

    let canonical_root = Path::new(trimmed)
        .canonicalize()
        .map_err(|error| match error.kind() {
            std::io::ErrorKind::NotFound => FsPolicyError::RootMissing,
            _ => FsPolicyError::InvalidRequest(error.to_string()),
        })?;

    if !canonical_root.is_dir() {
        return Err(FsPolicyError::RootNotDirectory);
    }

    Ok(canonical_root)
}

pub fn resolve_scoped_directory(
    root_path: &str,
    relative_path: Option<&str>,
) -> Result<(PathBuf, PathBuf), FsPolicyError> {
    let canonical_root = canonicalize_scope_root(root_path)?;
    let requested = relative_path.unwrap_or("").trim();
    validate_scope_path_text(requested).map_err(FsPolicyError::InvalidRequest)?;

    let candidate = if requested.is_empty() {
        canonical_root.clone()
    } else {
        let requested_path = Path::new(requested);

        if requested_path.is_absolute()
            || requested_path.components().any(|component| {
                matches!(component, Component::Prefix(_) | Component::RootDir)
            })
        {
            return Err(FsPolicyError::AbsolutePathDenied);
        }

        if requested_path
            .components()
            .any(|component| matches!(component, Component::ParentDir))
        {
            return Err(FsPolicyError::ParentTraversalDenied);
        }

        let joined = canonical_root.join(requested_path);
        joined.canonicalize().map_err(|error| match error.kind() {
            std::io::ErrorKind::NotFound => FsPolicyError::RequestedPathMissing,
            _ => FsPolicyError::InvalidRequest(error.to_string()),
        })?
    };

    if !candidate.starts_with(&canonical_root) {
        return Err(FsPolicyError::OutsideSelectedRoot);
    }

    if !candidate.is_dir() {
        return Err(FsPolicyError::RequestedPathNotDirectory);
    }

    Ok((canonical_root, candidate))
}

pub fn list_scoped_directory(
    root_path: &str,
    relative_path: Option<&str>,
) -> Result<ScopedDirectoryListing, FsPolicyError> {
    let (canonical_root, canonical_target) = resolve_scoped_directory(root_path, relative_path)?;
    let current_relative_path = canonical_target
        .strip_prefix(&canonical_root)
        .unwrap_or_else(|_| Path::new(""))
        .to_string_lossy()
        .replace('\\', "/");

    let mut entries = fs::read_dir(&canonical_target)
        .map_err(|error| FsPolicyError::ReadDirectory(error.to_string()))?
        .filter_map(|entry_result| entry_result.ok())
        .map(|entry| {
            let path = entry.path();
            let relative = path
                .strip_prefix(&canonical_root)
                .unwrap_or(path.as_path())
                .to_string_lossy()
                .replace('\\', "/");

            DirectoryEntry {
                name: entry.file_name().to_string_lossy().to_string(),
                relative_path: relative,
                kind: path_kind(&path),
            }
        })
        .collect::<Vec<_>>();

    entries.sort_by(|left, right| left.name.to_lowercase().cmp(&right.name.to_lowercase()));

    Ok(ScopedDirectoryListing {
        root_path: canonical_root.to_string_lossy().to_string(),
        current_relative_path,
        entries,
        policy: scoped_policy(),
    })
}

#[cfg(test)]
mod tests {
    use std::fs::{create_dir_all, remove_dir_all, write};
    use std::path::PathBuf;
    use std::time::{SystemTime, UNIX_EPOCH};

    use super::{
        canonicalize_scope_root,
        list_scoped_directory,
        resolve_scoped_directory,
        FsPolicyError,
    };

    fn test_root() -> PathBuf {
        let unique = SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .expect("time")
            .as_nanos();
        std::env::temp_dir().join(format!("xplatform-taskmgr-fs-{unique}"))
    }

    #[test]
    fn canonicalize_scope_root_requires_existing_directory() {
        let missing = test_root();
        let error = canonicalize_scope_root(&missing.to_string_lossy()).expect_err("missing root should fail");
        assert!(matches!(error, FsPolicyError::RootMissing));
    }

    #[test]
    fn resolve_scoped_directory_rejects_absolute_and_parent_paths() {
        let root = test_root();
        create_dir_all(&root).expect("create root");

        let absolute_result = resolve_scoped_directory(
            &root.to_string_lossy(),
            Some(&root.join("nested").to_string_lossy()),
        );
        assert!(matches!(absolute_result, Err(FsPolicyError::AbsolutePathDenied)));

        let traversal_result = resolve_scoped_directory(&root.to_string_lossy(), Some("../outside"));
        assert!(matches!(traversal_result, Err(FsPolicyError::ParentTraversalDenied)));

        remove_dir_all(&root).expect("cleanup root");
    }

    #[test]
    fn list_scoped_directory_returns_sorted_relative_entries() {
        let root = test_root();
        let nested = root.join("logs");
        create_dir_all(&nested).expect("create nested dir");
        write(root.join("zeta.txt"), b"zeta").expect("write zeta");
        write(root.join("alpha.txt"), b"alpha").expect("write alpha");

        let listing = list_scoped_directory(&root.to_string_lossy(), None).expect("list root");

        assert_eq!(listing.policy.relative_paths_only, true);
        assert_eq!(listing.current_relative_path, "");
        assert_eq!(listing.entries.first().expect("first entry").name, "alpha.txt");
        assert!(listing.entries.iter().any(|entry| entry.relative_path == "logs"));

        remove_dir_all(&root).expect("cleanup root");
    }
}
