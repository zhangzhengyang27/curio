import { defineConfig, devices } from '@playwright/test'

// E2E 使用独立端口，避免与开发者本机其它项目的 dev server（常见占用 5173/5199）冲突：
// 一旦端口被别的应用占用，reuseExistingServer 会把测试连到「别人的页面」上，
// 结果是用例全部以「元素找不到」失败，且原因极难定位。
// 5199 也曾被占用过（2026-09 实测），故默认改用更冷门的 5299。
const E2E_PORT = Number(process.env.E2E_PORT || 5299)
const E2E_BASE_URL = `http://localhost:${E2E_PORT}`

// E2E 目标：
//   dev（默认）  → 直接跑 vite dev server，反馈快，但**不经过生产打包**，
//                  因此测不出分包/产物相关问题（例如 chunk 拆分导致的初始化顺序错误）。
//   preview      → 跑 `vite preview` 服务已构建产物，验证真正要上线的东西。
// 建议：本地开发用 dev，合并前与 CI 两者都跑。
const E2E_TARGET = process.env.E2E_TARGET === 'preview' ? 'preview' : 'dev'
// preview 模式要预览的产物目录（可指向仓库外的构建输出，绕开本机批量删除保护）
const E2E_PREVIEW_OUT_DIR = process.env.E2E_PREVIEW_OUT_DIR || 'dist'

const webServerCommand =
  E2E_TARGET === 'preview'
    ? `npm run preview -- --outDir ${E2E_PREVIEW_OUT_DIR} --port ${E2E_PORT} --strictPort`
    : `npm run dev -- --port ${E2E_PORT} --strictPort`

export default defineConfig({
  testDir: './tests',
  // 显式约束用例文件，避免误把 tests/ 下的一次性脚本（.mjs/.py）当成用例
  testMatch: '**/*.spec.{js,ts}',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  // Vite dev server 是按需编译的（上千个示例组件 + 上万个模块），
  // 多 worker 并行首访时首次编译会很慢，worker 越多反而越慢且容易抖动。
  workers: process.env.CI ? 1 : 2,
  // 单条用例整体超时（含 dev server 冷启动编译）
  timeout: 60 * 1000,
  // 断言默认 5s 对本项目偏紧：首个访问某条路由的用例需要现编译对应模块。
  // 15s 也不够——四平台页要等 Cesium 底座 + worldZh 2.4MB 多边形，
  // 实测 dev 下 /workbench 冷启动到 .panel-left 可见即 11.5~18.3s（空载单机），
  // 并行 worker 下成倍放大；原先散在各 spec 的 15s 断言正是最先到期的那一批。
  // 30s 与各 spec 早已手工写死的 .panel-left 预算对齐。
  expect: { timeout: 30 * 1000 },
  reporter: 'list',
  use: {
    baseURL: E2E_BASE_URL,
    trace: 'on-first-retry',
    navigationTimeout: 30 * 1000,
    // 与上面 expect.timeout 同源：locator.waitFor() / .evaluate() 这类操作走的是
    // actionTimeout 而不是 expect.timeout。重型页里裸调 waitFor() 的地方不少
    // （如 /tools/toolbox 等 .panel-left），15s 同样撑不住 11.5~18.3s 的冷启动。
    actionTimeout: 30 * 1000,
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    // --strictPort：端口被占用时直接失败，而不是回退到随机端口让测试打偏
    command: webServerCommand,
    url: E2E_BASE_URL,
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
  },
})
