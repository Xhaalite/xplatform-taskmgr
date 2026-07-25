import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faChevronLeft,
  faChevronRight,
  faFilter,
  faListCheck,
  faRotate,
} from '@fortawesome/free-solid-svg-icons';
import type { ProcessSortBy } from '../../services/apiClient';
import { useProcessTable } from '../../store/processStore';
import { formatBytes } from '../../utils/formatters';

function sortIndicator(active: boolean, direction: 'asc' | 'desc') {
  if (!active) {
    return '';
  }

  return direction === 'asc' ? ' ▲' : ' ▼';
}

interface HeaderProps {
  label: string;
  keyName: ProcessSortBy;
  activeKey: ProcessSortBy;
  direction: 'asc' | 'desc';
  onSort: (value: ProcessSortBy) => void;
}

function SortHeader({
  label,
  keyName,
  activeKey,
  direction,
  onSort,
}: HeaderProps) {
  const active = activeKey === keyName;
  return (
    <button
      className='inline-flex items-center gap-1 text-left text-xs font-semibold uppercase tracking-[0.14em] text-slate-300 transition hover:text-cyanGlow'
      type='button'
      onClick={() => onSort(keyName)}
    >
      {label}
      {sortIndicator(active, direction)}
    </button>
  );
}

export function ProcessTable() {
  const {
    items,
    loading,
    error,
    page,
    totalPages,
    totalCount,
    filterQuery,
    sortBy,
    sortDirection,
    setFilterQuery,
    setSort,
    nextPage,
    prevPage,
  } = useProcessTable();

  return (
    <section className='rounded-[28px] border border-cyanGlow/15 bg-panel p-5 shadow-panel backdrop-blur md:p-6'>
      <div className='mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between'>
        <div>
          <div className='mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-cyanGlow'>
            <FontAwesomeIcon icon={faListCheck} />
            Process Explorer
          </div>
          <h2 className='text-xl font-semibold text-white'>
            Running processes
          </h2>
          <p className='mt-1 text-sm text-slate-400'>
            Filter by pid, executable name, or command line and sort on the
            backend.
          </p>
        </div>

        <label className='flex w-full max-w-md items-center gap-3 rounded-2xl border border-cyanGlow/15 bg-slate-950/30 px-4 py-3 text-slate-300'>
          <FontAwesomeIcon icon={faFilter} className='text-cyanGlow' />
          <span className='sr-only'>Filter processes</span>
          <input
            className='w-full bg-transparent text-sm text-white outline-none placeholder:text-slate-500'
            type='search'
            value={filterQuery}
            onChange={(event) => setFilterQuery(event.target.value)}
            placeholder='Filter by PID, name, or command line'
          />
        </label>
      </div>

      <div className='mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between'>
        <p className='text-sm text-slate-400'>
          Total: {totalCount} | Page {page} of {totalPages}
        </p>
        {loading ? (
          <p className='inline-flex items-center gap-2 text-sm text-slate-400'>
            <FontAwesomeIcon icon={faRotate} className='animate-spin' />
            Refreshing...
          </p>
        ) : null}
      </div>
      {error ? (
        <p className='mb-4 rounded-2xl border border-red-400/25 bg-red-500/10 px-4 py-3 text-sm text-red-200'>
          {error}
        </p>
      ) : null}

      <div className='overflow-x-auto rounded-2xl border border-white/10 bg-slate-950/20'>
        <table className='min-w-full border-collapse text-sm'>
          <thead className='bg-slate-950/40'>
            <tr>
              <th className='px-4 py-3 text-left'>
                <SortHeader
                  label='PID'
                  keyName='pid'
                  activeKey={sortBy}
                  direction={sortDirection}
                  onSort={setSort}
                />
              </th>
              <th className='px-4 py-3 text-left'>
                <SortHeader
                  label='Name'
                  keyName='name'
                  activeKey={sortBy}
                  direction={sortDirection}
                  onSort={setSort}
                />
              </th>
              <th className='px-4 py-3 text-left'>
                <SortHeader
                  label='CPU %'
                  keyName='cpuUsagePercent'
                  activeKey={sortBy}
                  direction={sortDirection}
                  onSort={setSort}
                />
              </th>
              <th className='px-4 py-3 text-left'>
                <SortHeader
                  label='Memory'
                  keyName='memoryBytes'
                  activeKey={sortBy}
                  direction={sortDirection}
                  onSort={setSort}
                />
              </th>
              <th className='px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.14em] text-slate-300'>
                Status
              </th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 ? (
              <tr>
                <td
                  colSpan={5}
                  className='px-4 py-8 text-center text-sm text-slate-400'
                >
                  No processes match this filter.
                </td>
              </tr>
            ) : (
              items.map((item) => (
                <tr
                  key={item.pid}
                  className='border-t border-white/10 transition hover:bg-white/5'
                >
                  <td className='px-4 py-3 font-mono text-slate-300'>
                    {item.pid}
                  </td>
                  <td className='px-4 py-3 font-medium text-white'>
                    {item.name}
                  </td>
                  <td className='px-4 py-3 text-slate-200'>
                    {item.cpuUsagePercent.toFixed(1)}
                  </td>
                  <td className='px-4 py-3 text-slate-200'>
                    {formatBytes(item.memoryBytes)}
                  </td>
                  <td className='px-4 py-3 text-slate-400'>{item.status}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className='mt-4 flex items-center justify-end gap-2'>
        <button
          className='inline-flex items-center gap-2 rounded-xl border border-cyanGlow/15 bg-cyanGlow/10 px-3 py-2 text-sm font-medium text-white transition hover:bg-cyanGlow/20 disabled:cursor-not-allowed disabled:opacity-40'
          type='button'
          onClick={prevPage}
          disabled={page <= 1}
        >
          <FontAwesomeIcon icon={faChevronLeft} />
          Previous
        </button>
        <button
          className='inline-flex items-center gap-2 rounded-xl border border-cyanGlow/15 bg-cyanGlow/10 px-3 py-2 text-sm font-medium text-white transition hover:bg-cyanGlow/20 disabled:cursor-not-allowed disabled:opacity-40'
          type='button'
          onClick={nextPage}
          disabled={page >= totalPages}
        >
          Next
          <FontAwesomeIcon icon={faChevronRight} />
        </button>
      </div>
    </section>
  );
}
