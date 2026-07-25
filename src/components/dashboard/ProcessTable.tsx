import type { ProcessSortBy } from '../../services/apiClient';
import { useProcessTable } from '../../store/processStore';

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
      className='sort-button'
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
    <section className='panel'>
      <div className='process-toolbar'>
        <h2>Processes</h2>
        <input
          type='search'
          value={filterQuery}
          onChange={(event) => setFilterQuery(event.target.value)}
          placeholder='Filter by PID, name, or command line'
        />
      </div>

      <div className='process-meta'>
        <p className='label'>
          Total: {totalCount} | Page {page} of {totalPages}
        </p>
        {loading ? <p className='label'>Refreshing...</p> : null}
      </div>
      {error ? <p className='status error'>{error}</p> : null}

      <div className='table-wrap'>
        <table>
          <thead>
            <tr>
              <th>
                <SortHeader
                  label='PID'
                  keyName='pid'
                  activeKey={sortBy}
                  direction={sortDirection}
                  onSort={setSort}
                />
              </th>
              <th>
                <SortHeader
                  label='Name'
                  keyName='name'
                  activeKey={sortBy}
                  direction={sortDirection}
                  onSort={setSort}
                />
              </th>
              <th>
                <SortHeader
                  label='CPU %'
                  keyName='cpuUsagePercent'
                  activeKey={sortBy}
                  direction={sortDirection}
                  onSort={setSort}
                />
              </th>
              <th>
                <SortHeader
                  label='Memory'
                  keyName='memoryBytes'
                  activeKey={sortBy}
                  direction={sortDirection}
                  onSort={setSort}
                />
              </th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 ? (
              <tr>
                <td colSpan={5} className='empty-row'>
                  No processes match this filter.
                </td>
              </tr>
            ) : (
              items.map((item) => (
                <tr key={item.pid}>
                  <td>{item.pid}</td>
                  <td>{item.name}</td>
                  <td>{item.cpuUsagePercent.toFixed(1)}</td>
                  <td>{formatBytes(item.memoryBytes)}</td>
                  <td>{item.status}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className='process-pagination'>
        <button type='button' onClick={prevPage} disabled={page <= 1}>
          Previous
        </button>
        <button type='button' onClick={nextPage} disabled={page >= totalPages}>
          Next
        </button>
      </div>
    </section>
  );
}
