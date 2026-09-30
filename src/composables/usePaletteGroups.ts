import { computed, type Ref, type ComputedRef } from 'vue'
import type { CommandItem } from './commandPaletteCore'

/**
 * 首页命令面板的三组命令(自 EarthView 原样迁出,行为等价):
 * 地点(飞达)/ 图层(显隐)/ 工具。执行器依赖由 EarthView 注入。
 */
/** EarthView 画布实例的最小结构面(组件实例 Ref 结构兼容传入) */
interface CanvasLike {
  flyTo?: (lon: number, lat: number) => void
}

export function usePaletteGroups(options: {
  /** getter 注入保持响应式:searchIndex 异步填充,传值快照会让地点组永远为空 */
  searchIndex: () => Record<string, { lon: number; lat: number }>
  layers: ComputedRef<Array<{ id: string; name: string; visible: boolean }>>
  canvas: Ref<CanvasLike | null>
  handlers: {
    layerToggle: (id: string, visible: boolean) => void
    toggleRotate: () => void
    screenshot: () => void
    nightToggle: () => void
    cloudToggle: () => void
    storm: () => void
    splitScreen: () => void
    tour: () => void
  }
}) {
  const { layers, canvas, handlers } = options
  const searchIndexOf = options.searchIndex

  return computed<Array<{ name: string; items: CommandItem[] }>>(() => [
    {
      name: '地点',
      items: Object.entries(searchIndexOf()).map(([name, d]) => ({
        key: `地点:${name}`,
        group: '地点',
        label: name,
        hint: `${d.lon.toFixed(0)}, ${d.lat.toFixed(0)}`,
        run: () => canvas.value?.flyTo?.(d.lon, d.lat),
      })),
    },
    {
      name: '图层',
      items: layers.value.map(l => ({
        key: `图层:${l.id}`,
        group: '图层',
        label: l.name,
        hint: l.visible ? '显示中' : '已隐藏',
        run: () => handlers.layerToggle(l.id, !l.visible),
      })),
    },
    {
      name: '工具',
      items: [
        { key: '工具:自动旋转', group: '工具', label: '自动旋转', hint: 'Space', run: handlers.toggleRotate },
        { key: '工具:截图', group: '工具', label: '截图', hint: 'S', run: handlers.screenshot },
        { key: '工具:夜间模式', group: '工具', label: '夜间模式', hint: 'N', run: handlers.nightToggle },
        { key: '工具:云层', group: '工具', label: '云层', run: handlers.cloudToggle },
        { key: '工具:风暴', group: '工具', label: '风暴', run: handlers.storm },
        { key: '工具:分屏对比', group: '工具', label: '分屏对比', run: handlers.splitScreen },
        { key: '工具:数据巡游', group: '工具', label: '数据巡游', run: handlers.tour },
      ],
    },
  ])
}
