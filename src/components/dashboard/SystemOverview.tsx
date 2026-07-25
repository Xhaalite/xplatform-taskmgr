import type { SystemSnapshot } from '../../services/apiClient';

function formatBytes(bytes: number): string {
  if (bytes <= 0) {
    return '0 B';
  }

  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  const index = Math.min(
    Math.floor(Math.log(bytes) / Math.log(1024)),
    units.length - 1,
  );
  const value = bytes / 1024 ** index;
  return `${value.toFixed(index > 1 ? 1 : 0)} ${units[index]}`;
}

function formatUptime(seconds: number): string {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  return `${days}d ${hours}h ${minutes}m`;
}

interface Props {
  snapshot: SystemSnapshot;
}

export function SystemOverview({ snapshot }: Props) {
  return (
    <section className='panel'>
      <h2>System Overview</h2>
      <div className='grid two-col'>
        <div>
          <p className='label'>Hostname</p>
          <p>{snapshot.hostname}</p>
        </div>
        <div>
          <p className='label'>OS</p>
          <p>{snapshot.osName}</p>
        </div>
        <div>
          <p className='label'>Version</p>
          <p>{snapshot.osVersion}</p>
        </div>
        <div>
          <p className='label'>Kernel</p>
          <p>{snapshot.kernelVersion}</p>
        </div>
        <div>
          <p className='label'>Uptime</p>
          <p>{formatUptime(snapshot.uptimeSeconds)}</p>
        </div>
        <div>
          <p className='label'>CPU Usage</p>
          <p>{snapshot.cpuUsagePercent.toFixed(1)}%</p>
        </div>
        <div>
          <p className='label'>Used Memory</p>
          <p>{formatBytes(snapshot.usedMemoryBytes)}</p>
        </div>
        <div>
          <p className='label'>Total Memory</p>
          <p>{formatBytes(snapshot.totalMemoryBytes)}</p>
        </div>
      </div>
    </section>
  );
}
