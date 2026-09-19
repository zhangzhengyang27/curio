/**
 * 数据驱动的差异更新工具
 * 通过唯一 id 对比新旧数据，仅创建/更新/删除变化的 Three.js 对象
 */
export interface DataDigestOptions<T, O> {
  /** 从数据项中提取唯一 id（默认 item.id || JSON.stringify(item)） */
  getId?: (item: T) => string
  /** 为新数据项创建 Three.js 对象 */
  onCreate?: (item: T) => O
  /** 数据项变化时更新已有对象 */
  onUpdate?: (obj: O, item: T, oldItem: T) => void
  /** 对象被移除前的回调 */
  onRemove?: (obj: O, item: T) => void
  /** 比较两个数据项是否相等（默认 JSON.stringify 深比较） */
  comparator?: (a: T, b: T) => boolean
}

export interface DataDigestChange<T, O> {
  id: string
  obj: O
  item: T
  oldItem?: T
}

export class DataDigest<T = any, O = any> {
  private readonly getId: (item: T) => string
  private readonly onCreate: (item: T) => O
  private readonly onUpdate: (obj: O, item: T, oldItem: T) => void
  private readonly onRemove: (obj: O, item: T) => void
  private readonly comparator: (a: T, b: T) => boolean
  private _map = new Map<string, { obj: O; item: T }>()

  constructor(options: DataDigestOptions<T, O> = {}) {
    this.getId = options.getId || ((item: T) => (item as { id?: string })?.id ?? JSON.stringify(item))
    this.onCreate = options.onCreate || (() => undefined as O)
    this.onUpdate = options.onUpdate || (() => {})
    this.onRemove = options.onRemove || (() => {})
    this.comparator = options.comparator || ((a: T, b: T) => JSON.stringify(a) === JSON.stringify(b))
  }

  /**
   * 对比新数据与旧数据，触发创建/更新/移除回调
   */
  update(data: T[] | null | undefined): { created: DataDigestChange<T, O>[]; updated: DataDigestChange<T, O>[]; removed: DataDigestChange<T, O>[] } {
    const items = Array.isArray(data) ? data : []
    const newIds = new Set<string>()
    const created: DataDigestChange<T, O>[] = []
    const updated: DataDigestChange<T, O>[] = []
    const removed: DataDigestChange<T, O>[] = []
    const nextMap = new Map<string, { obj: O; item: T }>()

    for (const item of items) {
      const id = this.getId(item)
      newIds.add(id)
      const existing = this._map.get(id)
      if (existing) {
        if (!this.comparator(existing.item, item)) {
          this.onUpdate(existing.obj, item, existing.item)
          updated.push({ id, obj: existing.obj, item, oldItem: existing.item })
        }
        nextMap.set(id, { obj: existing.obj, item })
      } else {
        const obj = this.onCreate(item)
        created.push({ id, obj, item })
        nextMap.set(id, { obj, item })
      }
    }

    for (const [id, entry] of this._map) {
      if (!newIds.has(id)) {
        this.onRemove(entry.obj, entry.item)
        removed.push({ id, obj: entry.obj, item: entry.item })
      }
    }

    this._map = nextMap
    return { created, updated, removed }
  }

  /** 清空内部缓存 */
  clear(): void {
    this._map.clear()
  }
}
