import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { test, expect } from '@playwright/test'
import { mockTianditu } from './helpers/tiles'

/**
 * 核心链路冒烟测试。
 *
 * 目标：用最低成本守住「页面能打开、导航分壳不越界、地图页能就绪或降级」
 * 这些主干，避免再次出现「配置看起来存在、实际跑不出用例」的假阀门。
 *
 * 选择器均取自真实组件：
 *   .app-nav / .nav-brand / .shell-switch  → src/App.vue + src/shells/*
 *   .nav-search                            → 原资源库外壳的搜索框，2026-10-15 已随
 *                                              示例中心移除，现存断言只有 toHaveCount(0)
 *   .bmap-page                             → src/views/BMap/index.vue
 */

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

  test('两个产品外壳物理分区：顶栏互不越界，且示例搜索框不再存在', async ({ page }) => {
    // 回归：此前 8 项导航把 4 个产品功能和 4 个示例集平铺在一条顶栏里，
    // 且那条顶栏搜索在任何页面敲一个字符都会把用户拽去 /examples。
    // 现在按路由分壳，跨产品只剩一个显式的「切换」链接。
    // 2026-09-24 T02：/tools 迁入产品外壳；2026-10-15：示例中心移除，
    // 资源壳只剩 ThreeGlobe 与百度地图，搜索框随 registry 数据源一并消失。
    const productLinks = ['地球', '地图工具箱', '全球数据分析', '地震应急监测', '分析工作台']
    const resourceLinks = ['ThreeGlobe', '百度地图']
    const navLinks = page.locator('.app-nav .nav-links a')

    await page.goto('/')
    await expect(page.locator('.app-nav')).toBeVisible()
    // 用 toHaveText 而不是「读一次 allInnerTexts 再比」：main.ts 现在等
    // router.isReady() 才挂载，goto 返回那一刻导航可能还没渲染，读一次会拿到空数组
    await expect(navLinks).toHaveText(productLinks)
    await expect(page.locator('.nav-search')).toHaveCount(0)
    await expect(page.locator('.shell-switch')).toHaveText('ThreeGlobe')

    await page.goto('/analysis')
    await expect(navLinks).toHaveText(productLinks)

    // /tools（含详情页）也在产品壳：顶栏可见另外 4 个平台页，且没有示例搜索框
    await page.goto('/tools')
    await expect(navLinks).toHaveText(productLinks)
    await expect(page.locator('.nav-search')).toHaveCount(0)

    // 资源壳：/three-globe 上没有搜索框（随示例中心移除），壳切换链接仍能穿越
    await page.goto('/three-globe')
    await expect(navLinks).toHaveText(resourceLinks)
    await expect(page.locator('.nav-search')).toHaveCount(0)
    await expect(page.locator('.shell-switch')).toHaveText('返回地球')

    await page.locator('.shell-switch').click()
    await expect(page).toHaveURL(/\/$/)
    await expect(page.locator('canvas')).toBeVisible({ timeout: 30_000 })
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

      // 回归：7b00e25「全站暗色主题」漏掉了本页 —— .bmap-tab 用 color:inherit 配
      // 硬编码 #f3f4f6 底，47 个 tab 变成白字白底（对比度 1.15:1），整页导航不可读。
      // 5 项 verify 闸门、typecheck、lint 都不看 CSS 值，所以这类缺陷只能这样拦。
      // ⚠ 必须放在 akConfigured 分支内：无 AK 时页面走降级提示、tab 栏不渲染，
      //   此检查会因 querySelector 拿到 null 而炸（CI 首跑就是这么红的）。
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
    await expect(page.locator('.not-found-page a[href="/three-globe"]')).toBeVisible()

    await page.locator('.not-found-page a[href="/three-globe"]').click()
    await expect(page).toHaveURL(/\/three-globe/)
  })

  test('每条路由有自己的 document.title（含品牌名，与页面主标题一致）', async ({ page }) => {
    // 回归：document.title 此前在全仓无任何赋值处，标签页恒为 index.html 的静态标题。
    await page.goto('/monitor')
    await expect(page).toHaveTitle(/地震应急监测/)

    await page.goto('/definitely-not-a-page')
    await expect(page).toHaveTitle(/页面未找到/)
  })
})
