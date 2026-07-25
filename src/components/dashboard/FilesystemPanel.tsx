import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faChevronLeft,
  faFile,
  faFolderOpen,
  faFolder,
  faLink,
  faSitemap,
  faRotate,
} from '@fortawesome/free-solid-svg-icons';
import type { DirectoryEntry } from '../../services/apiClient';
import { useFilesystemBrowser } from '../../store/filesystemStore';

function entryIcon(entry: DirectoryEntry) {
  switch (entry.kind) {
    case 'directory':
      return faFolder;
    case 'symlink':
      return faLink;
    case 'file':
      return faFile;
    default:
      return faFile;
  }
}

function entryLabel(entry: DirectoryEntry) {
  return entry.relativePath || entry.name;
}

export function FilesystemPanel() {
  const {
    rootPathInput,
    setRootPathInput,
    applyRootPath,
    hasRootPath,
    currentRelativePath,
    entries,
    loading,
    error,
    policy,
    breadcrumbs,
    canGoUp,
    openPath,
    goUp,
    refresh,
    lastLoadedAtEpochMs,
  } = useFilesystemBrowser();

  const loadedLabel = lastLoadedAtEpochMs
    ? new Date(lastLoadedAtEpochMs).toLocaleTimeString()
    : 'not loaded yet';

  const isWindows =
    typeof navigator !== 'undefined' && /windows/i.test(navigator.userAgent);
  const rootPlaceholder = isWindows
    ? 'C:\\Users\\you\\Documents'
    : '/home/you/Documents';

  return (
    <section className='rounded-[28px] border border-cyanGlow/15 bg-panel p-5 shadow-panel backdrop-blur md:p-6'>
      <div className='mb-4 flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between'>
        <div>
          <div className='mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-cyanGlow'>
            <FontAwesomeIcon icon={faFolderOpen} />
            Filesystem Panel
          </div>
          <h2 className='flex items-center text-xl font-semibold text-white'>
            File Tree
          </h2>
          <p className='mt-1 text-sm text-slate-400'>
            Choose a root path to browse directories inside the scoped policy.
          </p>
        </div>

        <div className='flex w-full max-w-xl items-center gap-2 lg:justify-end'>
          <label className='flex w-full items-center gap-3 rounded-2xl border border-cyanGlow/15 bg-slate-950/30 px-4 py-3 text-slate-300'>
            <FontAwesomeIcon icon={faFolder} className='text-cyanGlow' />
            <span className='sr-only'>Root path input</span>
            <input
              className='w-full bg-transparent text-sm text-white outline-none placeholder:text-slate-500'
              type='text'
              value={rootPathInput}
              onChange={(event) => setRootPathInput(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  event.preventDefault();
                  applyRootPath();
                }
              }}
              placeholder={rootPlaceholder}
            />
          </label>
          <button
            type='button'
            onClick={applyRootPath}
            className='inline-flex items-center rounded-xl border border-cyanGlow/15 bg-cyanGlow/10 px-4 py-3 text-sm font-semibold text-white transition hover:bg-cyanGlow/20'
          >
            Open
          </button>
        </div>
      </div>

      <div className='mb-3 flex flex-wrap items-center gap-2'>
        <button
          type='button'
          onClick={goUp}
          disabled={!hasRootPath || !canGoUp || loading}
          className='inline-flex items-center gap-2 rounded-xl border border-cyanGlow/15 bg-cyanGlow/10 px-3 py-2 text-sm font-medium text-white transition hover:bg-cyanGlow/20 disabled:cursor-not-allowed disabled:opacity-40'
        >
          <FontAwesomeIcon icon={faChevronLeft} />
          Up
        </button>
        <button
          type='button'
          onClick={refresh}
          disabled={!hasRootPath || loading}
          className='inline-flex items-center gap-2 rounded-xl border border-cyanGlow/15 bg-cyanGlow/10 px-3 py-2 text-sm font-medium text-white transition hover:bg-cyanGlow/20 disabled:cursor-not-allowed disabled:opacity-40'
        >
          <FontAwesomeIcon
            icon={faRotate}
            className={loading ? 'animate-spin' : ''}
          />
          Refresh
        </button>
        <p className='ml-auto text-sm text-slate-400'>
          Current: {currentRelativePath || '/'} | Last loaded: {loadedLabel}
        </p>
      </div>

      <div className='mb-3 flex flex-wrap items-center gap-2 rounded-2xl border border-white/10 bg-slate-950/20 px-3 py-2'>
        <FontAwesomeIcon icon={faSitemap} className='text-slate-400' />
        {breadcrumbs.map((segment, index) => (
          <button
            key={`${segment.relativePath}-${index}`}
            type='button'
            onClick={() => openPath(segment.relativePath)}
            className='rounded-lg px-2 py-1 text-sm text-slate-300 transition hover:bg-white/10 hover:text-white'
          >
            {segment.label}
          </button>
        ))}
      </div>

      {policy ? (
        <div className='mb-3 flex flex-wrap gap-2'>
          <span className='rounded-full border border-cyanGlow/20 bg-cyanGlow/10 px-3 py-1 text-xs text-cyanGlow'>
            roots-only: {policy.userSelectedRootsOnly ? 'on' : 'off'}
          </span>
          <span className='rounded-full border border-cyanGlow/20 bg-cyanGlow/10 px-3 py-1 text-xs text-cyanGlow'>
            canonicalized: {policy.canonicalizationRequired ? 'on' : 'off'}
          </span>
          <span className='rounded-full border border-cyanGlow/20 bg-cyanGlow/10 px-3 py-1 text-xs text-cyanGlow'>
            relative-only: {policy.relativePathsOnly ? 'on' : 'off'}
          </span>
          <span className='rounded-full border border-cyanGlow/20 bg-cyanGlow/10 px-3 py-1 text-xs text-cyanGlow'>
            writable: {policy.writeOperationsEnabled ? 'on' : 'off'}
          </span>
        </div>
      ) : null}

      {error ? (
        <p className='mb-3 rounded-2xl border border-red-400/25 bg-red-500/10 px-4 py-3 text-sm text-red-200'>
          {error}
        </p>
      ) : null}

      <div className='overflow-x-auto rounded-2xl border border-white/10 bg-slate-950/20'>
        <table className='min-w-full border-collapse text-sm'>
          <thead className='bg-slate-950/40'>
            <tr>
              <th className='px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.14em] text-slate-300'>
                Name
              </th>
              <th className='px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.14em] text-slate-300'>
                Type
              </th>
              <th className='px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.14em] text-slate-300'>
                Relative Path
              </th>
            </tr>
          </thead>
          <tbody>
            {!hasRootPath ? (
              <tr>
                <td
                  colSpan={3}
                  className='px-4 py-8 text-center text-sm text-slate-400'
                >
                  Enter a root path and click Open.
                </td>
              </tr>
            ) : entries.length === 0 && !loading ? (
              <tr>
                <td
                  colSpan={3}
                  className='px-4 py-8 text-center text-sm text-slate-400'
                >
                  This directory has no entries.
                </td>
              </tr>
            ) : (
              entries.map((entry) => {
                const isDirectory = entry.kind === 'directory';

                return (
                  <tr
                    key={entry.relativePath || entry.name}
                    className='border-t border-white/10 transition hover:bg-white/5'
                  >
                    <td className='px-4 py-3'>
                      {isDirectory ? (
                        <button
                          type='button'
                          onClick={() => openPath(entry.relativePath)}
                          className='inline-flex items-center gap-2 rounded-lg px-2 py-1 text-left text-white transition hover:bg-white/10'
                        >
                          <FontAwesomeIcon
                            icon={entryIcon(entry)}
                            className='text-cyanGlow'
                          />
                          {entry.name}
                        </button>
                      ) : (
                        <span className='inline-flex items-center gap-2 text-slate-200'>
                          <FontAwesomeIcon
                            icon={entryIcon(entry)}
                            className='text-slate-400'
                          />
                          {entry.name}
                        </span>
                      )}
                    </td>
                    <td className='px-4 py-3 text-slate-300'>{entry.kind}</td>
                    <td className='px-4 py-3 text-slate-400'>
                      {entryLabel(entry)}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
