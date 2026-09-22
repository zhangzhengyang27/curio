import * as THREE from 'three'
import { createLinearScale } from '../utils/colorScale'
import { countryLine } from '../objects/BorderLines'
import { countryMesh } from '../objects/CountryMesh'

/** world.json 的 GeoJSON 结构（本仓只用到的最小字段） */
export interface WorldFeature {
  properties: {
    nameZh?: string
    name?: string
    [key: string]: unknown
  }
  geometry: {
    type: string
    /** Polygon: number[][][]；MultiPolygon: number[][][][]。各消费方自行归一化，不得改写本字段 */
    coordinates: number[][][] | number[][][][]
  }
}

export interface WorldData {
  features: WorldFeature[]
}

/** getCountryGdpColor 的产物：国家名 → GDP 数值与着色 */
export interface GdpColorEntry {
  gdp: number
  color: THREE.Color
}

/** gdp.json 的 record 结构（field 数组按位取值） */
interface GdpData {
  Root: { data: { record: Array<{ field: Array<{ text: unknown }> }> } }
}

/**
 * 从 world.json 构建完整地球（球体 + 边界线 + 国家Mesh）
 * @param earthGroup - 地球Group
 * @param R - 地球半径
 * @param worldData - world.json 数据
 * @param gdpColorData - GDP颜色映射数据 { '中国': { color, gdp }, ... }
 */
/**
 * 构建国家搜索索引 { nameZh: { lon, lat, enName } }
 */
export function buildSearchIndex(worldData: WorldData): Record<string, { lon: number; lat: number; enName?: string }> {
  const index: Record<string, { lon: number; lat: number; enName?: string }> = {}
  worldData.features.forEach(country => {
    const name = country.properties.nameZh || country.properties.name
    if (!name) return
    // 取第一个轮廓的第一个顶点作为近似中心；统一归一化为 MultiPolygon 四层结构
    const coords: number[][][][] = country.geometry.type === 'Polygon'
      ? [country.geometry.coordinates as number[][][]]
      : (country.geometry.coordinates as number[][][][])
    const firstRing = coords[0]?.[0]
    if (!firstRing?.length) return
    // 质心近似：所有顶点的平均值
    let sumLon = 0, sumLat = 0
    firstRing.forEach(p => { sumLon += p[0]; sumLat += p[1] })
    const n = firstRing.length
    index[name] = {
      lon: sumLon / n,
      lat: sumLat / n,
      enName: country.properties.name
    }
  })
  return index
}

export function buildEarthFromData(
  earthGroup: THREE.Group,
  R: number,
  worldData: WorldData,
  gdpColorData: Record<string, GdpColorEntry> = {}
): void {
  earthGroup.clear()
  // 自定义字段：国家 Mesh 集合，供拾取/图层遍历使用
  const group = earthGroup as THREE.Group & { meshArr: THREE.Mesh[] }
  group.meshArr = []

  worldData.features.forEach(country => {
    // 归一化只落在局部变量上。写回 geometry 会让 geometry.type 仍是 'Polygon'
    // 而 coordinates 已多包一层，后续再读同一份数据的代码（如 buildSearchIndex）
    // 会在已包过的基础上再包一层，质心取到「环的数组」而算成 NaN。
    const coords: number[][][][] = country.geometry.type === 'Polygon'
      ? [country.geometry.coordinates as number[][][]]
      : country.geometry.coordinates as number[][][][]

    const RLine = R * 1.002
    const RMesh = R * 1.001

    const line = countryLine(RLine, coords)
    const mesh = countryMesh(RMesh, coords) as THREE.Mesh & { color?: THREE.Color; gdp?: number }

    earthGroup.add(line)
    earthGroup.add(mesh)
    group.meshArr.push(mesh)

    mesh.name = country.properties.nameZh || country.properties.name || ''

    // 存储经纬度（取多边形质心）
    const firstRing = coords[0]?.[0]
    if (firstRing?.length) {
      let slon = 0, slat = 0
      firstRing.forEach(p => { slon += p[0]; slat += p[1] })
      mesh.userData = { lon: slon / firstRing.length, lat: slat / firstRing.length }
    }

    // three-types-fixes.d.ts 把 Material.color/emissive 并成了可选，这里收窄回必选
    type CountryMaterial = THREE.MeshPhongMaterial & { color: THREE.Color; emissive: THREE.Color }

    if (gdpColorData[mesh.name]) {
      ;(mesh.material as CountryMaterial).color.copy(gdpColorData[mesh.name].color)
      mesh.color = gdpColorData[mesh.name].color.clone()
      mesh.gdp = gdpColorData[mesh.name].gdp
    } else {
      const mat = mesh.material as CountryMaterial
      mat.color.set(0x0a1520)
      mat.emissive.set(0x001122)
      mesh.color = new THREE.Color(0x0a1520)
    }
  })
}

