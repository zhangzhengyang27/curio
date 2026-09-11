import { defineConfig, devices } from '@playwright/test'

// E2E 使用独立端口，避免与开发者本机其它项目的 dev server（常见占用 5173）冲突：
// 一旦端口被别的应用占用，reuseExistingServer 会把测试连到「别人的页面」上，
// 结果是 5 条用例全部以「元素找不到」失败，且原因极难定位。
const E2E_PORT = Number(process.env.E2E_PORT || 5199)
const E2E_BASE_URL = `http://localhost:${E2E_PORT}`

export default defineConfig({
  testDir: './tests',
  // 显式约束用例文件，避免误把 tests/ 下的一次性脚本（.mjs/.py）当成用例
  testMatch: '**/*.spec.js',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  // Vite dev server 是按需编译的（上千个示例组件 + 上万个模块），
  // 多 worker 并行首访时首次编译会很慢，worker 越多反而越慢且容易抖动。
  workers: process.env.CI ? 1 : 2,
  // 单条用例整体超时（含 dev server 冷启动编译）
  timeout: 60 * 1000,
  // 断言默认 5s 对本项目偏紧：首个访问某条路由的用例需要现编译对应模块
  expect: { timeout: 15 * 1000 },
  reporter: 'list',
  use: {
    baseURL: E2E_BASE_URL,
    trace: 'on-first-retry',
    navigationTimeout: 30 * 1000,
    actionTimeout: 15 * 1000,
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    // --strictPort：端口被占用时直接失败，而不是回退到随机端口让测试打偏
    command: `npm run dev -- --port ${E2E_PORT} --strictPort`,
    url: E2E_BASE_URL,
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
  },
})
