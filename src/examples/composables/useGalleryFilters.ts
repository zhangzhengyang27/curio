import { ref, computed, watch, onMounted, onBeforeUnmount, shallowRef } from 'vue'
import type { Ref } from 'vue'
import type { RegistryExample } from '../registry/index'
import { useRoute, useRouter } from 'vue-router'
import { techGroups, techSearchTerms, subCategoryDefinitions, countSubCategories, ensureRegistryLoaded } from './useExampleFilters'

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
/**
 * 每页 16 时 1415 条要 89 页，配合「翻页不回到顶部」基本没人能翻过第 3 页。
 * 48 在 1440 宽下正好是 4 列 × 12 行，页数降到 30。
 */
export const PAGE_SIZE = 48

/**
 * 画廊的滚动容器。
 *
 * theme.css 给 html / body / #app 都设了 height:100% + overflow:auto，
 * 于是文档本身永远不溢出，真正溢出的是 #app —— window.scrollTo() 在那里是空操作。
 * 这正是「翻页后停在原处、看起来像没反应」的根因。
 * （/tools、/analysis、/monitor 各自带 overflow 容器，不受这条影响。）
 */
export function galleryScrollRoot(): HTMLElement | null {
  return document.getElementById('app')
}

/** 详情返回列表时的滚动位置暂存键；值形如 `${fullPath}|${scrollTop}` */
const SCROLL_KEY = 'tv:examples:scroll'