/**
 * 解析GDP数据生成国家颜色映射
 * @param gdpData - gdp.json 数据
 * @returns { '中国': { gdp, color }, ... }
 */
export function getCountryGdpColor(gdpData: GdpData): Record<string, GdpColorEntry> {
  const countryGdpColor: Record<string, GdpColorEntry> = {}
  const gdpMax = 18219297584000 // 美国GDP基准
  const colorScale = createLinearScale([0, 1], ['#1a2a3a', '#ff8800'])

  gdpData.Root.data.record.forEach(obj => {
    if (obj.field[2].text === 2015) {
      const name = obj.field[0].text as string
      const gdpText = obj.field[3].text as string | null
      const gdp = gdpText ? parseFloat(gdpText) : 0
      let color: THREE.Color
      if (gdp && gdp > 0) {
        color = new THREE.Color(colorScale(Math.sqrt(gdp / gdpMax)))
      } else {
        color = new THREE.Color(0xffffff)
      }
      countryGdpColor[name] = { gdp, color }
    }
  })
  return countryGdpColor
}

/**
 * 通用数据加载器（模块级缓存）
 *
 * worldZh.json 约 2.4 MB、gdp.json 约 9.2 MB：双屏对比时两个 EarthCanvas 各自
 * 加载一遍，路由往返也要重来。缓存的是**同一份对象引用**，所以消费方绝不可就地
 * 改写它（buildEarthFromData 曾把 Polygon 的 coordinates 就地包一层，正是这个
 * 约束被破坏的样子）。
 * 失败的 promise 不入缓存，留给下一次重试。
 */
const dataCache = new Map<string, Promise<unknown>>()

export function loadData(url: string): Promise<unknown> {
  let cached = dataCache.get(url)
  if (!cached) {
    cached = fetch(url).then(r => r.json()).catch((err) => {
      dataCache.delete(url)
      throw err
    })
    dataCache.set(url, cached)
  }
  return cached
}

/**
 * 加载世界地图数据
 */
export async function loadWorldData(basePath = '/data'): Promise<{ world: WorldData; gdpColorMap: Record<string, GdpColorEntry> }> {
  const [world, gdp] = await Promise.all([
    loadData(`${basePath}/worldZh.json`),
    loadData(`${basePath}/gdp.json`).catch(() => null)
  ])

  let gdpColorMap: Record<string, GdpColorEntry> = {}
  if (gdp) {
    gdpColorMap = getCountryGdpColor(gdp as GdpData)
  }

  return { world: world as WorldData, gdpColorMap }
}

/**
 * 通用热力颜色映射
 * @param data - { '中国': value, ... }，值也允许 { value|density|emission } 形态
 * @param maxValue - 基准最大值
 * @param lowColor - 低值颜色 hex
 * @param highColor - 高值颜色 hex
 * @returns { '中国': { value, color } }
 */
export function buildHeatmapColors(
  data: Record<string, number | { value?: number; density?: number; emission?: number }>,
  maxValue: number,
  lowColor = '#ffffff',
  highColor = '#ff0000'
): Record<string, { value: number; color: THREE.Color }> {
  const result: Record<string, { value: number; color: THREE.Color }> = {}
  const colorScale = createLinearScale([0, 1], [lowColor, highColor])
  Object.entries(data).forEach(([name, value]) => {
    const v = (typeof value === 'object' ? value.value || value.density || value.emission : value) as number
    const t = maxValue > 0 ? Math.sqrt(v / maxValue) : 0
    result[name] = { value: v, color: new THREE.Color(colorScale(t)) }
  })
  return result
}

/**
 * 加载人口数据
 */
export async function loadPopulationData(basePath = '/data'): Promise<unknown> {
  return loadData(`${basePath}/mock/population.json`)
}

/**
 * 加载碳排放数据
 */
export async function loadCarbonData(basePath = '/data'): Promise<unknown> {
  return loadData(`${basePath}/mock/carbon.json`)
}

/**
 * 加载贸易流数据
 */
export async function loadTradeFlows(basePath = '/data'): Promise<unknown> {
  return loadData(`${basePath}/mock/trade-flows.json`)
}

/**
 * 加载航班数据
 */
export async function loadFlightsData(basePath = '/data'): Promise<unknown> {
  return loadData(`${basePath}/mock/flights.json`)
}

/**
 * 加载地震数据
 */
export async function loadEarthquakeData(basePath = '/data'): Promise<unknown> {
  return loadData(`${basePath}/mock/earthquakes.json`)
}

/**
 * 加载夜间灯光数据
 */
export async function loadNightLightsData(basePath = '/data'): Promise<unknown> {
  return loadData(`${basePath}/mock/nightlights.json`)
}
