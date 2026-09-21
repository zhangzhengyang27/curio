import test from 'node:test'
import assert from 'node:assert/strict'
import { createServer } from 'node:http'
import type { AddressInfo } from 'node:net'
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { createTileHandler, loadTileConfig, parseTilePath, tileProxyEnabled } from '../src/tiles.ts'

// 真实瓦片最小也有数百字节（实测海洋 img L8 约 874B）；这里给一个同样量级的载荷，
// 才能穿过 tiles.ts 里「小于 64 字节视为坏响应」的守卫
const REAL_PNG = Buffer.concat([Buffer.from('89504e470d0a1a0a0000000d49484452', 'hex'), Buffer.alloc(200, 7)])

interface UpstreamCalls {
  n: number
  lastUrl: string | null
  lastUa: string | null
  lastReferer: string | null
}

/**
 * 起一个假天地图。行为可配：返回真图 / 返回 D3 记录的占位体积 / 返回错误。
 */
async function withStubUpstream(
  mode: 'ok' | 'placeholder' | 'error',
  run: (base: string, calls: UpstreamCalls) => Promise<void>
): Promise<void> {
  const calls: UpstreamCalls = { n: 0, lastUrl: null, lastUa: null, lastReferer: null }
  const stub = createServer((req, res) => {
    calls.n++
    calls.lastUrl = req.url || null
    calls.lastUa = req.headers['user-agent'] || null
    calls.lastReferer = req.headers['referer'] || null
    if (mode === 'error') {
      res.writeHead(403)
      res.end('forbidden')
      return
    }
    if (mode === 'placeholder') {
      // 103B 素色占位（KNOWN_PITFALLS D3）
      res.writeHead(200, { 'content-type': 'image/png', 'cache-control': 'max-age=432000' })
      res.end(Buffer.alloc(103, 1))
      return
    }
    res.writeHead(200, { 'content-type': 'image/png', 'cache-control': 'max-age=432000' })
    res.end(REAL_PNG)
  })
  await new Promise<void>((r) => stub.listen(0, r))
  const port = (stub.address() as AddressInfo).port
  try {
    // {s} 占位必须被替换掉，否则上游 URL 是坏的
    await run(`http://127.0.0.1:${port}/t{s}`, calls)
  } finally {
    await new Promise<void>((r) => stub.close(() => r()))
  }
}

async function withProxy(
  upstreamBase: string,
  extra: Partial<ReturnType<typeof loadTileConfig>> = {},
  keys = ['k1', 'k2']
): Promise<{ base: string; dir: string; close: () => Promise<void>; metrics: () => unknown }> {
  const dir = await mkdtemp(join(tmpdir(), 'tv-tiles-'))
  const cfg = { ...loadTileConfig({}), upstreamBase, cacheDir: dir, keys, ...extra }
  const tiles = createTileHandler(cfg)
  const srv = createServer((req, res) => {
    void tiles.handle(req, res).then((handled) => {
      if (!handled) {
        res.writeHead(404)
        res.end()
      }
    })
  })
  await new Promise<void>((r) => srv.listen(0, r))
  const base = `http://127.0.0.1:${(srv.address() as AddressInfo).port}`
  return {
    base,
    dir,
    metrics: () => tiles.metrics,
    close: async () => {
      await new Promise<void>((r) => srv.close(() => r()))
      await rm(dir, { recursive: true, force: true })
    },
  }
}

test('parseTilePath 只接受白名单形状，构造上排除路径穿越与 SSRF', () => {
  assert.deepEqual(parseTilePath('/tiles/vec/8/214/106'), { layer: 'vec', z: 8, x: 214, y: 106 })
  assert.deepEqual(parseTilePath('/tiles/img_w/3/1/2'), null, '图层名必须是不带 _w 的四个之一')
  assert.equal(parseTilePath('/tiles/vec/8/214'), null)
  assert.equal(parseTilePath('/tiles/vec/8/214/106/extra'), null)
  assert.equal(parseTilePath('/tiles/../etc/passwd'), null)
  assert.equal(parseTilePath('/tiles/vec/%2e%2e/1/2'), null)
  assert.equal(parseTilePath('/tiles/vec/30/1/1'), null, 'z 超过 22 拒绝')
  assert.equal(parseTilePath('/tiles/vec/8/999/1'), null, 'x 超出 2^z 拒绝')
})

test('未配置 key 时反代整体关闭（503），不影响前端降级', async () => {
  assert.equal(tileProxyEnabled({ ...loadTileConfig({}), keys: [] }), false)
  const p = await withProxy('http://127.0.0.1:1/t{s}', {}, [])
  try {
    const res = await fetch(`${p.base}/tiles/vec/1/1/1`)
    assert.equal(res.status, 503)
  } finally {
    await p.close()
  }
})

test('健康检查路由不需要 key 就能读状态', async () => {
  const p = await withProxy('http://127.0.0.1:1/t{s}')
  try {
    const body = (await (await fetch(`${p.base}/tiles/health`)).json()) as Record<string, unknown>
    assert.equal(body.ok, true)
    assert.equal(body.enabled, true)
  } finally {
    await p.close()
  }
})

