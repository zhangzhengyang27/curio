import { ref, computed, watch, onMounted, onBeforeUnmount, shallowRef } from 'vue'
import type { RegistryExample } from '../registry/index'
import { KNOWN_SOURCES, getSources } from '../registry/index'
import { useRoute, useRouter } from 'vue-router'
import { techGroups, techSearchTerms, subCategoryDefinitions, ensureRegistryLoaded } from './useExampleFilters'

/**
 * 示例中心画廊的「筛选状态机」：URL ↔ 状态双向同步 + 分面计数 / 过滤 / 排序 / 分页。
 *
 * 为什么抽出来：原实现全在 ExampleGallery.vue 的 <script setup> 里（约 170 行），
 * 与 400 行样式混在一起，既无法单独验证，也让组件难以继续拆分。
 *
 * 关键行为（改动前请确认这些不变量仍然成立，E2E 有覆盖）：
 *   - 状态 → URL：切换任何筛选/排序/视图都写回 query，刷新可保持、可分享
 *   - URL → 状态：onMounted + watch(route.query) 还原，支持前进/后退
 *   - 用户主动切换才重置子分类与页码；从 URL 还原时**不**重置
 *     （否则前进/后退会把子分类与页码冲掉）
 *
 * ── 检索索引（2026-09-23 重构）───────────────────────────────────────────
 * 三个筛选维度（技术 / 来源 / 专题）各自要显示「在其它维度已生效条件下的计数」，
 * 这是标准分面检索。老实现只算「技术 × 专题」两层，且每敲一个字就对 1417 条
 * 重跑 17 条专题匹配器 —— 三维度分面会把这个成本 ×3。
 *
 * 所以改成：注册表落地时**一次性**把每条示例的维度归属算成字符串数组（技术键、
 * 专题键、来源键 + 检索串），此后任何一次交互都只是在这些数组上做 includes，
 * 匹配器（含正则 / 分词）不再参与运行时计算。
 */

/** 每页条数选项。默认 48：1440 宽下正好 4 列 × 12 行，1417 条降到 30 页。 */
export const PAGE_SIZE_OPTIONS = [24, 48, 96]
export const DEFAULT_PAGE_SIZE = 48

export const SORT_OPTIONS = [
  { key: 'default', label: '推荐顺序' },
  { key: 'title', label: '标题 A→Z' },
  { key: 'source', label: '按来源分组' },
  { key: 'category', label: '按专题分组' },
] as const

export type GallerySortKey = (typeof SORT_OPTIONS)[number]['key']
export type GalleryView = 'grid' | 'list'
export type GalleryDensity = 'comfortable' | 'compact'

/** 分面项：键 + 展示名 + 在当前其它维度条件下的命中数 */
export interface GalleryFacet {
  key: string
  label: string
  count: number
}

/** 已选条件 chip */
export interface ActiveFilter {
  key: 'tech' | 'source' | 'sub' | 'search'
  label: string
  value: string
}

interface IndexedExample {
  ex: RegistryExample
  /** 小写检索串，字段间用 \u0000 分隔（避免跨字段拼接产生意外命中） */
  haystack: string
  /** 命中的技术键（不含 'all'） */
  techs: string[]
  /** 命中的专题键（不含 'all'） */
  subs: string[]
  source: string
}

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
/** 密度是个人偏好，不进 URL（分享链接不该把对方的视图设成紧凑） */
const DENSITY_KEY = 'tv:examples:density'

/** 中文标题排序要用 collator，否则 localeCompare 的拼音序在部分浏览器不一致 */
const collator = new Intl.Collator('zh-Hans-CN', { numeric: true, sensitivity: 'base' })

function readDensity(): GalleryDensity {
  try {
    return localStorage.getItem(DENSITY_KEY) === 'compact' ? 'compact' : 'comfortable'
  } catch {
    return 'comfortable'
  }
}

/** 逐键比对，避免 JSON.stringify 受键顺序影响而误判为「有变化」触发多余导航 */
function sameQuery(a: Record<string, unknown>, b: Record<string, unknown>) {
  const ka = Object.keys(a).filter(k => a[k] !== undefined && a[k] !== '')
  const kb = Object.keys(b).filter(k => b[k] !== undefined && b[k] !== '')
  if (ka.length !== kb.length) return false
  return ka.every(k => String(a[k]) === String(b[k]))
}

