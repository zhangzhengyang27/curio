import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useTimelineStore = defineStore('timeline', () => {
  const currentYear = ref(2015)
  const isPlaying = ref(false)
  const speed = ref(1)
  const yearRange = ref([2000, 2020])
  const yearlyData = ref(null)
  const globalMax = ref(0)
  let playTimer = null

  function setYearlyData(data) {
    yearlyData.value = data
    let max = 0
    Object.values(data).forEach(yd => {
      Object.values(yd).forEach(v => { if (v > max) max = v })
    })
    globalMax.value = max
  }

  function setYear(year) {
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
  function setSpeed(s) { speed.value = s; if (isPlaying.value) { pause(); play() } }

  const _AGGREGATE = new Set([
    '世界','经合组织成员','人口紅利之後','高收入国家','IBRD与IDA','低收入国家',
    '中低等收入国家','中高等收入国家','最不发达地区','发展中地区','东亚与太平洋',
    '欧洲与中亚','拉丁美洲与加勒比','中东与北非','南亚','撒哈拉以南非洲','北美',
    '欧洲联盟','阿拉伯联盟','小岛屿发展中国家','阿拉伯联盟国家','中低收入国家',
    '中等收入国家','低收入','只有IBRD','高收入','低收入缺粮国','最不发达国家',
    '中等偏下收入','中等偏上收入','重债穷国','东亚发展中国家','已签署的HIPC'
  ])

  function getPillarData(year) {
    const data = yearlyData.value?.[year]
    const prevData = yearlyData.value?.[year - 1]
    if (!data) return []
    let maxGdp = 0
    // Pre-filter: only names with <6 chars and no special characters (likely real countries)
    const isRealCountry = (n) => !n.includes('(') && !n.includes('（') && !n.includes('区') && !n.includes('组织') && !n.includes('成员') && !n.includes('红') && !n.includes('货币') && !n.includes('签') && n.length <= 6
    Object.values(yearlyData.value).forEach(yd => {
      Object.entries(yd).forEach(([n, v]) => {
        if (isRealCountry(n) && v > maxGdp) maxGdp = v
      })
    })
    const entries = Object.entries(data)
      .filter(([n]) => isRealCountry(n))
      .sort((a, b) => b[1] - a[1])
      .slice(0, 30)
      .map(([name, gdp]) => {
        const prevGdp = prevData?.[name] || gdp
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
