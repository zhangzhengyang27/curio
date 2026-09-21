import { pathToFileURL } from 'node:url'
import { loadConfig } from './config.ts'
import { openStore } from './db.ts'
import { createApiServer } from './http.ts'
import type { ApiState } from './http.ts'
import { startScheduler } from './schedule.ts'
import { syncFeed } from './usgs.ts'

export function startQuakeServer(config = loadConfig()) {
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

  const server = createApiServer(store, state)
  server.listen(config.port, config.host, () => {
    console.log(`[quake] 监听 ${config.host}:${config.port}，USGS=${config.usgsBase}，db=${config.dbPath}`)
  })
  // 启动即拉一次，别让前端首屏等满一个轮询周期
  void poll()

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
