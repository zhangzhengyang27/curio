import { DatabaseSync } from 'node:sqlite'
import { mkdirSync } from 'node:fs'
import { dirname } from 'node:path'

export interface QuakeRow {
  id: string
  mag: number
  place: string
  time: number
  depth: number
  lon: number
  lat: number
  alert: string | null
  url: string
}

export interface QuakeStore {
  upsert(rows: QuakeRow[]): number
  since(ts: number, limit: number): QuakeRow[]
  latest(limit: number): QuakeRow[]
  count(): number
  timeRange(): { min: number; max: number } | null
  prune(olderThanMs: number): number
  close(): void
}

export function openStore(dbPath: string): QuakeStore {
  if (dbPath !== ':memory:') mkdirSync(dirname(dbPath), { recursive: true })
  const db = new DatabaseSync(dbPath)
  db.exec(`
    CREATE TABLE IF NOT EXISTS quakes (
      id    TEXT PRIMARY KEY,
      mag   REAL NOT NULL,
      place TEXT NOT NULL,
      time  INTEGER NOT NULL,
      depth REAL NOT NULL,
      lon   REAL NOT NULL,
      lat   REAL NOT NULL,
      alert TEXT,
      url   TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_quakes_time ON quakes (time DESC);
  `)

  const upsertStmt = db.prepare(`
    INSERT INTO quakes (id, mag, place, time, depth, lon, lat, alert, url)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      mag = excluded.mag, place = excluded.place, time = excluded.time,
      depth = excluded.depth, lon = excluded.lon, lat = excluded.lat,
      alert = excluded.alert, url = excluded.url
  `)
  const sinceStmt = db.prepare(
    'SELECT * FROM quakes WHERE time > ? ORDER BY time DESC LIMIT ?'
  )
  const latestStmt = db.prepare('SELECT * FROM quakes ORDER BY time DESC LIMIT ?')
  const countStmt = db.prepare('SELECT COUNT(*) AS n FROM quakes')
  const rangeStmt = db.prepare('SELECT MIN(time) AS min, MAX(time) AS max FROM quakes')
  const pruneStmt = db.prepare('DELETE FROM quakes WHERE time < ?')

  return {
    upsert(rows) {
      let n = 0
      db.exec('BEGIN')
      try {
        for (const r of rows) {
          upsertStmt.run(r.id, r.mag, r.place, r.time, r.depth, r.lon, r.lat, r.alert, r.url)
          n++
        }
        db.exec('COMMIT')
      } catch (err) {
        db.exec('ROLLBACK')
        throw err
      }
      return n
    },
    since(ts, limit) {
      return sinceStmt.all(ts, limit) as unknown as QuakeRow[]
    },
    latest(limit) {
      return latestStmt.all(limit) as unknown as QuakeRow[]
    },
    count() {
      return Number((countStmt.get() as { n: number }).n)
    },
    timeRange() {
      const r = rangeStmt.get() as { min: number | null; max: number | null }
      return r.min == null || r.max == null ? null : { min: r.min, max: r.max }
    },
    prune(olderThanMs) {
      const before = countStmt.get() as { n: number }
      pruneStmt.run(olderThanMs)
      return Number(before.n) - this.count()
    },
    close() {
      db.close()
    },
  }
}
