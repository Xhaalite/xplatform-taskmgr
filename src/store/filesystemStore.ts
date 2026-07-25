import { useEffect, useMemo, useState } from 'react';
import {
  listScopedDirectory,
  type DirectoryEntry,
  type ScopedDirectoryListing,
  type ScopedFsPolicy,
} from '../services/apiClient';

export interface PathSegment {
  label: string;
  relativePath: string;
}

export interface FilesystemViewState {
  rootPathInput: string;
  rootPath: string;
  currentRelativePath: string;
  entries: DirectoryEntry[];
  policy: ScopedFsPolicy | null;
  loading: boolean;
  error: string | null;
  lastLoadedAtEpochMs: number | null;
}

function parentRelativePath(relativePath: string): string {
  const parts = relativePath.split('/').filter(Boolean);
  return parts.slice(0, -1).join('/');
}

function buildBreadcrumbs(relativePath: string): PathSegment[] {
  const parts = relativePath.split('/').filter(Boolean);
  const breadcrumbs: PathSegment[] = [{ label: 'Root', relativePath: '' }];

  let current = '';
  for (const part of parts) {
    current = current ? `${current}/${part}` : part;
    breadcrumbs.push({ label: part, relativePath: current });
  }

  return breadcrumbs;
}

export function useFilesystemBrowser() {
  const [state, setState] = useState<FilesystemViewState>({
    rootPathInput: '',
    rootPath: '',
    currentRelativePath: '',
    entries: [],
    policy: null,
    loading: false,
    error: null,
    lastLoadedAtEpochMs: null,
  });

  const [refreshTick, setRefreshTick] = useState(0);

  useEffect(() => {
    let active = true;

    const loadListing = async () => {
      if (!state.rootPath) {
        return;
      }

      try {
        const listing: ScopedDirectoryListing = await listScopedDirectory({
          rootPath: state.rootPath,
          relativePath:
            state.currentRelativePath.length > 0
              ? state.currentRelativePath
              : undefined,
        });

        if (!active) {
          return;
        }

        setState((previous) => ({
          ...previous,
          entries: listing.entries,
          policy: listing.policy,
          currentRelativePath: listing.currentRelativePath,
          loading: false,
          error: null,
          lastLoadedAtEpochMs: Date.now(),
        }));
      } catch (error) {
        if (!active) {
          return;
        }

        const message =
          error instanceof Error
            ? error.message
            : 'Failed to load scoped directory';

        setState((previous) => ({
          ...previous,
          loading: false,
          error: message,
        }));
      }
    };

    void loadListing();

    return () => {
      active = false;
    };
  }, [refreshTick, state.currentRelativePath, state.rootPath]);

  const breadcrumbs = useMemo(
    () => buildBreadcrumbs(state.currentRelativePath),
    [state.currentRelativePath],
  );

  const setRootPathInput = (value: string) => {
    setState((previous) => ({
      ...previous,
      rootPathInput: value,
    }));
  };

  const applyRootPath = () => {
    const nextRoot = state.rootPathInput.trim();

    if (!nextRoot) {
      setState((previous) => ({
        ...previous,
        error: 'Root path is required',
      }));
      return;
    }

    setState((previous) => ({
      ...previous,
      rootPath: nextRoot,
      currentRelativePath: '',
      entries: [],
      policy: null,
      loading: true,
      error: null,
    }));
  };

  const openPath = (relativePath: string) => {
    setState((previous) => ({
      ...previous,
      currentRelativePath: relativePath,
      loading: true,
      error: null,
    }));
  };

  const goUp = () => {
    setState((previous) => ({
      ...previous,
      currentRelativePath: parentRelativePath(previous.currentRelativePath),
      loading: true,
      error: null,
    }));
  };

  const refresh = () => {
    if (!state.rootPath) {
      return;
    }

    setState((previous) => ({
      ...previous,
      loading: true,
      error: null,
    }));
    setRefreshTick((previous) => previous + 1);
  };

  return {
    ...state,
    breadcrumbs,
    canGoUp: state.currentRelativePath.length > 0,
    hasRootPath: state.rootPath.length > 0,
    setRootPathInput,
    applyRootPath,
    openPath,
    goUp,
    refresh,
  };
}
