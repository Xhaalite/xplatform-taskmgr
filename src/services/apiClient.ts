import { invoke } from '@tauri-apps/api/core';

export interface CapabilityFlags {
  hostname: boolean;
  osVersion: boolean;
  kernelVersion: boolean;
  cpuUsage: boolean;
  memoryStats: boolean;
  swapStats: boolean;
  processListing: boolean;
  scopedFilesystem: boolean;
}

export interface MetricCapability {
  supported: boolean;
  unit: string | null;
  note: string | null;
}

export interface CapabilityDetails {
  hostname: MetricCapability;
  osVersion: MetricCapability;
  kernelVersion: MetricCapability;
  cpuUsage: MetricCapability;
  memoryStats: MetricCapability;
  swapStats: MetricCapability;
  processListing: MetricCapability;
  scopedFilesystem: MetricCapability;
}

export interface NormalizationMetadata {
  memoryUnit: string;
  cpuUsageUnit: string;
  timestampUnit: string;
  collector: string;
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
  capabilityDetails: CapabilityDetails;
  normalization: NormalizationMetadata;
  sampledAtEpochMs: number;
}

export interface SnapshotRequest {
  minRefreshMs: number;
}

export interface NetworkInterfaceSnapshot {
  name: string;
  receivedBytes: number;
  transmittedBytes: number;
}

export interface NetworkSnapshot {
  supported: boolean;
  note: string | null;
  interfaces: NetworkInterfaceSnapshot[];
  totalReceivedBytes: number;
  totalTransmittedBytes: number;
  deltaReceivedBytes: number;
  deltaTransmittedBytes: number;
  sampledAtEpochMs: number;
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

export interface ProcessDetail {
  pid: string;
  name: string;
  commandLine: string;
  executablePath: string | null;
  currentWorkingDirectory: string | null;
  cpuUsagePercent: number;
  memoryBytes: number;
  virtualMemoryBytes: number;
  status: string;
  startedAtEpochS: number;
  runTimeSeconds: number;
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

export interface ScopedDirectoryRequest {
  rootPath: string;
  relativePath?: string;
}

export type DirectoryEntryKind = 'file' | 'directory' | 'symlink' | 'other';

export interface DirectoryEntry {
  name: string;
  relativePath: string;
  kind: DirectoryEntryKind;
}

export interface ScopedFsPolicy {
  userSelectedRootsOnly: boolean;
  canonicalizationRequired: boolean;
  relativePathsOnly: boolean;
  writeOperationsEnabled: boolean;
}

export interface ScopedDirectoryListing {
  rootPath: string;
  currentRelativePath: string;
  entries: DirectoryEntry[];
  policy: ScopedFsPolicy;
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

export async function getNetworkSnapshot(): Promise<NetworkSnapshot> {
  return invoke<NetworkSnapshot>('get_network_snapshot');
}

export async function getProcessDetail(pid: string): Promise<ProcessDetail> {
  return invoke<ProcessDetail>('get_process_detail', {
    request: { pid },
  });
}

export async function listScopedDirectory(
  request: ScopedDirectoryRequest,
): Promise<ScopedDirectoryListing> {
  return invoke<ScopedDirectoryListing>('list_scoped_directory_command', {
    request,
  });
}
