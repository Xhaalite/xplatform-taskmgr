import { useTelemetry } from '../../store/telemetryStore';
import { ProcessTable } from './ProcessTable';
import { SystemOverview } from './SystemOverview';
import { TrendChart } from './TrendChart';

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
    <main className='shell'>
      <header>
        <p className='eyebrow'>Cross-Platform Task Manager</p>
        <h1>System + Memory Dashboard</h1>
        <p className='status'>
          Polling every {pollIntervalMs}ms (
          {isBackgroundPolling ? 'background' : 'active'}) | Last update:{' '}
          {updatedLabel}
        </p>
      </header>

      {loading && <p className='status'>Collecting telemetry...</p>}
      {error && <p className='status error'>{error}</p>}

      {snapshot ? (
        <>
          <SystemOverview snapshot={snapshot} />
          <section className='grid two-col'>
            <TrendChart
              title='CPU Usage %'
              values={cpuHistory}
              color='#f7b500'
            />
            <TrendChart
              title='Memory Usage %'
              values={memoryHistoryPercent}
              color='#32c4ff'
            />
          </section>
          <section className='panel'>
            <h2>Capabilities</h2>
            <p>
              CPU usage:{' '}
              {snapshot.capabilities.cpuUsage ? 'supported' : 'unsupported'} |
              Memory stats:{' '}
              {snapshot.capabilities.memoryStats ? 'supported' : 'unsupported'}
            </p>
          </section>
          <ProcessTable />
        </>
      ) : null}
    </main>
  );
}
