import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

/**
 * 零依赖的 .env.local 加载器。
 *
 * 为什么需要：AGENTS.md R4 要求「凭据只写 .env.local」，而 server/ 是独立进程、
 * 不经 vite 的 env 注入。没有这一层的话，天地图 key 只能靠 `TDT_TOKEN=xxx npm run dev:server`
 * 传 —— 那会把凭据写进 shell 历史与父进程环境，正是 R4 要避免的形态。
 *
 * 路径按 R5 从本文件推导（仓库根 = server/src 的上两级），不写死任何机器上的绝对路径。
 * 已存在于 process.env 的变量**不覆盖**：显式传的环境变量优先，CI 可控。
 */
const ENV_FILE = fileURLToPath(new URL('../../.env.local', import.meta.url))

export function parseEnvFile(text: string): Record<string, string> {
  const out: Record<string, string> = {}
  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim()
    if (!line || line.startsWith('#')) continue
    const eq = line.indexOf('=')
    if (eq <= 0) continue
    const key = line.slice(0, eq).trim()
    let value = line.slice(eq + 1).trim()
    // 去掉成对的首尾引号；未加引号时保留行内 # 之后的内容（与 dotenv 的宽松行为一致即可）
    if (value.length > 1 && /^(".*"|'.*')$/.test(value)) value = value.slice(1, -1)
    out[key] = value
  }
  return out
}

/** 读取并合并 .env.local；文件不存在（CI / 新克隆）时静默返回已加载的键名 */
export function applyEnvFile(path = ENV_FILE): string[] {
  let text: string
  try {
    text = readFileSync(path, 'utf8')
  } catch {
    return []
  }
  const parsed = parseEnvFile(text)
  const applied: string[] = []
  for (const [key, value] of Object.entries(parsed)) {
    if (process.env[key] === undefined) {
      process.env[key] = value
      applied.push(key)
    }
  }
  return applied
}
