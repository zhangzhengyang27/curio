import { ref, computed, onUnmounted } from 'vue'

/**
 * 地震应急监测的数据流层。
 *
 * 事件源：/data/mock/earthquakes.json（200 条，{lon,lat,mag,depth,date}）。
 * 「实时推送」为模拟实现：加载后仅放行最初一批（默认 10 条），其余进入
 * 待推送池，由定时器逐条放行（或点「模拟事件」手动放行）——用于演示
 * 告警驱动的监控闭环。
 *
 * 处置状态持久化（K1）：非默认状态（处理中/已处置）以 { eventId: status }
 * 存 localStorage（tv-monitor-status），刷新后恢复；eventId 是数据池内的
 * 稳定索引（池文件冻结不变）。重置演练清空存储并全部回到未处理。
 */

const STATUS_KEY = 'tv-monitor-status'

function loadPersistedStatus() {
  try {
    const raw = JSON.parse(localStorage.getItem(STATUS_KEY))
    return raw && typeof raw === 'object' ? raw : {}
  } catch {
    return {}
  }
}

function persistStatus(events) {
  const map = {}
  for (const e of events) {
    if (e.status !== 'open') map[e.id] = e.status
  }
  localStorage.setItem(STATUS_KEY, JSON.stringify(map))
}

export const LEVELS = {
  critical: { label: '重大', color: '#e53935' }, // mag ≥ 7
  major: { label: '较大', color: '#fb8c00' }, // 5 ≤ mag < 7
  normal: { label: '一般', color: '#fbc02d' }, // mag < 5
}

export const STATUS_LABEL = { open: '未处理', processing: '处理中', resolved: '已处置' }

export function levelOf(mag) {
  if (mag >= 7) return 'critical'
  if (mag >= 5) return 'major'
  return 'normal'
}

export function useEarthquakeFeed({ initialCount = 10, streamIntervalMs = 7000 } = {}) {
  const events = ref([]) // 全部事件（含未放行）
  const feed = ref([]) // 已放行（到达）的事件 id，按到达顺序，新的在前
  let streamTimer = null

  const arrivedEvents = computed(() => {
    const byId = new Map(events.value.map((e) => [e.id, e]))
    return feed.value.map((id) => byId.get(id)).filter(Boolean)
  })

  const stats = computed(() => {
    const s = { open: 0, processing: 0, resolved: 0, critical: 0 }
    for (const e of arrivedEvents.value) {
      s[e.status]++
      if (e.status !== 'resolved' && e.level === 'critical') s.critical++
    }
    return s
  })

  const pendingPool = computed(() => events.value.filter((e) => !e.arrived))

  function load() {
    return fetch('/data/mock/earthquakes.json')
      .then((r) => r.json())
      .then((raw) => {
        // 按日期降序 = 「最新事件」在前，模拟流按此顺序放行
        const sorted = [...raw].sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0))
        const persisted = loadPersistedStatus()
        events.value = sorted.map((r, i) => ({
          id: i,
          lon: r.lon,
          lat: r.lat,
          mag: r.mag,
          depth: r.depth,
          date: r.date,
          level: levelOf(r.mag),
          status: persisted[i] || 'open',
          arrived: false,
        }))
        for (let k = 0; k < Math.min(initialCount, events.value.length); k++) revealAt(k)
      })
  }

  function revealAt(pooledIndex) {
    const pool = events.value.filter((e) => !e.arrived)
    const e = pool[Math.min(pooledIndex, pool.length - 1)]
    if (!e) return false
    e.arrived = true
    feed.value = [e.id, ...feed.value]
    return true
  }

  /** 手动放行一条新事件（演示/测试用）；池空返回 false */
  function simulateOne() {
    return revealAt(0)
  }

  function startStream() {
    stopStream()
    streamTimer = setInterval(() => {
      if (pendingPool.value.length === 0) {
        stopStream()
        return
      }
      revealAt(0)
    }, streamIntervalMs)
  }

  function stopStream() {
    if (streamTimer) {
      clearInterval(streamTimer)
      streamTimer = null
    }
  }

  function setStatus(id, status) {
    const e = events.value.find((x) => x.id === id)
    if (e) {
      e.status = status
      persistStatus(events.value)
    }
  }

  /** 重置演练：全部事件回到未处理并清空持久化（K1） */
  function resetDrill() {
    for (const e of events.value) e.status = 'open'
    localStorage.removeItem(STATUS_KEY)
  }

  onUnmounted(stopStream)

  return {
    events,
    feed,
    arrivedEvents,
    stats,
    pendingPool,
    load,
    simulateOne,
    startStream,
    stopStream,
    setStatus,
    resetDrill,
  }
}
