import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { test, expect } from '@playwright/test'
import { mockTianditu } from './helpers/tiles'

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

test.beforeEach(async ({ page }) => {
  await mockTianditu(page)
})

test.describe('冒烟测试：核心链路', () => {
  test('首页可加载且顶栏完整', async ({ page }) => {
    const pageErrors = collectPageErrors(page)

    await page.goto('/')

    await expect(page.locator('.app-nav')).toBeVisible()
    await expect(page.locator('.nav-brand')).toBeVisible()
    await expect(page.locator('.nav-links a')).toHaveCount(5)
    await expect(page.locator('.action-btn')).toBeVisible()
    // 数据产品外壳**不该**有示例搜索框：它原先挂在共用顶栏上，
    // 在首页敲一个字符就会把用户连人带地球场景拽去 /examples。
    await expect(page.locator('.nav-search')).toHaveCount(0)

    expect(pageErrors, `首页出现未捕获异常：\n${pageErrors.join('\n')}`).toEqual([])
  })

  // 回归：EarthCanvas 的 onMounted 是 async（要等 worldZh.json 与 gdp-timeline 两个请求），
  // 期间切走路由会先跑 onUnmounted；续跑随后打在已拆毁的状态上
  // （tweenGroup 被置 null → new Tween 抛 TypeError），且被外层 catch 吞成一条
  // console.error，界面上完全看不见。这里用延迟把竞态窗口强制打开。
  test('首页数据在途时切走路由，初始化不在已卸载的组件上续跑', async ({ page }) => {
    const initErrors: string[] = []
    page.on('console', (m) => {
      if (m.type() === 'error' && m.text().includes('EarthCanvas init error')) {
        initErrors.push(m.text())
      }
    })
    // 延迟 8s：只要 canvas 已挂载，就必然处于「onMounted 卡在 await」的状态
    await page.route('**/data/worldZh.json', async (route) => {
      await new Promise((r) => setTimeout(r, 8000))
      await route.continue()
    })

    await page.goto('/')
    await page.locator('canvas').waitFor({ timeout: 15_000 })

    // 切走路由靠顶栏链接。以前这里点的是 a[href="/three-globe"]，而首页用的是
    // ProductShell，那个元素根本不存在，可选链又让它静默跳过 —— 于是这条用例
    // 从来没真正切走过路由，却一直显示通过。改点首页真实存在的 /analysis，
    // 并显式断言链接存在，让「找不到目标」变成失败而不是空转。
    const navLink = page.locator('.nav-links a[href="/analysis"]')
    await expect(navLink).toHaveCount(1)
    await navLink.click()

    await page.waitForTimeout(10_000) // 越过 8s 延迟点，续跑此时必然已发生

    expect(initErrors, `卸载后仍有初始化续跑：\n${initErrors.join('\n')}`).toEqual([])
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

  test('两个产品外壳物理分区：顶栏互不越界，产品外壳没有示例搜索框', async ({ page }) => {
    // 回归：此前 8 项导航把 4 个产品功能和 4 个示例集平铺在一条顶栏里，
    // 且那条顶栏搜索在任何页面敲一个字符都会把用户拽去 /examples。
    // 现在按路由分壳，跨产品只剩一个显式的「切换」链接。
    // 2026-09-24 T02：/tools 迁入产品外壳（平台页②却挂在资源库壳是历史错位），
    // 导航文案与各页面自身的名字统一（业务监控→地震应急监测等）。
    const productLinks = ['地球', '地图工具箱', '全球数据分析', '地震应急监测', '分析工作台']
    const resourceLinks = ['示例中心', 'ThreeGlobe', '百度地图']
    const navLinks = page.locator('.app-nav .nav-links a')

    await page.goto('/')
    await expect(page.locator('.app-nav')).toBeVisible()
    // 用 toHaveText 而不是「读一次 allInnerTexts 再比」：main.ts 现在等
    // router.isReady() 才挂载，goto 返回那一刻导航可能还没渲染，读一次会拿到空数组
    await expect(navLinks).toHaveText(productLinks)
    await expect(page.locator('.nav-search')).toHaveCount(0)
    await expect(page.locator('.shell-switch')).toHaveText('示例中心')

    await page.goto('/analysis')
    await expect(navLinks).toHaveText(productLinks)

    // /tools（含详情页）也在产品壳：顶栏可见另外 4 个平台页，且没有示例搜索框
    await page.goto('/tools')
    await expect(navLinks).toHaveText(productLinks)
    await expect(page.locator('.nav-search')).toHaveCount(0)

    await page.goto('/examples')
    await expect(navLinks).toHaveText(resourceLinks)
    await expect(page.locator('.nav-search .search-input')).toBeVisible()
    await expect(page.locator('.shell-switch')).toHaveText('返回地球')

    // 切换链接必须真的能穿过去
    await page.locator('.shell-switch').click()
    await expect(page).toHaveURL(/\/$/)
    await expect(page.locator('canvas')).toBeVisible({ timeout: 30_000 })
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

  test('资源库外壳内搜索不劫持当前路由：输入留在原页，回车才跳转', async ({ page }) => {
    // 含两次 SPA 内导航 + 静置，与 A5 的定点放宽口径一致
    test.setTimeout(120_000)
    // 回归：这条搜索原先挂在两个产品共用的顶栏上，对任意路由每次按键都
    // router.push('/examples')。拆壳后跨产品这条路已经不存在，但**同一个外壳内**
    // （/bmap、/three-globe 上）输入仍然不该把用户从当前页拽走。
    // （原打在 /tools 上；2026-09-24 T02 起 /tools 迁入产品外壳，本壳不再含它。）
    const nav = page.locator('.nav-search .search-input')

    // 先访问一次示例中心再 SPA 切走：/examples 的懒加载 chunk 若未预载，
    // 旧代码那次 push 会在 chunk 加载阶段被中止，本用例就抓不到劫持（实测踩过）。
    await page.goto('/examples')
    await expect(page.locator('.example-card').first()).toBeVisible({ timeout: 30_000 })
    await page.locator('.app-nav a[href="/three-globe"]').click()
    await expect(page.locator('.gallery-page')).toBeVisible({ timeout: 30_000 })
    await page.waitForTimeout(2000)

    await nav.fill('globe')
    await page.waitForTimeout(1500)
    expect(new URL(page.url()).pathname, '输入关键词不应把用户从 ThreeGlobe 画廊带走').toBe('/three-globe')

    await nav.press('Enter')
    await expect(page).toHaveURL(/\/examples\?search=globe/)
    expect([...new URL(page.url()).searchParams.keys()], '跳转只该带 search').toEqual(['search'])
    await expect(page.locator('.example-gallery-page')).toBeVisible()
  })

  test('示例中心内输入用 replace，且不把旧 page 带进新结果集', async ({ page }) => {
    // 回归：旧实现写 {...route.query}，第 3 页输入关键词后旧 page 被原样保留，
    // 结果不足 3 页时网格空白却连空态都不显示（useGalleryFilters.ts:140-146 记录过）。
    await page.goto('/examples?page=2')
    await expect(page.locator('.example-card').first()).toBeVisible()
    const posBefore = await page.evaluate(() => (history.state as { position?: number })?.position ?? 0)

    await page.locator('.nav-search .search-input').fill('shader')
    await page.waitForTimeout(600)

    const params = new URL(page.url()).searchParams
    expect(params.get('search')).toBe('shader')
    expect(params.has('page'), '搜索词变了就不该沿用旧页码').toBe(false)
    const posAfter = await page.evaluate(() => (history.state as { position?: number })?.position ?? 0)
    expect(posAfter, '输入过程不应产生历史记录，否则后退键要按几十次').toBe(posBefore)
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

  // 回归：顶栏写 ?search= 时用的是 {...route.query}，旧 page 被原样带过来。
  // 在第 7 页搜一个只剩 1 页结果的词，paginatedExamples 会 slice 出空数组，
  // 而 filteredExamples.length 又 >0 → 连空态提示都不渲染，用户看到「共 N 个」配空白网格。
  // ?page=999 / 负数 / 小数同属这一类越界。
  test('页码越界自动钳制，不出现空白网格(回归:搜索保留旧 page)', async ({ page }) => {
    // 「地球」实测 11 条 = 1 页；单页时 .pagination 整个不渲染，
    // 所以这里断言的是「卡片可见 + 越界的 page 参数被写回清掉」，而不是分页按钮
    await page.goto('/examples?search=地球&page=7')
    await expect(page.locator('.example-card').first()).toBeVisible({ timeout: 15_000 })
    expect(new URL(page.url()).searchParams.has('page'), '钳回第 1 页后 page 参数应被省略').toBe(false)
    await expect(page.locator('.example-card')).toHaveCount(11)

    // 负数会让 slice 从尾部取错数据，属于同一类脏 URL；这条有多页，可以断按钮
    await page.goto('/examples?page=-3')
    await expect(page.locator('.example-card').first()).toBeVisible()
    await expect(page.locator('.page-btn.active')).toHaveText('1')
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

  test('「查看代码」弹窗：打开时锁定背景滚动，关闭后必须还原', async ({ page }) => {
    await page.goto(DEMO_PATH)

    await page.locator('.code-btn').evaluate((el) => el.click())
    await expect(page.locator('.code-modal')).toBeVisible()

    // 复制按钮可用 == 抽屉确实拿到了当前节的源码；日后若把 Header 抽成子组件，
    // 最容易丢的就是这个 prop（丢了就会变成禁用态）
    await expect(page.locator('.code-modal .header-copy')).toBeEnabled()

    // 打开时锁定背景滚动，否则弹窗后面的页面还能滚
    expect(await page.evaluate(() => document.body.style.overflow)).toBe('hidden')

    await page.locator('.code-modal .close-btn').click()
    await expect(page.locator('.code-modal')).toHaveCount(0)

    // 关键：关闭后必须还原。泄漏了整页就再也滚不动，且当场很难发现
    expect(await page.evaluate(() => document.body.style.overflow)).toBe('')
  })

  test('「查看代码」弹窗：ESC 可关闭并解绑监听', async ({ page }) => {
    await page.goto(DEMO_PATH)

    await page.locator('.code-btn').evaluate((el) => el.click())
    await expect(page.locator('.code-modal')).toBeVisible()

    await page.keyboard.press('Escape')
    await expect(page.locator('.code-modal')).toHaveCount(0)
    expect(await page.evaluate(() => document.body.style.overflow)).toBe('')
  })

  test('百度地图页按是否配置 AK 进入就绪或降级，而非卡在加载态', async ({ page }) => {
    const akConfigured = !!readBMapAk()

    await page.goto('/bmap')

    await expect(page.locator('.bmap-page')).toBeVisible()
    await expect(page.locator('.bmap-header h1')).toContainText('百度地图')

    // 回归：7b00e25「全站暗色主题」漏掉了本页 —— .bmap-tab 用 color:inherit 配
    // 硬编码 #f3f4f6 底，47 个 tab 变成白字白底（对比度 1.15:1），整页导航不可读。
    // 5 项 verify 闸门、typecheck、lint 都不看 CSS 值，所以这类缺陷只能这样拦。
    const contrast = await page.evaluate(() => {
      const lum = (c) => {
        const [r, g, b] = c.match(/[\d.]+/g).slice(0, 3).map((v) => {
          const x = Number(v) / 255
          return x <= 0.03928 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4
        })
        return 0.2126 * r + 0.7152 * g + 0.0722 * b
      }
      const ratio = (fg, bg) => {
        const a = lum(fg)
        const b = lum(bg)
        return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05)
      }
      const effBg = (el) => {
        let n = el
        while (n) {
          const c = getComputedStyle(n).backgroundColor
          if (c && !/rgba\(0, 0, 0, 0\)/.test(c)) return c
          n = n.parentElement
        }
        return 'rgb(10, 14, 23)'
      }
      const tab = document.querySelector('.bmap-tab:not(.active)')
      return { tab: ratio(getComputedStyle(tab).color, effBg(tab)) }
    })
    expect(contrast.tab, `/bmap tab 对比度仅 ${contrast.tab.toFixed(2)}:1，低于 AA 要求的 4.5`).toBeGreaterThanOrEqual(4.5)

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

  test('未知路径渲染 404 页，而不是「导航条 + 空白」', async ({ page }) => {
    // 回归：加 catch-all 之前 /foo 只产生一条 Vue Router console warn，
    // 页面渲染成顶栏加空 body，用户与构建都不知道自己走错了地址。
    await page.goto('/definitely-not-a-page')

    await expect(page.locator('.not-found-page')).toBeVisible()
    await expect(page.locator('.not-found-page h1')).toContainText('页面未找到')
    await expect(page.locator('.not-found-page .path')).toContainText('/definitely-not-a-page')

    // 两条出路必须是真链接，不能只是看起来像按钮
    await expect(page.locator('.not-found-page a[href="/"]')).toBeVisible()
    await expect(page.locator('.not-found-page a[href="/examples"]')).toBeVisible()

    await page.locator('.not-found-page a[href="/examples"]').click()
    await expect(page).toHaveURL(/\/examples/)
  })

  test('展示元数据覆盖层：补掉无信息描述，且不抹掉已写了技术点的条目', async ({ page }) => {
    // 分类级规则只应对「…通过标准渲染流程呈现。」这类空洞生效。
    // 同一章节里既有空洞条目也有写了具体技术点的条目，无条件按章节覆盖会把后者一起抹掉。
    const CONTENT_FREE = /通过标准渲染流程呈现/

    await page.goto('/examples?tech=webgl')
    await expect(page.locator('.example-card').first()).toBeVisible({ timeout: 30_000 })

    // 信息瘦身改版：网格卡片不再渲染描述段（描述与标签内容大量重复）；
    await expect(page.locator('.card-grid.is-grid .card-desc')).toHaveCount(0)
    // 描述类断言改在列表视图上看 —— 列表行保留一行描述，
    // 是「无信息描述」清洗成果在界面上仍然可见的地方。
    await page.getByLabel('列表视图').click()
    await expect(page.locator('.example-card.is-list').first()).toBeVisible()

    // WebGL 分片 134 条里原本 126 条共用两句模板，现在应全部换成章节主题
    const texts = await page.locator('.example-card').allInnerTexts()
    expect(texts.length).toBeGreaterThan(0)
    for (const t of texts) {
      expect(t, `卡片仍在展示无信息描述：\n${t}`).not.toMatch(CONTENT_FREE)
    }
    expect(texts.join('\n')).toMatch(/专题/)

    // 逐条覆盖要能盖过分类规则：Theatrejs 的标题是人工改写的
    await page.goto('/examples?search=Theatre')
    await expect(page.locator('.example-card').first()).toContainText('Theatre.js 动画编排')

    // 被标 hidden 的上游调试页不该能从详情直连进去。
    //
    // 这里刻意**只断言详情路由，不断言画廊列表**。试过并且放弃了：
    // 注册表是懒加载的，列表类负向断言（toHaveCount(0) / .result-count 为「共 0 个示例」）
    // 会在卡片渲染出来之前就先通过 —— 实测把 hidden 摘掉后两种写法都仍然"通过"，
    // 是假绿。而详情路由的 .error-tip 是实打实会被示例内容替换掉的正向断言，
    // 反验两次都能抓到（摘掉 hidden 即失败）。
    // 另注：不能搜原来的「测试」—— 这两条的 title 已被逐条覆盖改写成
    // 「影像图层调试页」/「综合调试页」，搜「测试」命中不到，等于没测。
    const hiddenEntries = [
      '/examples/cesium-examples/cesiumExamples/tools/test',
      '/examples/three-cesium-examples/threeExamples/other/test',
    ]
    for (const href of hiddenEntries) {
      await page.goto(href)
      await expect(page.locator('.error-tip')).toContainText('未找到示例', { timeout: 30_000 })
    }
  })

  test('每条路由有自己的 document.title（含品牌名，与页面主标题一致）', async ({ page }) => {
    // 回归：document.title 此前在全仓无任何赋值处，标签页恒为 index.html 的静态标题。
    await page.goto('/monitor')
    await expect(page).toHaveTitle(/地震应急监测/)

    await page.goto('/examples')
    await expect(page).toHaveTitle(/示例中心/)

    await page.goto('/definitely-not-a-page')
    await expect(page).toHaveTitle(/页面未找到/)
  })
})
