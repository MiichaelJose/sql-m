import { useEffect, useRef, useMemo } from 'react'
import { useQueryStore } from '../store/queryStore'
import QueryRow from './QueryRow'

/**
 * QueryList
 * @param {string[]} tables  — table names to include (empty = all)
 * @param {string}   filter  — text search override (falls back to global store filter)
 */
export default function QueryList({ tables = [], filter: filterProp }) {
  // Subscribe DIRECTLY to the raw queries array and filter primitives so this
  // component always re-renders when data changes or props change.
  const allQueries  = useQueryStore(s => s.queries)
  const globalFilter = useQueryStore(s => s.filter)
  const paused       = useQueryStore(s => s.paused)
  const buffer       = useQueryStore(s => s.buffer)

  const activeFilter = filterProp !== undefined ? filterProp : globalFilter

  // Derive filtered list inline — avoids stale-closure issues with store functions
  const queries = useMemo(() => {
    let result = allQueries

    if (tables && tables.length > 0) {
      const tableSet = new Set(tables.map(t => t.toLowerCase()))
      result = result.filter(q => q.tableName && tableSet.has(q.tableName.toLowerCase()))
    }

    if (activeFilter && activeFilter.trim()) {
      const lower = activeFilter.toLowerCase()
      result = result.filter(q => q.query && q.query.toLowerCase().includes(lower))
    }

    return result
  }, [allQueries, tables, activeFilter])

  const listRef  = useRef(null)
  const atTopRef = useRef(true)

  // Auto-scroll to top when new queries arrive (newest-first layout)
  useEffect(() => {
    if (!paused && listRef.current && atTopRef.current) {
      listRef.current.scrollTop = 0
    }
  }, [queries.length, paused])

  const handleScroll = () => {
    if (!listRef.current) return
    atTopRef.current = listRef.current.scrollTop < 40
  }

  if (queries.length === 0) {
    return (
      <div className="query-list-empty">
        {activeFilter ? (
          <>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/><line x1="6" y1="9" x2="16" y2="9"/><line x1="6" y1="13" x2="12" y2="13"/>
            </svg>
            <p>No queries match <strong>"{activeFilter}"</strong></p>
          </>
        ) : tables.length > 0 ? (
          <>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/>
            </svg>
            <p>No queries for <strong>{tables.join(', ')}</strong></p>
            <span className="empty-hint">Queries touching these tables will appear here automatically.</span>
          </>
        ) : (
          <>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/>
            </svg>
            <p>Waiting for SQL queries from <strong>localhost:9091</strong></p>
            <span className="empty-hint">Make sure sql-tapd is running and your app is connected to its proxy port.</span>
          </>
        )}
      </div>
    )
  }

  return (
    <div className="query-list-wrapper">
      {/* Column headers */}
      <div className="query-list-header">
        <span className="col-badge">Type</span>
        <span className="col-query">Query</span>
        <span className="col-duration">Duration</span>
        <span className="col-rows">Rows</span>
        <span className="col-time">Time</span>
      </div>

      <div
        className="query-list"
        ref={listRef}
        onScroll={handleScroll}
        role="list"
        aria-label="SQL query stream"
      >
        {queries.map((q) => (
          <QueryRow key={q.id} query={q} />
        ))}
      </div>

      {paused && buffer.length > 0 && (
        <div className="paused-banner">
          <svg viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>
          {buffer.length} new {buffer.length === 1 ? 'query' : 'queries'} buffered — resume to see them
        </div>
      )}
    </div>
  )
}
