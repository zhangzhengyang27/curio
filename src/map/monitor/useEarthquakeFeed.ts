import { ref, computed, onUnmounted } from 'vue'
import type { Ref, ComputedRef } from 'vue'
import { pullInitial, pullNew } from './quakeSource.ts'
import type { RawQuake, QuakeSourceMode } from './quakeSource.ts'

export type QuakeStatus = 'open' | 'processing' | 'resolved'
export type QuakeLevel = 'critical' | 'major' | 'normal'

export interface QuakeEvent {
  /** USGS 事件 id（合成演练事件为 sim-* 前缀）——跨天稳定，处置持久化以它为键 */
  id: string
  lon: number
  lat: number
  mag: number
  depth: number
  /** 发震时刻（毫秒） */
  time: number
  place: string
  url: string
  level: QuakeLevel
  status: QuakeStatus
  arrived: boolean
}

/**
 * 地震应急监测的数据流层。
 *
 * 事件源：server/ 后端（USGS feed 的 SQLite 缓存 + 增量 API）；后端不可达时
 * 退打包快照 public/data/quake-snapshot.json（见 quakeSource.ts）。
 * 「实时推送」= 每 streamIntervalMs 轮询一次增量，新出现的事件即新到达。
 *
 * 处置状态持久化（K1）：非默认状态以 { eventId: status } 存 localStorage
 * （tv-monitor-status-v2）。键是 USGS 字符串 id；v1 用数组下标做键，
 * 数据源换成活数据后下标会漂移，故换键并整体作废旧记录。
 */

const STATUS_KEY = 'cu-monitor-status-v2'
/** 2026-09-30 M4 前的旧键;首次读取时一次性迁移 */
const LEGACY_STATUS = 'tv-monitor-status-v2';

function readStorage(): string | null {
  try {
    const cur = localStorage.getItem(STATUS_KEY);
    if (cur !== null) return cur
    const legacy = localStorage.getItem(LEGACY_STATUS);
    if (legacy !== null) {
      localStorage.setItem(STATUS_KEY, legacy)
      localStorage.removeItem(LEGACY_STATUS)
    }
    return legacy
  } catch { return null }
}

function loadPersistedStatus(): Record<string, QuakeStatus> {
  try {
    const raw = JSON.parse(readStorage() as string)
    return raw && typeof raw === 'object' ? raw : {}
  } catch {
    return {}
  }
}

function persistStatus(events: QuakeEvent[]): void {
  const map: Record<string, QuakeStatus> = {}
  for (const e of events) {
    if (e.status !== 'open') map[e.id] = e.status
  }
  // 写侧要包：隐私模式/配额满时 setItem 会抛，而调用方此刻已经改过 e.status——
  // 不包会让「改状态」成功、「刷新地图标记」被中断，列表徽标与地图颜色从此脱钩。
  try {
    localStorage.setItem(STATUS_KEY, JSON.stringify(map))
  } catch { /* 忽略：无法持久化不影响本次会话内的处置流转 */ }
}

export const LEVELS: Record<QuakeLevel, { label: string; color: string }> = {
  critical: { label: '重大', color: '#e53935' }, // mag ≥ 阈值(默认 7,UI 可调 K2)
  major: { label: '较大', color: '#fb8c00' }, // 5 ≤ mag < 阈值
  normal: { label: '一般', color: '#fbc02d' }, // mag < 5
}

export const STATUS_LABEL: Record<QuakeStatus, string> = { open: '未处理', processing: '处理中', resolved: '已处置' }

/** 按阈值分级(K2):critical = mag ≥ threshold;major = 5 ≤ mag < threshold */
export function levelOf(mag: number, threshold = 7): QuakeLevel {
  if (mag >= threshold) return 'critical'
  if (mag >= 5) return 'major'
  return 'normal'
}

export function formatQuakeTime(time: number, withYear = false): string {
  const d = new Date(time)
  const p = (n: number) => String(n).padStart(2, '0')
  const ymd = withYear ? `${d.getFullYear()}-` : ''
  return `${ymd}${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`
}

/** USGS 对整级震级只给 `5`，与 `4.7` 混排不齐；显示统一一位小数 */
export function formatMag(mag: number): string {
  return mag.toFixed(1)
}