export function useGalleryFilters() {
  const route = useRoute()
  const router = useRouter()

  const keyword = ref(typeof route.query.search === 'string' ? route.query.search : '')
  const currentTech = ref('all')
  const currentSubCategory = ref('all')
  const currentPage = ref(Number(route.query.page) || 1)
  const pageSize = PAGE_SIZE

  const allExamplesList = shallowRef<RegistryExample[]>([])

  /**
   * 从示例详情返回时恢复列表滚动位置。
   *
   * 浏览器原生的前进/后退恢复只作用于文档滚动根，而这里滚动的是 #app
   * （见 galleryScrollRoot 注释），所以 ?page=3 能回来但位置基本归零。
   *
   * 两件必须处理的事：
   *   ① 容器还没长开时赋值会被夹到当前最大值 → 每 100ms 重试直到放得下。
   *      不用 requestAnimationFrame：它在后台/不可见页会被节流。
   *   ② Chrome 自己也会异步恢复一次 #app，落地时内容往往还很短，于是把一个
   *      夹小后的值盖在我们设好的位置上，而且**不派发 scroll 事件**（实测收不到），
   *      所以只能落位后持续强制 1.5s 把它压回去。期间用户任何输入都立刻让路，
   *      不会出现「滚不动」。
   *      刻意不改 history.scrollRestoration —— 那是全站开关，会连带影响
   *      /tools 等自带滚动容器的页面。
   */
  let userTouched = false
  let restoreTimer: ReturnType<typeof setInterval> | null = null
  const markUserTouched = () => { userTouched = true }

  function clearRestoreTimer() {
    if (restoreTimer !== null) {
      clearInterval(restoreTimer)
      restoreTimer = null
    }
  }

  function restoreScroll() {
    const saved = sessionStorage.getItem(SCROLL_KEY)
    if (!saved) return
    const [url, topRaw] = saved.split('|')
    const top = Number(topRaw)
    if (url !== route.fullPath || !(top > 0)) {
      sessionStorage.removeItem(SCROLL_KEY)
      return
    }
    userTouched = false
    sessionStorage.removeItem(SCROLL_KEY)

    const deadline = Date.now() + 3500
    let settledTicks = 0
    clearRestoreTimer()
    restoreTimer = setInterval(() => {
      const root = galleryScrollRoot()
      if (!root || userTouched) {
        clearRestoreTimer()
        return
      }
      if (root.scrollHeight - root.clientHeight >= top) {
        root.scrollTop = top
        if (++settledTicks >= 15) clearRestoreTimer()
      } else if (Date.now() > deadline) {
        clearRestoreTimer()
      }
    }, 100)
  }

  ensureRegistryLoaded().then(list => {
    // displayHidden 在这里过滤，而不是在 registry 缓存处删条目 ——
    // 否则 verify-registry / verify-thumbnails 会跟着少检这些条目（见 metadata/index.ts）
    allExamplesList.value = list.filter(ex => !ex.displayHidden)
    restoreScroll()
  })
  const allExamples = computed(() => allExamplesList.value)

  /**
   * 一次性派生的检索索引：按「技术」分桶 + 预计算小写检索串。
   *
   * 为什么需要：下面 techTabs / availableSubCategories / filteredExamples 原本各自
   * 全量扫一遍全部示例（1417 条），而 subCategoryDefinitions 有 17 条分类匹配器、
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
      // 分面派生词一并进检索串，让「地图」这类领域词能命中地理条目（取舍见 techSearchTerms 注释）
      const facetWords = techGroups
        .filter(t => t.key !== 'all' && t.match(ex))
        .flatMap(t => techSearchTerms[t.key] || [])
      haystacks.set(
        ex,
        [ex.title || '', ex.description || '', ...(ex.tags || []), ...facetWords].join('\u0000').toLowerCase()
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
    const counts = countSubCategories(techExamples.value)
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

  // 页码钳制。两个来源会让 currentPage 落到有效范围之外：
  //   ① 顶栏写 ?search= 时是 {...route.query}（src/App.vue），旧 page 被原样保留——
  //      在第 3 页输入关键词、结果不足 3 页时 paginatedExamples 为空，
  //      而 filteredExamples.length 又 >0，连空态提示都不显示 → 用户见「共 N 个」配空白网格；
  //   ② 手输/分享的 ?page=999、?page=-3、?page=2.5 直接落进 slice（负数会从尾部取错数据）。
  // 放在这里而不是让 selectTech/selectCategory 重置，是因为它们管不到「搜索」这条路径，
  // 且前进/后退还原 URL 时不该被额外重置。
  watch([totalPages, currentPage], () => {
    const max = Math.max(1, totalPages.value)
    const cur = Math.floor(Number(currentPage.value))
    if (!Number.isFinite(cur) || cur < 1) currentPage.value = 1
    else if (cur > max) currentPage.value = max
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

  /**
   * 用户点击页码：改页码并把容器滚回顶部。
   *
   * 为什么挂在动作上而不是 watch(currentPage)：currentPage 会被三条路径改动 ——
   * 用户翻页、URL 还原（syncQueryToState）、越界钳制。后两条不该滚，
   * 而且会和 restoreScroll 抢同一个容器（实测恢复到的 700 被拽回 33）。
   */
  function goToPage(page: number) {
    if (page === currentPage.value) return
    currentPage.value = page
    galleryScrollRoot()?.scrollTo({ top: 0, behavior: 'smooth' })
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

  /**
   * 记下滚动位置，供 restoreScroll 用。
   *
   * 在卡片 click 的**捕获阶段**同步取值，而不是挂 scroll 监听：
   * 点下去之后浏览器会把 #app 改写一次（实测视口 720 高时被夹到 75、900 高时 33），
   * 且那次改写早于路由守卫与组件卸载 —— 所以「滚动时记」和「离开时读」都会把
   * 浏览器的中间态当成用户的位置。捕获阶段的 click 先于这一切副作用。
   */
  const onCardClickCapture = (e: MouseEvent) => {
    const target = e.target as Element | null
    if (!target?.closest?.('.example-card')) return
    const root = galleryScrollRoot()
    // 0 不覆盖已存的值 —— 它代表「回到顶部」，不是一个值得恢复的位置
    if (root && root.scrollTop > 0) {
      sessionStorage.setItem(SCROLL_KEY, `${route.fullPath}|${root.scrollTop}`)
    }
  }

  onMounted(() => {
    galleryScrollRoot()?.addEventListener('click', onCardClickCapture, true)
    // 任何真实输入都意味着「用户接管了」，恢复逻辑立刻让路
    window.addEventListener('wheel', markUserTouched, { passive: true })
    window.addEventListener('pointerdown', markUserTouched, { passive: true })
    window.addEventListener('keydown', markUserTouched)
  })

  onBeforeUnmount(() => {
    // 必须清掉：这个 interval 会直接给 #app 赋 scrollTop，而 #app 是全站共用的
    // 滚动容器。不清的话用户从列表页再跳到别的页，最多 3.5 秒内仍会被拽回旧位置。
    clearRestoreTimer()
    galleryScrollRoot()?.removeEventListener('click', onCardClickCapture, true)
    window.removeEventListener('wheel', markUserTouched)
    window.removeEventListener('pointerdown', markUserTouched)
    window.removeEventListener('keydown', markUserTouched)
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
    goToPage,
  }
}
