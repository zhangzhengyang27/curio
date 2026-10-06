import { computed, ref, shallowRef } from 'vue'
import { getAllExamples, loadAllRegistries } from '../registry/index.ts'
import type { RegistryExample } from '../registry/index.ts'

// 全局响应式加载状态
const registryReady = ref(false)
const allExamplesList = shallowRef<RegistryExample[]>([])

let _initPromise: Promise<RegistryExample[]> | null = null
export function ensureRegistryLoaded() {
  if (!_initPromise) {
    _initPromise = loadAllRegistries().then((list: RegistryExample[]) => {
      allExamplesList.value = list
      registryReady.value = true
      return list
    })
  }
  return _initPromise
}

/**
 * 「地理 / GIS」分面。
 *
 * 为什么要单独一个分面而不是只靠技术栈：这个库按渲染技术组织（着色器 / 材质 / 灯光…），
 * 而产品本身是数字地球平台（docs/ROADMAP.md 1.1）。结果是搜「地图」只出 6 条、
 * 「中国」1 条、「GIS」1 条 —— 不是没有相关内容，是元数据里根本没有地理这个词。
 * 本分面由 source + category 规则自动判定，不逐条人工整改（示例中心是只读归档）。
 *
 * 判定口径：来源本身就是地理引擎/地理专题的，整源计入；
 * 其余来源只计入明确带地理语义的章节。
 */
const GEO_SOURCES = [
  'cesium-examples',
  'city-realtime-webgl',
]

/** 非地理来源里，章节本身就带地理语义的 category 片段 */
const GEO_CATEGORY_HINTS = [
  'vis-geo-earth',
  'city-realtime',
  'weather',
  'covid',
  'park-people',
  'github-contributions',
  'polyline-curve',
  'polygon-fill',
]

export function isGeoExample(ex: RegistryExample): boolean {
  if (GEO_SOURCES.includes(ex.source)) return true
  const category = (ex.category || '').toLowerCase()
  return GEO_CATEGORY_HINTS.some(hint => category.includes(hint))
}

/**
 * 分面在检索里应当被哪些词命中。
 *
 * 为什么不直接用分面标签：标签叫「地理 / GIS」，但用户搜的是「地图」。
 * 这批词**只进检索索引、不写进 registry** —— 示例中心是只读归档，
 * 给 380 条逐条补标签要动生成器并撞 verify:drift（AGENTS.md R1/R2）。
 *
 * ⚠ 代价是「语义不透明」：搜「地图」会命中元数据里根本没写「地图」二字的条目
 * （cesium-examples 整源计入 geo）。
 * 这是需求方 2026-09-23 明确选的取舍 —— 原先搜「地图」只出 6 条、
 * 「GIS」1 条，等于地理内容在 1415 条库里不可检索。
 */
export const techSearchTerms: Record<string, string[]> = {
  geo: ['地理', '地图', 'GIS'],
}

export const techGroups = [
  { key: 'all', label: '全部技术', match: () => true },
  { key: 'cesium', label: 'Cesium', match: (ex: RegistryExample) => ex.source === 'cesium-examples' || (ex.category && ex.category.startsWith('cesiumExamples/')) },
  { key: 'webgl', label: 'WebGL', match: (ex: RegistryExample) => ex.source === 'webgl' || ex.source === 'city-realtime-webgl' || ex.category === 'webglExamples' },
  { key: 'graphics', label: 'Graphics / MyGrapics', match: (ex: RegistryExample) => ex.source === 'graphics' || ex.source === 'mygrapics' },
  // 与 Cesium 标签有意重叠（Cesium 本来就是地球引擎），价值在于把散在
  // graphics 里的地理章节也一并收进来，并让「地图」这个词可搜。
  { key: 'geo', label: '地理 / GIS', match: isGeoExample },
]

