import * as THREE from 'three'
import { createLinearScale } from '../utils/colorScale.js'
import { countryLine } from '../objects/BorderLines.js'
import { countryMesh } from '../objects/CountryMesh.js'

/**
 * 从 world.json 构建完整地球（球体 + 边界线 + 国家Mesh）
 * @param {THREE.Group} earthGroup - 地球Group
 * @param {number} R - 地球半径
 * @param {object} worldData - world.json 数据
 * @param {object} gdpColorData - GDP颜色映射数据 { '中国': { color, gdp }, ... }
 */
/**
 * 构建国家搜索索引 { nameZh: { lon, lat, enName } }
 */
export function buildSearchIndex(worldData) {
  const index = {}
  worldData.features.forEach(country => {
    const name = country.properties.nameZh || country.properties.name
    if (!name) return
    // 取第一个轮廓的第一个顶点作为近似中心
    let coords = country.geometry.coordinates
    if (country.geometry.type === 'Polygon') {
      coords = [coords]
    }
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

export function buildEarthFromData(earthGroup, R, worldData, gdpColorData = {}) {
  earthGroup.clear()
  earthGroup.meshArr = []

  worldData.features.forEach(country => {
    if (country.geometry.type === 'Polygon') {
      country.geometry.coordinates = [country.geometry.coordinates]
    }

    const RLine = R * 1.002
    const RMesh = R * 1.001

    const line = countryLine(RLine, country.geometry.coordinates)
    const mesh = countryMesh(RMesh, country.geometry.coordinates)

    earthGroup.add(line)
    earthGroup.add(mesh)
    earthGroup.meshArr.push(mesh)

    mesh.name = country.properties.nameZh || country.properties.name

    // 存储经纬度（取多边形质心）
    const firstRing = country.geometry.coordinates[0]?.[0]
    if (firstRing?.length) {
      let slon = 0, slat = 0
      firstRing.forEach(p => { slon += p[0]; slat += p[1] })
      mesh.userData = { lon: slon / firstRing.length, lat: slat / firstRing.length }
    }

    if (gdpColorData[mesh.name]) {
      mesh.material.color.copy(gdpColorData[mesh.name].color)
      mesh.color = gdpColorData[mesh.name].color.clone()
      mesh.gdp = gdpColorData[mesh.name].gdp
    } else {
      mesh.material.color.set(0x0a1520)
      mesh.material.emissive.set(0x001122)
      mesh.color = new THREE.Color(0x0a1520)
    }
  })
}

/**
 * 解析GDP数据生成国家颜色映射
 * @param {object} gdpData - gdp.json 数据
 * @returns {object} { '中国': { gdp, color }, ... }
 */
export function getCountryGdpColor(gdpData) {
  const countryGdpColor = {}
  const gdpMax = 18219297584000 // 美国GDP基准
  const colorScale = createLinearScale([0, 1], ['#1a2a3a', '#ff8800'])

  gdpData.Root.data.record.forEach(obj => {
    if (obj.field[2].text == 2015) {
      const name = obj.field[0].text
      const gdp = obj.field[3].text
      let color
      if (gdp) {
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
 * 通用数据加载器
 * @param {string} url - 数据文件路径
 * @returns {Promise<any>}
 */
export async function loadData(url) {
  const res = await fetch(url)
  return res.json()
}

/**
 * 加载世界地图数据
 * @returns {Promise<{world: object, gdpColorMap: object}>}
 */
export async function loadWorldData(basePath = '/data') {
  const [world, gdp] = await Promise.all([
    loadData(`${basePath}/worldZh.json`),
    loadData(`${basePath}/gdp.json`).catch(() => null)
  ])

  let gdpColorMap = {}
  if (gdp) {
    gdpColorMap = getCountryGdpColor(gdp)
  }

  return { world, gdpColorMap }
}

/**
 * 通用热力颜色映射
 * @param {object} data - { '中国': value, ... }
 * @param {number} maxValue - 基准最大值
 * @param {string} lowColor - 低值颜色 hex
 * @param {string} highColor - 高值颜色 hex
 * @returns {object} { '中国': { value, color } }
 */
export function buildHeatmapColors(data, maxValue, lowColor = '#ffffff', highColor = '#ff0000') {
  const result = {}
  const colorScale = createLinearScale([0, 1], [lowColor, highColor])
  Object.entries(data).forEach(([name, value]) => {
    const v = typeof value === 'object' ? value.value || value.density || value.emission : value
    const t = maxValue > 0 ? Math.sqrt(v / maxValue) : 0
    result[name] = { value: v, color: new THREE.Color(colorScale(t)) }
  })
  return result
}

/**
 * 加载人口数据
 */
export async function loadPopulationData(basePath = '/data') {
  return loadData(`${basePath}/mock/population.json`)
}

/**
 * 加载碳排放数据
 */
export async function loadCarbonData(basePath = '/data') {
  return loadData(`${basePath}/mock/carbon.json`)
}

/**
 * 加载贸易流数据
 */
export async function loadTradeFlows(basePath = '/data') {
  return loadData(`${basePath}/mock/trade-flows.json`)
}

/**
 * 加载航班数据
 */
export async function loadFlightsData(basePath = '/data') {
  return loadData(`${basePath}/mock/flights.json`)
}

/**
 * 加载地震数据
 */
export async function loadEarthquakeData(basePath = '/data') {
  return loadData(`${basePath}/mock/earthquakes.json`)
}

/**
 * 加载夜间灯光数据
 */
export async function loadNightLightsData(basePath = '/data') {
  return loadData(`${basePath}/mock/nightlights.json`)
}
