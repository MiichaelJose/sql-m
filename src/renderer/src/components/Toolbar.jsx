import { useQueryStore } from '../store/queryStore'

const OP_LABELS = {
  0: 'UNKNOWN',
  1: 'QUERY',
  2: 'PREPARE',
  3: 'EXECUTE',
  4: 'BEGIN',
  5: 'COMMIT',
  6: 'ROLLBACK',
  7: 'CLOSE'
}

export default function Toolbar() {
  const { filter, setFilter, paused, setPaused, clearAll, queries, totalReceived } = useQueryStore()

  return (
    <header className="toolbar">
      <div className="toolbar-brand">
        <svg className="brand-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <ellipse cx="12" cy="5" rx="9" ry="3" />
          <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3" />
          <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" />
        </svg>
        <span className="brand-name">SQL Monitor</span>
        <span className="brand-target">localhost:9091</span>
      </div>

      <div className="toolbar-controls">
        <div className="search-wrapper">
          <svg className="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.35-4.35" />
          </svg>
          <input
            id="filter-input"
            className="search-input"
            type="text"
            placeholder="Filter queries..."
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          />
          {filter && (
            <button className="search-clear" onClick={() => setFilter('')} aria-label="Clear filter">
              ×
            </button>
          )}
        </div>

        <button
          id="btn-pause-resume"
          className={`btn ${paused ? 'btn-warning' : 'btn-secondary'}`}
          onClick={() => setPaused(!paused)}
          title={paused ? 'Resume live updates' : 'Pause live updates'}
        >
          {paused ? (
            <>
              <svg viewBox="0 0 24 24" fill="currentColor"><polygon points="5,3 19,12 5,21"/></svg>
              Resume
            </>
          ) : (
            <>
              <svg viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>
              Pause
            </>
          )}
        </button>

        <button
          id="btn-clear"
          className="btn btn-danger"
          onClick={clearAll}
          title="Clear all queries"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/>
          </svg>
          Clear
        </button>

        <button
          id="btn-reconnect"
          className="btn btn-primary"
          onClick={() => window.sqlm?.reconnect()}
          title="Reconnect to sql-tapd"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21.5 2v6h-6M2.5 22v-6h6m18-6A10 10 0 1 0 3.2 15.6"/>
          </svg>
          Reconnect
        </button>
      </div>

      <div className="toolbar-meta">
        <span className="meta-count">
          {totalReceived.toLocaleString()} queries
        </span>
        {paused && (
          <span className="meta-paused">● PAUSED</span>
        )}
      </div>
    </header>
  )
}
