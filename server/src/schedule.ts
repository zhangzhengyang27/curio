/**
 * 进程内调度：分钟级增量轮询 + 每天定点全量重同步。
 * 不引 node-cron：需求只有「每 N 毫秒」和「每天某点」两种节奏，
 * 两个定时器就够了，少一个依赖就少一处与 Node 版本的耦合。
 */

/** 距目标时区下一个 hour:00 的毫秒数。中国无夏令时，但按通用算法写以便换时区不出错。 */
export function msUntilDailyRun(now: Date, hour: number, tz: string): number {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: tz,
    hour12: false,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).formatToParts(now)
  const get = (t: string) => Number(parts.find((p) => p.type === t)?.value ?? 0)
  // hour12:false 时午夜可能报 '24'，归零
  const wallHour = get('hour') % 24
  const wallMs = ((wallHour * 60 + get('minute')) * 60 + get('second')) * 1000
  const targetMs = hour * 3_600_000
  const dayMs = 86_400_000
  return (targetMs - wallMs + dayMs) % dayMs || dayMs
}

export interface SchedulerHandles {
  stop(): void
  nextDailyAt: () => number
}

export function startScheduler(opts: {
  pollMs: number
  dailyHour: number
  dailyTz: string
  onPoll: () => Promise<void>
  onDaily: () => Promise<void>
  now?: () => Date
}): SchedulerHandles {
  const now = opts.now ?? (() => new Date())
  let dailyTimer: ReturnType<typeof setTimeout> | null = null
  let nextDaily = 0

  const pollTimer = setInterval(() => {
    void opts.onPoll().catch((err) => console.warn('[quake] 增量同步失败:', err))
  }, opts.pollMs)

  const armDaily = (): void => {
    const delay = msUntilDailyRun(now(), opts.dailyHour, opts.dailyTz)
    nextDaily = Date.now() + delay
    dailyTimer = setTimeout(() => {
      void opts
        .onDaily()
        .catch((err) => console.warn('[quake] 每日全量同步失败:', err))
        .finally(armDaily)
    }, delay)
  }
  armDaily()

  return {
    stop() {
      clearInterval(pollTimer)
      if (dailyTimer) clearTimeout(dailyTimer)
    },
    nextDailyAt: () => nextDaily,
  }
}
