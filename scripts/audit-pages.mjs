/**
 * 数字地球平台四页巡检：/analysis /tools /tools/toolbox /workbench /monitor
 *
 * 前置：dev server 已在 5173 端口运行（npm run dev）。
 * 用法：node scripts/audit-pages.mjs
 * 输出：每页的 load-error 是否显示、canvas 数量、pageerror/console error、HTTP>=400。
 * 只输出线索，不改任何文件。
 */
import { chromium } from 'playwright'

const pages = [
  { path: '/analysis', name: '1-全球分析', expect: 'analysis-view' },
  { path: '/tools', name: '2-地图工具箱(列表)', expect: 'gallery-page' },
  { path: '/tools/toolbox', name: '3-工具箱示例', expect: 'tools-example' },
  { path: '/workbench', name: '4-分析工作台', expect: 'workbench-view' },
  { path: '/monitor', name: '5-业务监控', expect: 'monitor-view' },
]

const browser = await chromium.launch()
for (const p of pages) {
  const page = await browser.newPage({ viewport: { width: 1400, height: 900 } })
  const errs = []
  const bad4xx5xx = []
  page.on('pageerror', (e) => errs.push('PAGEERROR: ' + e.message.slice(0, 150)))
  page.on('console', (m) => { if (m.type() === 'error') errs.push('console: ' + m.text().slice(0, 150)) })
  page.on('response', (res) => { if (res.status() >= 400) bad4xx5xx.push(`${res.status()} ${res.url().slice(0, 90)}`) })
  await page.goto(`http://localhost:5173${p.path}?debug=1`, { waitUntil: 'load' })
  await page.locator(`.${p.expect}`).waitFor({ timeout: 20000 }).catch(() => errs.push(`容器 .${p.expect} 未出现`))
  await page.waitForTimeout(12_000)
  const shot = `/tmp/audit4-${p.name}.png`
  await page.screenshot({ path: shot })
  const loadErr = await page.locator('.load-error').count()
  const canvas = await page.evaluate(() => {
    const cs = [...document.querySelectorAll('canvas')]
    if (cs.length === 0) return '无canvas'
    return `${cs.length}块, 首块 ${cs[0].width}x${cs[0].height}`
  })
  console.log(`\n===== ${p.name} (${p.path}) =====`)
  console.log(`load-error 显示: ${loadErr > 0 ? '是 ← 问题' : '否'} | 画布: ${canvas}`)
  console.log(`页面错误 ${errs.length} 条:`, errs.slice(0, 4).join(' || ') || '无')
  console.log(`HTTP>=400: ${bad4xx5xx.length} 条:`, bad4xx5xx.slice(0, 5).join(' | ') || '无')
  await page.close()
}
await browser.close()
