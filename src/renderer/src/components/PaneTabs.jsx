import { useState, useRef } from 'react'
import { usePaneStore, ALL_PANE_ID } from '../store/paneStore'
import { getTableColor } from '../store/tableColors'
import AddPaneModal from './AddPaneModal'

export default function PaneTabs() {
  const { panes, activeId, setActive, removePane, reorderPanes } = usePaneStore()
  const [showModal, setShowModal]   = useState(false)
  const [editingPane, setEditingPane] = useState(null) // pane object being edited
  const dragSrc = useRef(null)

  // ── Drag-to-reorder ────────────────────────────────────────────────────────
  const handleDragStart = (e, idx) => {
    if (idx === 0) { e.preventDefault(); return } // never drag "All"
    dragSrc.current = idx
    e.dataTransfer.effectAllowed = 'move'
  }
  const handleDragOver = (e, idx) => {
    if (idx === 0 || dragSrc.current === null) return
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }
  const handleDrop = (e, toIdx) => {
    if (toIdx === 0 || dragSrc.current === null) return
    e.preventDefault()
    reorderPanes(dragSrc.current, toIdx)
    dragSrc.current = null
  }
  const handleDragEnd = () => { dragSrc.current = null }

  const openEdit = (e, pane) => {
    e.stopPropagation()
    setEditingPane(pane)
    setShowModal(true)
  }

  const closeModal = () => {
    setShowModal(false)
    setEditingPane(null)
  }

  return (
    <>
      <div className="pane-tabs" role="tablist" aria-label="Query panes">
        {panes.map((pane, idx) => {
          const isActive = pane.id === activeId
          const isAll    = pane.id === ALL_PANE_ID

          // derive accent color from first table (or neutral for "All")
          const firstColor = !isAll && pane.tables.length > 0
            ? getTableColor(pane.tables[0])
            : null

          return (
            <div
              key={pane.id}
              className={`pane-tab${isActive ? ' pane-tab-active' : ''}`}
              role="tab"
              aria-selected={isActive}
              tabIndex={0}
              draggable={!isAll}
              onClick={() => setActive(pane.id)}
              onKeyDown={(e) => e.key === 'Enter' && setActive(pane.id)}
              onDragStart={(e) => handleDragStart(e, idx)}
              onDragOver={(e)  => handleDragOver(e, idx)}
              onDrop={(e)      => handleDrop(e, idx)}
              onDragEnd={handleDragEnd}
              style={isActive && firstColor ? { '--tab-accent': firstColor.accent } : {}}
            >
              {/* Tab icon */}
              {isAll ? (
                <svg className="tab-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <ellipse cx="12" cy="5" rx="9" ry="3"/>
                  <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/>
                  <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/>
                </svg>
              ) : (
                <svg className="tab-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="3" width="18" height="18" rx="2"/>
                  <line x1="3" y1="9" x2="21" y2="9"/>
                  <line x1="3" y1="15" x2="21" y2="15"/>
                  <line x1="9" y1="9" x2="9" y2="21"/>
                </svg>
              )}

              <span className="tab-name">{pane.name}</span>

              {/* Table chips (non-All panes) */}
              {!isAll && pane.tables.length > 0 && (
                <span className="tab-tables">
                  {pane.tables.slice(0, 3).map(t => {
                    const col = getTableColor(t)
                    return (
                      <span
                        key={t}
                        className="tab-table-chip"
                        style={{ background: col.badge, color: col.text }}
                      >
                        {t}
                      </span>
                    )
                  })}
                  {pane.tables.length > 3 && (
                    <span className="tab-table-chip tab-table-more">
                      +{pane.tables.length - 3}
                    </span>
                  )}
                </span>
              )}

              {/* Edit + Close buttons (non-All panes) */}
              {!isAll && (
                <span className="tab-actions">
                  <button
                    className="tab-btn tab-btn-edit"
                    title="Edit pane"
                    onClick={(e) => openEdit(e, pane)}
                    aria-label={`Edit ${pane.name}`}
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                    </svg>
                  </button>
                  <button
                    className="tab-btn tab-btn-close"
                    title="Remove pane"
                    onClick={(e) => { e.stopPropagation(); removePane(pane.id) }}
                    aria-label={`Close ${pane.name}`}
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                    </svg>
                  </button>
                </span>
              )}
            </div>
          )
        })}

        {/* Add new pane button */}
        <button
          id="btn-add-pane"
          className="pane-tab-add"
          onClick={() => { setEditingPane(null); setShowModal(true) }}
          title="Add new pane"
          aria-label="Add new pane"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
        </button>
      </div>

      {showModal && (
        <AddPaneModal
          editingPane={editingPane}
          onClose={closeModal}
        />
      )}
    </>
  )
}
