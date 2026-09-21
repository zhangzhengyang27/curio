/**
 * E2E 用天地图瓦片隔离：用 1×1 透明 PNG 顶掉所有天地图请求。
 *
 * 为什么必须 mock：个人 key 影像底图日配额 1 万次 + 频率限流，
 * 而 75 条 E2E 每轮要加载四页真实瓦片几千次——既烧穿配额
 * （触发「该tk已限流」后整个 key 拒服），又让测试结果取决于
 * 外部服务状态。地图类测试断言的是面板/交互/状态机，不依赖
 * 瓦片像素。perf.spec 除外（它测的就是真实加载）。
 */
import { test as base, expect } from '@playwright/test'

const TILE_PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
  'base64'
)

export const test = base.extend({})
export { expect }

export async function mockTianditu(page) {
  await page.route('**/tianditu.gov.cn/**', (route) =>
    route.fulfill({ status: 200, contentType: 'image/jpeg', body: TILE_PNG })
  )
  // 同源瓦片反代（VITE_TILE_PROXY=/tiles 时启用，见 src/map/tileSource.ts）。
  // 不一起拦的话：一旦有人在 .env.local 里开了这个开关，E2E 就会经 vite 代理
  // 打真实天地图 —— 烧配额且结果取决于外部服务，正是本文件要避免的两件事。
  // 形状 /tiles/{layer}/{z}/{x}/{y}；本仓没有其它 /tiles 路径，不会误伤。
  await page.route('**/tiles/*/*/*/*', (route) =>
    route.fulfill({ status: 200, contentType: 'image/png', body: TILE_PNG })
  )
  // 反代的 health 探测决定前端走不走代理，测试里明确回「未启用」，
  // 让底图稳定走直连分支（上面那条 route 已覆盖）。
  await page.route('**/tiles/health*', (route) =>
    route.fulfill({ status: 503, contentType: 'application/json', body: '{"ok":false,"enabled":false}' })
  )
}

// 让所有引入本文件的用例自动获得 mock，无需逐条调用
test.beforeEach(async ({ page }) => {
  await mockTianditu(page)
})
