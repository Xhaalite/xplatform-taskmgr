import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faClock,
  faDesktop,
  faHardDrive,
  faMemory,
  faMicrochip,
  faServer,
} from '@fortawesome/free-solid-svg-icons';
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

const statCardClass =
  'rounded-2xl border border-white/10 bg-slate-950/30 p-4 transition-colors hover:border-cyanGlow/25 hover:bg-slate-950/40';

export function SystemOverview({ snapshot }: Props) {
  return (
    <section className='rounded-[28px] border border-cyanGlow/15 bg-panel p-5 shadow-panel backdrop-blur md:p-6'>
      <div className='mb-5 flex items-center gap-3'>
        <div className='flex h-10 w-10 items-center justify-center rounded-2xl border border-cyanGlow/20 bg-cyanGlow/10 text-cyanGlow'>
          <FontAwesomeIcon icon={faDesktop} />
        </div>
        <div>
          <h2 className='text-xl font-semibold text-white'>System Overview</h2>
          <p className='text-sm text-slate-400'>
            Host identity, memory profile, and runtime status
          </p>
        </div>
      </div>

      <div className='grid gap-4 sm:grid-cols-2 xl:grid-cols-4'>
        <div className={statCardClass}>
          <div className='mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-slate-400'>
            <FontAwesomeIcon icon={faServer} />
            Hostname
          </div>
          <p className='text-lg font-semibold text-white'>
            {snapshot.hostname}
          </p>
        </div>
        <div className={statCardClass}>
          <div className='mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-slate-400'>
            <FontAwesomeIcon icon={faMicrochip} />
            OS
          </div>
          <p className='text-lg font-semibold text-white'>{snapshot.osName}</p>
          <p className='mt-1 text-sm text-slate-400'>{snapshot.osVersion}</p>
        </div>
        <div className={statCardClass}>
          <div className='mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-slate-400'>
            <FontAwesomeIcon icon={faMicrochip} />
            Kernel
          </div>
          <p className='text-lg font-semibold text-white'>
            {snapshot.kernelVersion}
          </p>
        </div>
        <div className={statCardClass}>
          <div className='mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-slate-400'>
            <FontAwesomeIcon icon={faClock} />
            Uptime
          </div>
          <p className='text-lg font-semibold text-white'>
            {formatUptime(snapshot.uptimeSeconds)}
          </p>
        </div>
        <div className={statCardClass}>
          <div className='mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-slate-400'>
            <FontAwesomeIcon icon={faMicrochip} />
            CPU Usage
          </div>
          <p className='text-lg font-semibold text-white'>
            {snapshot.cpuUsagePercent.toFixed(1)}%
          </p>
        </div>
        <div className={statCardClass}>
          <div className='mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-slate-400'>
            <FontAwesomeIcon icon={faMemory} />
            Used Memory
          </div>
          <p className='text-lg font-semibold text-white'>
            {formatBytes(snapshot.usedMemoryBytes)}
          </p>
        </div>
        <div className={statCardClass}>
          <div className='mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-slate-400'>
            <FontAwesomeIcon icon={faHardDrive} />
            Total Memory
          </div>
          <p className='text-lg font-semibold text-white'>
            {formatBytes(snapshot.totalMemoryBytes)}
          </p>
        </div>
      </div>
    </section>
  );
}
