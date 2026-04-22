import { create } from 'zustand'
import { persist } from 'zustand/middleware'

// ── Helpers ───────────────────────────────────────────────────────────────────

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7)
}

// ── Default "All" pane ────────────────────────────────────────────────────────

const ALL_PANE_ID = '__all__'

const allPane = {
  id:        ALL_PANE_ID,
  name:      'All',
  tables:    [],   // empty = no table filter = show everything
  createdAt: 0,
  pinned:    true, // cannot be removed or reordered before user panes
}

// ── Store ─────────────────────────────────────────────────────────────────────

export const usePaneStore = create(
  persist(
    (set, get) => ({
      panes:    [allPane],
      activeId: ALL_PANE_ID,

      // ── Selectors ────────────────────────────────────────────────────────────

      getActivePane: () => {
        const { panes, activeId } = get()
        return panes.find(p => p.id === activeId) || panes[0]
      },

      // ── Actions ──────────────────────────────────────────────────────────────

      setActive: (id) => set({ activeId: id }),

      addPane: (name, tables) => {
        const newPane = {
          id:        uid(),
          name:      name.trim() || 'Pane',
          tables:    tables.map(t => t.toLowerCase()),
          createdAt: Date.now(),
          pinned:    false,
        }
        set(state => ({
          panes:    [...state.panes, newPane],
          activeId: newPane.id,
        }))
      },

      removePane: (id) => {
        if (id === ALL_PANE_ID) return // cannot remove "All"
        set(state => {
          const panes    = state.panes.filter(p => p.id !== id)
          const activeId = state.activeId === id ? ALL_PANE_ID : state.activeId
          return { panes, activeId }
        })
      },

      updatePane: (id, patch) => {
        if (id === ALL_PANE_ID) return
        set(state => ({
          panes: state.panes.map(p =>
            p.id === id
              ? { ...p, ...patch, tables: patch.tables ? patch.tables.map(t => t.toLowerCase()) : p.tables }
              : p
          ),
        }))
      },

      reorderPanes: (fromIdx, toIdx) => {
        set(state => {
          const panes = [...state.panes]
          // Never move the pinned "All" pane (index 0)
          if (fromIdx <= 0 || toIdx <= 0) return {}
          const [item] = panes.splice(fromIdx, 1)
          panes.splice(toIdx, 0, item)
          return { panes }
        })
      },
    }),
    {
      name: 'sql-monitor-panes',
      // Exclude nothing — persist everything
      // Re-inject the always-present "All" pane on rehydration in case it was lost
      onRehydrateStorage: () => (state) => {
        if (!state) return
        const hasAll = state.panes?.some(p => p.id === ALL_PANE_ID)
        if (!hasAll) {
          state.panes = [allPane, ...(state.panes || [])]
        }
      },
    }
  )
)

export { ALL_PANE_ID }
