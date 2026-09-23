import type { RegistryExample } from '../registry/index'

/**
 * 示例卡片 / 详情页的「这条到底是哪一个」辅助信息。
 *
 * 为什么需要：1415 条里只有 967 个唯一标题，最糟的一组 32 条全叫
 * 「加载器：模型加载」，而且它们的 category、categoryLabel 也完全相同
 * （都是 webgl/loader / 加载器）—— 界面上三个字段没有一个能把它们分开，
 * 唯一携带差异的是 id 的尾段（webgl_loader_3dm → 3dm）。
 *
 * 这里只读取已有字段做展示推导，不改 registry（示例中心是只读归档，见 docs/ROADMAP.md 第 0 节）。
 */

/** 分类展示名：优先用 registry 里的中文 categoryLabel，退回 category 原文 */
export function exampleCategoryLabel(ex: RegistryExample): string {
  return ex.categoryLabel || ex.category || ''
}

/**
 * 从 id 里剥掉「分类」已经表达过的前缀，剩下的才是这条真正的区分点。
 *
 * 例：category `webgl/loader` + id `webgl_loader_3dm` → `3dm`。
 * 剥不出有效尾段时返回空串（调用方据此不渲染），避免把 id 整串糊到界面上。
 */
export function exampleDiscriminator(ex: RegistryExample): string {
  const category = String(ex.category || '')
  const id = String(ex.id || '')
  if (!category || !id) return ''
  const prefix = `${category.replace(/\//g, '_')}_`
  if (!id.toLowerCase().startsWith(prefix.toLowerCase())) return ''
  const rest = id.slice(prefix.length)
  // 尾段过长说明它不是「格式名」而是整条路径的重复，贴上去只会污染卡片
  return rest && rest.length <= 28 ? rest : ''
}
