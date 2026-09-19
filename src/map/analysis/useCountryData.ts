import { ref, shallowRef } from 'vue'
import type { Ref, ShallowRef } from 'vue'

/** 分析页国家行：数值缺失为 null */
export interface CountryRow {
  name: string
  population: number | null
  area: number | null
  density: number | null
  emission: number | null
}

/**
 * 全球数据分析页的数据层。
 *
 * 数据源（全部以中文国名为主键，来自项目既有演示数据）：
 * - /data/mock/gdp-timeline.json  { 年份: { 国名: GDP美元 } }，2000~2020
 * - /data/mock/population.json    { 国名: { population, area, density } }
 * - /data/mock/carbon.json        { 国名: { emission MtCO2, year } }
 * - /data/worldZh.json            国家多边形（GeoJSON，properties.nameZh）
 *
 * 国家清单取「多边形 ∩ GDP 时间序列」交集——世界银行数据中的
 * 聚合项（世界/高收入国家/经合组织成员等）没有地理多边形，天然被排除。
 */
export function useCountryData(): {
  loading: Ref<boolean>
  error: Ref<string>
  years: Ref<string[]>
  countries: Ref<CountryRow[]>
  gdpByYear: Ref<Record<string, Record<string, number>>>
  /** 已解析的 worldZh GeoJSON，供 Choropleth 复用（shallowRef：2.4 MB 对象不做深响应） */
  world: ShallowRef<any>
  load(): Promise<void>
} {
  const loading = ref(true)
  const error = ref('')
  const years = ref<string[]>([])
  const countries = ref<CountryRow[]>([]) // [{ name, population, area, density, emission }]
  const gdpByYear = ref<Record<string, Record<string, number>>>({})
  // 2.4 MB 的多边形集合：用 shallowRef 只换引用、不建深响应代理
  const world = shallowRef<any>(null)

  async function load(): Promise<void> {
    loading.value = true
    error.value = ''
    try {
      const [timeline, population, carbon, worldGeo] = await Promise.all([
        fetch('/data/mock/gdp-timeline.json').then((r) => r.json()),
        fetch('/data/mock/population.json').then((r) => r.json()),
        fetch('/data/mock/carbon.json').then((r) => r.json()),
        fetch('/data/worldZh.json').then((r) => r.json()),
      ])
      world.value = worldGeo

      const yearKeys: string[] = Object.keys(timeline).sort()
      years.value = yearKeys
      gdpByYear.value = timeline

      const zhFromGeo = new Set<string>()
      for (const f of worldGeo.features || []) {
        const p = f.properties || {}
        zhFromGeo.add(p.nameZh || p.name)
      }

      const list: CountryRow[] = []
      for (const name of zhFromGeo) {
        const hasGdp = yearKeys.some((y) => name in timeline[y])
        if (!hasGdp) continue
        list.push({
          name,
          population: population[name]?.population ?? null,
          area: population[name]?.area ?? null,
          density: population[name]?.density ?? null,
          emission: carbon[name]?.emission ?? null,
        })
      }
      // 列表默认按最新一年 GDP 降序
      const lastYear = yearKeys[yearKeys.length - 1]
      list.sort((a, b) => (timeline[lastYear][b.name] || 0) - (timeline[lastYear][a.name] || 0))
      countries.value = list
    } catch (err) {
      error.value = '数据加载失败，请刷新重试。'
      console.error('[analysis] 数据加载失败:', err)
    } finally {
      loading.value = false
    }
  }

  return { loading, error, years, countries, gdpByYear, world, load }
}

/** GDP 美元 → 可读文本（万亿/亿） */
export function formatUSD(value: number | null | undefined): string {
  if (value == null || Number.isNaN(value)) return '暂无数据'
  if (value >= 1e12) return `${(value / 1e12).toFixed(2)} 万亿美元`
  if (value >= 1e8) return `${(value / 1e8).toFixed(0)} 亿美元`
  return `${Math.round(value / 1e4)} 万美元`
}

/** 人数 → 可读文本（亿/万） */
export function formatPopulation(value: number | null | undefined): string {
  if (value == null) return '暂无数据'
  if (value >= 1e8) return `${(value / 1e8).toFixed(2)} 亿`
  return `${(value / 1e4).toFixed(0)} 万`
}

/** 面积 → 万平方公里 */
export function formatAreaSqKm(value: number | null | undefined): string {
  if (value == null) return '暂无数据'
  return `${(value / 1e4).toFixed(0)} 万 km²`
}

/** 在某年 GDP 排名（1 起）；无数据返回 null */
export function gdpRank(timeline: Record<string, Record<string, number>>, year: string, name: string): number | null {
  const row = timeline[year] || {}
  const sorted = Object.entries(row).sort((a, b) => b[1] - a[1])
  const idx = sorted.findIndex(([n]) => n === name)
  return idx === -1 ? null : idx + 1
}
