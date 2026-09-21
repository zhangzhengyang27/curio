import type { IncomingMessage, ServerResponse } from 'node:http'
import { mkdir, readFile, stat, writeFile, readdir, unlink, rename } from 'node:fs/promises'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

/**
 * 天地图瓦片反向代理 + 磁盘缓存。
 *
 * 为什么要有这一层（2026-09-21 实测结论）：
 * - 天地图 t0~t7 全部只有 HTTP/1.1 且解析到同一 IP，浏览器对单主机的 6 连接是硬上限；
 *   而单张瓦片 p50 113~225ms、p95 937ms。跨境直连的延迟与限流全部摊在用户首屏上。
 * - 浏览器端 key 的 tk 必须在 URL 里，于是「多 key 分摊配额」和「URL 稳定可缓存」
 *   天然冲突（tk 一变，同一张瓦片就是另一个缓存键）。
 *   走反代后浏览器看到的是同源、不含 tk 的稳定 URL，key 只存在于服务端。
 *
 * ⚠ 天地图「浏览器端」key 会拒绝非浏览器 UA（实测 node 默认 UA → 403，
 * 带 Chrome UA + Referer → 200）。所以这一层必须伪装浏览器请求头，
 * 而不是天真地用 fetch 默认头。
 *
 * ⚠ 已知无法识别的情况：天地图的「无影像」带字占位图（4769B）与限流响应体（3224B）
 * 都是合法 PNG/JPEG，按状态码和类型看不出来。这里只按 D3 记录过的特征体积
 * 拒绝入缓存（下次还会重取），但仍然原样返回——分辨真伪交给像素分析，超出本层职责。
 */

/** 允许代理的图层白名单：路径解析不出这个集合之外的值，SSRF/路径穿越由构造排除 */
const LAYERS = {
  vec: { matrixSet: 'vec_w', layer: 'vec', ext: 'png', mime: 'image/png' },
  cva: { matrixSet: 'cva_w', layer: 'cva', ext: 'png', mime: 'image/png' },
  img: { matrixSet: 'img_w', layer: 'img', ext: 'jpg', mime: 'image/jpeg' },
  cia: { matrixSet: 'cia_w', layer: 'cia', ext: 'png', mime: 'image/png' },
} as const

export type TileLayer = keyof typeof LAYERS

export interface TileConfig {
  /** 上游基址（不含子域名段），测试指向本地 stub */
  upstreamBase: string
  /** 天地图子域名池，多子域名可放大浏览器侧并发，但会成倍提高上游并发 */
  subdomains: string[]
  keys: string[]
  cacheDir: string
  /** 与上游 `cache-control: max-age=432000`（5 天）对齐 */
  ttlMs: number
  /** 上游并发上限：这是真正保护配额的地方，浏览器侧并发不再等于上游并发 */
  upstreamConcurrency: number
  userAgent: string
  referer: string
  /** 缓存条目上限，超过按 mtime 淘汰最旧 */
  maxEntries: number
}

const TILE_PATH_RE = /^\/tiles\/(vec|cva|img|cia)\/(\d{1,2})\/(\d{1,7})\/(\d{1,7})$/

/**
 * D3 记录的占位图特征 —— 只用于「不要把它缓存 5 天」，不用于判真伪。
 *
 * ⚠ 这是启发式，且**已知会误杀**：实测全球视角下有 3 张 vec 瓦片确实是 ≤200B 的
 * 空白图（纯海洋，代理返回与上游逐字节一致），它们会被一并判为「可疑」而不入缓存。
 * 两种错误的代价不对等：误杀真图 = 下次重取一张约 100B 的瓦片；
 * 漏判占位 = 一张米白/带字占位被缓存 5 天，用户侧就是「地图坏了且修不好」。宁可误杀。
 * 因此 `/tiles/health` 的 `placeholders` 读作「可疑而未缓存」，不是「坏了 N 张」。
 *
 * 分层规则的依据：
 * - vec 的「素色占位」实测 103B，与空白真图同量级 → 只能用 ≤200B 这个区间；
 * - img 的「带字无影像占位」实测 4769B，且只出现在低层级（L6 起才是纯净卫星图）
 *   → 精确匹配 + 层级限定，真卫星瓦片恰好 4769B 的概率极低。
 * - 曾按 3224B 匹配限流响应体，实测那是 `tk=undefined` 的错误请求所致，
 *   本层始终带真 key，故移除该规则。
 */
function looksLikePlaceholder(layer: TileLayer, z: number, bytes: number): boolean {
  if (layer === 'img' && z <= 5 && bytes === 4769) return true
  return bytes <= 200
}
const DEFAULT_UA =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36'

