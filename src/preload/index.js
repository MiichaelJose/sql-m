import { contextBridge, ipcRenderer } from 'electron'

// Expose a safe, typed API to the renderer
contextBridge.exposeInMainWorld('sqlm', {
  // Subscribe to incoming query events
  onQueryEvent: (callback) => {
    const handler = (_event, data) => callback(data)
    ipcRenderer.on('query:event', handler)
    // Return unsubscribe function
    return () => ipcRenderer.removeListener('query:event', handler)
  },

  // Subscribe to gRPC connection status updates
  onGrpcStatus: (callback) => {
    const handler = (_event, data) => callback(data)
    ipcRenderer.on('grpc:status', handler)
    return () => ipcRenderer.removeListener('grpc:status', handler)
  },

  // Subscribe to gRPC errors
  onGrpcError: (callback) => {
    const handler = (_event, data) => callback(data)
    ipcRenderer.on('grpc:error', handler)
    return () => ipcRenderer.removeListener('grpc:error', handler)
  },

  // Trigger a manual reconnect
  reconnect: () => ipcRenderer.invoke('grpc:reconnect'),

  // Run EXPLAIN on a query
  explain: (query, args, analyze) => ipcRenderer.invoke('grpc:explain', { query, args, analyze })
})
