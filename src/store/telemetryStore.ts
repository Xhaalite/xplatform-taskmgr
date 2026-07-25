import { useEffect, useMemo, useState } from 'react';
import {
  getSystemSnapshot,
  type SnapshotRequest,
  type SystemSnapshot,
} from '../services/apiClient';

const MAX_HISTORY_POINTS = 60;
const DEFAULT_REFRESH_MS = 1500;
const DEFAULT_BACKGROUND_REFRESH_MS = 10000;

function appendPoint(history: number[], next: number): number[] {
  const updated = [...history, next];
  return updated.length > MAX_HISTORY_POINTS
    ? updated.slice(updated.length - MAX_HISTORY_POINTS)
    : updated;
}

export interface TelemetryViewState {
  snapshot: SystemSnapshot | null;
  cpuHistory: number[];
  memoryHistoryPercent: number[];
  loading: boolean;
  error: string | null;
  pollIntervalMs: number;
  isBackgroundPolling: boolean;
  updatedAtEpochMs: number | null;
}

export interface TelemetryOptions {
  refreshMs?: number;
  backgroundRefreshMs?: number;
}

export function useTelemetry(options: TelemetryOptions = {}) {
  const refreshMs = options.refreshMs ?? DEFAULT_REFRESH_MS;
  const backgroundRefreshMs =
    options.backgroundRefreshMs ?? DEFAULT_BACKGROUND_REFRESH_MS;

  const [state, setState] = useState<TelemetryViewState>({
    snapshot: null,
    cpuHistory: [],
    memoryHistoryPercent: [],
    loading: true,
    error: null,
    pollIntervalMs: refreshMs,
    isBackgroundPolling: false,
    updatedAtEpochMs: null,
  });

  const request = useMemo<SnapshotRequest>(
    () => ({ minRefreshMs: refreshMs }),
    [refreshMs],
  );

  useEffect(() => {
    let active = true;
    let timer: ReturnType<typeof setTimeout> | null = null;

    const currentInterval = () =>
      document.hidden ? backgroundRefreshMs : refreshMs;

    const poll = async () => {
      const interval = currentInterval();

      try {
        const snapshot = await getSystemSnapshot(request);

        if (!active) {
          return;
        }

        const memoryPercent =
          snapshot.totalMemoryBytes > 0
            ? (snapshot.usedMemoryBytes / snapshot.totalMemoryBytes) * 100
            : 0;

        setState((previous) => ({
          snapshot,
          cpuHistory: appendPoint(
            previous.cpuHistory,
            snapshot.cpuUsagePercent,
          ),
          memoryHistoryPercent: appendPoint(
            previous.memoryHistoryPercent,
            memoryPercent,
          ),
          loading: false,
          error: null,
          pollIntervalMs: interval,
          isBackgroundPolling: document.hidden,
          updatedAtEpochMs: Date.now(),
        }));
      } catch (error) {
        if (!active) {
          return;
        }

        const message =
          error instanceof Error ? error.message : 'Unknown error';
        setState((previous) => ({
          ...previous,
          loading: false,
          error: message,
          pollIntervalMs: interval,
          isBackgroundPolling: document.hidden,
        }));
      } finally {
        if (active) {
          timer = setTimeout(poll, interval);
        }
      }
    };

    const onVisibilityChange = () => {
      if (!active) {
        return;
      }

      setState((previous) => ({
        ...previous,
        isBackgroundPolling: document.hidden,
        pollIntervalMs: currentInterval(),
      }));

      if (timer) {
        clearTimeout(timer);
      }

      void poll();
    };

    document.addEventListener('visibilitychange', onVisibilityChange);

    void poll();

    return () => {
      active = false;
      document.removeEventListener('visibilitychange', onVisibilityChange);
      if (timer) {
        clearTimeout(timer);
      }
    };
  }, [backgroundRefreshMs, refreshMs, request]);

  return state;
}
