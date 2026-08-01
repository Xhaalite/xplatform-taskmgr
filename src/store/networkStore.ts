import { useEffect, useState } from 'react';
import {
  getNetworkSnapshot,
  type NetworkSnapshot,
} from '../services/apiClient';

export interface NetworkViewState {
  snapshot: NetworkSnapshot | null;
  loading: boolean;
  error: string | null;
  updatedAtEpochMs: number | null;
}

export function useNetworkTelemetry(refreshMs = 2000) {
  const [state, setState] = useState<NetworkViewState>({
    snapshot: null,
    loading: true,
    error: null,
    updatedAtEpochMs: null,
  });

  useEffect(() => {
    let active = true;
    let timer: ReturnType<typeof setTimeout> | null = null;

    const poll = async () => {
      try {
        const snapshot = await getNetworkSnapshot();
        if (!active) {
          return;
        }

        setState({
          snapshot,
          loading: false,
          error: null,
          updatedAtEpochMs: Date.now(),
        });
      } catch (error) {
        if (!active) {
          return;
        }

        const message =
          error instanceof Error
            ? error.message
            : 'Failed to load network telemetry';

        setState((previous) => ({
          ...previous,
          loading: false,
          error: message,
        }));
      } finally {
        if (active) {
          timer = setTimeout(poll, refreshMs);
        }
      }
    };

    void poll();

    return () => {
      active = false;
      if (timer) {
        clearTimeout(timer);
      }
    };
  }, [refreshMs]);

  return state;
}
