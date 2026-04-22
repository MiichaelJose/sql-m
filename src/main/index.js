import { app, shell, BrowserWindow, ipcMain } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import { createGrpcClient, startWatching, stopWatching } from './grpc-client'

let mainWindow = null

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 900,
    minHeight: 600,
    backgroundColor: '#0d1117',
    titleBarStyle: 'hiddenInset',
    frame: process.platform !== 'darwin',
    show: false,
    autoHideMenuBar: true,
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false,
      contextIsolation: true
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

app.whenReady().then(() => {
  electronApp.setAppUserModelId('com.sql-m')
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  createWindow()
  initGrpc()

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  stopWatching()
  if (process.platform !== 'darwin') app.quit()
})

// ─── gRPC lifecycle ────────────────────────────────────────────────────────────

let grpcClient = null

function initGrpc() {
  grpcClient = createGrpcClient('localhost:9091')

  // Forward events to renderer
  const onEvent = (event) => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('query:event', event)
    }
  }

  const onError = (err) => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('grpc:error', { message: err.message, code: err.code })
    }
  }

  const onStatus = (status) => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('grpc:status', status)
    }
  }

  startWatching(grpcClient, { onEvent, onError, onStatus })
}

// ─── IPC Handlers ──────────────────────────────────────────────────────────────

ipcMain.handle('grpc:reconnect', () => {
  stopWatching()
  if (grpcClient) {
    grpcClient.close()
  }
  initGrpc()
  return { ok: true }
})

ipcMain.handle('grpc:explain', async (_event, { query, args, analyze }) => {
  return new Promise((resolve, reject) => {
    if (!grpcClient) return reject(new Error('gRPC client not initialized'))
    grpcClient.Explain({ query, args: args || [], analyze: !!analyze }, (err, response) => {
      if (err) return reject(err)
      resolve({ plan: response.plan })
    })
  })
})
