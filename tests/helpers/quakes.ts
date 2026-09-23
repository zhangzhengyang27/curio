import type { Page, Route } from '@playwright/test'

export interface FixtureQuake {
  id: string
  mag: number
  place: string
  time: number
  depth: number
  lon: number
  lat: number
  alert: string | null
  url: string
}

const H = 3_600_000
/** 固定基准：2026-09-20T00:00:00Z。事件按小时递减，q01 最新、q12 最旧 */
export const T0 = Date.UTC(2026, 8, 20)

const MAGS = [6.2, 5.5, 4.8, 7.4, 5.1, 4.4, 3.9, 6.8, 7.1, 4.2, 5.7, 3.5]

/**
 * /monitor 用例的确定性数据源。
 *
 * 震级刻意打散（重大项 q04/q09 不在最新两位），这样「重大置顶」与
 * 「其余按时间降序」两条规则可以被分别验证；12 条 > initialCount(10)，
 * 于是「已加载但未被轮询放行」与「增量到达」都有可观测空间。
 */
export const FIXTURE: FixtureQuake[] = MAGS.map((mag, i) => ({
  id: `q${String(i + 1).padStart(2, '0')}`,
  mag,
  place: `演练地点 ${i + 1}`,
  time: T0 + (MAGS.length - 1 - i) * H,
  depth: 10 + i * 5,
  lon: 100 + i,
  lat: 20 + i,
  alert: null,
  url: '',
}))

export interface QuakeMock {
  events: FixtureQuake[]
}

/**
 * 拦截后端 API，让用例与 server/ 是否启动完全解耦。
 * 返回的 state 可在用例里 push 新事件，模拟「轮询期间有新地震到达」。
 */
export async function mockQuakes(
  page: Page,
  opts: { events?: FixtureQuake[]; failApi?: boolean } = {}
): Promise<QuakeMock> {
  const state: QuakeMock = { events: (opts.events ?? FIXTURE).map((e) => ({ ...e })) }
  await page.route('**/api/quakes*', async (route: Route) => {
    if (opts.failApi) return route.abort()
    const since = Number(new URL(route.request().url()).searchParams.get('since') || 0)
    const events = since > 0 ? state.events.filter((e) => e.time > since) : state.events
    await route.fulfill({
      contentType: 'application/json',
      body: JSON.stringify({ generatedAt: Date.now(), source: 'usgs', events }),
    })
  })
  return state
}

/** 与实现同口径地算出「重大置顶 + 其余按到达顺序」的期望 id 序列 */
export function expectedOrder(events: FixtureQuake[], threshold = 7): string[] {
  const desc = [...events].sort((a, b) => b.time - a.time)
  return [...desc.filter((e) => e.mag >= threshold).map((e) => e.id), ...desc.filter((e) => e.mag < threshold).map((e) => e.id)]
}
