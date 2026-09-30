/**
 * 「新键 + 旧键一次性迁移」的 localStorage 读取协议(M4 终审 Minor#5 收敛三处逐字抄写)。
 * 模式:读新键;缺失时回退旧键并回填迁移(迁移失败静默保留旧键,下次重试)。
 * 写路径应在持久化成功后调用 removeLegacyKey 清掉孤儿旧键(Minor#6)。
 */
export function readLegacyMigratedStorage(curKey: string, legacyKey: string): string | null {
  try {
    const cur = localStorage.getItem(curKey)
    if (cur !== null) return cur
    const legacy = localStorage.getItem(legacyKey)
    if (legacy !== null) {
      try {
        localStorage.setItem(curKey, legacy)
        localStorage.removeItem(legacyKey)
      } catch { /* 迁移写失败(隐私模式/配额):保留旧键,下次重试 */ }
    }
    return legacy
  } catch {
    return null
  }
}

/** 新键已持久化后清理旧键(孤儿清扫);静默失败无碍 */
export function removeLegacyKey(legacyKey: string): void {
  try {
    localStorage.removeItem(legacyKey)
  } catch { /* 无碍 */ }
}
