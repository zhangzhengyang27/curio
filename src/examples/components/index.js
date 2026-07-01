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
