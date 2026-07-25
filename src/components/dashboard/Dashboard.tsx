import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faChartLine,
  faCircleNodes,
  faClockRotateLeft,
  faDesktop,
  faWaveSquare,
} from '@fortawesome/free-solid-svg-icons';
import { useTelemetry } from '../../store/telemetryStore';
import { ProcessTable } from './ProcessTable';
import { SystemOverview } from './SystemOverview';
import { TrendChart } from './TrendChart';

const panelClass =
  'rounded-[28px] border border-cyanGlow/15 bg-panel p-5 shadow-panel backdrop-blur md:p-6';

export function Dashboard() {
  const {
    snapshot,
    cpuHistory,
    memoryHistoryPercent,
    loading,
    error,
    pollIntervalMs,
    isBackgroundPolling,
    updatedAtEpochMs,
  } = useTelemetry({ refreshMs: 1500, backgroundRefreshMs: 10000 });

  const updatedLabel = updatedAtEpochMs
    ? new Date(updatedAtEpochMs).toLocaleTimeString()
    : 'waiting for first sample';

  return (
    <main className='mx-auto flex min-h-screen w-full max-w-7xl flex-col gap-5 px-4 py-6 sm:px-6 lg:px-8'>
      <header className='grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]'>
        <section className={`${panelClass} overflow-hidden`}>
          <div className='mb-5 flex items-start justify-between gap-4'>
            <div className='space-y-3'>
              <p className='text-xs font-semibold uppercase tracking-[0.24em] text-amberPulse'>
                Cross-Platform Task Manager
              </p>
              <div className='space-y-2'>
                <h1 className='text-3xl font-semibold tracking-tight text-white sm:text-4xl'>
                  Secure system telemetry,
                  <span className='block text-cyanGlow'>
                    without leaving the device.
                  </span>
                </h1>
                <p className='max-w-2xl text-sm leading-6 text-slate-300 sm:text-base'>
                  Live local metrics from the Rust backend, process intelligence
                  from sysinfo, and an explicit capability surface for features
                  that vary across platforms.
                </p>
              </div>
            </div>
            <div className='hidden rounded-3xl border border-cyanGlow/15 bg-slate-950/30 p-4 text-cyanGlow lg:block'>
              <FontAwesomeIcon icon={faDesktop} className='text-3xl' />
            </div>
          </div>

          <div className='grid gap-3 sm:grid-cols-3'>
            <div className='rounded-2xl border border-white/10 bg-slate-950/30 p-4'>
              <div className='mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-400'>
                <FontAwesomeIcon icon={faClockRotateLeft} />
                Polling
              </div>
              <p className='text-2xl font-semibold text-white'>
                {pollIntervalMs}ms
              </p>
              <p className='mt-1 text-sm text-slate-400'>
                {isBackgroundPolling
                  ? 'Background throttled mode'
                  : 'Foreground live mode'}
              </p>
            </div>
            <div className='rounded-2xl border border-white/10 bg-slate-950/30 p-4'>
              <div className='mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-400'>
                <FontAwesomeIcon icon={faWaveSquare} />
                Status
              </div>
              <p className='text-2xl font-semibold text-white'>
                {loading ? 'Sampling' : error ? 'Attention' : 'Stable'}
              </p>
              <p className='mt-1 text-sm text-slate-400'>
                Last update: {updatedLabel}
              </p>
            </div>
            <div className='rounded-2xl border border-white/10 bg-slate-950/30 p-4'>
              <div className='mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-400'>
                <FontAwesomeIcon icon={faCircleNodes} />
                Surface
              </div>
              <p className='text-2xl font-semibold text-white'>Read-only</p>
              <p className='mt-1 text-sm text-slate-400'>
                No shell execution or write actions exposed
              </p>
            </div>
          </div>
        </section>

        <section className={`${panelClass} flex flex-col justify-between`}>
          <div>
            <div className='mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-cyanGlow'>
              <FontAwesomeIcon icon={faChartLine} />
              Capability Summary
            </div>
            <h2 className='text-xl font-semibold text-white'>
              What this build can see
            </h2>
            <p className='mt-2 text-sm leading-6 text-slate-300'>
              This phase exposes system identity, memory, CPU, and paged process
              inspection.
            </p>
          </div>

          {snapshot ? (
            <div className='mt-5 grid gap-3'>
              <div className='rounded-2xl border border-cyanGlow/15 bg-cyanGlow/5 p-4'>
                <p className='text-xs font-semibold uppercase tracking-[0.18em] text-slate-400'>
                  CPU usage
                </p>
                <p className='mt-1 text-2xl font-semibold text-white'>
                  {snapshot.capabilities.cpuUsage ? 'Supported' : 'Unavailable'}
                </p>
              </div>
              <div className='rounded-2xl border border-cyanGlow/15 bg-cyanGlow/5 p-4'>
                <p className='text-xs font-semibold uppercase tracking-[0.18em] text-slate-400'>
                  Memory stats
                </p>
                <p className='mt-1 text-2xl font-semibold text-white'>
                  {snapshot.capabilities.memoryStats
                    ? 'Supported'
                    : 'Unavailable'}
                </p>
              </div>
            </div>
          ) : null}
        </section>
      </header>

      {loading && (
        <p className='rounded-2xl border border-cyanGlow/15 bg-slate-950/30 px-4 py-3 text-sm text-slate-300'>
          Collecting telemetry...
        </p>
      )}
      {error && (
        <p className='rounded-2xl border border-red-400/25 bg-red-500/10 px-4 py-3 text-sm text-red-200'>
          {error}
        </p>
      )}

      {snapshot ? (
        <>
          <SystemOverview snapshot={snapshot} />
          <section className='grid gap-5 lg:grid-cols-2'>
            <TrendChart
              title='CPU Usage %'
              values={cpuHistory}
              color='#f7b500'
              icon={faWaveSquare}
              accent='text-amberPulse'
            />
            <TrendChart
              title='Memory Usage %'
              values={memoryHistoryPercent}
              color='#32c4ff'
              icon={faChartLine}
              accent='text-cyanGlow'
            />
          </section>
          <ProcessTable />
        </>
      ) : null}
    </main>
  );
}