/**
 * 子分类的匹配原语。
 *
 * 为什么不再用「对 category 整串跑一条松散正则」：category 是 `webxr/ar`、
 * `cesiumExamples/xxx` 这样的**路径**，整串正则会跨词边界误命中。
 * 旧实现里 `/(xr|vr|ar|webxr)/i` 把 particle / parallax / clearcoat / morphtargets
 * 全分进了「XR / VR / AR」—— 116 条中 87 条是误分，占该桶 75%。
 * 拆成「短词整段相等 / 长词才允许词干包含」两类后，这两类误分都能结构性避免。
 *
 * 约定：stem() 只传 ≥4 个字符的拉丁词干或 ≥2 个汉字的词干；
 * 更短的（xr / vr / ar / d3 / tsl / ubo / uv）一律走 seg()。
 * 三条不变量由 tests/example-taxonomy.spec.ts 守住。
 */
const catSegments = (ex: RegistryExample) =>
  (ex.category || '').toLowerCase().split('/').filter(Boolean)

const catTokens = (ex: RegistryExample) =>
  (ex.category || '').toLowerCase().split(/[^a-z0-9一-鿿]+/).filter(Boolean)

/** category 的某个路径段整词等于 words 之一 */
function seg(...words: string[]) {
  return (ex: RegistryExample) => words.some(w => catSegments(ex).includes(w))
}

/** category 的某个词元包含 stems 之一 */
function stem(...stems: string[]) {
  return (ex: RegistryExample) => {
    const tokens = catTokens(ex)
    return stems.some(s => tokens.some(t => t.includes(s)))
  }
}

/** 任一子匹配器命中即可 */
function anyOf(...matchers: Array<(ex: RegistryExample) => boolean>) {
  return (ex: RegistryExample) => matchers.some(m => m(ex))
}

/**
 * 前 16 桶是人工语义；最后「其他 / 未归类」取**补集**，
 * 由此让「每条示例至少落在一个子分类里」成为恒成立的不变量 ——
 * 旧实现漏掉 125 条（整块漏分类的场景），
 * 那些条目在任何子分类下都筛不到，且不会有任何报错。
 * 该桶计数同时是分类质量的棘轮：它变大说明 registry 引入了新的 category 词。
 */
const definedCategories = [
  {
    key: 'basics',
    label: '基础入门',
    match: stem('basic', 'base', 'start', 'scene', 'cleanup', 'scenegraph', 'helper',
      'simple', 'watch', 'hierarchy', 'coordinat', 'machineroom', 'lesson', '入门', '层次'),
  },
  {
    key: 'geometry',
    label: '几何体 / 线条',
    match: stem('geometr', 'polygon', 'polyline', 'curve', 'triang', 'lines', 'model',
      'vector', 'shaping', 'centroid', 'marchingcube', 'clip', 'parametric', 'mesh',
      '几何', '线条', '三角', '形状'),
  },
  {
    key: 'materials',
    label: '材质 / 纹理',
    match: stem('material', 'texture', 'normal', 'cubemap', 'pmrem', 'decal', 'clearcoat',
      'mirror', 'reflection', 'refraction', 'panorama', 'portal', 'video', 'backdrop',
      'caustic', 'ocean', 'water', 'sky', 'fog', 'procedural', 'hdr', 'display',
      'renderer', 'color', 'equirectangular', 'parallax', 'tonemap', '纹理', '颜色', '贴图'),
  },
  {
    key: 'lights',
    label: '灯光 / 阴影',
    match: stem('light', 'shadow', 'lensflare', 'occlusion', '光照', '灯光'),
  },
  {
    key: 'shader',
    label: '着色器 / GLSL',
    match: anyOf(
      stem('shader', 'glsl', 'noise', 'pixel', 'gpgpu', 'compute', 'custom', 'sandbox',
        'polar', 'generator', 'struct', 'storage', 'compile', '着色器', '语言'),
      seg('tsl', 'ubo'),
    ),
  },
  {
    key: 'animation',
    label: '动画 / 粒子',
    match: stem('animat', 'particl', 'morph', 'skin', 'instanc', 'point', 'batch',
      'sprite', 'random', '动画', '粒子'),
  },
  {
    key: 'post-effects',
    label: '后期处理 / 特效',
    match: stem('post', 'effect', 'pass', 'furnace', 'worker', 'lod', 'upscaling',
      'raffle', '特效', '后处理'),
  },
  {
    key: 'interaction',
    label: '交互 / 相机',
    match: anyOf(
      stem('control', 'camera', 'raycast', 'boxselection', 'multiple', 'interact',
        '拾取', '交互'),
      seg('uv'),
    ),
  },
  {
    key: 'loader',
    label: '加载器 / 资源',
    match: stem('loader', 'exporter', 'layer', 'offline', '加载', '资源'),
  },
  {
    key: 'data-viz',
    label: '数据可视化',
    match: anyOf(
      stem('data', 'chart', 'covid', 'github', 'graph', 'weather', 'city', 'vis-geo',
        'park-people', '可视化'),
      seg('d3'),
    ),
  },
  {
    key: 'math',
    label: '数学 / 变换',
    match: stem('quaternion', 'matrix', 'vector', 'math', 'easing', 'bezier', 'spline',
      'random', '矩阵', '变换'),
  },
  {
    key: 'expand',
    label: '扩展 / 综合',
    match: anyOf(
      stem('expand', 'other', 'misc', 'test', 'canvas', 'css2d', 'css3d', 'sketch',
        'svg', 'performance', 'applic', 'modifier', 'tools', 'demo', '示例', '案例', '综合'),
      seg('examples'),
    ),
  },
]

