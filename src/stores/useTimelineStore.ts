import { defineStore } from 'pinia'
import { ref, shallowRef } from 'vue'

/** gdp-timeline.json：年份（字符串键）→ 国家名 → GDP 数值 */
type YearlyData = Record<string, Record<string, number>>

// 预过滤：排除汇总区域和非国家条目
const isRealCountry = (n: string) => !n.includes('(') && !n.includes('（') && !n.includes('组织') && !n.includes('成员') && !n.includes('红') && !n.includes('货币') && !n.includes('签') && !n.includes('世界') && !n.includes('地区') && !n.includes('联盟') && !n.includes('IBRD') && !n.includes('HIPC') && n.length <= 8

export const useTimelineStore = defineStore('timeline', () => {
  const currentYear = ref(2015)
  const isPlaying = ref(false)
  const speed = ref(1)
  const yearRange = ref<[number, number]>([2000, 2020])
  const yearlyData = shallowRef<YearlyData | null>(null)
  const globalMax = ref(0)
  let playTimer: ReturnType<typeof setTimeout> | null = null
  let realCountryMax = 0 // 预计算的真实国家 GDP 最大值，避免 getPillarData 每次全量扫描

  function setYearlyData(data: YearlyData | null | undefined) {
    yearlyData.value = data || null
    let max = 0
    let cMax = 0
    if (data) {
      Object.values(data).forEach(yd => {
        Object.entries(yd).forEach(([n, v]) => {
          if (typeof v === 'number' && v > max) max = v
          if (isRealCountry(n) && typeof v === 'number' && v > cMax) cMax = v
        })
      })
    }
    globalMax.value = max
    realCountryMax = cMax
  }

  function setYear(year: number) {
    currentYear.value = Math.max(yearRange.value[0], Math.min(yearRange.value[1], year))
  }

  function play() { if (!isPlaying.value) { isPlaying.value = true; tick() } }
  function pause() { isPlaying.value = false; if (playTimer) { clearTimeout(playTimer); playTimer = null } }
  function toggle() { isPlaying.value ? pause() : play() }
  function tick() {
    if (!isPlaying.value) return
    setYear(currentYear.value + 1)
    if (currentYear.value >= yearRange.value[1]) currentYear.value = yearRange.value[0]
    playTimer = setTimeout(tick, 1000 / speed.value)
  }
  function setSpeed(s: number) { speed.value = s; if (isPlaying.value) { pause(); play() } }

  function getPillarData(year: number) {
    // JSON 键为年份字符串；数字索引在 JS 里本就等价于字符串索引
    const data = yearlyData.value?.[String(year)]
    const prevData = yearlyData.value?.[String(year - 1)]
    if (!data) return { pillars: [], maxHeight: 60 }
    const maxGdp = realCountryMax
    const entries = Object.entries(data)
      .filter(([n, v]) => isRealCountry(n) && typeof v === 'number')
      .sort((a, b) => b[1] - a[1])
      .slice(0, 30)
      .map(([name, gdp]) => {
        const prevGdp = (prevData && typeof prevData[name] === 'number') ? prevData[name] : gdp
        const growth = prevGdp > 0 ? (gdp - prevGdp) / prevGdp : 0
        const h = maxGdp > 0 ? (gdp / maxGdp) * 60 : 1
        const absG = Math.min(Math.abs(growth) * 12, 1)
        const color = growth >= 0
          ? { r: 0.15, g: 0.15 + absG * 0.85, b: 0.15 }
          : { r: 0.15 + absG * 0.85, g: 0.15, b: 0.15 }
        return { name, gdp, growth, height: Math.max(h, 1.5), color }
      })
    return { pillars: entries, maxHeight: 60 }
  }

  return { currentYear, isPlaying, speed, yearRange, yearlyData, globalMax,
    setYearlyData, setYear, play, pause, toggle, setSpeed, getPillarData }
})