export function useEarthquakeFeed({ initialCount = 10, streamIntervalMs = 30_000 }: { initialCount?: number; streamIntervalMs?: number } = {}): {
  events: Ref<QuakeEvent[]>
  feed: Ref<string[]>
  arrivedEvents: ComputedRef<QuakeEvent[]>
  stats: ComputedRef<Record<QuakeStatus | 'critical', number>>
  threshold: Ref<number>
  setThreshold(t: number): number
  /** 自动推送（增量轮询）是否在跑——单一事实源，视图层不得再镜像一份 */
  streaming: Ref<boolean>
  replaying: Ref<boolean>
  sourceMode: Ref<QuakeSourceMode>
  sourceUpdatedAt: Ref<number>
  /** 最近一次轮询失败（链路中断但仍在用库内/快照数据） */
  sourceDegraded: Ref<boolean>
  startReplay(onEach: (e: QuakeEvent) => void, intervalMs?: number): void
  stopReplay(): void
  load(): Promise<void>
  injectSimEvent(): QuakeEvent
  startStream(): void
  stopStream(): void
  setStatus(id: string, status: QuakeStatus): void
  resetDrill(): void
} {
  const events = ref<QuakeEvent[]>([]) // 已加载的全部事件
  const feed = ref<string[]>([]) // 已到达的事件 id，按到达顺序，新的在前
  const threshold = ref(7) // 重大阈值(K2),UI 可调
  const streaming = ref(false)
  const sourceMode = ref<QuakeSourceMode>('live')
  const sourceUpdatedAt = ref(0)
  const sourceDegraded = ref(false)
  let streamTimer: ReturnType<typeof setInterval> | null = null
  let replayTimer: ReturnType<typeof setTimeout> | null = null // 时间回放计时器(K4)
  let replaySnapshot: string[] | null = null // 回放前的 feed 快照，退出回放时恢复
  let simSeq = 0

  const arrivedEvents = computed(() => {
    const byId = new Map(events.value.map((e) => [e.id, e]))
    const list = feed.value.map((id) => byId.get(id)).filter((e): e is QuakeEvent => Boolean(e))
    // 重大事件列顶(K2),其余按到达顺序
    return [...list.filter((e) => e.level === 'critical'), ...list.filter((e) => e.level !== 'critical')]
  })

  const stats = computed(() => {
    const s: Record<QuakeStatus | 'critical', number> = { open: 0, processing: 0, resolved: 0, critical: 0 }
    for (const e of arrivedEvents.value) {
      s[e.status]++
      if (e.status !== 'resolved' && e.level === 'critical') s.critical++
    }
    return s
  })

  /** 调整重大阈值并全量重算分级(K2)。粒度 0.5，与输入框 step 一致，不静默取整 */
  function setThreshold(t: number): number {
    const v = Math.min(9, Math.max(4, Math.round((Number(t) || 7) * 2) / 2))
    threshold.value = v
    for (const e of events.value) {
      e.level = levelOf(e.mag, v)
    }
    return v
  }

  function toEvent(r: RawQuake, persisted: Record<string, QuakeStatus>): QuakeEvent {
    // USGS 会给出两位小数震级（M3.61），列表/标记/字幕/详情四处显示统一收成一位；
    // 分级也按同一值算，避免「显示 7.0 / 判级用 6.96」的错位
    const mag = Math.round(r.mag * 10) / 10
    return {
      id: r.id,
      lon: r.lon,
      lat: r.lat,
      mag,
      depth: r.depth,
      time: r.time,
      place: r.place,
      url: r.url,
      level: levelOf(mag, threshold.value),
      status: persisted[r.id] || 'open',
      arrived: false,
    }
  }

  async function load(): Promise<void> {
    const pull = await pullInitial()
    sourceMode.value = pull.mode
    sourceUpdatedAt.value = pull.generatedAt
    sourceDegraded.value = false
    const persisted = loadPersistedStatus()
    // 按发震时刻降序 = 「最新事件」在前
    events.value = [...pull.events]
      .sort((a, b) => b.time - a.time)
      .map((r) => toEvent(r, persisted))
    revealInitialBatch()
  }

  /**
   * 放行初始批次里第 pooledIndex 个未到达事件。
   * revealAt 是头插，首屏要「新的在前」就得倒序放行（先放批次里最旧的）。
   */
  function revealAt(pooledIndex: number): boolean {
    const pool = events.value.filter((e) => !e.arrived)
    const e = pool[Math.min(pooledIndex, pool.length - 1)]
    if (!e) return false
    e.arrived = true
    feed.value = [e.id, ...feed.value]
    return true
  }

  function revealInitialBatch(): void {
    for (let k = Math.min(initialCount, events.value.length) - 1; k >= 0; k--) revealAt(k)
  }

  /** 注入一条合成事件（演示/测试用）；place 明确标注非真实数据。
   *  id 用自增序号而非时间戳，测试才能稳定定位 `feed-item-sim-N` */
  function injectSimEvent(): QuakeEvent {
    simSeq++
    const mag = Math.round((4.5 + Math.random() * 3) * 10) / 10
    const e: QuakeEvent = {
      id: `sim-${simSeq}`,
      lon: Math.round((Math.random() * 360 - 180) * 100) / 100,
      lat: Math.round((Math.random() * 140 - 70) * 100) / 100,
      mag,
      depth: Math.round(10 + Math.random() * 300),
      time: Date.now(),
      place: '演练事件（合成，非真实数据）',
      url: '',
      level: levelOf(mag, threshold.value),
      status: 'open',
      arrived: true,
    }
    events.value.push(e)
    feed.value = [e.id, ...feed.value]
    return e
  }

  function latestTime(): number {
    let t = 0
    for (const e of events.value) if (e.time > t) t = e.time
    return t
  }

  async function pollOnce(): Promise<void> {
    const fresh = await pullNew(latestTime())
    if (fresh === null) {
      sourceDegraded.value = true
      return
    }
    sourceDegraded.value = false
    sourceUpdatedAt.value = Date.now()
    const known = new Set(events.value.map((e) => e.id))
    const arrivals = fresh.filter((f) => !known.has(f.id)).sort((a, b) => a.time - b.time)
    if (!arrivals.length) return
    for (const f of arrivals) {
      events.value.push(toEvent(f, {}))
      // 轮询期间到达即「已到达」，不进未放行池
      events.value[events.value.length - 1].arrived = true
      feed.value = [f.id, ...feed.value]
    }
  }

  function startStream(): void {
    stopStream()
    streaming.value = true
    streamTimer = setInterval(() => {
      void pollOnce().catch(() => {
        sourceDegraded.value = true
      })
    }, streamIntervalMs)
  }

  function stopStream(): void {
    if (streamTimer) {
      clearInterval(streamTimer)
      streamTimer = null
    }
    streaming.value = false
  }

  function setStatus(id: string, status: QuakeStatus): void {
    const e = events.value.find((x) => x.id === id)
    if (e) {
      e.status = status
      persistStatus(events.value)
    }
  }

  /** 重置演练：处置记录清零。事件本身来自真实数据源，不再回池重放 */
  function resetDrill(): void {
    stopReplay()
    for (const e of events.value) e.status = 'open'
    try {
      localStorage.removeItem(STATUS_KEY)
    } catch { /* 忽略 */ }
  }

  // ---- 时间回放(K4):按发震时间升序重放事件到达过程 ----
  // 回放是「预览模式」：进入时快照当前 feed，退出（手动停止或播完）恢复，
  // 否则中途停止会把用户的事件流清成回放前缀，且除重置演练外无路可回。
  const replaying = ref(false)

  function startReplay(onEach: (e: QuakeEvent) => void, intervalMs = 700): void {
    stopReplay()
    stopStream()
    replaySnapshot = feed.value.slice()
    replaying.value = true
    // 全部回退,按发震时间升序重放
    for (const e of events.value) e.arrived = false
    feed.value = []
    const ascending = [...events.value].sort((a, b) => a.time - b.time)
    let i = 0
    const step = (): void => {
      if (i >= ascending.length) {
        stopReplay()
        return
      }
      const e = ascending[i++]
      e.arrived = true
      feed.value = [e.id, ...feed.value]
      onEach(e)
      replayTimer = setTimeout(step, intervalMs)
    }
    step()
  }

  function stopReplay(): void {
    if (replayTimer) {
      clearTimeout(replayTimer)
      replayTimer = null
    }
    if (replaying.value && replaySnapshot) {
      const kept = new Set(replaySnapshot)
      for (const e of events.value) e.arrived = kept.has(e.id)
      feed.value = replaySnapshot
    }
    replaySnapshot = null
    replaying.value = false
  }

  onUnmounted(() => {
    stopStream()
    stopReplay()
  })

  return {
    events,
    feed,
    arrivedEvents,
    stats,
    threshold,
    setThreshold,
    streaming,
    replaying,
    sourceMode,
    sourceUpdatedAt,
    sourceDegraded,
    startReplay,
    stopReplay,
    load,
    injectSimEvent,
    startStream,
    stopStream,
    setStatus,
    resetDrill,
  }
}
