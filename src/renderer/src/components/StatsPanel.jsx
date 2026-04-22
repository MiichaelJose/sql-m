import { useMemo } from 'react'
import { useQueryStore } from '../store/queryStore'

function StatCard({ label, value, sub, accent }) {
  return (
    <div className={`stat-card ${accent ? `stat-${accent}` : ''}`}>
      <span className="stat-value">{value}</span>
      <span className="stat-label">{label}</span>
      {sub && <span className="stat-sub">{sub}</span>}
    </div>
  )
}

export default function StatsPanel() {
  const { totalReceived, slowCount, nPlusOneCount, errorCount, aggregates } = useQueryStore()

  // Top 10 most repeated queries
  const topQueries = useMemo(() => {
    return Object.entries(aggregates)
      .map(([query, stats]) => ({ query, ...stats }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10)
  }, [aggregates])

  // Top 5 slowest average queries
  const slowestQueries = useMemo(() => {
    return Object.entries(aggregates)
      .map(([query, stats]) => ({ query, ...stats }))
      .filter(q => q.count >= 1)
      .sort((a, b) => b.avgDuration - a.avgDuration)
      .slice(0, 5)
  }, [aggregates])

  function fmt(ms) {
    if (ms < 1) return `${(ms * 1000).toFixed(0)}μs`
    if (ms < 1000) return `${ms.toFixed(1)}ms`
    return `${(ms / 1000).toFixed(2)}s`
  }

  function truncate(str, n = 48) {
    if (!str) return '—'
    return str.length > n ? str.slice(0, n) + '…' : str
  }

  return (
    <div className="stats-panel">
      <h2 className="stats-title">Overview</h2>

      <div className="stat-grid">
        <StatCard label="Total Queries" value={totalReceived.toLocaleString()} />
        <StatCard label="Slow Queries" value={slowCount.toLocaleString()} accent="slow" sub="> 100ms" />
        <StatCard label="N+1 Detected" value={nPlusOneCount.toLocaleString()} accent="nplus" />
        <StatCard label="Errors" value={errorCount.toLocaleString()} accent="error" />
      </div>

      <section className="stats-section">
        <h3 className="section-title">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
          </svg>
          Most Frequent
        </h3>
        {topQueries.length === 0 ? (
          <p className="stats-empty">No data yet</p>
        ) : (
          <ul className="agg-list">
            {topQueries.map(({ query, count, avgDuration }) => (
              <li key={query} className="agg-item" title={query}>
                <span className="agg-query">{truncate(query, 42)}</span>
                <div className="agg-meta">
                  <span className="agg-count">{count}×</span>
                  <span className="agg-dur">{fmt(avgDuration)} avg</span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="stats-section">
        <h3 className="section-title">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
          </svg>
          Slowest Avg
        </h3>
        {slowestQueries.length === 0 ? (
          <p className="stats-empty">No data yet</p>
        ) : (
          <ul className="agg-list">
            {slowestQueries.map(({ query, count, avgDuration }) => (
              <li key={query} className="agg-item agg-item-slow" title={query}>
                <span className="agg-query">{truncate(query, 42)}</span>
                <div className="agg-meta">
                  <span className="agg-count">{count}×</span>
                  <span className="agg-dur agg-dur-slow">{fmt(avgDuration)}</span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
