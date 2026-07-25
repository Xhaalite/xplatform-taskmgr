import { invoke } from '@tauri-apps/api/core';

export interface CapabilityFlags {
  cpuUsage: boolean;
  memoryStats: boolean;
}

export interface SystemSnapshot {
  hostname: string;
  osName: string;
  osVersion: string;
  kernelVersion: string;
  uptimeSeconds: number;
  cpuUsagePercent: number;
  totalMemoryBytes: number;
  usedMemoryBytes: number;
  totalSwapBytes: number;
  usedSwapBytes: number;
  capabilities: CapabilityFlags;
  sampledAtEpochMs: number;
}

export interface SnapshotRequest {
  minRefreshMs: number;
}

export type ProcessSortBy = 'pid' | 'name' | 'cpuUsagePercent' | 'memoryBytes';

export type SortDirection = 'asc' | 'desc';

export interface ProcessItem {
  pid: string;
  name: string;
  cpuUsagePercent: number;
  memoryBytes: number;
  virtualMemoryBytes: number;
  status: string;
  startedAtEpochS: number;
}

export interface ProcessPageRequest {
  page: number;
  pageSize: number;
  filterQuery?: string;
  sortBy?: ProcessSortBy;
  sortDirection?: SortDirection;
}

export interface ProcessPage {
  items: ProcessItem[];
  totalCount: number;
  page: number;
  pageSize: number;
  sortBy: ProcessSortBy;
  sortDirection: SortDirection;
  filterQuery: string;
}

export async function getSystemSnapshot(
  request: SnapshotRequest,
): Promise<SystemSnapshot> {
  return invoke<SystemSnapshot>('get_system_snapshot', { request });
}

export async function getProcessPage(
  request: ProcessPageRequest,
): Promise<ProcessPage> {
  return invoke<ProcessPage>('get_process_page', { request });
}
