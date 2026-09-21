import test from 'node:test'
import assert from 'node:assert/strict'
import { createServer } from 'node:http'
import type { AddressInfo } from 'node:net'
import { openStore } from '../src/db.ts'
import { createApiServer } from '../src/http.ts'
import type { ApiState } from '../src/http.ts'
import { syncFeed } from '../src/usgs.ts'

const FEED = {
  type: 'FeatureCollection',
  features: [
    {
      id: 'us-a',
      properties: { mag: 5.1, place: 'A', time: 2_000_000, alert: null, type: 'earthquake', url: 'u-a' },
      geometry: { type: 'Point', coordinates: [100, 30, 10] },
    },
    {
      id: 'us-b',
      properties: { mag: 2.6, place: 'B', time: 1_000_000, alert: null, type: 'earthquake', url: 'u-b' },
      geometry: { type: 'Point', coordinates: [101, 31, 20] },
    },
    {
      id: 'us-noise',
      properties: { mag: 4, place: 'N', time: 1_500_000, alert: null, type: 'quarry blast', url: 'u-n' },
      geometry: { type: 'Point', coordinates: [102, 32, 30] },
    },
  ],
}

async function getJson<T>(url: string): Promise<T> {
  return (await (await fetch(url)).json()) as T
}

async function withStubUsgs(run: (base: string) => Promise<void>): Promise<void> {
  const stub = createServer((req, res) => {
    if (req.url?.includes('/summary/2.5_day.geojson') || req.url?.includes('/summary/2.5_week.geojson')) {
      res.writeHead(200, { 'content-type': 'application/json' })
      res.end(JSON.stringify(FEED))
      return
    }
    res.writeHead(404)
    res.end()
  })
  await new Promise<void>((r) => stub.listen(0, r))
  const base = `http://127.0.0.1:${(stub.address() as AddressInfo).port}`
  try {
    await run(base)
  } finally {
    stub.close()
  }
}

test('同步 + API：落库过滤噪声、增量查询与 health 元信息', async () => {
  await withStubUsgs(async (base) => {
    const store = openStore(':memory:')
    const written = await syncFeed(store, base, '2.5_day')
    assert.equal(written, 2) // quarry blast 被丢弃
    assert.equal(store.count(), 2)

    const state: ApiState = {
      startedAt: 0,
      lastSyncAt: 123,
      lastError: null,
      usgsBase: base,
      nextDailyAt: () => 456,
    }
    const server = createApiServer(store, state)
    await new Promise<void>((r) => server.listen(0, r))
    const port = (server.address() as AddressInfo).port

    const all = await getJson<{ events: { id: string }[] }>(`http://127.0.0.1:${port}/api/quakes`)
    assert.equal(all.events.length, 2)
    assert.equal(all.events[0].id, 'us-a') // time DESC

    const inc = await getJson<{ events: { id: string }[] }>(`http://127.0.0.1:${port}/api/quakes?since=1500000`)
    assert.deepEqual(inc.events.map((e) => e.id), ['us-a'])

    const health = await getJson<{ count: number; lastSyncAt: number; nextDailySyncAt: number }>(
      `http://127.0.0.1:${port}/api/health`
    )
    assert.equal(health.count, 2)
    assert.equal(health.lastSyncAt, 123)
    assert.equal(health.nextDailySyncAt, 456)

    const missing = await fetch(`http://127.0.0.1:${port}/api/nope`)
    assert.equal(missing.status, 404)

    server.close()
    store.close()
  })
})

test('USGS 不可达时 syncFeed 抛错（调用方据此保留旧数据降级）', async () => {
  const store = openStore(':memory:')
  await assert.rejects(() => syncFeed(store, 'http://127.0.0.1:1', '2.5_day'))
  store.close()
})
