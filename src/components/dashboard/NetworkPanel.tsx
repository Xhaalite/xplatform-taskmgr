import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faArrowDown,
  faArrowUp,
  faCircleNodes,
  faNetworkWired,
} from '@fortawesome/free-solid-svg-icons';
import { useNetworkTelemetry } from '../../store/networkStore';
import { formatBytes, formatBytesPerSecond } from '../../utils/formatters';

const panelClass =
  'rounded-[28px] border border-cyanGlow/15 bg-panel p-5 shadow-panel backdrop-blur md:p-6';

export function NetworkPanel() {
  const { snapshot, loading, error, updatedAtEpochMs } = useNetworkTelemetry();

  const lastUpdated = updatedAtEpochMs
    ? new Date(updatedAtEpochMs).toLocaleTimeString()
    : 'waiting for first sample';

  return (
    <section className={panelClass}>
      <div className='mb-4 flex items-center justify-between gap-3'>
        <div>
          <div className='mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-cyanGlow'>
            <FontAwesomeIcon icon={faNetworkWired} />
            Network Activity
          </div>
          <h2 className='text-xl font-semibold text-white'>
            Interface traffic
          </h2>
          <p className='mt-1 text-sm text-slate-400'>
            Total bytes and live throughput sampled from local interfaces.
          </p>
        </div>
        <div className='rounded-xl border border-white/10 bg-slate-950/30 px-3 py-2 text-xs text-slate-300'>
          {loading ? 'Refreshing...' : `Last update: ${lastUpdated}`}
        </div>
      </div>

      {error ? (
        <p className='mb-4 rounded-2xl border border-red-400/25 bg-red-500/10 px-4 py-3 text-sm text-red-200'>
          {error}
        </p>
      ) : null}

      {snapshot ? (
        <>
          <div className='mb-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4'>
            <div className='rounded-2xl border border-white/10 bg-slate-950/30 p-4'>
              <p className='text-xs font-semibold uppercase tracking-[0.14em] text-slate-400'>
                Support
              </p>
              <p className='mt-1 text-lg font-semibold text-white'>
                {snapshot.supported ? 'Enabled' : 'Unavailable'}
              </p>
            </div>
            <div className='rounded-2xl border border-white/10 bg-slate-950/30 p-4'>
              <p className='text-xs font-semibold uppercase tracking-[0.14em] text-slate-400'>
                <FontAwesomeIcon icon={faArrowDown} className='mr-2' />
                Throughput In
              </p>
              <p className='mt-1 text-lg font-semibold text-white'>
                {formatBytesPerSecond(snapshot.deltaReceivedBytes, 2)}
              </p>
            </div>
            <div className='rounded-2xl border border-white/10 bg-slate-950/30 p-4'>
              <p className='text-xs font-semibold uppercase tracking-[0.14em] text-slate-400'>
                <FontAwesomeIcon icon={faArrowUp} className='mr-2' />
                Throughput Out
              </p>
              <p className='mt-1 text-lg font-semibold text-white'>
                {formatBytesPerSecond(snapshot.deltaTransmittedBytes, 2)}
              </p>
            </div>
            <div className='rounded-2xl border border-white/10 bg-slate-950/30 p-4'>
              <p className='text-xs font-semibold uppercase tracking-[0.14em] text-slate-400'>
                <FontAwesomeIcon icon={faCircleNodes} className='mr-2' />
                Interfaces
              </p>
              <p className='mt-1 text-lg font-semibold text-white'>
                {snapshot.interfaces.length}
              </p>
            </div>
          </div>

          {snapshot.note ? (
            <p className='mb-4 rounded-2xl border border-amber-400/25 bg-amber-500/10 px-4 py-3 text-sm text-amber-200'>
              {snapshot.note}
            </p>
          ) : null}

          <div className='overflow-x-auto rounded-2xl border border-white/10 bg-slate-950/20'>
            <table className='min-w-full border-collapse text-sm'>
              <thead className='bg-slate-950/40'>
                <tr>
                  <th className='px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.14em] text-slate-300'>
                    Interface
                  </th>
                  <th className='px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.14em] text-slate-300'>
                    Received
                  </th>
                  <th className='px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.14em] text-slate-300'>
                    Transmitted
                  </th>
                </tr>
              </thead>
              <tbody>
                {snapshot.interfaces.length === 0 ? (
                  <tr>
                    <td
                      colSpan={3}
                      className='px-4 py-8 text-center text-sm text-slate-400'
                    >
                      No interfaces reported.
                    </td>
                  </tr>
                ) : (
                  snapshot.interfaces.map((entry) => (
                    <tr
                      key={entry.name}
                      className='border-t border-white/10 transition hover:bg-white/5'
                    >
                      <td className='px-4 py-3 font-mono text-slate-200'>
                        {entry.name}
                      </td>
                      <td className='px-4 py-3 text-slate-200'>
                        {formatBytes(entry.receivedBytes)}
                      </td>
                      <td className='px-4 py-3 text-slate-200'>
                        {formatBytes(entry.transmittedBytes)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </>
      ) : null}
    </section>
  );
}
