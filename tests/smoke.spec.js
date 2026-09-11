import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { test, expect } from '@playwright/test'

/**
 * 核心链路冒烟测试。
 *
 * 目标：用最低成本守住「页面能打开、示例能被解析到、查看代码能打开」这三条主干，
 * 避免再次出现「配置看起来存在、实际跑不出用例」的假阀门（见 CI 与 CONTRIBUTING）。
 *
 * 选择器均取自真实组件：
 *   .app-nav / .nav-brand / .nav-search .search-input → src/App.vue
 *   （顶栏搜索框必须带 .nav-search 限定：首页 EarthView 里还有一个
 *     src/components/SearchBox.vue 的 .search-input，裸用 .search-input 会命中 2 个元素。
 *     该歧义在 dev 模式下因首页渲染慢而侥幸通过，生产产物下必然失败。）
 *   .example-card / .error-tip             → src/examples/views/ExampleGallery.vue
 *   .demo-root / .code-btn                 → src/examples/views/ExampleDemo.vue
 *   .example-host                          → src/examples/views/ExampleHost.vue
 *   .code-modal / .code-pre                → src/components/CodeDrawer.vue
 *   .bmap-page                             → src/views/BMap/index.vue
 */

// 结构简单、依赖少的示例：css2d 的 label 示例（含共享壳 ExampleScene，可覆盖多节代码）
const DEMO_PATH = '/examples/threejs-official/css2d/css2d_label'

/**
 * registry **数据**分块的识别模式，兼容两种 E2E 目标：
 *   dev     → /src/examples/registry/threeCesiumExamples.js（源码路径）
 *   preview → /assets/threeCesiumExamples-CcbqyxGT.js（带哈希的分块名）
 *
 * 必须只匹配 11 个数据文件、排除 registry/index.js：index.js 是 barrel，
 * 被 useExampleFilters 静态导入，首页请求它属于正常；真正要拦的是数据分块。
 * 顶栏在所有路由都挂载，曾因此把 3+ 个数据 registry 拉进首屏（见 docs/PERF_BASELINE.md）。
 */
const REGISTRY_CHUNK_RE =
  /(?:\/src\/examples\/registry\/|\/assets\/)(?:threeCesiumExamples|cesiumExamples|threejsLesson|earthLessons|threejsOfficialExamples|granary3dExamples|webglExamples|mygrapicsExamples|graphicsExamples|threeProjectExamples|cityRealtimeWebglExamples)(?:-[A-Za-z0-9_-]+)?\.js/

/** 收集页面级未捕获异常，用于断言框架层没有崩溃 */
function collectPageErrors(page) {
  const errors = []
  page.on('pageerror', (err) => errors.push(err.message))
  return errors
}

/**
 * 读取本机是否配置了百度地图 AK。
 * 测试需要据此走两条不同的期望分支（有 AK → 示例就绪；无 AK → 降级提示），
 * 否则「未配置 AK」的功能在 CI 与本地会给出相反的结论。
 */
function readBMapAk() {
  const root = fileURLToPath(new URL('..', import.meta.url))
  for (const file of ['.env.local', '.env']) {
    const full = join(root, file)
    if (!existsSync(full)) continue
    const match = readFileSync(full, 'utf8').match(/^\s*VITE_BMAP_AK\s*=\s*(\S.*)$/m)
    if (match && match[1].trim()) return match[1].trim()
  }
  return process.env.VITE_BMAP_AK || ''
}

