import { create } from 'zustand'
import { extractTableName } from './tableColors'

const MAX_QUERIES = 2000

export const useQueryStore = create((set, get) => ({
  // ── State ──────────────────────────────────────────────────────────────────
  queries:       [],
  paused:        false,
  buffer:        [],
  filter:        '',
  grpcStatus:    { connected: false, connecting: true, error: null },
  totalReceived: 0,
  slowCount:     0,
  nPlusOneCount: 0,
  errorCount:    0,
  aggregates:    {},

  // All unique table names seen so far — used for autocomplete in AddPaneModal
  seenTables: [],

  // ── Actions ────────────────────────────────────────────────────────────────

  addEvent: (rawEvent) => {
    const state = get()

    // Always derive tableName in the renderer — do not rely on the main process
    // setting it, since IPC serialisation may drop null fields or the grpc-client
    // may not have been restarted yet.
    const tableName = rawEvent.tableName || extractTableName(rawEvent.query) || null
    const event = { ...rawEvent, tableName }

    // Update aggregates
    const key      = event.normalizedQuery || event.query
    const prev     = state.aggregates[key] || { count: 0, totalDuration: 0, avgDuration: 0 }
    const newCount = prev.count + 1
    const newTotal = prev.totalDuration + event.durationMs
    const newAgg   = {
      count:         newCount,
      totalDuration: newTotal,
      avgDuration:   Math.round((newTotal / newCount) * 100) / 100,
    }
    const newAggregates = { ...state.aggregates, [key]: newAgg }

    // Track seen tables
    let seenTables = state.seenTables
    if (tableName && !seenTables.includes(tableName)) {
      seenTables = [...seenTables, tableName].sort()
    }

    const stats = {
      totalReceived: state.totalReceived + 1,
      slowCount:     state.slowCount     + (event.slowQuery ? 1 : 0),
      nPlusOneCount: state.nPlusOneCount + (event.nPlus1   ? 1 : 0),
      errorCount:    state.errorCount    + (event.error    ? 1 : 0),
      aggregates:    newAggregates,
      seenTables,
    }

    if (state.paused) {
      set({ buffer: [event, ...state.buffer], ...stats })
      return
    }

    const queries = [event, ...state.queries].slice(0, MAX_QUERIES)
    set({ queries, ...stats })
  },

  setFilter: (filter) => set({ filter }),

  setPaused: (paused) => {
    const state = get()
    if (!paused && state.buffer.length > 0) {
      const queries = [...state.buffer, ...state.queries].slice(0, MAX_QUERIES)
      set({ paused: false, buffer: [], queries })
    } else {
      set({ paused })
    }
  },

  setGrpcStatus: (status) => set({ grpcStatus: status }),

  clearAll: () => set({
    queries:       [],
    buffer:        [],
    totalReceived: 0,
    slowCount:     0,
    nPlusOneCount: 0,
    errorCount:    0,
    aggregates:    {},
    // keep seenTables — user may want to keep pane config intact
  }),

  // ── Derived ────────────────────────────────────────────────────────────────

  /** Filtered queries for the active pane.
   * @param {string[]} tables  — empty = no table filter (All pane)
   * @param {string}   text    — text search filter
   */
  getFilteredQueries: (tables = [], text = '') => {
    const { queries } = get()
    let result = queries

    if (tables && tables.length > 0) {
      const set_ = new Set(tables.map(t => t.toLowerCase()))
      result = result.filter(q => q.tableName && set_.has(q.tableName.toLowerCase()))
    }

    if (text && text.trim()) {
      const lower = text.toLowerCase()
      result = result.filter(q => q.query && q.query.toLowerCase().includes(lower))
    }

    return result
  },
}))
