import { defineAsyncComponent } from 'vue'

/**
 * 将 camelCase / kebab-case / snake_case 的 id 转为 PascalCase
 */
function toPascalCase(id) {
  return id
    .replace(/[-_](.)/g, (_, char) => char.toUpperCase())
    .replace(/^(.)/, (_, char) => char.toUpperCase())
}

/**
 * 按约定路径加载 Vue 示例组件。
 * 约定路径（按优先级）：
 *   ./{source}/{category}/{PascalCaseId}Example.vue
 *   ./{source}/{category}/{id}.vue
 *   ./{source}/{category}/{id}/index.vue
 */
const modules = import.meta.glob('./**/*.vue')

export function loadExampleComponent(source, category, id) {
  const normalizedCategory = category.replace(/^\//, '').replace(/\/$/, '')
  const paths = [
    `./${source}/${normalizedCategory}/${toPascalCase(id)}Example.vue`,
    `./${source}/${normalizedCategory}/${id}.vue`,
    `./${source}/${normalizedCategory}/${id}/index.vue`,
  ]
  for (const path of paths) {
    const loader = modules[path]
    if (loader) return defineAsyncComponent(loader)
  }
  return null
}

/**
 * 按相同约定路径加载示例组件的「源码字符串」（用于「查看代码」）。
 * 使用 ?raw 且 eager:false —— 点击时才懒加载，Vite 会把每个 .vue 打成独立
 * chunk，不进首屏主包（1429 个文件也不会撑大初始加载）。
 * @returns {Promise<{code:string, path:string}|null>} path 为真实命中的 glob key（如 ./xxx/AreaMapExample.vue）
 */
const sourceModules = import.meta.glob('./**/*.vue', {
  query: '?raw',
  import: 'default',
  eager: false,
})

export async function loadExampleSource(source, category, id) {
  const normalizedCategory = category.replace(/^\//, '').replace(/\/$/, '')
  const paths = [
    `./${source}/${normalizedCategory}/${toPascalCase(id)}Example.vue`,
    `./${source}/${normalizedCategory}/${id}.vue`,
    `./${source}/${normalizedCategory}/${id}/index.vue`,
  ]
  for (const path of paths) {
    const loader = sourceModules[path]
    if (loader) {
      try {
        const code = await loader()
        // 解析主文件里 import 的 ExampleScene 共享壳组件，一并返回
        const scenes = await loadReferencedScenes(code)
        // 返回源码 + 真实命中路径（glob key，含 ./ 前缀）+ 引用的场景壳
        return { code, path, scenes }
      } catch (err) {
        console.error('[loadExampleSource] 加载源码失败：', path, err)
        return null
      }
    }
  }
  return null
}

/**
 * 从主示例源码里扫描 import 的「共享场景壳」组件（basename 以 ExampleScene 结尾，
 * 如 ExampleScene.vue / WebGLExampleScene.vue / CesiumExampleScene.vue 等共 7 种），
 * 用同一套 ?raw glob 懒加载它们的源码，供「查看代码」抽屉一并展示。
 * @returns {Promise<Array<{name:string, code:string, path:string}>>}
 */
const SCENE_IMPORT_RE = /import\s+(?:[\w*{}\s,]+?\s+from\s+)?['"]([^'"]+\.vue)['"]/g

async function loadReferencedScenes(mainCode) {
  const scenes = []
  const seen = new Set()
  let m
  while ((m = SCENE_IMPORT_RE.exec(mainCode))) {
    const importPath = m[1]
    const base = importPath.split('/').pop() // 例：ExampleScene.vue
    if (!/ExampleScene\.vue$/i.test(base)) continue // 只取共享壳，忽略其它本地 .vue
    if (seen.has(base)) continue
    seen.add(base)
    const key = `./${base}` // 这些壳都在 src/examples/components/ 顶层
    const loader = sourceModules[key]
    if (loader) {
      try {
        const code = await loader()
        scenes.push({ name: base.replace(/\.vue$/i, ''), code, path: key })
      } catch (err) {
        console.error('[loadExampleSource] 加载 ExampleScene 源码失败：', key, err)
      }
    }
  }
  return scenes
}
