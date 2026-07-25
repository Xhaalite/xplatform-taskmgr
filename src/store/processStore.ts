import { useEffect, useMemo, useState } from 'react';
import {
  getProcessPage,
  type ProcessItem,
  type ProcessSortBy,
  type SortDirection,
} from '../services/apiClient';

const DEFAULT_PAGE_SIZE = 12;

export interface ProcessTableState {
  items: ProcessItem[];
  loading: boolean;
  error: string | null;
  page: number;
  pageSize: number;
  totalCount: number;
  filterQuery: string;
  sortBy: ProcessSortBy;
  sortDirection: SortDirection;
}

export function useProcessTable(refreshMs = 5000) {
  const [state, setState] = useState<ProcessTableState>({
    items: [],
    loading: true,
    error: null,
    page: 1,
    pageSize: DEFAULT_PAGE_SIZE,
    totalCount: 0,
    filterQuery: '',
    sortBy: 'cpuUsagePercent',
    sortDirection: 'desc',
  });

  const request = useMemo(
    () => ({
      page: state.page,
      pageSize: state.pageSize,
      filterQuery: state.filterQuery,
      sortBy: state.sortBy,
      sortDirection: state.sortDirection,
    }),
    [
      state.filterQuery,
      state.page,
      state.pageSize,
      state.sortBy,
      state.sortDirection,
    ],
  );

  useEffect(() => {
    let active = true;
    let timer: ReturnType<typeof setTimeout> | null = null;

    const load = async () => {
      try {
        const response = await getProcessPage(request);
        if (!active) {
          return;
        }

        setState((previous) => ({
          ...previous,
          loading: false,
          error: null,
          items: response.items,
          totalCount: response.totalCount,
        }));
      } catch (error) {
        if (!active) {
          return;
        }

        const message =
          error instanceof Error
            ? error.message
            : 'Failed to load process page';
        setState((previous) => ({
          ...previous,
          loading: false,
          error: message,
        }));
      } finally {
        if (active) {
          timer = setTimeout(load, refreshMs);
        }
      }
    };

    void load();

    return () => {
      active = false;
      if (timer) {
        clearTimeout(timer);
      }
    };
  }, [refreshMs, request]);

  const totalPages = Math.max(1, Math.ceil(state.totalCount / state.pageSize));

  const setFilterQuery = (value: string) => {
    setState((previous) => ({
      ...previous,
      filterQuery: value,
      page: 1,
      loading: true,
    }));
  };

  const setSort = (sortBy: ProcessSortBy) => {
    setState((previous) => {
      if (previous.sortBy === sortBy) {
        return {
          ...previous,
          sortDirection: previous.sortDirection === 'asc' ? 'desc' : 'asc',
          page: 1,
          loading: true,
        };
      }

      return {
        ...previous,
        sortBy,
        sortDirection: 'desc',
        page: 1,
        loading: true,
      };
    });
  };

  const nextPage = () => {
    setState((previous) => ({
      ...previous,
      page: Math.min(previous.page + 1, totalPages),
      loading: true,
    }));
  };

  const prevPage = () => {
    setState((previous) => ({
      ...previous,
      page: Math.max(previous.page - 1, 1),
      loading: true,
    }));
  };

  return {
    ...state,
    totalPages,
    setFilterQuery,
    setSort,
    nextPage,
    prevPage,
  };
}