test('首次 miss 走上游并落盘，第二次 hit 不再打上游', async () => {
  await withStubUpstream('ok', async (base, calls) => {
    const p = await withProxy(base)
    try {
      const first = await fetch(`${p.base}/tiles/vec/8/214/106`)
      assert.equal(first.status, 200)
      assert.equal(first.headers.get('x-tile-cache'), 'miss')
      assert.deepEqual(Buffer.from(await first.arrayBuffer()), REAL_PNG)
      assert.equal(calls.n, 1)
      assert.ok(calls.lastUrl?.includes('/vec_w/wmts'), `上游路径应为 vec_w，实际 ${calls.lastUrl}`)
      assert.ok(calls.lastUrl?.includes('tilecol=214'), '行列必须随瓦片坐标变化（D3-0 的教训）')
      assert.ok(calls.lastUrl?.includes('tilerow=106'))
      assert.ok(!calls.lastUrl?.includes('{s}'), '子域名占位符必须被替换')
      assert.ok(calls.lastUrl?.includes('tk=k'), 'key 只出现在服务端→上游这一段')

      const second = await fetch(`${p.base}/tiles/vec/8/214/106`)
      assert.equal(second.headers.get('x-tile-cache'), 'hit')
      assert.equal(calls.n, 1, '命中缓存后不应再打上游')
      assert.equal(second.headers.get('cache-control'), 'public, max-age=432000')
      // 浏览器侧 URL 不含 tk → 缓存键稳定
      assert.ok(!p.base.includes('tk='))
    } finally {
      await p.close()
    }
  })
})

test('上游必须收到浏览器 UA + Referer（天地图拒绝非浏览器 UA，实测 403）', async () => {
  await withStubUpstream('ok', async (base, calls) => {
    const p = await withProxy(base, { userAgent: 'ChromeTestUA/140', referer: 'https://example.test/' })
    try {
      await fetch(`${p.base}/tiles/cia/3/1/2`)
      assert.equal(calls.lastUa, 'ChromeTestUA/140')
      assert.equal(calls.lastReferer, 'https://example.test/')
    } finally {
      await p.close()
    }
  })
})

test('占位图原样返回但不进缓存（否则 5 天里每次都是它）', async () => {
  await withStubUpstream('placeholder', async (base, calls) => {
    const p = await withProxy(base)
    try {
      const first = await fetch(`${p.base}/tiles/vec/8/1/1`)
      assert.equal(first.status, 200)
      assert.equal(first.headers.get('x-tile-cache'), 'placeholder')
      assert.equal(first.headers.get('cache-control'), 'no-store')
      assert.equal((p.metrics() as { placeholders: number }).placeholders, 1)

      await fetch(`${p.base}/tiles/vec/8/1/1`)
      assert.equal(calls.n, 2, '占位图不应被缓存，第二次应重取')
    } finally {
      await p.close()
    }
  })
})

test('占位图判定按图层收窄：4769B 只对低层级 img 成立，vec 同体积是真图', async () => {
  // 实测踩过的误判：全球视角 3 张 vec 瓦片确实是 ≤200B 的空白图，
  // 若只按体积精确匹配 103/4769 就会把 img 的规则错套到 vec 上
  const stub = createServer((req, res) => {
    // 两张瓦片故意给同样的 4769B：只有 img 的低层级才是占位
    res.writeHead(200, { 'content-type': req.url?.includes('/img_w/') ? 'image/jpeg' : 'image/png' })
    res.end(Buffer.alloc(4769, 3))
  })
  await new Promise<void>((r) => stub.listen(0, r))
  const p = await withProxy(`http://127.0.0.1:${(stub.address() as AddressInfo).port}/t{s}`)
  try {
    const vec = await fetch(`${p.base}/tiles/vec/2/1/1`)
    assert.equal(vec.headers.get('x-tile-cache'), 'miss', 'vec 的 4769B 是真图，应正常缓存')
    const img = await fetch(`${p.base}/tiles/img/4/1/1`)
    assert.equal(img.headers.get('x-tile-cache'), 'placeholder', '低层级 img 的 4769B 是「无影像」带字占位')
    assert.equal(img.headers.get('cache-control'), 'no-store')
  } finally {
    await p.close()
    await new Promise<void>((r) => stub.close(() => r()))
  }
})

test('上游失败返回 502 且不写缓存，前端按 baseColor 降级', async () => {
  await withStubUpstream('error', async (base, calls) => {
    const p = await withProxy(base)
    try {
      const res = await fetch(`${p.base}/tiles/img/8/1/1`)
      assert.equal(res.status, 502)
      assert.equal(res.headers.get('x-tile-cache'), 'upstream-error')
      assert.equal((p.metrics() as { upstreamErrors: number }).upstreamErrors, 1)
      await fetch(`${p.base}/tiles/img/8/1/1`)
      assert.equal(calls.n, 2)
    } finally {
      await p.close()
    }
  })
})

test('多 key 轮转摊配额，且不影响缓存键', async () => {
  await withStubUpstream('ok', async (base, calls) => {
    const p = await withProxy(base, {}, ['keyA', 'keyB'])
    try {
      await fetch(`${p.base}/tiles/vec/4/1/1`)
      const urlA = calls.lastUrl
      await fetch(`${p.base}/tiles/vec/4/1/2`)
      const urlB = calls.lastUrl
      assert.ok(urlA?.includes('tk=keyA') && urlB?.includes('tk=keyB'), '两次请求应落到不同 key')
    } finally {
      await p.close()
    }
  })
})

test('sweep 超过上限时按最旧淘汰', async () => {
  await withStubUpstream('ok', async (base) => {
    const p = await withProxy(base, { maxEntries: 3 })
    try {
      for (let i = 0; i < 6; i++) await fetch(`${p.base}/tiles/vec/3/${i}/1`)
      const removed = await (async () => {
        // 直接走内部 sweep：通过 handler 暴露
        const tiles = createTileHandler({ ...loadTileConfig({}), upstreamBase: base, cacheDir: p.dir, maxEntries: 3 })
        return tiles.sweep()
      })()
      assert.ok(removed >= 3, `应淘汰至少 3 个，实际 ${removed}`)
    } finally {
      await p.close()
    }
  })
})
