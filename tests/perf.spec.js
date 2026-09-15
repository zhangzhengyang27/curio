import { test } from '@playwright/test'

/**
 * 性能基线测量（只测量，不做性能断言，避免 CI 抖动）。
 *
 * 目的：在决定「要不要做产物瘦身 / 首屏优化」之前，先拿到**真实数字**。
 * 之前对性能的讨论一直停留在「产物 34 MB、3203 个 chunk」这类构建侧指标，
 * 但那不是用户感受到的东西。
 *
 * 数据来源全部是浏览器原生 API，不引入额外依赖：
 *   - performance.getEntriesByType('resource')  → 请求数、transferSize（压缩后实际传输量）
 *   - performance.getEntriesByType('paint')     → FCP
 *   - performance.getEntriesByType('navigation')→ DCL / Load
 *   - 就绪选择器可见耗时                          → 「内容真正可用」的近似值
 *
 * 用法：
 *   E2E_TARGET=preview npm run test:e2e -- --grep 性能基线   # 测生产产物（推荐）
 *   npm run test:e2e -- --grep 性能基线                      # 测 dev server（不具代表性）
 *
 * 注意：dev server 按需编译，数字不可用于决策；必须以 preview（生产产物）为准。
 */

const ROUTES = [
  { path: '/', name: '首页地球', ready: '.app-nav' },
  { path: '/examples', name: '示例中心', ready: '.example-card' },
  // 四页面(X3):Cesium 底座约 10MB 级传输属预期,预算见 docs/PERF_BASELINE.md
  { path: '/tools', name: '地图工具箱', ready: '.panel-left' },
  { path: '/analysis', name: '全球数据分析', ready: '.panel-left' },
  { path: '/monitor', name: '业务监控', ready: '.stats-bar' },
  { path: '/workbench', name: '分析工作台', ready: '.panel-left' },
]

function fmtKB(bytes) {
  return `${(bytes / 1024).toFixed(0)} KB`
}

test.describe('性能基线', () => {
  for (const route of ROUTES) {
    test(`${route.name}（${route.path}）`, async ({ page }) => {
      // 每个用例独立 context，避免缓存影响（Playwright 默认即为新 context）
      const t0 = Date.now()
      await page.goto(route.path, { waitUntil: 'load' })
      await page.waitForSelector(route.ready, { state: 'visible', timeout: 60_000 })
      const readyMs = Date.now() - t0

      const data = await page.evaluate(() => {
        const resources = performance.getEntriesByType('resource')
        const nav = performance.getEntriesByType('navigation')[0] || {}
        const paint = performance.getEntriesByType('paint')
        const fcp = paint.find((p) => p.name === 'first-contentful-paint')

        const byExt = (name) => {
          const ext = (name.split('?')[0].split('.').pop() || '').toLowerCase()
          return ext
        }

        const buckets = { js: 0, css: 0, image: 0, font: 0, other: 0 }
        const counts = { js: 0, css: 0, image: 0, font: 0, other: 0 }
        const largest = []

        for (const r of resources) {
          const ext = byExt(r.name)
          const size = r.transferSize || r.encodedBodySize || 0
          let kind = 'other'
          if (ext === 'js' || ext === 'mjs') kind = 'js'
          else if (ext === 'css') kind = 'css'
          else if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'avif', 'svg', 'ico'].includes(ext)) kind = 'image'
          else if (['woff', 'woff2', 'ttf', 'otf'].includes(ext)) kind = 'font'

          buckets[kind] += size
          counts[kind] += 1
          largest.push({ name: r.name.split('/').pop(), kind, size })
        }

        largest.sort((a, b) => b.size - a.size)

        return {
          resources: resources.length,
          counts,
          buckets,
          largest: largest.slice(0, 8),
          fcp: fcp ? Math.round(fcp.startTime) : null,
          domContentLoaded: Math.round(nav.domContentLoadedEventEnd || 0),
          load: Math.round(nav.loadEventEnd || 0),
        }
      })

      const totalBytes = Object.values(data.buckets).reduce((a, b) => a + b, 0)
      const lines = [
        '',
        `===== ${route.name} ${route.path} =====`,
        `请求数         ${data.resources}  (js ${data.counts.js} / css ${data.counts.css} / img ${data.counts.image} / font ${data.counts.font})`,
        `传输总量       ${fmtKB(totalBytes)}`,
        `  其中 JS      ${fmtKB(data.buckets.js)}`,
        `  其中 CSS     ${fmtKB(data.buckets.css)}`,
        `  其中 图片    ${fmtKB(data.buckets.image)}`,
        `  其中 字体    ${fmtKB(data.buckets.font)}`,
        `FCP            ${data.fcp} ms`,
        `DCL            ${data.domContentLoaded} ms`,
        `Load           ${data.load} ms`,
        `就绪(${route.ready}) 可见  ${readyMs} ms`,
        '最大的 8 个资源:',
        ...data.largest.map((r) => `  ${fmtKB(r.size).padStart(10)}  [${r.kind}] ${r.name}`),
        '',
      ]
      console.log(lines.join('\n'))
    })
  }
})
