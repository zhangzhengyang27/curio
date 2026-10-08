/**
 * 示例「展示元数据」覆盖层。
 *
 * 为什么需要这一层：registry 条目的标题与描述是从上游仓库抓取时机械生成的 ——
 * 大量描述共用「这是一个基于 …」一个句式框架，另有若干条标题就是「测试」。
 * registry 分片由生成器维护、被 `npm run verify:drift` 逐字节比对
 * （AGENTS.md R1/R2），手工改文案必被 CI 拦下。
 *
 * 所以：registry 保持"机器可重生成"的纯净状态，人写的展示文案放这里。
 * 本文件不被任何生成器写入、不参与 verify:drift 比对，改它不需要
 * --dry-run/--check/--force 那套流程。
 *
 * key 格式：`${source}|${category}|${id}`
 *   source 用 registryLoaders 的键（如 'three-cesium-examples'），不是 label。
 *
 * 只写需要纠正的条目；没列出的条目原样透传。
 *
 * 2026-10-08：webgl / graphics / mygrapics / city-realtime-webgl 四源已整体迁出
 * 至 html5-dataviz 项目（含本文件中 47 条对应的分类覆盖），本文件只保留 cesium 源。
 */

export interface DisplayOverride {
  /** 覆盖 registry.title */
  title?: string
  /** 覆盖 registry.description */
  description?: string
  /** 覆盖 registry.tags（整体替换，不做合并 —— 合并会让删不掉的旧标签一直留着） */
  tags?: string[]
  /**
   * 从画廊与详情中隐藏。
   * 用于上游仓库的调试页 / 空壳页：它们不是"示例"，摆在归档里只会稀释内容。
   */
  hidden?: boolean
}

export const displayOverrides: Record<string, DisplayOverride> = {
  // ── 上游调试页，非案例 ────────────────────────────────────────────
  'cesium-examples|cesiumExamples/tools|test': {
    title: '影像图层调试页',
    description: '上游仓库的 Cesium 影像图层调试页，用于验证图层挂载，不是完整案例。',
    hidden: true,
  },
}

/** 2026-10-08 四源迁出后已清空（原 graphics/mygrapics/webgl 44 条分类覆盖随源删除） */
export const displayCategoryOverrides: Record<string, DisplayOverride> = {}
