// 按 source 分片懒加载注册表，减少首屏 JS 体积
// ⚠ 显式 .ts 扩展：本模块同时被 Vite 应用与 verify-registry(Node strip-types)消费,
// 后者无法解析无扩展名导入;tsconfig 已开 allowImportingTsExtensions。

import { applyDisplayOverrides, loadDisplayOverrides } from '../metadata/index.ts'

/** registry 单条示例条目(生成器维护,字段见 scripts/generate-registry.js) */
export interface RegistryExample {
  id: string
  source: string
  category: string
  categoryLabel?: string
  title: string
  description?: string
  tags?: string[]
  thumbnail?: string
  runner: string
  entry?: string
  [key: string]: unknown
}

// 2026-10-08：webgl / graphics / mygrapics / city-realtime-webgl 四源已整体迁出至
// html5-dataviz 项目（组件/分片/资产同批删除），仅剩 cesium-examples。
const registryLoaders = {
  'cesium-examples': () => import('./cesiumExamples.ts'),
}

/**
 * 全部已知来源键。
 *
 * 与 getSources() 的区别：那个要等 11 个分片加载完才有（且 label 从缓存取），
 * 而 URL 参数校验发生在 onMounted —— 那时注册表还没落地，拿它校验 ?src=webgl
 * 会一律判为非法。分面列表可以在加载后用 getSources() 补中文名，校验用这里。
 */
export const KNOWN_SOURCES: readonly string[] = Object.keys(registryLoaders)

// 同步缓存（加载完成后可用）
const _registryCache = new Map<string, { source: string; label: string; examples: RegistryExample[] }>()
let _allExamplesCache: RegistryExample[] | null = null
let _loadPromise: Promise<RegistryExample[]> | null = null

/**
 * 异步加载所有注册表（首次调用时触发，后续返回缓存）
 */
export function loadAllRegistries() {
  if (_allExamplesCache) return Promise.resolve(_allExamplesCache)
  if (_loadPromise) return _loadPromise
  _loadPromise = Promise.all(
    Object.entries(registryLoaders).map(async ([source, loader]) => {
      const mod = await loader()
      const registry = (mod.default || mod) as unknown as { source: string; label: string; examples: RegistryExample[] }
      // 覆盖层必须在写缓存之前套上：getExampleById / getExamplesBySource 直接读
      // _registryCache，在这里套一次三条读路径才一致（见 metadata/index.ts）
      await loadDisplayOverrides()
      _registryCache.set(source, {
        ...registry,
        examples: applyDisplayOverrides(source, registry.examples),
      })
      return _registryCache.get(source)!
    })
  ).then(registries => {
    const list: RegistryExample[] = []
    registries.forEach(registry => {
      registry.examples.forEach(ex => {
        list.push({ ...ex, source: registry.source })
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

export function getExampleById(source: string, category: string, id: string) {
  const registry = _registryCache.get(source)
  if (!registry) return null
  return registry.examples.find(ex => ex.category === category && ex.id === id) || null
}

export function getExamplesBySource(source: string) {
  const registry = _registryCache.get(source)
  return registry ? registry.examples.map(ex => ({ ...ex, source })) : []
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
