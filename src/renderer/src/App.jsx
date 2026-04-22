import { useEffect } from 'react'
import Toolbar from './components/Toolbar'
import PaneTabs from './components/PaneTabs'
import QueryList from './components/QueryList'
import StatsPanel from './components/StatsPanel'
import StatusBar from './components/StatusBar'
import { useQueryStore } from './store/queryStore'
import { usePaneStore } from './store/paneStore'

export default function App() {
  const { addEvent, setGrpcStatus } = useQueryStore()

  // ── Reactive active pane ───────────────────────────────────────────────────
  // Subscribing directly to panes + activeId ensures App re-renders whenever
  // the user clicks a different tab (the getActivePane() function pattern
  // captures a stale closure and does NOT trigger re-renders).
  const panes    = usePaneStore(s => s.panes)
  const activeId = usePaneStore(s => s.activeId)
  const activePane = panes.find(p => p.id === activeId) ?? panes[0]


  useEffect(() => {
    const api = window.sqlm
    if (!api) {
      console.warn('[App] window.sqlm not found — preload may not be loaded')
      return
    }

    const unsubEvent  = api.onQueryEvent(addEvent)
    const unsubStatus = api.onGrpcStatus(setGrpcStatus)
    const unsubError  = api.onGrpcError((err) => {
      setGrpcStatus({ connected: false, connecting: false, error: err.message })
    })

    return () => {
      unsubEvent()
      unsubStatus()
      unsubError()
    }
  }, [addEvent, setGrpcStatus])

  return (
    <div className="app-shell">
      <Toolbar />
      <div className="content-area">
        <div className="main-panel">
          <PaneTabs />
          <QueryList tables={activePane.tables} />
        </div>
        <aside className="side-panel">
          <StatsPanel />
        </aside>
      </div>
      <StatusBar />
    </div>
  )
}
