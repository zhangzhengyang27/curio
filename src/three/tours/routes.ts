import globalOverview from './global-overview.json'
import chinaFocus from './china-focus.json'
import globalConnections from './global-connections.json'
import earthAtNight from './earth-at-night.json'
import type { TourRoute } from '../../composables/useTourEngine'

/** 路线派生字段:总时长估算文案;JSON 路线还带展示元信息 */
export interface TourRouteMeta {
  id: string
  title: string
  description: string
}

export type TourRouteWithDuration = TourRoute & TourRouteMeta & { durationText: string }

/**
 * 巡游路线注册表。路线本体是纯 JSON 数据（文案改动只改 JSON），
 * 这里只做装载与派生字段（时长估算），并被 UI 懒加载：
 * 只有打开巡游入口时才会 import 本模块，不进首屏 bundle。
 */
function withDuration(route: TourRoute & TourRouteMeta): TourRouteWithDuration {
  const totalMs = route.steps.reduce(
    (sum, s) => sum + (s.flyDuration ?? 2500) + (s.dwell ?? 8000),
    0
  )
  return { ...route, durationText: `约 ${Math.round(totalMs / 1000 / 5) * 5} 秒` }
}

export const routes: TourRouteWithDuration[] = [
  withDuration(globalOverview as TourRoute & TourRouteMeta),
  withDuration(chinaFocus as TourRoute & TourRouteMeta),
  withDuration(globalConnections as TourRoute & TourRouteMeta),
  withDuration(earthAtNight as TourRoute & TourRouteMeta)
]