export function loadTileConfig(env: NodeJS.ProcessEnv = process.env): TileConfig {
  const keys = (env.TDT_TOKEN || env.VITE_TDT_TOKEN || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
  return {
    upstreamBase: (env.TILE_UPSTREAM_BASE || 'https://t{s}.tianditu.gov.cn').replace(/\/$/, ''),
    subdomains: (env.TILE_SUBDOMAINS || '0,1,2,3').split(',').map((s) => s.trim()).filter(Boolean),
    keys,
    cacheDir: env.TILE_CACHE_DIR || fileURLToPath(new URL('../data/tile-cache', import.meta.url)),
    ttlMs: Number(env.TILE_CACHE_TTL_MS || 5 * 86_400_000),
    // 上游并发 8：实测（本机 → t0，冷缓存，一片全新海域一屏）
    //   4 并发 → 补齐 3.16s、单张 p50 331ms
    //   8 并发 → 补齐 2.31s、单张 p50 265ms（与直连的 2.19s 基本打平）
    // 命中缓存时同场景单张 p50 7.2ms。
    // 安全性：141 次上游请求 0 占位 0 错误；此前浏览器侧直连实测单主机 8 并发
    // （同一 key）与 16 并发（轮转 5 key）也全部返回真图。再往上调要重跑占位反验。
    upstreamConcurrency: Number(env.TILE_UPSTREAM_CONCURRENCY || 8),
    userAgent: env.TILE_UPSTREAM_UA || DEFAULT_UA,
    referer: env.TILE_UPSTREAM_REFERER || 'https://localhost/',
    maxEntries: Number(env.TILE_CACHE_MAX_ENTRIES || 20_000),
  }
}

export function tileProxyEnabled(cfg: TileConfig): boolean {
  return cfg.keys.length > 0
}

interface ParsedTile {
  layer: TileLayer
  z: number
  x: number
  y: number
}

/** 解析请求路径；任何不符合白名单形状的输入一律返回 null（调用方走 404） */
export function parseTilePath(pathname: string): ParsedTile | null {
  const m = TILE_PATH_RE.exec(pathname)
  if (!m) return null
  const z = Number(m[2])
  const x = Number(m[3])
  const y = Number(m[4])
  // 天地图 w 矩阵集是 Web 墨卡托，2^z × 2^z；越界直接拒，避免给上游造无意义请求
  const max = 1 << z
  if (z > 22 || x < 0 || y < 0 || x >= max || y >= max) return null
  return { layer: m[1] as TileLayer, z, x, y }
}

function cacheKeyOf(tile: ParsedTile): string {
  return join(tile.layer, String(tile.z), String(tile.x), String(tile.y))
}

function upstreamUrlOf(cfg: TileConfig, tile: ParsedTile, s: number, key: string): string {
  const conf = LAYERS[tile.layer]
  const base = cfg.upstreamBase.replace('{s}', String(cfg.subdomains[s % cfg.subdomains.length]))
  return (
    `${base}/${conf.matrixSet}/wmts?service=WMTS&version=1.0.0&request=GetTile` +
    `&tilematrix=${tile.z}&tilerow=${tile.y}&tilecol=${tile.x}` +
    `&tilematrixset=w&layer=${conf.layer}&style=default&format=tiles&tk=${key}`
  )
}

/** 简易信号量：上游并发是唯一需要限流的地方，浏览器侧并发不再直接打到天地图 */
function createLimiter(limit: number) {
  let active = 0
  const waiting: (() => void)[] = []
  return async function run<T>(fn: () => Promise<T>): Promise<T> {
    if (active >= limit) await new Promise<void>((r) => waiting.push(r))
    active++
    try {
      return await fn()
    } finally {
      active--
      waiting.shift()?.()
    }
  }
}

export interface TileMetrics {
  hits: number
  misses: number
  upstreamErrors: number
  placeholders: number
}

export interface TileHandler {
  /** 返回 true 表示本处理器已接管该请求 */
  handle: (req: IncomingMessage, res: ServerResponse) => Promise<boolean>
  metrics: TileMetrics
  sweep: () => Promise<number>
}

export function createTileHandler(cfg: TileConfig): TileHandler {
  const limit = createLimiter(cfg.upstreamConcurrency)
  let keyCursor = 0
  const metrics: TileMetrics = { hits: 0, misses: 0, upstreamErrors: 0, placeholders: 0 }

  async function readCache(file: string): Promise<{ buf: Buffer; mtimeMs: number } | null> {
    try {
      const st = await stat(file)
      const buf = await readFile(file)
      return { buf, mtimeMs: st.mtimeMs }
    } catch {
      return null
    }
  }

  async function fetchUpstream(tile: ParsedTile): Promise<{ buf: Buffer; mime: string } | null> {
    const key = cfg.keys[keyCursor++ % cfg.keys.length]
    const s = (tile.x + tile.y) % cfg.subdomains.length
    const url = upstreamUrlOf(cfg, tile, s, key)
    try {
      const res = await limit(() =>
        fetch(url, { headers: { 'user-agent': cfg.userAgent, referer: cfg.referer }, cache: 'no-store' })
      )
      if (!res.ok) {
        metrics.upstreamErrors++
        return null
      }
      const buf = Buffer.from(await res.arrayBuffer())
      if (buf.byteLength < 64) {
        metrics.upstreamErrors++
        return null
      }
      return { buf, mime: res.headers.get('content-type') || LAYERS[tile.layer].mime }
    } catch {
      metrics.upstreamErrors++
      return null
    }
  }

  async function handle(req: IncomingMessage, res: ServerResponse): Promise<boolean> {
    const pathname = (req.url || '').split('?')[0]
    if (pathname === '/tiles/health') {
      res.writeHead(200, { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' })
      res.end(JSON.stringify({ ok: true, enabled: tileProxyEnabled(cfg), ...metrics }))
      return true
    }
    const tile = parseTilePath(pathname)
    if (!tile) return false
    if (!tileProxyEnabled(cfg)) {
      res.writeHead(503, { 'cache-control': 'no-store' })
      res.end('tile proxy disabled: no TDT_TOKEN configured')
      return true
    }

    const conf = LAYERS[tile.layer]
    const file = join(cfg.cacheDir, cacheKeyOf(tile))
    const cached = await readCache(file)
    if (cached && Date.now() - cached.mtimeMs < cfg.ttlMs) {
      metrics.hits++
      res.writeHead(200, {
        'content-type': conf.mime,
        'cache-control': 'public, max-age=432000',
        'x-tile-cache': 'hit',
      })
      res.end(cached.buf)
      return true
    }

    metrics.misses++
    const fetched = await fetchUpstream(tile)
    if (!fetched) {
      // 上游失败：宁可能力降级露 baseColor，也不缓存一个坏结果
      res.writeHead(502, { 'cache-control': 'no-store', 'x-tile-cache': 'upstream-error' })
      res.end()
      return true
    }
    if (looksLikePlaceholder(tile.layer, tile.z, fetched.buf.byteLength)) {
      metrics.placeholders++
      res.writeHead(200, {
        'content-type': conf.mime,
        'cache-control': 'no-store',
        'x-tile-cache': 'placeholder',
      })
      res.end(fetched.buf)
      return true
    }

    try {
      await mkdir(dirname(file), { recursive: true })
      // 先写临时名再 rename：并发请求同一张瓦片时不会读到半个文件
      const tmp = `${file}.${process.pid}.${Math.random().toString(36).slice(2)}.tmp`
      await writeFile(tmp, fetched.buf)
      await rename(tmp, file)
    } catch {
      // 缓存写失败不影响本次响应，下次重取即可
    }
    res.writeHead(200, {
      'content-type': conf.mime,
      'cache-control': 'public, max-age=432000',
      'x-tile-cache': 'miss',
    })
    res.end(fetched.buf)
    return true
  }

  /** 按 mtime 淘汰最旧条目，返回删除数量 */
  async function sweep(): Promise<number> {
    const entries: { path: string; mtimeMs: number }[] = []
    async function walk(dir: string): Promise<void> {
      let names: string[]
      try {
        names = await readdir(dir, { withFileTypes: false })
      } catch {
        return
      }
      for (const name of names) {
        const p = join(dir, name)
        try {
          const st = await stat(p)
          if (st.isDirectory()) await walk(p)
          else if (st.isFile()) entries.push({ path: p, mtimeMs: st.mtimeMs })
        } catch {
          /* 竞态删除，忽略 */
        }
      }
    }
    await walk(resolve(cfg.cacheDir))
    if (entries.length <= cfg.maxEntries) return 0
    entries.sort((a, b) => a.mtimeMs - b.mtimeMs)
    const doomed = entries.slice(0, entries.length - Math.floor(cfg.maxEntries * 0.8))
    for (const e of doomed) await unlink(e.path).catch(() => {})
    return doomed.length
  }

  return { handle, metrics, sweep }
}
