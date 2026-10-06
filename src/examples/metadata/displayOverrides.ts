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

  // ── 上游调试页，非案例 ────────────────────────────────────────────
  'cesium-examples|cesiumExamples/tools|test': {
    title: '影像图层调试页',
    description: '上游仓库的 Cesium 影像图层调试页，用于验证图层挂载，不是完整案例。',
    hidden: true,
  },
}

/**
 * 按 `${source}|${category}` 匹配的**批量**覆盖。
 *
 * 为什么按分类而不是逐条：1417 条里有 216 条的描述是完全无信息的
 * 「…通过标准渲染流程呈现。」，它们集中在 64 个 (来源, 章节) 组合里。
 * 写 64 条规则而不是 216 条逐条覆盖，同章节以后新增的示例会自动生效。
 *
 * 只替换描述、不动 title/tags，且**逐条覆盖优先级更高**（见 metadata/index.ts）。
 *
 * 这些文字没有一句是编造的：category 里本来就带着课程章节
 * （如 kaikeba-webgl/08-glsl-es语言），但画廊此前**从不展示 category**
 * （getCategories() 无人调用），等于信息存在却对用户不可见。
 * 来源标签（「Three.js 案例」等）卡片上已有徽标，所以这里刻意不重复。
 */
export const displayCategoryOverrides: Record<string, DisplayOverride> = {
  "graphics|d3": { description: "D3 数据可视化专题" },
  "graphics|d3-spritejs": { description: "D3 + SpriteJS 专题" },
  "graphics|data-graph-css": { description: "CSS 数据图形专题" },
  "graphics|data-graph-svg": { description: "SVG 数据图形专题" },
  "graphics|data/park-people": { description: "公园人流可视化专题" },
  "graphics|data/weather": { description: "天气可视化专题" },
  "graphics|github-contributions": { description: "GitHub 贡献图专题" },
  "graphics|gl-raffle": { description: "WebGL 抽奖专题" },
  "graphics|misc": { description: "杂项专题" },
  "graphics|normal-maps": { description: "法线贴图专题" },
  "graphics|performance-basic": { description: "渲染性能（基础）专题" },
  "graphics|performance-more": { description: "渲染性能（进阶）专题" },
  "graphics|performance-webgl": { description: "WebGL 渲染性能专题" },
  "graphics|performance_canvas": { description: "Canvas 渲染性能专题" },
  "graphics|qcharts": { description: "图表组件集专题" },
  "graphics|sketch": { description: "生成艺术速写专题" },
  "graphics|vis-geo-earth/demos": { description: "综合演示专题" },
  "graphics|vis-geo-earth/docs": { description: "文档配套专题" },
  "graphics|vis-geo-earth/examples": { description: "综合示例专题" },
  "mygrapics|3d-camera": { description: "3D 相机专题" },
  "mygrapics|animate": { description: "动画专题" },
  "mygrapics|bezier": { description: "贝塞尔曲线专题" },
  "mygrapics|canvas": { description: "Canvas 绘图专题" },
  "mygrapics|canvas/basic": { description: "基础专题" },
  "mygrapics|canvas/hierarchy": { description: "层级结构专题" },
  "mygrapics|color-hints": { description: "配色提示专题" },
  "mygrapics|coordinates": { description: "坐标系专题" },
  "mygrapics|parametric": { description: "参数化图形专题" },
  "mygrapics|parametric-polar": { description: "极坐标参数化专题" },
  "mygrapics|parametric2": { description: "参数化图形（进阶）专题" },
  "mygrapics|pixels": { description: "像素操作专题" },
  "mygrapics|svg/basic": { description: "基础专题" },
  "mygrapics|svg/hierarchy": { description: "层级结构专题" },
  "mygrapics|triangluations": { description: "三角剖分专题" },
  "mygrapics|vector_draw": { description: "向量绘制专题" },
  "mygrapics|vector_tree": { description: "向量树专题" },
  "mygrapics|webgl_particles": { description: "WebGL 粒子专题" },
  "webgl|kaikeba-webgl/01-webgl-入门-webgl": { description: "WebGL 入门专题" },
  "webgl|kaikeba-webgl/04-矩阵变换": { description: "矩阵变换专题" },
  "webgl|kaikeba-webgl/05-复合变换": { description: "复合变换专题" },
  "webgl|kaikeba-webgl/06-颜色与纹理": { description: "颜色与纹理专题" },
  "webgl|kaikeba-webgl/07-视图矩阵的本质": { description: "视图矩阵的本质专题" },
  "webgl|kaikeba-webgl/08-glsl-es语言": { description: "GLSL 语言专题" },
  "webgl|study-webgl/1-base": { description: "WebGL 基础专题" },
  "webgl|study-webgl/3-三维世界与光照": { description: "三维世界与光照专题" },
  "webgl|study-webgl/4-层次模型": { description: "层次模型专题" },
}
