/**
 * 数据驱动的差异更新工具
 * 通过唯一 id 对比新旧数据，仅创建/更新/删除变化的 Three.js 对象
 */
export class DataDigest {
  /**
   * @param {object} options
   * @param {function} [options.getId] - 从数据项中提取唯一 id（默认 item.id || JSON.stringify(item)）
   * @param {function} options.onCreate - 为新数据项创建 Three.js 对象
   * @param {function} [options.onUpdate] - 数据项变化时更新已有对象
   * @param {function} [options.onRemove] - 对象被移除前的回调
   * @param {function} [options.comparator] - 比较两个数据项是否相等（默认 JSON.stringify 深比较）
   */
  constructor(options = {}) {
    this.getId = options.getId || (item => item?.id ?? JSON.stringify(item))
    this.onCreate = options.onCreate || (() => {})
    this.onUpdate = options.onUpdate || (() => {})
    this.onRemove = options.onRemove || (() => {})
    this.comparator = options.comparator || ((a, b) => JSON.stringify(a) === JSON.stringify(b))
    /** @type {Map<string, {obj: any, item: any}>} */
    this._map = new Map()
  }

  /**
   * 对比新数据与旧数据，触发创建/更新/移除回调
   * @param {Array} data
   * @returns {{created: Array, updated: Array, removed: Array}}
   */
  update(data) {
    const items = Array.isArray(data) ? data : []
    const newIds = new Set()
    const created = []
    const updated = []
    const removed = []
    const nextMap = new Map()

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
  clear() {
    this._map.clear()
  }
}