export function useGalleryFilters() {
  const route = useRoute()
  const router = useRouter()

  const keyword = ref(typeof route.query.search === 'string' ? route.query.search : '')
  const currentTech = ref('all')
  const currentSource = ref('all')
  const currentSubCategory = ref('all')
  const sort = ref<GallerySortKey>('default')
  const view = ref<GalleryView>('grid')
  const density = ref<GalleryDensity>(readDensity())
  const currentPage = ref(Number(route.query.page) || 1)
  const pageSize = ref(DEFAULT_PAGE_SIZE)

  const indexed = shallowRef<IndexedExample[]>([])
  /** source key → 中文名；注册表加载后由 getSources() 填 */
  const sourceLabels = ref<Record<string, string>>({})

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
    indexed.value = list
      .filter(ex => !ex.displayHidden)
      .map(ex => {
        const matchedTechs = techGroups.filter(t => t.key !== 'all' && t.match(ex))
        // 分面派生词一并进检索串，让「地图」这类领域词能命中地理条目（取舍见 techSearchTerms 注释）
        const facetWords = matchedTechs.flatMap(t => techSearchTerms[t.key] || [])
        return {
          ex,
          haystack: [ex.title || '', ex.description || '', ...(ex.tags || []), ...facetWords]
            .join('\u0000')
            .toLowerCase(),
          techs: matchedTechs.map(t => t.key),
          subs: subCategoryDefinitions.filter(s => s.key !== 'all' && s.match(ex)).map(s => s.key),
          source: ex.source,
        }
      })
    try {
      sourceLabels.value = Object.fromEntries(getSources().map(s => [s.source, s.label]))
    } catch {
      // 拿不到中文名就退回 source 键，不让分面整块消失
    }
    restoreScroll()
  })

  const loading = computed(() => indexed.value.length === 0)
  const totalCount = computed(() => indexed.value.length)

  function sourceLabel(key: string) {
    return sourceLabels.value[key] || key
  }
  function subLabel(key: string) {
    return subCategoryDefinitions.find(s => s.key === key)?.label || key
  }

  /**
   * 三维度分面的公共过滤器。
   *
   * `skip` 传要忽略的维度：算某个维度的计数时，必须把**它自己**排除在外，
   * 否则选中「Three.js」之后其它技术项的计数会全部变成 0，用户就没法换了。
   */
  const kw = computed(() => keyword.value.trim().toLowerCase())
  function passes(item: IndexedExample, skip: 'tech' | 'source' | 'sub' | null) {
    if (skip !== 'tech' && currentTech.value !== 'all' && !item.techs.includes(currentTech.value)) return false
    if (skip !== 'source' && currentSource.value !== 'all' && item.source !== currentSource.value) return false
    if (skip !== 'sub' && currentSubCategory.value !== 'all' && !item.subs.includes(currentSubCategory.value)) return false
    if (kw.value && !item.haystack.includes(kw.value)) return false
    return true
  }

  const techPool = computed(() => indexed.value.filter(i => passes(i, 'tech')))
  const sourcePool = computed(() => indexed.value.filter(i => passes(i, 'source')))
  const subPool = computed(() => indexed.value.filter(i => passes(i, 'sub')))

  const techTabs = computed<GalleryFacet[]>(() => {
    const counts = new Map<string, number>()
    for (const item of techPool.value) {
      counts.set('all', (counts.get('all') || 0) + 1)
      for (const t of item.techs) counts.set(t, (counts.get(t) || 0) + 1)
    }
    return techGroups.map(t => ({ key: t.key, label: t.label, count: counts.get(t.key) || 0 }))
  })

  const sourceFacets = computed<GalleryFacet[]>(() => {
    const counts = new Map<string, number>()
    for (const item of sourcePool.value) {
      counts.set(item.source, (counts.get(item.source) || 0) + 1)
    }
    // 来源名长短不一，按条目数降序排比按字母排更好扫
    const items = [...counts.entries()].sort((a, b) => b[1] - a[1])
    return [
      { key: 'all', label: '全部来源', count: sourcePool.value.length },
      ...items.map(([key, count]) => ({ key, label: sourceLabel(key), count })),
    ]
  })

  const subFacets = computed<GalleryFacet[]>(() => {
    const counts = new Map<string, number>()
    for (const item of subPool.value) {
      for (const s of item.subs) counts.set(s, (counts.get(s) || 0) + 1)
    }
    return subCategoryDefinitions
      .map(s => ({
        key: s.key,
        label: s.label,
        count: s.key === 'all' ? subPool.value.length : (counts.get(s.key) || 0),
      }))
      .filter(s => s.key === 'all' || s.count > 0)
  })

  const currentTechLabel = computed(
    () => techGroups.find(t => t.key === currentTech.value)?.label || '全部技术',
  )
  /** 侧栏顶部那一行「当前技术 N 个示例」；与 techTabs 同源，不会和标签数漂移 */
  const techExamplesCount = computed(
    () => techTabs.value.find(t => t.key === currentTech.value)?.count ?? 0,
  )

  const filteredExamples = computed<RegistryExample[]>(() => {
    const list = indexed.value.filter(i => passes(i, null)).map(i => i.ex)
    switch (sort.value) {
      case 'title':
        return list.sort((a, b) => collator.compare(a.title || '', b.title || ''))
      case 'source':
        return list.sort(
          (a, b) =>
            collator.compare(sourceLabel(a.source), sourceLabel(b.source)) ||
            collator.compare(a.title || '', b.title || ''),
        )
      case 'category':
        return list.sort(
          (a, b) =>
            collator.compare(a.categoryLabel || a.category || '', b.categoryLabel || b.category || '') ||
            collator.compare(a.title || '', b.title || ''),
        )
      default:
        // 注册表原序 = 上游组织好的章节顺序，是「推荐顺序」的唯一可信来源
        return list
    }
  })

  // 注意：这里**不能**钳成最小 1。空结果集必须得到 0 页，
  // 否则注册表落地时 totalPages 从 1 变 1（无变化），
  // 下面的越界钳制 watch 就永远不触发 —— 「?page=7 配 11 条结果」的空白网格回归会重新出现。
  const totalPages = computed(() => Math.ceil(filteredExamples.value.length / pageSize.value))
  const paginatedExamples = computed(() => {
    const start = (currentPage.value - 1) * pageSize.value
    return filteredExamples.value.slice(start, start + pageSize.value)
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

  const activeFilters = computed<ActiveFilter[]>(() => {
    const list: ActiveFilter[] = []
    if (currentTech.value !== 'all') list.push({ key: 'tech', label: '技术', value: currentTechLabel.value })
    if (currentSource.value !== 'all') list.push({ key: 'source', label: '来源', value: sourceLabel(currentSource.value) })
    if (currentSubCategory.value !== 'all') {
      list.push({ key: 'sub', label: '专题', value: subLabel(currentSubCategory.value) })
    }
    const trimmed = keyword.value.trim()
    if (trimmed) list.push({ key: 'search', label: '关键词', value: trimmed })
    return list
  })

  // 页码钳制。三个来源会让 currentPage 落到有效范围之外：
  //   ① 顶栏写 ?search= 时是 {...route.query}（src/App.vue），旧 page 被原样保留——
  //      在第 3 页输入关键词、结果不足 3 页时 paginatedExamples 为空，
  //      而 filteredExamples.length 又 >0，连空态提示都不显示 → 用户见「共 N 个」配空白网格；
  //   ② 手输/分享的 ?page=999、?page=-3、?page=2.5 直接落进 slice（负数会从尾部取错数据）；
  //   ③ 缩小每页条数会让总页数变多/变少的反向越界。
  // 放在这里而不是让 selectTech/selectCategory 重置，是因为它们管不到「搜索」这条路径，
  // 且前进/后退还原 URL 时不该被额外重置。
  watch([totalPages, currentPage], () => {
    const max = Math.max(1, totalPages.value)
    const cur = Math.floor(Number(currentPage.value))
    if (!Number.isFinite(cur) || cur < 1) currentPage.value = 1
    else if (cur > max) currentPage.value = max
  })

  // 用户主动切换技术 / 来源 / 专题时，重置页码。
  // 注意：不再用 watch(currentTech) / watch([keyword, currentSubCategory]) 自动重置，
  // 否则在浏览器前进/后退（syncQueryToState 从 URL 还原状态）时也会触发重置，
  // 导致子分类与页码状态被冲掉、无法恢复。
  //
  // 切技术时连专题一起重置：专题是「在当前技术范围内」的计数，跨技术沿用
  // 一个不存在的专题键会直接空结果，且界面上看不出原因。
  function selectTech(key: string) {
    if (currentTech.value === key) return
    currentTech.value = key
    currentSubCategory.value = 'all'
    currentPage.value = 1
  }

  function selectSource(key: string) {
    if (currentSource.value === key) return
    currentSource.value = key
    currentSubCategory.value = 'all'
    currentPage.value = 1
  }

  function selectCategory(key: string) {
    if (currentSubCategory.value === key) return
    currentSubCategory.value = key
    currentPage.value = 1
  }

  function setSort(key: GallerySortKey) {
    if (sort.value === key) return
    sort.value = key
    currentPage.value = 1
  }

  function setPageSize(n: number) {
    if (!PAGE_SIZE_OPTIONS.includes(n) || pageSize.value === n) return
    pageSize.value = n
    currentPage.value = 1
  }

  function setView(v: GalleryView) {
    view.value = v
  }

  function setDensity(d: GalleryDensity) {
    density.value = d
    try {
      localStorage.setItem(DENSITY_KEY, d)
    } catch {
      // 隐私模式下写不进就算了，当前会话内仍然生效
    }
  }

  /** 单个 chip 的 × ：把对应维度清回默认值 */
  function clearFilter(key: ActiveFilter['key']) {
    if (key === 'tech') currentTech.value = 'all'
    else if (key === 'source') currentSource.value = 'all'
    else if (key === 'sub') currentSubCategory.value = 'all'
    else keyword.value = ''
    currentPage.value = 1
  }

  function clearAllFilters() {
    currentTech.value = 'all'
    currentSource.value = 'all'
    currentSubCategory.value = 'all'
    keyword.value = ''
    currentPage.value = 1
  }

  /**
   * 用户点击页码：改页码并把容器滚回顶部。
   *
   * 为什么挂在动作上而不是 watch(currentPage)：currentPage 会被多条路径改动 ——
   * 用户翻页、URL 还原（syncQueryToState）、越界钳制、改每页条数。后几条不该滚，
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
    const src = route.query.src
    const search = route.query.search
    const sortQ = route.query.sort
    const sizeQ = Number(route.query.size)
    const viewQ = route.query.view

    if (typeof tech === 'string' && techGroups.some(t => t.key === tech)) currentTech.value = tech
    if (typeof src === 'string' && KNOWN_SOURCES.includes(src)) currentSource.value = src
    if (typeof sub === 'string' && subCategoryDefinitions.some(s => s.key === sub)) currentSubCategory.value = sub
    if (typeof sortQ === 'string' && SORT_OPTIONS.some(o => o.key === sortQ)) sort.value = sortQ as GallerySortKey
    if (PAGE_SIZE_OPTIONS.includes(sizeQ)) pageSize.value = sizeQ
    if (viewQ === 'list' || viewQ === 'grid') view.value = viewQ
    keyword.value = typeof search === 'string' ? search : ''
    currentPage.value = Number(route.query.page) || 1
  }

  onMounted(syncQueryToState)
  watch(() => route.query, syncQueryToState, { deep: true })

  // 状态 -> URL：任何筛选/排序/视图变化都写回 query，刷新可保持、可分享、可前进后退
  watch([currentTech, currentSource, currentSubCategory, keyword, sort, pageSize, view, currentPage], () => {
    const query: Record<string, string | number> = {}
    if (currentTech.value !== 'all') query.tech = currentTech.value
    if (currentSource.value !== 'all') query.src = currentSource.value
    if (currentSubCategory.value !== 'all') query.sub = currentSubCategory.value
    const trimmed = keyword.value.trim()
    if (trimmed) query.search = trimmed
    if (sort.value !== 'default') query.sort = sort.value
    if (pageSize.value !== DEFAULT_PAGE_SIZE) query.size = pageSize.value
    if (view.value !== 'grid') query.view = view.value
    if (currentPage.value > 1) query.page = currentPage.value
    // 避免无实质变化时触发导航（防止 watch 循环）
    if (!sameQuery(query, route.query as Record<string, unknown>)) router.replace({ query })
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
    currentSource,
    currentSubCategory,
    currentPage,
    pageSize,
    sort,
    view,
    density,
    loading,
    // 分面与派生数据
    totalCount,
    currentTechLabel,
    techExamplesCount,
    techTabs,
    sourceFacets,
    subFacets,
    filteredExamples,
    paginatedExamples,
    totalPages,
    visiblePages,
    activeFilters,
    // 动作
    selectTech,
    selectSource,
    selectCategory,
    setSort,
    setPageSize,
    setView,
    setDensity,
    clearFilter,
    clearAllFilters,
    goToPage,
  }
}