export const subCategoryDefinitions = [
  { key: 'all', label: '全部', match: () => true },
  ...definedCategories,
  {
    key: 'unclassified',
    label: '其他 / 未归类',
    match: (ex: RegistryExample) => !definedCategories.some(c => c.match(ex)),
  },
]

/**
 * 一组示例在各子分类下的计数。侧栏（useGalleryFilters）与顶栏下拉
 * （getSubCategoriesByTech）共用同一份遍历，避免两处各写一遍而漂移。
 */
export function countSubCategories(list: RegistryExample[]) {
  const counts = new Map<string, number>()
  counts.set('all', list.length)
  for (const ex of list) {
    for (const sub of subCategoryDefinitions) {
      if (sub.key !== 'all' && sub.match(ex)) {
        counts.set(sub.key, (counts.get(sub.key) || 0) + 1)
      }
    }
  }
  return counts
}

export function getSubCategoriesByTech(techKey: string) {
  const tech = techGroups.find(t => t.key === techKey)
  if (!tech) return []

  const counts = countSubCategories(getAllExamples().filter(ex => tech.match(ex)))
  return subCategoryDefinitions
    .filter(sub => sub.key === 'all' || (counts.get(sub.key) || 0) > 0)
    .map(sub => ({ ...sub, count: counts.get(sub.key) || 0 }))
}

export function useExampleFilters() {
  // 刻意 **不在** setup 阶段触发 ensureRegistryLoaded()。
  //
  // 本 composable 被 App.vue 的全局顶栏使用，而顶栏在所有路由（含首页）都会挂载；
  // 在 setup 里触发一次，就等于把 11 个 registry（约 43 KB，见 docs/PERF_BASELINE.md）
  // 钉进首屏依赖图 —— 而首页根本不需要它，顶栏的示例分类菜单要等用户打开才渲染。
  //
  // 约定：需要数据时由调用方在合适时机主动调用返回的 ensureRegistryLoaded
  // （悬停/打开下拉、聚焦搜索框、进入 /examples）。/examples 下的页面本身
  // 也会在 setup 阶段调用 ensureRegistryLoaded，不依赖这里。
  const allExamples = computed(() => allExamplesList.value)

  const techList = computed(() => {
    return techGroups.map(tech => {
      const count = tech.key === 'all'
        ? allExamples.value.length
        : allExamples.value.filter(ex => tech.match(ex)).length
      return { ...tech, count }
    })
  })

  return {
    techGroups,
    subCategoryDefinitions,
    techList,
    registryReady,
    getSubCategoriesByTech,
    ensureRegistryLoaded
  }
}
