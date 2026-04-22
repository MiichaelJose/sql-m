import grpc from '@grpc/grpc-js'
import protoLoader from '@grpc/proto-loader'
import { join } from 'path'
import { app } from 'electron'
import { is } from '@electron-toolkit/utils'

// ── SQL table extractor (duplicated from renderer for main-process use) ────────
// We cannot import from renderer, so we keep a minimal copy here.
const _TABLE_RE = [
  /\bINSERT\s+(?:OR\s+\w+\s+)?INTO\s+["'`]?(\w+)["'`]?/i,
  /\bREPLACE\s+INTO\s+["'`]?(\w+)["'`]?/i,
  /\bUPDATE\s+["'`]?(\w+)["'`]?/i,
  /\bDELETE\s+FROM\s+["'`]?(\w+)["'`]?/i,
  /\bFROM\s+["'`]?(\w+)["'`]?/i,
  /\b(?:CREATE|DROP|ALTER)\s+(?:TEMPORARY\s+)?TABLE\s+(?:IF\s+(?:NOT\s+)?EXISTS\s+)?["'`]?(\w+)["'`]?/i,
  /\bTRUNCATE\s+(?:TABLE\s+)?["'`]?(\w+)["'`]?/i,
]
const _SQL_KW = new Set(['SELECT','FROM','WHERE','JOIN','INNER','LEFT','RIGHT','OUTER',
  'FULL','CROSS','ON','AS','SET','VALUES','INTO','TABLE','INDEX','VIEW','DATABASE',
  'SCHEMA','EXISTS','NOT','IF','TEMPORARY','DISTINCT','ALL','AND','OR','IN','IS',
  'NULL','LIKE','BETWEEN','CASE','WHEN','THEN','ELSE','END','ORDER','BY','GROUP',
  'HAVING','LIMIT','OFFSET','UNION','EXCEPT','INTERSECT','WITH','RECURSIVE'])

function extractTableName(sql) {
  if (!sql) return null
  for (const re of _TABLE_RE) {
    const m = sql.match(re)
    if (m && m[1] && !_SQL_KW.has(m[1].toUpperCase())) return m[1].toLowerCase()
  }
  return null
}


// Resolve proto path — works in both dev and production (asar)
function getProtoPath() {
  if (is.dev) {
    return join(process.cwd(), 'src', 'proto', 'tap', 'v1', 'tap.proto')
  }
  return join(app.getAppPath(), 'src', 'proto', 'tap', 'v1', 'tap.proto')
}

const PROTO_OPTIONS = {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true,
  includeDirs: [
    // For well-known types (google/protobuf/...)
    join(process.cwd(), 'node_modules', 'google-proto-files'),
    join(process.cwd(), 'node_modules', '@grpc', 'proto-loader', 'build', 'node_modules', 'google-proto-files')
  ]
}

let activeStream = null

/**
 * Creates and returns a gRPC client connected to the given address.
 */
export function createGrpcClient(address) {
  const protoPath = getProtoPath()

  let packageDef
  try {
    packageDef = protoLoader.loadSync(protoPath, PROTO_OPTIONS)
  } catch (e) {
    console.error('[gRPC] Failed to load proto:', e.message)
    throw e
  }

  const proto = grpc.loadPackageDefinition(packageDef)
  const TapService = proto.tap?.v1?.TapService

  if (!TapService) {
    throw new Error('[gRPC] TapService not found in proto definition')
  }

  return new TapService(address, grpc.credentials.createInsecure())
}

/**
 * Starts a server-streaming Watch call and emits parsed events.
 */
export function startWatching(client, { onEvent, onError, onStatus }) {
  if (!client) return

  console.log('[gRPC] Starting Watch stream...')
  onStatus({ connected: false, connecting: true, error: null })

  const stream = client.Watch({})
  activeStream = stream

  stream.on('data', (response) => {
    const ev = response.event
    if (!ev) return

    // Convert protobuf types to plain JSON-serializable values
    const durationNs =
      ev.duration
        ? BigInt(ev.duration.seconds || 0) * 1_000_000_000n + BigInt(ev.duration.nanos || 0)
        : 0n

    const durationMs = Number(durationNs) / 1_000_000

    const startEpochMs = ev.start_time
      ? Number(BigInt(ev.start_time.seconds || 0)) * 1000 +
        Math.floor(Number(ev.start_time.nanos || 0) / 1_000_000)
      : Date.now()

    const parsed = {
      id: ev.id || crypto.randomUUID(),
      op: ev.op,
      query: ev.query || '',
      args: ev.args || [],
      startTime: startEpochMs,
      durationMs: Math.round(durationMs * 100) / 100,
      rowsAffected: Number(ev.rows_affected || 0),
      error: ev.error || null,
      txId: ev.tx_id || null,
      nPlus1: !!ev.n_plus_1,
      normalizedQuery: ev.normalized_query || ev.query || '',
      slowQuery: !!ev.slow_query,
      tableName: extractTableName(ev.query || ''),
    }

    onEvent(parsed)

  })

  stream.on('error', (err) => {
    console.error('[gRPC] Stream error:', err.message)
    onStatus({ connected: false, connecting: false, error: err.message })
    onError(err)

    // Auto-reconnect after 3 seconds
    setTimeout(() => {
      if (activeStream === stream) {
        console.log('[gRPC] Attempting reconnect...')
        startWatching(client, { onEvent, onError, onStatus })
      }
    }, 3000)
  })

  stream.on('status', (status) => {
    console.log('[gRPC] Stream status:', status)
  })

  stream.on('end', () => {
    console.log('[gRPC] Stream ended')
    onStatus({ connected: false, connecting: false, error: 'Stream ended' })
  })

  // Small delay to emit "connected" once data starts arriving
  const connectedTimer = setTimeout(() => {
    onStatus({ connected: true, connecting: false, error: null })
  }, 500)

  stream.on('error', () => clearTimeout(connectedTimer))
}

/**
 * Cancels the active stream if any.
 */
export function stopWatching() {
  if (activeStream) {
    activeStream.cancel()
    activeStream = null
    console.log('[gRPC] Watch stream cancelled')
  }
}
