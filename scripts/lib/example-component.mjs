/**
 * 示例组件的「约定路径」解析 —— 单一事实来源。
 *
 * 示例中心按「约定优于配置」解析组件：
 *   src/examples/components/{source}/{category}/{PascalCase(id)}Example.vue
 *   src/examples/components/{source}/{category}/{id}.vue
 *   src/examples/components/{source}/{category}/{id}/index.vue
 *
 * 这套约定同时被两处使用，且两处必须完全一致，否则会出现
 * 「生成器登记了条目 / 校验器判定组件缺失」的自相矛盾：
 *   - scripts/verify-registry.mjs（校验闸门，缺组件即拦截）
 *   - scripts/generate-registry.js（生成器，决定登记哪些条目）
 *
 * 因此把解析逻辑收敛到本模块，避免两边各写一份后慢慢漂移。
 */
import { existsSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = resolve(fileURLToPath(import.meta.url), '../../..')

export const COMPONENTS_DIR = join(ROOT, 'src/examples/components')

/** 示例 id → 组件文件名用 PascalCase（如 draw-face → DrawFace） */
export const toPascalCase = (id) =>
  id
    .replace(/[-_](.)/g, (_, char) => char.toUpperCase())
    .replace(/^(.)/, (_, char) => char.toUpperCase())

/** 按约定列出某条目所有可能的组件路径（顺序即优先级） */
export function exampleComponentCandidates(source, category, id) {
  const dir = join(COMPONENTS_DIR, source, category)
  return [
    join(dir, `${toPascalCase(id)}Example.vue`),
    join(dir, `${id}.vue`),
    join(dir, id, 'index.vue'),
  ]
}

/** 该示例是否已转换为 Vue 组件（即能否以 runner=vue 登记） */
export function hasExampleComponent(source, category, id) {
  return exampleComponentCandidates(source, category, id).some((p) => existsSync(p))
}
