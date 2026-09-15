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
  critical: { label: '重大', color: '#e53935' }, // mag ≥ 阈值(默认 7,UI 可调 K2)
  major: { label: '较大', color: '#fb8c00' }, // 5 ≤ mag < 阈值
  normal: { label: '一般', color: '#fbc02d' }, // mag < 5
}

export const STATUS_LABEL = { open: '未处理', processing: '处理中', resolved: '已处置' }

/** 按阈值分级(K2):critical = mag ≥ threshold;major = 5 ≤ mag < threshold */
export function levelOf(mag, threshold = 7) {
  if (mag >= threshold) return 'critical'
  if (mag >= 5) return 'major'
  return 'normal'
}

export function useEarthquakeFeed({ initialCount = 10, streamIntervalMs = 7000 } = {}) {
  const events = ref([]) // 全部事件（含未放行）
  const feed = ref([]) // 已放行（到达）的事件 id，按到达顺序，新的在前
  const threshold = ref(7) // 重大阈值(K2),UI 可调
  let streamTimer = null
  let replayTimer = null // 时间回放计时器(K4)

  const arrivedEvents = computed(() => {
    const byId = new Map(events.value.map((e) => [e.id, e]))
    const list = feed.value.map((id) => byId.get(id)).filter(Boolean)
    // 重大事件列顶(K2),其余按到达顺序
    return [...list.filter((e) => e.level === 'critical'), ...list.filter((e) => e.level !== 'critical')]
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

  /** 调整重大阈值并全量重算分级(K2) */
  function setThreshold(t) {
    const v = Math.min(9, Math.max(4, Math.round(Number(t) || 7)))
    threshold.value = v
    for (const e of events.value) {
      e.level = levelOf(e.mag, v)
    }
    return v
  }

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
          level: levelOf(r.mag, threshold.value),
          status: persisted[i] || 'open',
          arrived: false,
        }))
        for (let k = 0; k < Math.min(initialCount, events.value.length); k++) revealAt(0)
      })
  }

  /**
   * 放行池中第 pooledIndex 个未放行事件。
   * ⚠ 循环放行时固定传 0:pool 每次都会重建(已放行被过滤),传递增索引
   *   会跳号——曾导致初始 10 条实际是「偶数位」事件、最新事件被跳过
   *   (2026-09-15 K2 实施时发现的产品缺陷)。
   */
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
    stopReplay()
    for (const e of events.value) {
      e.status = 'open'
      e.arrived = false
      e.level = levelOf(e.mag, threshold.value)
    }
    feed.value = []
    localStorage.removeItem(STATUS_KEY)
    for (let k = 0; k < Math.min(initialCount, events.value.length); k++) revealAt(0)
  }

  // ---- 时间回放(K4):按发震时间升序重放事件到达过程 ----
  const replaying = ref(false)

  function startReplay(onEach, intervalMs = 700) {
    stopReplay()
    stopStream()
    replaying.value = true
    // 全部回退,按发震时间升序重放
    for (const e of events.value) e.arrived = false
    feed.value = []
    const ascending = [...events.value].sort((a, b) => (a.date > b.date ? 1 : a.date < b.date ? -1 : 0))
    let i = 0
    const step = () => {
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

  function stopReplay() {
    if (replayTimer) {
      clearTimeout(replayTimer)
      replayTimer = null
    }
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
    pendingPool,
    threshold,
    setThreshold,
    replaying,
    startReplay,
    stopReplay,
    load,
    simulateOne,
    startStream,
    stopStream,
    setStatus,
    resetDrill,
  }
}
