/**
 * tableColors.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Deterministic per-table colour system.
 *
 * Each unique table name is hashed to a stable hue (0-360°) and converted
 * to a set of CSS-ready HSL values so every query log row for a given table
 * always renders with the same colour — even across sessions.
 *
 * Colours are intentionally muted (low saturation, low-alpha backgrounds)
 * so they complement the dark theme without being garish.
 */

// ─── Known table overrides ────────────────────────────────────────────────────
// You can pin specific tables to specific hues here.
// Format: { tableName (lowercase): hue (0-360) }
const TABLE_HUE_OVERRIDES = {
  users:       205,   // blue
  orders:      142,   // green
  products:    32,    // orange
  payments:    280,   // purple
  sessions:    165,   // teal
  logs:        50,    // yellow
  events:      310,   // pink
  tickets:     190,   // cyan
  accounts:    260,   // violet
  messages:    20,    // amber
  notifications: 170, // seafoam
  reports:     95,    // lime
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Fast, deterministic string → number hash (djb2) */
function hashString(str) {
  let h = 5381
  for (let i = 0; i < str.length; i++) {
    h = ((h << 5) + h) ^ str.charCodeAt(i)
    h = h >>> 0 // keep unsigned 32-bit
  }
  return h
}

/** Map a table name to a hue (0-359). Uses override if present, else hash. */
function tableToHue(tableName) {
  const key = tableName.toLowerCase()
  if (TABLE_HUE_OVERRIDES[key] !== undefined) return TABLE_HUE_OVERRIDES[key]
  return hashString(key) % 360
}

// ─── Main export ──────────────────────────────────────────────────────────────

/**
 * Returns a colour descriptor for the given table name.
 * Result is memoised in a module-level Map so the cost is paid only once.
 *
 * @returns {{
 *   hue: number,
 *   bg: string,       // CSS rgba — subtle row background
 *   border: string,   // CSS rgba — left-border accent
 *   badge: string,    // CSS rgba — badge background
 *   text: string,     // CSS hsl  — readable text on dark bg
 *   accent: string,   // CSS hsl  — brighter accent for emphasis
 * }}
 */
const _cache = new Map()

export function getTableColor(tableName) {
  if (!tableName) return null
  const key = tableName.toLowerCase()
  if (_cache.has(key)) return _cache.get(key)

  const hue = tableToHue(key)
  const colors = {
    hue,
    bg:     `hsla(${hue}, 70%, 55%, 0.06)`,
    border: `hsla(${hue}, 70%, 55%, 0.45)`,
    badge:  `hsla(${hue}, 65%, 55%, 0.18)`,
    text:   `hsl(${hue}, 80%, 72%)`,
    accent: `hsl(${hue}, 85%, 65%)`,
  }
  _cache.set(key, colors)
  return colors
}

// ─── SQL table extractor ──────────────────────────────────────────────────────

/**
 * Best-effort extraction of the primary table name from a SQL string.
 * Handles common patterns: FROM <t>, JOIN <t>, INTO <t>, UPDATE <t>, TABLE <t>.
 * Returns null if nothing can be determined.
 *
 * @param {string} sql
 * @returns {string|null}
 */
export function extractTableName(sql) {
  if (!sql) return null

  const q = sql.trim()

  // Ordered list of patterns — first match wins
  const patterns = [
    // INSERT INTO table / REPLACE INTO table
    /\bINSERT\s+(?:OR\s+\w+\s+)?INTO\s+["'`]?(\w+)["'`]?/i,
    /\bREPLACE\s+INTO\s+["'`]?(\w+)["'`]?/i,
    // UPDATE table SET …
    /\bUPDATE\s+["'`]?(\w+)["'`]?/i,
    // DELETE FROM table
    /\bDELETE\s+FROM\s+["'`]?(\w+)["'`]?/i,
    // SELECT … FROM table
    /\bFROM\s+["'`]?(\w+)["'`]?/i,
    // CREATE / DROP / ALTER TABLE table
    /\b(?:CREATE|DROP|ALTER)\s+(?:TEMPORARY\s+)?TABLE\s+(?:IF\s+(?:NOT\s+)?EXISTS\s+)?["'`]?(\w+)["'`]?/i,
    // TRUNCATE TABLE / TRUNCATE table
    /\bTRUNCATE\s+(?:TABLE\s+)?["'`]?(\w+)["'`]?/i,
  ]

  for (const re of patterns) {
    const m = q.match(re)
    if (m && m[1] && !RESERVED.has(m[1].toUpperCase())) {
      return m[1].toLowerCase()
    }
  }

  return null
}

/** SQL keywords to ignore when they accidentally match a table slot */
const RESERVED = new Set([
  'SELECT', 'FROM', 'WHERE', 'JOIN', 'INNER', 'LEFT', 'RIGHT', 'OUTER',
  'FULL', 'CROSS', 'ON', 'AS', 'SET', 'VALUES', 'INTO', 'TABLE', 'INDEX',
  'VIEW', 'DATABASE', 'SCHEMA', 'EXISTS', 'NOT', 'IF', 'TEMPORARY',
  'DISTINCT', 'ALL', 'AND', 'OR', 'IN', 'IS', 'NULL', 'LIKE', 'BETWEEN',
  'CASE', 'WHEN', 'THEN', 'ELSE', 'END', 'ORDER', 'BY', 'GROUP', 'HAVING',
  'LIMIT', 'OFFSET', 'UNION', 'EXCEPT', 'INTERSECT', 'WITH', 'RECURSIVE',
])
