/**
 * 全球分析页的等值区着色（choropleth）。
 *
 * 世界多边形通过 GeoJsonDataSource 装载为实体集合；按「当年数值排名
 * 百分位」映射到 7 级色阶（长尾分布，排名比绝对值更适合分色）。
 * 选中国与对比国使用高亮色覆盖。无数据国家为浅灰。
 */
/* viewer/entity 为预编译 Cesium 对象，无类型可依 */
/**
 * 7 级色阶（ColorBrewer Blues）：percent 0=最弱 → 浅，1=最强 → 深。
 * 球面始终是浅色矢量底图（卫星影像层按高度门控，vec/cva 不受门控），
 * 所以色阶不跟应用明暗主题走——暗色主题下把高值映到近白只会白上加白。
 */
const RAMP = ['#f7fbff', '#d0e1f2', '#94c4df', '#4a98c9', '#2271b2', '#0c4a8c', '#08306b']

const SELECT_COLOR = '#ff8a3d' // 主选国
const COMPARE_COLORS = ['#e0457b', '#7c4dc4', '#2bb596', '#c9b314'] // 对比国依次取用

const NODATA_CSS = '#dcdcd6'
const NODATA_ALPHA = 0.6

function rampColor(percent: number): string {
  // percent: 0~1，0=最弱
  const idx = Math.min(RAMP.length - 1, Math.floor(percent * RAMP.length))
  return RAMP[idx]
}

export class Choropleth {
  Cesium: any
  viewer: any
  dataSource: any
  /**
   * nameZh → 该国**全部**多边形实体。
   *
   * 必须存数组：worldZh 的 343 个多边形只对应 168 个国家名，37 国是多部件
   * （美国 15 块、中国 3 块）。原先只留最后一个，导致多部件国家只有最小的一块
   * 拿到色值、其余停在默认灰——而最低档色阶 #f7fbff 与默认灰几乎同色，肉眼看不出来。
   */
  byName: Map<string, any[]>

  constructor(Cesium: any, viewer: any) {
    this.Cesium = Cesium
    this.viewer = viewer
    this.dataSource = null
    this.byName = new Map()
  }

  /**
   * 装载 worldZh 多边形；onProgress(loaded, total) 供调试/状态显示。
   * @param geo 已解析的 worldZh GeoJSON。分析页/工作台的数据层本来就要读这份文件，
   *            传进来即可省掉第二次 2.4 MB 的 fetch + JSON.parse；缺省才自行拉取。
   */
  async load(geo?: any, onProgress?: (loaded: number, total: number) => void): Promise<number> {
    if (!geo) geo = await (await fetch('/data/worldZh.json')).json()
    const ds = await this.Cesium.GeoJsonDataSource.load(geo, {
      stroke: this.Cesium.Color.fromCssColorString('#9a9a9a'),
      fill: this.Cesium.Color.fromCssColorString(NODATA_CSS).withAlpha(NODATA_ALPHA),
      strokeWidth: 1,
    })
    this.viewer.dataSources.add(ds)
    this.dataSource = ds
    const entities = ds.entities.values
    const total = entities.length
    entities.forEach((entity: any, i: number) => {
      const props = entity.properties
      const name = (props.nameZh && props.nameZh.getValue()) || (props.name && props.name.getValue())
      if (name) {
        const list = this.byName.get(name)
        if (list) list.push(entity)
        else this.byName.set(name, [entity])
        entity.__nameZh = name
      }
      onProgress?.(i + 1, total)
    })
    return entities.length
  }

  /**
   * 按某年 GDP 重新着色（GDP 专用便捷入口，内部转调 applyValues）。
   * @param timeline gdp-timeline 原始数据
   * @param year 年份
   * @param selected 主选国
   * @param compared 对比国列表
   */
  apply(
    timeline: Record<string, Record<string, number>>,
    year: string,
    selected: string | null = null,
    compared: string[] = []
  ): void {
    this.applyValues(timeline[year] || {}, selected, compared)
  }

  /**
   * 按任意「国名 → 数值」映射着色（工作台的通用指标入口）。
   * 映射之外的国家置灰。
   */
  applyValues(values: Record<string, number>, selected: string | null = null, compared: string[] = []): void {
    if (!this.dataSource) return
    const entries = Object.entries(values).filter(([name]) => this.byName.has(name))
    entries.sort((a, b) => b[1] - a[1])
    const Cesium = this.Cesium

    const compareColorOf = (name: string): string | null => {
      const idx = compared.indexOf(name)
      return idx === -1 ? null : COMPARE_COLORS[idx % COMPARE_COLORS.length]
    }

    // entries 已按数值降序：rank 0 = 最强，换算成「0=最弱」的百分位契约
    for (let rank = 0; rank < entries.length; rank++) {
      const [name] = entries[rank]
      const entities = this.byName.get(name)
      if (!entities) continue
      const percent = entries.length > 1 ? 1 - rank / (entries.length - 1) : 1
      const highlight = name === selected ? SELECT_COLOR : compareColorOf(name)
      const css = highlight || rampColor(percent)
      const color = Cesium.Color.fromCssColorString(css).withAlpha(highlight ? 0.95 : 0.85)
      for (const entity of entities) {
        if (entity.polygon) entity.polygon.material = color
      }
    }
    // 无数据的国家置灰
    const nodataColor = Cesium.Color.fromCssColorString(NODATA_CSS).withAlpha(NODATA_ALPHA)
    for (const [name, entities] of this.byName) {
      if (!(name in values) && !(name === selected) && !compared.includes(name)) {
        for (const entity of entities) {
          if (entity.polygon) entity.polygon.material = nodataColor
        }
      }
    }
  }

  /** 拾取屏幕点对应的国家名 */
  pickName(windowPos: { x: number; y: number }): string | null {
    const picked = this.viewer.scene.pick(windowPos)
    const name = picked?.id?.__nameZh
    return typeof name === 'string' ? name : null
  }

  /** 相机飞往国家。多部件国家传实体数组，Cesium 会把整个国家框进视野 */
  flyTo(name: string): void {
    const entities = this.byName.get(name)
    if (!entities?.length) return
    this.viewer.flyTo(entities, { duration: 1.2 })
  }

  destroy(): void {
    if (this.dataSource) {
      this.viewer.dataSources.remove(this.dataSource, true)
      this.dataSource = null
      this.byName.clear()
    }
  }
}
