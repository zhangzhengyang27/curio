/**
 * Accessor 工厂 — 常量 / 字段名 / 函数 三态解析
 * 用法: const latFn = accessor(35);         // 常量 → 始终返回 35
 *       const latFn = accessor('lat');       // 字段名 → d.lat
 *       const latFn = accessor(d => d.lat);  // 函数 → 按需计算
 */
export type AccessorSpec = string | number | boolean | null | ((item: any) => unknown)

export function accessor(value: AccessorSpec): (item?: any) => unknown {
  if (typeof value === 'function') return value
  if (typeof value === 'string') return (d?: Record<string, unknown>) => d?.[value]
  return () => value
}

/**
 * 批量创建 accessor
 * @param defs - { lat: 'lat', lng: 116, color: d => d.c }
 * @returns { lat, lng, color } 每个都是函数
 */
export function accessors(defs: Record<string, AccessorSpec>): Record<string, (item?: any) => unknown> {
  const result: Record<string, (item?: any) => unknown> = {}
  Object.entries(defs).forEach(([key, val]) => {
    result[key] = accessor(val)
  })
  return result
}
