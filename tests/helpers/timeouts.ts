/**
 * 重型页面的等待预算——单一来源，不要在 spec 里另写字面量。
 *
 * 三个超时各管一段，只改一个不够（见 KNOWN_PITFALLS A5）：
 *   用例级 → playwright.config `timeout`（60s；含 ≥2 次整页加载的用例定点
 *            test.setTimeout(120_000)，**不要**用文件级 test.slow()）
 *   断言级 → config `expect.timeout`（30s，普通断言够用）
 *   操作级 → config `use.actionTimeout`（30s，管 waitFor/evaluate/click）
 */

/**
 * 平台页「图表首次出现」要比断言默认更宽：图表是在整页冷启动之后
 * 再 `await import('echarts')`（dev 下 1.1 MB 未打包 chunk）才挂上的。
 * 实测空载到 .panel-left 可见就要 11.5~18.3s，全量长跑满负荷下 30s 仍会不够。
 */
export const CHART_FIRST_RENDER = 60_000
