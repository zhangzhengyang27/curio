// 按 source 分片懒加载注册表，减少首屏 JS 体积
const registryLoaders = {
  'three-cesium-examples': () => import('./threeCesiumExamples.js'),
  'cesium-examples': () => import('./cesiumExamples.js'),
  'threejs-lesson': () => import('./threejsLesson.js'),
  'earth-lessons': () => import('./earthLessons.js'),
  'threejs-official': () => import('./threejsOfficialExamples.js'),
  'granary-3d': () => import('./granary3dExamples.js'),
  'webgl': () => import('./webglExamples.js'),
  'mygrapics': () => import('./mygrapicsExamples.js'),
  'graphics': () => import('./graphicsExamples.js'),
  'three-project': () => import('./threeProjectExamples.js'),
  'city-realtime-webgl': () => import('./cityRealtimeWebglExamples.js'),
}

// 同步缓存（加载完成后可用）
const _registryCache = new Map()
let _allExamplesCache = null
let _loadPromise = null

/**
 * 异步加载所有注册表（首次调用时触发，后续返回缓存）
 */
export function loadAllRegistries() {
  if (_allExamplesCache) return Promise.resolve(_allExamplesCache)
  if (_loadPromise) return _loadPromise
  _loadPromise = Promise.all(
    Object.entries(registryLoaders).map(async ([source, loader]) => {
      const mod = await loader()
      const registry = mod.default || mod
      _registryCache.set(source, registry)
      return registry
    })
  ).then(registries => {
    const list = []
    registries.forEach(registry => {
      registry.examples.forEach(ex => {
        list.push({ source: registry.source, ...ex })
      })
    })
    _allExamplesCache = list
    return list
  })
  return _loadPromise
}

/**
 * 同步获取所有示例（需先调用 loadAllRegistries 完成加载）
 */
export function getAllExamples() {
  if (_allExamplesCache) return _allExamplesCache
  return []
}

/**
 * 异步获取所有示例（自动触发加载）
 */
export async function getAllExamplesAsync() {
  return loadAllRegistries()
}

export function getExampleById(source, category, id) {
  const registry = _registryCache.get(source)
  if (!registry) return null
  return registry.examples.find(ex => ex.category === category && ex.id === id) || null
}

export function getExamplesBySource(source) {
  const registry = _registryCache.get(source)
  return registry ? registry.examples.map(ex => ({ source, ...ex })) : []
}

export function getCategories() {
  const cats = new Map()
  cats.set('all', { key: 'all', label: '全部' })
  getAllExamples().forEach(ex => {
    if (!cats.has(ex.category)) {
      cats.set(ex.category, { key: ex.category, label: ex.categoryLabel || ex.category })
    }
  })
  return Array.from(cats.values())
}

export function getSources() {
  return Object.keys(registryLoaders).map(source => {
    const cached = _registryCache.get(source)
    return { source, label: cached?.label || source }
  })
}