test.describe('冒烟测试：核心链路', () => {
  test('首页可加载且顶栏完整', async ({ page }) => {
    const pageErrors = collectPageErrors(page)

    await page.goto('/')

    await expect(page.locator('.app-nav')).toBeVisible()
    await expect(page.locator('.nav-brand')).toBeVisible()
    await expect(page.locator('.nav-search .search-input')).toBeVisible()

    expect(pageErrors, `首页出现未捕获异常：\n${pageErrors.join('\n')}`).toEqual([])
  })

  test('首页不为顶栏预载示例注册表', async ({ page }) => {
    const registryRequests = []
    page.on('request', (req) => {
      if (REGISTRY_CHUNK_RE.test(req.url())) registryRequests.push(req.url())
    })

    await page.goto('/')

    await expect(page.locator('.app-nav')).toBeVisible()
    // 等网络空闲，确保「本该发生」的预载确实已经发生而不是还没来得及
    await page.waitForLoadState('networkidle')

    expect(
      registryRequests,
      `首页预载了示例注册表（顶栏在所有路由都挂载，不应在 setup 阶段触发加载）：\n${registryRequests.join('\n')}`
    ).toEqual([])
  })

  test('打开顶栏「示例中心」下拉后按需加载注册表并显示分类计数', async ({ page }) => {
    await page.goto('/')

    await expect(page.locator('.app-nav')).toBeVisible()
    await page.locator('.dropdown-trigger', { hasText: '示例中心' }).click()
    await expect(page.locator('.dropdown-item').first()).toBeVisible()

    // registry 是按需加载的，计数会在加载完成后由 0 变为真实值
    await expect
      .poll(
        async () => {
          const counts = await page.locator('.dropdown-count').allInnerTexts()
          return counts.reduce((sum, c) => sum + (Number.parseInt(c, 10) || 0), 0)
        },
        { timeout: 20000, message: '下拉项计数应大于 0，说明 registry 已按需加载完成' }
      )
      .toBeGreaterThan(0)
  })

  test('示例中心可加载、搜索框常驻且卡片渲染', async ({ page }) => {
    const pageErrors = collectPageErrors(page)

    await page.goto('/examples')

    await expect(page.locator('.nav-search .search-input')).toBeVisible()
    await expect(page.locator('.example-gallery-page')).toBeVisible()

    const cards = page.locator('.example-card')
    await expect(cards.first()).toBeVisible()
    expect(await cards.count()).toBeGreaterThan(0)

    expect(pageErrors, `示例中心出现未捕获异常：\n${pageErrors.join('\n')}`).toEqual([])
  })

  test('示例中心按关键词过滤：URL ?search= 生效且结果集变小', async ({ page }) => {
    // .result-count 在注册表加载完成前是 0，必须先等卡片渲染出来再读，否则读到的是中间态
    const readCount = async () =>
      Number.parseInt((await page.locator('.result-count').innerText()).replace(/\D/g, ''), 10)

    await page.goto('/examples')
    await expect(page.locator('.example-card').first()).toBeVisible()
    const total = await readCount()
    expect(total, '未过滤时应展示全部示例').toBeGreaterThan(1000)

    // 关键词走 route.query.search → ExampleGallery 的 filteredExamples。
    // 用「shader」而非更直觉的词：标题/描述/标签多为中文，实测 "water" / "camera"
    // 在这三个字段里命中数为 0（页面会显示空态，卡片渲染不出来）。
    await page.goto('/examples?search=shader')
    await expect(page.locator('.example-card').first()).toBeVisible()
    const filtered = await readCount()

    expect(filtered, `「shader」应有命中（全部 ${total} 条，命中 ${filtered} 条）`).toBeGreaterThan(0)
    expect(filtered, `过滤后应少于全部（全部 ${total} 条，命中 ${filtered} 条）`).toBeLessThan(total)
  })

  test('切换技术标签会过滤结果并写回 URL', async ({ page }) => {
    await page.goto('/examples')
    await expect(page.locator('.example-card').first()).toBeVisible()
    const total = Number.parseInt((await page.locator('.result-count').innerText()).replace(/\D/g, ''), 10)

    const threeTab = page.locator('.tech-tab', { hasText: 'Three.js' })
    await expect(threeTab).toBeVisible()
    const tabCount = Number.parseInt((await threeTab.locator('.tech-tab-count').innerText()).replace(/\D/g, ''), 10)
    expect(tabCount, 'Three.js 标签应显示自己的条目数').toBeGreaterThan(0)

    await threeTab.click()

    await expect(page.locator('.tech-tab.active')).toContainText('Three.js')
    await expect.poll(() => new URL(page.url()).searchParams.get('tech')).toBe('threejs')
    // 结果计数与侧栏计数都应切到该技术
    await expect
      .poll(async () => Number.parseInt((await page.locator('.result-count').innerText()).replace(/\D/g, ''), 10))
      .toBe(tabCount)
    await expect(page.locator('.tech-count')).toContainText(String(tabCount))
    expect(tabCount, `技术过滤后应少于全部（全部 ${total}）`).toBeLessThan(total)
  })

  test('点击侧栏子分类会过滤结果并写回 URL', async ({ page }) => {
    await page.goto('/examples')
    await expect(page.locator('.example-card').first()).toBeVisible()

    const items = page.locator('.category-item')
    await expect(items.first()).toBeVisible()
    // 第 1 项是「全部」，跳过它，取第一个真实子分类
    const target = items.nth(1)
    const label = (await target.locator('.item-label').innerText()).trim()
    const count = Number.parseInt((await target.locator('.item-count').innerText()).replace(/\D/g, ''), 10)
    expect(count, `子分类「${label}」应有计数`).toBeGreaterThan(0)

    await target.click()

    await expect(page.locator('.category-item.active')).toContainText(label)
    await expect.poll(() => new URL(page.url()).searchParams.get('sub')).not.toBeNull()
    // 结果数应等于侧栏里该子分类标注的数量
    await expect
      .poll(async () => Number.parseInt((await page.locator('.result-count').innerText()).replace(/\D/g, ''), 10))
      .toBe(count)
  })

  test('分页：URL ?page= 生效，且第 2 页内容与第 1 页不同', async ({ page }) => {
    await page.goto('/examples')
    await expect(page.locator('.example-card').first()).toBeVisible()
    await expect(page.locator('.pagination')).toBeVisible()
    const firstOnPage1 = await page.locator('.example-card').first().innerText()

    await page.goto('/examples?page=2')
    await expect(page.locator('.example-card').first()).toBeVisible()
    const firstOnPage2 = await page.locator('.example-card').first().innerText()

    expect(firstOnPage2, '第 2 页的首张卡片应与第 1 页不同').not.toBe(firstOnPage1)
    await expect(page.locator('.page-btn.active')).toContainText('2')
  })

  test('示例详情页能按命名约定解析到 Vue 组件', async ({ page }) => {
    await page.goto(DEMO_PATH)

    await expect(page.locator('.demo-root')).toBeVisible()
    // .example-host 存在 == loadExampleComponent 按约定路径命中，而非回落到「未找到组件」
    await expect(page.locator('.example-host')).toBeVisible()
    await expect(page.locator('.error-tip')).toHaveCount(0)
  })

  test('「查看代码」弹窗可打开并渲染源码', async ({ page }) => {
    await page.goto(DEMO_PATH)

    const codeBtn = page.locator('.code-btn')
    await expect(codeBtn).toBeVisible()

    // 示例内部的 GUI 面板/覆盖层可能盖住按钮，直接派发 DOM click 绕过命中测试
    await codeBtn.evaluate((el) => el.click())

    await expect(page.locator('.code-modal')).toBeVisible()
    const code = page.locator('.code-pre').first()
    await expect(code).toBeVisible()
    expect((await code.innerText()).length).toBeGreaterThan(100)
  })

  test('百度地图页按是否配置 AK 进入就绪或降级，而非卡在加载态', async ({ page }) => {
    const akConfigured = !!readBMapAk()

    await page.goto('/bmap')

    await expect(page.locator('.bmap-page')).toBeVisible()
    await expect(page.locator('.bmap-header h1')).toContainText('百度地图')

    if (akConfigured) {
      // 已配置 VITE_BMAP_AK → SDK 动态加载成功，示例 tab 栏渲染出来
      await expect(page.locator('.bmap-nav')).toBeVisible({ timeout: 20000 })
      await expect(page.locator('.bmap-warning')).toHaveCount(0)
    } else {
      // 未配置 AK → 必须给出可读的降级提示，而不是一直卡在「正在加载…」
      await expect(page.locator('.bmap-warning')).toContainText('未配置百度地图 AK', {
        timeout: 20000,
      })
      await expect(page.locator('.bmap-loading')).toHaveCount(0)
    }
  })
})
