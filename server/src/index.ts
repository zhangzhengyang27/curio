import { pathToFileURL } from 'node:url'
import { loadConfig } from './config.ts'
import { openStore } from './db.ts'
import { createApiServer } from './http.ts'
import type { ApiState } from './http.ts'
import { startScheduler } from './schedule.ts'
import { syncFeed } from './usgs.ts'
import { createTileHandler, loadTileConfig, tileProxyEnabled } from './tiles.ts'
import { applyEnvFile } from './envfile.ts'
import type { ServerConfig } from './config.ts'

export function startQuakeServer(configOverride?: ServerConfig) {
  // 必须先于 loadConfig：天地图 key 与 DB 路径都从 .env.local 兜底读入
  applyEnvFile()
  const config = configOverride || loadConfig()
  const tileConfig = loadTileConfig()
  const tiles = createTileHandler(tileConfig)
  const store = openStore(config.dbPath)
  const state: ApiState = {
    startedAt: Date.now(),
    lastSyncAt: null,
    lastError: null,
    usgsBase: config.usgsBase,
    nextDailyAt: () => 0,
  }

  const markSync = (err: unknown): void => {
    if (err) {
      state.lastError = err instanceof Error ? err.message : String(err)
      console.warn('[quake] 同步失败，继续服务库内旧数据:', state.lastError)
    } else {
      state.lastSyncAt = Date.now()
      state.lastError = null
    }
  }

  const poll = async (): Promise<void> => {
    try {
      await syncFeed(store, config.usgsBase, '2.5_day')
      markSync(null)
    } catch (err) {
      markSync(err)
    }
  }
  const daily = async (): Promise<void> => {
    try {
      // 全量重同步补增量窗口漏掉的事件，再裁掉保留期外的旧数据
      await syncFeed(store, config.usgsBase, '2.5_week')
      const pruned = store.prune(Date.now() - config.retainDays * 86_400_000)
      console.log(`[quake] 每日全量同步完成，裁剪 ${pruned} 条过期事件`)
      markSync(null)
    } catch (err) {
      markSync(err)
    }
  }

  const scheduler = startScheduler({
    pollMs: config.pollMs,
    dailyHour: config.dailyHour,
    dailyTz: config.dailyTz,
    onPoll: poll,
    onDaily: daily,
  })
  state.nextDailyAt = scheduler.nextDailyAt

  const server = createApiServer(store, state, tiles)
  server.listen(config.port, config.host, () => {
    console.log(`[quake] 监听 ${config.host}:${config.port}，USGS=${config.usgsBase}，db=${config.dbPath}`)
    console.log(
      tileProxyEnabled(tileConfig)
        ? `[tiles] 天地图反代已启用：/tiles/{vec|cva|img|cia}/{z}/{x}/{y}，上游并发 ${tileConfig.upstreamConcurrency}，缓存 ${tileConfig.cacheDir}`
        : '[tiles] 未配置 TDT_TOKEN，瓦片反代关闭（前端将直连天地图）'
    )
  })
  // 启动即拉一次，别让前端首屏等满一个轮询周期
  void poll()
  // 缓存淘汰：启动清一次，之后每小时一次（sweep 只 stat 不读内容，2 万条目内是毫秒级）
  void tiles.sweep().catch(() => {})
  const sweepTimer = setInterval(() => void tiles.sweep().catch(() => {}), 3_600_000)
  sweepTimer.unref()

  const shutdown = (): void => {
    scheduler.stop()
    server.close()
    store.close()
  }
  process.once('SIGINT', shutdown)
  process.once('SIGTERM', shutdown)

  return { server, store, state, scheduler, shutdown }
}

const isEntry = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href
if (isEntry) startQuakeServer()
