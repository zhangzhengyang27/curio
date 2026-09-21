import { createServer } from 'node:http'
import type { IncomingMessage, Server, ServerResponse } from 'node:http'
import type { QuakeStore } from './db.ts'
import type { TileHandler } from './tiles.ts'

export interface ApiState {
  startedAt: number
  lastSyncAt: number | null
  lastError: string | null
  usgsBase: string
  nextDailyAt: () => number
}

const CORS = {
  'access-control-allow-origin': '*',
  'access-control-allow-methods': 'GET, OPTIONS',
  'access-control-allow-headers': 'content-type',
  'access-control-max-age': '86400',
}

function json(res: ServerResponse, status: number, body: unknown): void {
  const payload = JSON.stringify(body)
  res.writeHead(status, {
    'content-type': 'application/json; charset=utf-8',
    'cache-control': 'no-store',
    ...CORS,
  })
  res.end(payload)
}

export function createApiServer(store: QuakeStore, state: ApiState, tiles?: TileHandler): Server {
  return createServer((req: IncomingMessage, res: ServerResponse) => {
    const url = new URL(req.url || '/', 'http://localhost')

    if (req.method === 'OPTIONS') {
      res.writeHead(204, CORS)
      res.end()
      return
    }
    if (req.method !== 'GET') {
      json(res, 405, { error: 'method not allowed' })
      return
    }

    // 瓦片反代优先：它是唯一会 await 的路由，且自带 404 之外的全部错误码
    if (tiles && url.pathname.startsWith('/tiles/')) {
      tiles.handle(req, res).then((handled) => {
        if (!handled) json(res, 404, { error: 'not found' })
      }).catch((err) => {
        res.writeHead(500, { 'cache-control': 'no-store' })
        res.end(String(err instanceof Error ? err.message : err))
      })
      return
    }

    if (url.pathname === '/api/health') {
      json(res, 200, {
        ok: true,
        now: Date.now(),
        startedAt: state.startedAt,
        count: store.count(),
        range: store.timeRange(),
        lastSyncAt: state.lastSyncAt,
        lastError: state.lastError,
        nextDailySyncAt: state.nextDailyAt(),
        usgsBase: state.usgsBase,
      })
      return
    }

    if (url.pathname === '/api/quakes') {
      const since = Number(url.searchParams.get('since') || 0)
      const limit = Math.min(Number(url.searchParams.get('limit') || 200) || 200, 1000)
      const events = since > 0 ? store.since(since, limit) : store.latest(limit)
      json(res, 200, { generatedAt: Date.now(), source: 'usgs', events })
      return
    }

    json(res, 404, { error: 'not found' })
  })
}
