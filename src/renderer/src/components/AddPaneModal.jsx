import { useState, useEffect, useRef } from 'react'
import { usePaneStore } from '../store/paneStore'
import { useQueryStore } from '../store/queryStore'
import { getTableColor, extractTableName } from '../store/tableColors'

/**
 * AddPaneModal
 * Creates or edits a pane.
 * @param {object|null} editingPane  — if set, pre-fills the form for editing
 * @param {function}    onClose
 */
export default function AddPaneModal({ editingPane, onClose }) {
  const { addPane, updatePane } = usePaneStore()
  const seenTables = useQueryStore(s => s.seenTables)
  const queries    = useQueryStore(s => s.queries)

  // Derive known tables from both seenTables + live extraction from recent queries
  const allKnownTables = (() => {
    const set = new Set(seenTables)
    queries.slice(0, 500).forEach(q => {
      const t = extractTableName(q.query)
      if (t) set.add(t)
    })
    return [...set].sort()
  })()

  const [name,      setName]      = useState(editingPane?.name   || '')
  const [tables,    setTables]    = useState(editingPane?.tables || [])
  const [inputVal,  setInputVal]  = useState('')
  const [suggestions, setSuggestions] = useState([])
  const [showSugg,  setShowSugg]  = useState(false)
  const inputRef = useRef(null)

  const isEditing = !!editingPane

  // Focus name field on mount
  useEffect(() => {
    if (!isEditing) inputRef.current?.focus()
  }, [isEditing])

  // Update suggestions when typing a table name
  useEffect(() => {
    if (!inputVal.trim()) { setSuggestions(allKnownTables); return }
    const lower = inputVal.toLowerCase()
    setSuggestions(allKnownTables.filter(t => t.includes(lower) && !tables.includes(t)))
  }, [inputVal, tables, allKnownTables.join(',')])

  const addTable = (t) => {
    const val = t.trim().toLowerCase()
    if (!val || tables.includes(val)) return
    setTables(prev => [...prev, val])
    setInputVal('')
    setShowSugg(false)
    inputRef.current?.focus()
  }

  const removeTable = (t) => setTables(prev => prev.filter(x => x !== t))

  const handleInputKey = (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault()
      addTable(inputVal)
    }
    if (e.key === 'Backspace' && !inputVal && tables.length > 0) {
      setTables(prev => prev.slice(0, -1))
    }
    if (e.key === 'Escape') onClose()
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    const finalName = name.trim() || (tables.length > 0 ? tables.join(', ') : 'Pane')
    if (isEditing) {
      updatePane(editingPane.id, { name: finalName, tables })
    } else {
      addPane(finalName, tables)
    }
    onClose()
  }

  return (
    <div className="modal-overlay" onClick={onClose} role="dialog" aria-modal="true">
      <div className="modal-box" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="modal-header">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="3" width="18" height="18" rx="2"/>
            <line x1="3" y1="9" x2="21" y2="9"/>
            <line x1="3" y1="15" x2="21" y2="15"/>
            <line x1="9" y1="9" x2="9" y2="21"/>
          </svg>
          <h2>{isEditing ? 'Edit Pane' : 'New Pane'}</h2>
          <button className="modal-close" onClick={onClose} aria-label="Close">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form">
          {/* Name */}
          <div className="modal-field">
            <label htmlFor="pane-name">Name</label>
            <input
              id="pane-name"
              className="modal-input"
              type="text"
              placeholder={tables.length > 0 ? tables.join(', ') : 'e.g. Orders'}
              value={name}
              onChange={e => setName(e.target.value)}
              maxLength={32}
            />
          </div>

          {/* Tables */}
          <div className="modal-field">
            <label htmlFor="pane-tables">
              Tables
              <span className="modal-label-hint">Queries that touch these tables will appear in this pane</span>
            </label>

            {/* Chips + input */}
            <div
              className="table-chip-input"
              onClick={() => { inputRef.current?.focus(); setShowSugg(true) }}
            >
              {tables.map(t => {
                const col = getTableColor(t)
                return (
                  <span
                    key={t}
                    className="table-chip"
                    style={{ background: col.badge, color: col.text, borderColor: col.border }}
                  >
                    {t}
                    <button
                      type="button"
                      className="chip-remove"
                      onClick={e => { e.stopPropagation(); removeTable(t) }}
                      aria-label={`Remove ${t}`}
                    >×</button>
                  </span>
                )
              })}
              <input
                id="pane-tables"
                ref={inputRef}
                className="chip-text-input"
                type="text"
                placeholder={tables.length === 0 ? 'Type a table name...' : ''}
                value={inputVal}
                onChange={e => { setInputVal(e.target.value); setShowSugg(true) }}
                onKeyDown={handleInputKey}
                onFocus={() => setShowSugg(true)}
                onBlur={() => setTimeout(() => setShowSugg(false), 150)}
                autoComplete="off"
              />
            </div>

            {/* Autocomplete dropdown */}
            {showSugg && suggestions.length > 0 && (
              <div className="sugg-dropdown">
                {suggestions.slice(0, 12).map(t => {
                  const col = getTableColor(t)
                  return (
                    <button
                      key={t}
                      type="button"
                      className="sugg-item"
                      onMouseDown={() => addTable(t)}
                    >
                      <span
                        className="sugg-dot"
                        style={{ background: col.accent }}
                      />
                      {t}
                    </button>
                  )
                })}
                {allKnownTables.length === 0 && (
                  <span className="sugg-empty">No tables seen yet — type to add manually</span>
                )}
              </div>
            )}
          </div>

          {/* Preview */}
          {tables.length > 0 && (
            <div className="modal-preview">
              <span className="modal-preview-label">Preview</span>
              <div className="modal-preview-row">
                {tables.map(t => {
                  const col = getTableColor(t)
                  return (
                    <span
                      key={t}
                      className="preview-tab-chip"
                      style={{
                        background:  col.badge,
                        color:       col.text,
                        borderLeft:  `3px solid ${col.border}`,
                      }}
                    >
                      {t}
                    </span>
                  )
                })}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="modal-actions">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={tables.length === 0 && !name.trim()}
            >
              {isEditing ? 'Save Changes' : 'Create Pane'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
