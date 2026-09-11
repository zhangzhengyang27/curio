# 性能基线

> 结论先行：**首页首屏 JS 从 2246 KB 降到 533 KB（−76%）**，原因是移除了一个
> 首页根本不用的 1.7 MB 高斯泼溅库（`@sparkjsdev/spark`）的预加载。
> 下面是测量方法、数字与剩余机会。

---

## 1. 怎么测的

工具：`tests/perf.spec.js`（Playwright + 浏览器原生 Performance API，不引入额外依赖）。

```bash
E2E_TARGET=preview E2E_PREVIEW_OUT_DIR=/tmp/xxx npm run test:e2e -- --grep 性能基线
```

采集口径：

| 指标 | 来源 |
|---|---|
| 请求数 / 传输量 | `performance.getEntriesByType('resource')` 的 `transferSize`（**压缩后实际传输字节**） |
| FCP | `performance.getEntriesByType('paint')` 的 `first-contentful-paint` |
| DCL / Load | `performance.getEntriesByType('navigation')` |
| 「就绪」耗时 | 从导航开始到就绪选择器可见（首页 `.app-nav`、示例中心 `.example-card`） |

### ⚠ 读数字时的注意事项

- **必须以生产产物（`E2E_TARGET=preview`）为准。** dev server 按需编译，数字没有参考价值。
- **传输量是硬指标，时间仅供参考。** 测量环境是 headless Chromium + 软件渲染（swiftshader）
  且与其他任务共享 CPU，FCP 等绝对时间明显高于真实硬件。
  时间可用于**前后对比**，不要当作线上体验的绝对值。
- 每次测量使用全新 context，不受缓存影响。

---

## 2. 基线数字（生产产物）

| 指标 | 优化前 | 优化后 | 变化 |
|---|---|---|---|
| **首页** 传输总量 | 2252 KB | **539 KB** | **−76%** |
| **首页** 其中 JS | 2246 KB | **533 KB** | **−76%** |
| 首页 FCP | 4008 ms | 716 ms | −82% |
| 首页 就绪（`.app-nav`） | 4994 ms | 1161 ms | −77% |
| **示例中心** 传输总量 | 2603 KB | **889 KB** | **−66%** |
| 示例中心 其中 JS | 2254 KB | **541 KB** | **−76%** |
| 示例中心 FCP | 4004 ms | 976 ms | −76% |
| 示例中心 就绪（`.example-card`） | 6058 ms | 1556 ms | −74% |

### 优化前的首页 JS 构成（问题所在）

```
1714 KB  vendor-spark    ← 高斯泼溅库，首页根本不用（76%）
 369 KB  vendor-three    ← 必需
  57 KB  vendor-3d-tiles ← 首页 3D Tiles 图层，必需
  24 KB  threejsOfficialExamples（registry）
  13 KB  threeCesiumExamples（registry）
   6 KB  webglExamples（registry）
```

### 根因

`@sparkjsdev/spark` 只被单个示例（`SparkjsExample.vue`）以 `await import()` 动态引入。
但一旦在 `vite.config.js` 的 `codeSplitting.groups` 里给它建分组，它就变成**共享 chunk**，
被 Vite 提升进首页的 `modulepreload` 列表 —— 而首页的 entry 静态导入里根本没有它。

**修复**：不为 spark 建分组，交回打包器放进按需加载的懒加载块（现为独立的
`spark.module-*.js`，只在打开该示例时加载）。

> 顺带说明：修复前 `vendor-cesium`（8.3 MB）也曾被预载到首页，
> 已在上一轮的分包修复中一并解决。

---

## 3. 剩余机会（按性价比排序）

| 机会 | 预估收益 | 说明 |
|---|---|---|
| 首页延迟加载 registry | ~43 KB | 首页加载了 3+ 个 registry 文件，源于顶栏搜索使用的 `useExampleFilters`。可延迟到进入 `/examples` 或聚焦搜索框时再加载 |
| 示例中心封面图 | 343 KB / 16 张 | 已用 `loading="lazy"`，但首屏 16 张仍会加载。可缩小封面尺寸或改用更小的预览图 |
| `vendor-three` | 369 KB | 首页必需，进一步压缩需裁剪 three.js 构建（风险高，不建议） |
| 产物总量 34 MB / 3203 chunks | — | 这些是**按需加载**的示例块，不在首屏路径上，不影响用户体验。不必为了减小总量而动它们 |

**不建议做**：为了降低「产物总量」而做全量瘦身 —— 那 34 MB 分散在 3203 个按需块里，
用户每次只下载其中极小一部分。优化目标应该是**首屏与常用路径**，而不是磁盘上的产物大小。

---

## 4. 防回归

`tests/perf.spec.js` 只测量、不做性能断言（避免 CI 抖动）。
数字会打印在 CI 日志里，每次发布前人工对比一次即可。

若将来要给某个库新增 `codeSplitting.groups` 条目，请务必确认：
**它是否真的会出现在首页/常用页的依赖图里**。分组会把库变成共享块，
从而可能被提升进 `modulepreload` —— 这正是本次 1.7 MB 问题的成因。
