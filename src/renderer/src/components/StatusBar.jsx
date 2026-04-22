import { useQueryStore } from '../store/queryStore'

export default function StatusBar() {
  const { grpcStatus, queries, filter } = useQueryStore()
  const { connected, connecting, error } = grpcStatus

  return (
    <footer className="status-bar">
      <div className="status-left">
        <span className={`conn-indicator ${connected ? 'conn-ok' : connecting ? 'conn-connecting' : 'conn-error'}`}>
          <span className="conn-dot" />
          {connected ? 'Connected' : connecting ? 'Connecting…' : 'Disconnected'}
        </span>
        <span className="status-sep">|</span>
        <span className="status-addr">localhost:9091</span>
        {error && !connected && (
          <>
            <span className="status-sep">|</span>
            <span className="status-error" title={error}>{error.length > 60 ? error.slice(0, 60) + '…' : error}</span>
          </>
        )}
      </div>

      <div className="status-right">
        {filter && (
          <span className="status-filter">
            Filter: <strong>{filter}</strong> — {queries.length.toLocaleString()} shown
          </span>
        )}
        <span className="status-version">sql-m v1.0.0</span>
      </div>
    </footer>
  )
}
