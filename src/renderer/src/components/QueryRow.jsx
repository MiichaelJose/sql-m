import { useState, memo, useCallback, useMemo } from 'react'
import { getTableColor, extractTableName } from '../store/tableColors'

const OP_LABELS  = ['UNK', 'QRY', 'PRE', 'EXEC', 'BGN', 'CMT', 'RBK', 'CLO']
const OP_CLASSES = ['op-unk', 'op-query', 'op-prepare', 'op-execute', 'op-begin', 'op-commit', 'op-rollback', 'op-close']

function formatTime(epochMs) {
  const d = new Date(epochMs)
  return d.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' }) +
    '.' + String(d.getMilliseconds()).padStart(3, '0')
}

function formatDuration(ms) {
  if (ms < 1) return `${(ms * 1000).toFixed(0)}μs`
  if (ms < 1000) return `${ms.toFixed(1)}ms`
  return `${(ms / 1000).toFixed(2)}s`
}

function getDurationClass(ms, isSlow) {
  if (isSlow || ms > 100) return 'dur-slow'
  if (ms > 30) return 'dur-warn'
  return 'dur-ok'
}

function getQueryType(query) {
  if (!query) return 'OTHER'
  const q = query.trimStart().toUpperCase()
  if (q.startsWith('SELECT'))   return 'SELECT'
  if (q.startsWith('INSERT'))   return 'INSERT'
  if (q.startsWith('UPDATE'))   return 'UPDATE'
  if (q.startsWith('DELETE'))   return 'DELETE'
  if (q.startsWith('CREATE'))   return 'CREATE'
  if (q.startsWith('DROP'))     return 'DROP'
  if (q.startsWith('ALTER'))    return 'ALTER'
  if (q.startsWith('BEGIN') || q.startsWith('START')) return 'BEGIN'
  if (q.startsWith('COMMIT'))   return 'COMMIT'
  if (q.startsWith('ROLLBACK')) return 'ROLLBACK'
  return 'OTHER'
}

const QueryRow = memo(function QueryRow({ query }) {
  const [expanded, setExpanded] = useState(false)
  const [copiedId, setCopiedId] = useState(null)

  const opLabel      = OP_LABELS[query.op]  || 'UNK'
  const opClass      = OP_CLASSES[query.op] || 'op-unk'
  const qType        = getQueryType(query.query)
  const durationClass = getDurationClass(query.durationMs, query.slowQuery)

  // ── Table colour ─────────────────────────────────────────────────────────────
  const tableColor = useMemo(() => {
    const table = extractTableName(query.query)
    return table ? getTableColor(table) : null
  }, [query.query])

  const tableName = useMemo(() => extractTableName(query.query), [query.query])

  // ── Inline styles driven by table colour ─────────────────────────────────────
  const rowStyle = tableColor && !query.slowQuery && !query.nPlus1 && !query.error
    ? {
        background:  tableColor.bg,
        borderLeft:  `2px solid ${tableColor.border}`,
      }
    : tableColor
    ? { borderLeft: `2px solid ${tableColor.border}` }
    : {}

  const tableBadgeStyle = tableColor
    ? {
        background: tableColor.badge,
        color:      tableColor.text,
      }
    : {}

  // ── Copy ─────────────────────────────────────────────────────────────────────
  const copyQuery = useCallback((e) => {
    e.stopPropagation()
    navigator.clipboard.writeText(query.query)
    setCopiedId(query.id)
    setTimeout(() => setCopiedId(null), 1500)
  }, [query.query, query.id])

  // ── Row classes ───────────────────────────────────────────────────────────────
  const rowClasses = [
    'query-row',
    query.slowQuery ? 'row-slow'   : '',
    query.nPlus1   ? 'row-nplus1' : '',
    query.error    ? 'row-error'  : '',
    expanded       ? 'row-expanded': '',
  ].filter(Boolean).join(' ')

  return (
    <div
      className={rowClasses}
      style={rowStyle}
      role="listitem"
      onClick={() => setExpanded(!expanded)}
      aria-expanded={expanded}
    >
      {/* Main row */}
      <div className="row-main">
        <span className={`op-badge ${opClass}`}>{opLabel}</span>
        <span className={`qtype-badge qtype-${qType.toLowerCase()}`}>{qType}</span>

        {/* Table name badge */}
        {tableName && (
          <span className="table-badge" style={tableBadgeStyle}>
            {tableName}
          </span>
        )}

        <span className="col-query query-text">
          {query.query || <em className="no-query">—</em>}
        </span>

        <span className={`col-duration duration-badge ${durationClass}`}>
          {formatDuration(query.durationMs)}
        </span>

        <span className="col-rows rows-count">
          {query.rowsAffected > 0 ? query.rowsAffected.toLocaleString() : '—'}
        </span>

        <span className="col-time time-label">
          {formatTime(query.startTime)}
        </span>

        {/* Tags */}
        <div className="row-tags">
          {query.slowQuery && <span className="tag tag-slow">SLOW</span>}
          {query.nPlus1    && <span className="tag tag-nplus1">N+1</span>}
          {query.error     && <span className="tag tag-error">ERR</span>}
          {query.txId      && <span className="tag tag-tx">TX</span>}
        </div>
      </div>

      {/* Expanded detail panel */}
      {expanded && (
        <div className="row-detail" onClick={(e) => e.stopPropagation()}>
          <div className="detail-header">
            <span className="detail-label">Full Query</span>
            <div className="detail-header-right">
              {tableName && (
                <span
                  className="detail-table-badge"
                  style={tableBadgeStyle}
                >
                  {tableName}
                </span>
              )}
              <button className="copy-btn" onClick={copyQuery} id={`copy-${query.id}`}>
                {copiedId === query.id ? (
                  <>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12"/></svg>
                    Copied!
                  </>
                ) : (
                  <>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
                    Copy
                  </>
                )}
              </button>
            </div>
          </div>

          <pre
            className="detail-query"
            style={tableColor ? { borderLeftColor: tableColor.border, borderLeftWidth: '3px' } : {}}
          >
            {query.query}
          </pre>

          {query.args && query.args.length > 0 && (
            <div className="detail-section">
              <span className="detail-label">Parameters</span>
              <div className="detail-args">
                {query.args.map((arg, i) => (
                  <span key={i} className="arg-chip">
                    <em>${i + 1}</em> {arg}
                  </span>
                ))}
              </div>
            </div>
          )}

          {query.error && (
            <div className="detail-section detail-error">
              <span className="detail-label">Error</span>
              <pre className="error-text">{query.error}</pre>
            </div>
          )}

          <div className="detail-meta-row">
            {query.txId && <span className="meta-chip"><em>TX</em> {query.txId}</span>}
            <span className="meta-chip"><em>Duration</em> {formatDuration(query.durationMs)}</span>
            <span className="meta-chip"><em>Rows</em> {query.rowsAffected}</span>
            <span className="meta-chip"><em>Time</em> {formatTime(query.startTime)}</span>
            <span className="meta-chip"><em>ID</em> {query.id}</span>
          </div>
        </div>
      )}
    </div>
  )
})

export default QueryRow
