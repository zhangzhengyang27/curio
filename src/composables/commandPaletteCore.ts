/**
 * 命令面板核心:纯数据变换,不 import vue —— 让 node:test 能直接跑
 * (tests/unit/commandPaletteCore.test.ts)。Vue 响应式壳在 CommandPalette.vue。
 */
export interface PaletteItem {
  /** 全局唯一:`${group}:${id}` */
  key: string
  group: string
  label: string
  hint?: string
}

export function filterItems(items: PaletteItem[], query: string, limit = 12): PaletteItem[] {
  const q = query.trim().toLowerCase()
  const hit = q
    ? items.filter(i => i.label.toLowerCase().includes(q))
    : items
  return hit.slice(0, limit)
}

/** 环绕移动;total 为 0 时恒返回 0,避免 NaN 混进 activeIndex */
export function moveActive(current: number, delta: number, total: number): number {
  if (total === 0) return 0
  return (current + delta + total) % total
}

/** Vue 层的命令项:带执行器。核心层只定义类型不执行,保持可单测 */
export type CommandItem = PaletteItem & { run: () => void }
