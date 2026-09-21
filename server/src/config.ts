import { fileURLToPath } from 'node:url'

export interface ServerConfig {
  host: string
  port: number
  usgsBase: string
  dbPath: string
  pollMs: number
  dailyHour: number
  dailyTz: string
  retainDays: number
}

/**
 * 全部走 env + 相对本文件的推导（AGENTS.md R5：不写死本机绝对路径）。
 * QUAKE_USGS_BASE 可指向本地 stub，集成测试靠它断网跑。
 * 默认只监听 127.0.0.1：静态站由 nginx 反代 /api 同源化，不需要把端口暴露到局域网。
 */
export function loadConfig(env: NodeJS.ProcessEnv = process.env): ServerConfig {
  return {
    host: env.QUAKE_HOST || '127.0.0.1',
    port: Number(env.PORT || 8787),
    usgsBase: (env.QUAKE_USGS_BASE || 'https://earthquake.usgs.gov').replace(/\/$/, ''),
    dbPath: env.QUAKE_DB || fileURLToPath(new URL('../data/quakes.db', import.meta.url)),
    pollMs: Number(env.QUAKE_POLL_MS || 5 * 60_000),
    dailyHour: Number(env.QUAKE_DAILY_HOUR ?? 2),
    dailyTz: env.QUAKE_DAILY_TZ || 'Asia/Shanghai',
    retainDays: Number(env.QUAKE_RETAIN_DAYS || 7),
  }
}
