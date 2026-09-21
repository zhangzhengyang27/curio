/**
 * 示例「展示元数据」覆盖层。
 *
 * 为什么需要这一层：src/examples/registry/ 下 1417 条条目里，
 * 标题与描述是从上游仓库（three-cesium-examples 等）抓取时机械生成的 ——
 * 1415 条描述共用「这是一个基于 …」一个句式框架，另有若干条标题就是「测试」。
 * 而 registry 的 4 个分片由生成器维护、被 `npm run verify:drift` 逐字节比对
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
   * 用于上游仓库的调试页 / 空壳页：它们不是"示例"，摆在 1417 条里只会稀释内容。
   */
  hidden?: boolean
}

export const displayOverrides: Record<string, DisplayOverride> = {
  // ── 上游把 id 直接当标题（Theatre.js 是动画编排库，不是 "Theatrejs"）──
  'three-cesium-examples|threeExamples/animation|Theatrejs': {
    title: 'Theatre.js 动画编排',
    description: '用 Theatre.js 编排 Three.js 场景的动画时间轴，可在浏览器里可视化调参。',
    tags: ['Three.js', '动画', 'Theatre.js', '时间轴'],
  },

  // ── 上游调试页，非案例 ────────────────────────────────────────────
  'cesium-examples|cesiumExamples/tools|test': {
    title: '影像图层调试页',
    description: '上游仓库的 Cesium 影像图层调试页，用于验证图层挂载，不是完整案例。',
    hidden: true,
  },
  'three-cesium-examples|threeExamples/other|test': {
    title: '综合调试页',
    description: '上游仓库 Three.js / Cesium 混合环境的调试页，不是完整案例。',
    hidden: true,
  },
}
