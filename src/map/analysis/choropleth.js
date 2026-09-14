/**
 * 全球分析页的等值区着色（choropleth）。
 *
 * 世界多边形通过 GeoJsonDataSource 装载为实体集合；按「当年 GDP 排名
 * 百分位」映射到 7 级蓝色色阶（GDP 长尾分布，排名比绝对值更适合分色）。
 * 选中国与对比国使用高亮色覆盖。无数据/非当前视图国家为浅灰。
 */
const RAMP = ['#f7fbff', '#d0e1f2', '#94c4df', '#4a98c9', '#2271b2', '#0c4a8c', '#08306b']

const SELECT_COLOR = '#ff8a3d' // 主选国
const COMPARE_COLORS = ['#e0457b', '#7c4dc4', '#2bb596', '#c9b314'] // 对比国依次取用

function rampColor(percent) {
  // percent: 0~1，0=最弱
  const idx = Math.min(RAMP.length - 1, Math.floor(percent * RAMP.length))
  return RAMP[idx]
}

export class Choropleth {
  constructor(Cesium, viewer) {
    this.Cesium = Cesium
    this.viewer = viewer
    this.dataSource = null
    /** nameZh → entity */
    this.byName = new Map()
  }

  /** 装载 worldZh 多边形；onProgress(loaded, total) 供调试/状态显示 */
  async load(onProgress) {
    const res = await fetch('/data/worldZh.json')
    const geo = await res.json()
    const ds = await this.Cesium.GeoJsonDataSource.load(geo, {
      stroke: this.Cesium.Color.fromCssColorString('#9a9a9a'),
      fill: this.Cesium.Color.fromCssColorString('#e8e8e2').withAlpha(0.85),
      strokeWidth: 1,
    })
    this.viewer.dataSources.add(ds)
    this.dataSource = ds
    const entities = ds.entities.values
    let total = entities.length
    entities.forEach((entity, i) => {
      const props = entity.properties
      const name = (props.nameZh && props.nameZh.getValue()) || (props.name && props.name.getValue())
      if (name) {
        this.byName.set(name, entity)
        entity.__nameZh = name
      }
      onProgress?.(i + 1, total)
    })
    return entities.length
  }

  /**
   * 按某年 GDP 重新着色。
   * @param {object} timeline gdp-timeline 原始数据
   * @param {string} year 年份
   * @param {string|null} selected 主选国
   * @param {string[]} compared 对比国列表
   */
  apply(timeline, year, selected = null, compared = []) {
    if (!this.dataSource) return
    const row = timeline[year] || {}
    const entries = Object.entries(row).filter(([name]) => this.byName.has(name))
    entries.sort((a, b) => b[1] - a[1])
    const Cesium = this.Cesium

    const compareColorOf = (name) => {
      const idx = compared.indexOf(name)
      return idx === -1 ? null : COMPARE_COLORS[idx % COMPARE_COLORS.length]
    }

    for (const [name, value] of entries) {
      const entity = this.byName.get(name)
      if (!entity?.polygon) continue
      const percent = entries.length > 1 ? entries.findIndex(([n]) => n === name) / (entries.length - 1) : 1
      const highlight = name === selected ? SELECT_COLOR : compareColorOf(name)
      const css = highlight || rampColor(percent)
      entity.polygon.material = Cesium.Color.fromCssColorString(css).withAlpha(highlight ? 0.95 : 0.85)
    }
    // 无 GDP 数据的国家置灰
    for (const [name, entity] of this.byName) {
      if (!(name in row) && !(name === selected) && !compared.includes(name)) {
        if (entity.polygon) {
          entity.polygon.material = Cesium.Color.fromCssColorString('#dcdcd6').withAlpha(0.6)
        }
      }
    }
  }

  /** 拾取屏幕点对应的国家名 */
  pickName(windowPos) {
    const picked = this.viewer.scene.pick(windowPos)
    const name = picked?.id?.__nameZh
    return typeof name === 'string' ? name : null
  }

  /** 相机飞往国家 */
  flyTo(name) {
    const entity = this.byName.get(name)
    if (!entity) return
    this.viewer.flyTo(entity, { duration: 1.2 })
  }

  destroy() {
    if (this.dataSource) {
      this.viewer.dataSources.remove(this.dataSource, true)
      this.dataSource = null
      this.byName.clear()
    }
  }
}
