import type { UiIconName } from './UiIcon'

/**
 * 12 个可视化模式(静态数据;VizModeBar 消费渲染,EarthView 引用做 loading 文案解析)。
 * 独立成文件的原因:<script setup> 不允许 ES module exports(@vue/compiler-sfc 直接编译失败)。
 */
export const VIZ_MODES: Array<{ key: string; label: string; icon?: UiIconName }> = [
  { key: 'gdp', label: 'GDP', icon: 'banknote' },
  { key: 'population', label: '人口', icon: 'users' },
  { key: 'carbon', label: '碳排放', icon: 'factory' },
  { key: 'trade', label: '贸易', icon: 'trade' },
  { key: 'flights', label: '航班', icon: 'plane' },
  { key: 'earthquake', label: '地震', icon: 'activity' },
  { key: 'nightlights', label: '夜间灯光', icon: 'bulb' },
  { key: 'china', label: '中国', icon: 'flag' },
  { key: 'landmarks', label: '地标', icon: 'pin' },
  { key: 'heatmap', label: '热力图', icon: 'flame' },
  { key: 'import', label: '导入数据', icon: 'download' },
  { key: 'default', label: '默认', icon: 'globe' },
]

export interface VizMode {
  key: string
  label: string
  icon?: UiIconName
}
