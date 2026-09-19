import { ref, computed, watch, onMounted, shallowRef } from 'vue'
import type { Ref } from 'vue'
import type { RegistryExample } from '../registry/index'
import { useRoute, useRouter } from 'vue-router'
import { techGroups, subCategoryDefinitions, ensureRegistryLoaded } from './useExampleFilters'

/**
 * 示例中心画廊的「筛选状态机」：URL ↔ 状态双向同步 + 过滤/分页的全部派生数据。
 *
 * 为什么抽出来：原实现全在 ExampleGallery.vue 的 <script setup> 里（约 170 行），
 * 与 400 行样式混在一起，既无法单独验证，也让组件难以继续拆分。
 * 抽成 composable 后，状态机可以脱离模板被理解和复用。
 *
 * 关键行为（改动前请确认这些不变量仍然成立，E2E 有覆盖）：
 *   - 状态 → URL：切换技术/子分类/搜索/翻页都写回 query，刷新可保持、可分享
 *   - URL → 状态：onMounted + watch(route.query) 还原，支持前进/后退
 *   - 用户主动切换才重置子分类与页码；从 URL 还原时**不**重置
 *     （否则前进/后退会把子分类与页码冲掉）
 */
export const PAGE_SIZE = 16

export function useGalleryFilters() {
  const route = useRoute()
  const router = useRouter()

  const keyword = ref(typeof route.query.search === 'string' ? route.query.search : '')
  const currentTech = ref('all')
  const currentSubCategory = ref('all')
  const currentPage = ref(Number(route.query.page) || 1)
  const pageSize = PAGE_SIZE

  const allExamplesList = shallowRef<RegistryExample[]>([])
  ensureRegistryLoaded().then(list => { allExamplesList.value = list })
  const allExamples = computed(() => allExamplesList.value)

  /**
   * 一次性派生的检索索引：按「技术」分桶 + 预计算小写检索串。
   *
   * 为什么需要：下面 techTabs / availableSubCategories / filteredExamples 原本各自
   * 全量扫一遍全部示例（1417 条），而 subCategoryDefinitions 有 17 条正则、
   * 关键词匹配还要逐条 toLowerCase —— 每敲一个字就整链重算，是几万次正则匹配
   * 加几千次字符串分配。
   *
   * 分桶只在注册表加载完成时构建一次；此后改搜索词只需在「当前技术的桶」里做
   * 字符串匹配，技术维度的匹配不再重复计算。
   */
  const exampleIndex = computed(() => {
    const byTech = new Map<string, RegistryExample[]>(techGroups.map(t => [t.key, [] as RegistryExample[]]))
    // 用 \u0000 分隔，避免跨字段拼接产生意外命中（如标题尾部 + 标签首部连起来）
    const haystacks = new Map<RegistryExample, string>()
    for (const ex of allExamplesList.value) {
      haystacks.set(
        ex,
        [ex.title || '', ex.description || '', ...(ex.tags || [])].join('\u0000').toLowerCase()
      )
      for (const tech of techGroups) {
        if (tech.match(ex)) byTech.get(tech.key)!.push(ex)
      }
    }
    return { byTech, haystacks }
  })

  // 当前技术下的示例集合（复用分桶结果，不在每次输入时重算）
  const techExamples = computed(
    () => exampleIndex.value.byTech.get(currentTech.value) ?? allExamples.value
  )

  const techTabs = computed(() => {
    return techGroups.map(t => ({ ...t, count: exampleIndex.value.byTech.get(t.key)!.length }))
  })

  const currentTechInfo = computed(() => techGroups.find(t => t.key === currentTech.value))
  const currentTechLabel = computed(() => currentTechInfo.value?.label || '全部技术')
  const techExamplesCount = computed(() => techExamples.value.length)

  const availableSubCategories = computed(() => {
    const list = techExamples.value

    const counts = new Map()
    counts.set('all', list.length)

    list.forEach(ex => {
      subCategoryDefinitions.forEach(sub => {
        if (sub.key !== 'all' && sub.match(ex)) {
          counts.set(sub.key, (counts.get(sub.key) || 0) + 1)
        }
      })
    })

    return subCategoryDefinitions
      .filter(sub => sub.key === 'all' || (counts.get(sub.key) || 0) > 0)
      .map(sub => ({ ...sub, count: counts.get(sub.key) || 0 }))
  })

  const filteredExamples = computed(() => {
    const kw = keyword.value.trim().toLowerCase()
    const sub = subCategoryDefinitions.find(s => s.key === currentSubCategory.value)
    const list = techExamples.value

    // 无关键词且不限子分类时直接复用分桶数组，连一次遍历都省掉
    if (!kw && sub?.key === 'all') return list

    return list.filter(ex => {
      if (sub && sub.key !== 'all' && !sub.match(ex)) return false
      if (!kw) return true
      return exampleIndex.value.haystacks.get(ex)!.includes(kw)
    })
  })

  const totalPages = computed(() => Math.ceil(filteredExamples.value.length / pageSize))
  const paginatedExamples = computed(() => {
    const start = (currentPage.value - 1) * pageSize
    return filteredExamples.value.slice(start, start + pageSize)
  })

  const visiblePages = computed(() => {
    const total = totalPages.value
    if (total <= 7) {
      return Array.from({ length: total }, (_, i) => i + 1)
    }

    const current = currentPage.value
    let start = Math.max(2, current - 2)
    let end = Math.min(total - 1, current + 2)

    if (current <= 3) {
      end = 5
    } else if (current >= total - 2) {
      start = total - 4
    }

    const pages: Array<number | string> = [1]
    if (start > 2) pages.push('...')
    for (let i = start; i <= end; i++) pages.push(i)
    if (end < total - 1) pages.push('...')
    pages.push(total)
    return pages
  })

  // 用户主动切换技术 / 子分类时，重置子分类与页码。
  // 注意：不再用 watch(currentTech) / watch([keyword, currentSubCategory]) 自动重置，
  // 否则在浏览器前进/后退（syncQueryToState 从 URL 还原状态）时也会触发重置，
  // 导致子分类与页码状态被冲掉、无法恢复。
  function selectTech(key: string) {
    if (currentTech.value === key) return
    currentTech.value = key
    currentSubCategory.value = 'all'
    currentPage.value = 1
  }

  function selectCategory(key: string) {
    if (currentSubCategory.value === key) return
    currentSubCategory.value = key
    currentPage.value = 1
  }

  function syncQueryToState() {
    const tech = route.query.tech
    const sub = route.query.sub
    const search = route.query.search
    const validTech = typeof tech === 'string' && techGroups.some(t => t.key === tech)
    const validSub = typeof sub === 'string' && subCategoryDefinitions.some(s => s.key === sub)
    if (validTech) currentTech.value = tech as string
    if (validSub) currentSubCategory.value = sub as string
    keyword.value = typeof search === 'string' ? search : ''
    currentPage.value = Number(route.query.page) || 1
  }

  onMounted(syncQueryToState)
  watch(() => route.query, syncQueryToState, { deep: true })

  // 状态 -> URL：切换技术 / 分类 / 搜索时写回 query，刷新可保持、可分享、可前进后退
  watch([currentTech, currentSubCategory, keyword, currentPage], () => {
    const query: Record<string, string | number> = {}
    if (currentTech.value !== 'all') query.tech = currentTech.value
    if (currentSubCategory.value !== 'all') query.sub = currentSubCategory.value
    const kw = keyword.value.trim()
    if (kw) query.search = kw
    if (currentPage.value > 1) query.page = currentPage.value
    // 避免无实质变化时触发导航（防止 watch 循环）
    const currentQuery = route.query
    const isSame = JSON.stringify(query) === JSON.stringify({ ...currentQuery })
    if (!isSame) router.replace({ query })
  })

  // 翻页时滚动到顶部
  watch(currentPage, () => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  })

  return {
    // 状态（模板直接绑定的）
    currentTech,
    currentSubCategory,
    currentPage,
    // 派生数据
    currentTechLabel,
    techExamplesCount,
    techTabs,
    availableSubCategories,
    filteredExamples,
    paginatedExamples,
    totalPages,
    visiblePages,
    // 动作
    selectTech,
    selectCategory,
  }
}
