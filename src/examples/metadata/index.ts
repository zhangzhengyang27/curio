/**
 * 展示元数据覆盖层的读取侧。
 *
 * 字段覆盖（title / description / tags）刻意注入在 registry/index.ts 写
 * _registryCache 的那一刻，而不是各个读取口：
 * registry 有三条独立读路径 —— loadAllRegistries 的列表、getExampleById、
 * getExamplesBySource —— 后两条直接读 _registryCache。若只在列表处打补丁，
 * 卡片会显示纠正后的标题、点进详情页却还是「测试」，而且不报任何错。
 * 在写入处套一次，三条路径自动一致。
 *
 * hidden 是例外：这里只打 displayHidden 标记，真正的过滤放在展示层
 * （useGalleryFilters 与 ExampleDemo），理由见 applyDisplayOverrides 的注释。
 */
import type { DisplayOverride } from './displayOverrides.ts'

/** registry 条目里会被覆盖的字段；用结构类型避免与 registry/index.ts 形成循环导入 */
interface Overridable {
  id: string
  category: string
  title: string
  description?: string
  tags?: string[]
  [key: string]: unknown
}

let entryTable: Record<string, DisplayOverride> | null = null
let categoryTable: Record<string, DisplayOverride> | null = null

/**
 * 只说「通过标准渲染流程呈现」、不含任何具体信息的模板描述。
 * 分类级规则仅对这类条目生效，见 applyDisplayOverrides。
 */
const CONTENT_FREE_DESCRIPTION = /这是一个基于[\s\S]*?通过标准渲染流程呈现。$/

/**
 * 覆盖表按需加载。用动态 import 而不是静态：
 * registry/index.ts 是 barrel，静态引入会让「只加载一个分片」也背上整张表。
 */
export async function loadDisplayOverrides(): Promise<void> {
  if (entryTable) return
  const mod = await import('./displayOverrides.ts')
  entryTable = mod.displayOverrides
  categoryTable = mod.displayCategoryOverrides
}

export function displayOverrideKey(source: string, ex: Overridable): string {
  return `${source}|${ex.category}|${ex.id}`
}

/**
 * 套覆盖层。返回新数组，不修改入参
 * （registry 分片模块是共享对象，改它会污染同一次会话里的其它读取）。
 *
 * 两级查找，逐条覆盖优先。分类级规则**只补空洞**：仅当条目原本是无信息的
 * 模板描述时才生效。这不是保守起见 —— 同一个章节里既有「通过标准渲染流程
 * 呈现」的条目，也有写了具体技术点的条目，无条件按章节覆盖会把后者一起抹掉。
 *
 * ⚠ hidden **不在这里剔除条目**，只打 `displayHidden` 标记，由展示层过滤。
 * 原因：verify-registry.mjs / verify-thumbnails.mjs 也走 getAllExamplesAsync()，
 * 在这里删条目会让被隐藏的例子**脱离 R3「id ↔ 组件文件命中」的 CI 检查** ——
 * 展示层不该削减源码完整性检查的覆盖面。实测过：删条目时校验侧条目数从 1417 掉到 1415。
 * hidden 只可能来自逐条覆盖，分类级规则不涉及。
 */
export function applyDisplayOverrides<T extends Overridable>(source: string, examples: T[]): T[] {
  if (!entryTable || !categoryTable) return examples
  return examples.map(ex => {
    let ov: DisplayOverride | undefined = entryTable![displayOverrideKey(source, ex)]
    if (!ov) {
      const catRule = categoryTable![`${source}|${ex.category}`]
      if (catRule && CONTENT_FREE_DESCRIPTION.test(ex.description || '')) ov = catRule
    }
    if (!ov) return ex
    const merged = { ...ex, displayHidden: !!ov.hidden } as T
    if (ov.title) merged.title = ov.title
    if (ov.description !== undefined) merged.description = ov.description
    if (ov.tags) merged.tags = ov.tags
    return merged
  })
}

/** 供诊断脚本用：两张覆盖表的条目数；未加载返回 -1 */
export function displayOverrideCount(): { entries: number, categories: number } {
  return {
    entries: entryTable ? Object.keys(entryTable).length : -1,
    categories: categoryTable ? Object.keys(categoryTable).length : -1,
  }
}
