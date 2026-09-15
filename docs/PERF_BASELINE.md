# 性能基线

> 结论先行：**2026-09-14 复测发现本文档旧基线（首页 539 KB）已严重失真**——
> 实测首页传输 2999 KB。归因出三个相互独立的成因并全部修复后，回落至 **1765 KB**，
> 其中首页 JS 由 694 KB 降至 **589 KB**。旧数字失真的根因之一正是「perf 只测量不断言」，
> 详见「防回归」一节。

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
  且与其他任务共享 CPU，FCP 等绝对时间波动极大（同一产物实测过 584 ms 与 16364 ms）。
  时间可用于**前后对比**，不要当作线上体验的绝对值。
- **采集窗口 = `load` 事件 + 就绪选择器可见**。晚于该窗口才发起的资源不计入。
  对比数字时必须同口径；改动了资源加载时机（懒加载/预加载）时尤其要当心口径漂移。
- 每次测量使用全新 context，不受缓存影响。
- 本机注意：多次 `vite preview` 复用同一端口时，确认旧进程已退出（`lsof -ti :<port>`），
  否则探测到的是旧产物（2026-09 实测踩过）。

---

## 2. 基线数字（生产产物，2026-09-14 修复后）

| 指标 | 修复前（本轮实测） | 修复后 | 变化 |
|---|---|---|---|
| **首页** 传输总量 | 2999 KB | **1765 KB** | **−41%** |
| **首页** 其中 JS | 694 KB | **589 KB** | **−15%** |
| 首页 其中图片 | 1798 KB | 669 KB | −63% |
| **示例中心** 传输总量 | 890 KB | 890 KB | 持平 |
| **示例中心** 其中 JS | 542 KB | 542 KB | 持平 |

### 四平台页面首屏预算（X3，2026-09-15 新增）

> `tests/perf.spec.js` 已覆盖四页度量（就绪选择器 + 传输构成）。
> 四页共享 **Cesium 底座**（动态 script 加载 Build 产物，Workers/Assets 约 10 MB 级，
> 仅在进入平台页面时按需加载，不进首页/示例中心首屏），预算按「Cesium 底座 + 页面自有资源」口径：

| 页面 | 就绪选择器 | 首屏传输预算（上限告警，非 CI 断言） | 备注 |
|---|---|---|---|
| `/tools` 地图工具箱 | `.panel-left` | 15 MB | Cesium + 天地图瓦片按串行加载（红线），页面自有 JS 极小 |
| `/analysis` 全球数据分析 | `.panel-left` | 15 MB | 另有 worldZh/gdp/population/carbon 数据(~600 KB) |
| `/monitor` 业务监控 | `.stats-bar` | 15 MB | 另有 earthquakes.json(~30 KB) |
| `/workbench` 分析工作台 | `.panel-left` | 15 MB | echarts 动态 import,不进首屏关键路径 |

预算为**告警上限**而非精确值：perf spec 只测量不断言（文件头说明），
若某页实测显著越过预算（如 Cesium 被意外打进页面主包），先查分包再查预载。

> 历史注：本文档旧基线为「首页 539 KB / JS 533 KB」（2026-09 上轮）。
> 该数字测量时部分资源（贴图/首屏数据）晚于采集窗口，未能反映真实首屏；
> 且此后引入的回归无人发现。新旧数字**不可直接对比**，以本表口径为准。

### 首页当前的传输构成（修复后）

```
 627 KB  earth-blue-marble.webp   ← 地表贴图（WebP q80）
 369 KB  vendor-three             ← 必需
 237 KB  gdp.json                 ← 首屏数据（GDP 模式默认加载）
 215 KB  worldZh.json             ← 首屏数据（中文世界地图）
  57 KB  vendor-3d-tiles          ← 首页 3D Tiles 图层，必需
  48 KB  gdp-timeline.json        ← 首屏数据
  46 KB  vendor-d3
  42 KB  earth-topology.webp      ← 凹凸贴图（WebP q80）
```

### 2026-09-14 修复的三个成因

1. **`vendor-three-globe` 分组递归捕获吞依赖（−155 KB）**：
   分组默认 `includeDependenciesRecursively: true`，把 three-globe 的依赖
   （`@tweenjs/tween`、`d3-scale` 等**首页自己也在用的库**）一并吞进该 chunk；
   首页的 Tween/d3-scale 被绑定到那份拷贝，被迫下载整个 three-globe。
   修复：该组显式关闭递归捕获（`vite.config.js` 内有完整注释）。
2. **CSS2DRenderer 与 three-globe 被搅进同一 chunk**：
   首页 `useLabels` 只需要 jsm-compat 的两个 CSS2D 类，但 Rolldown 默认分块把它们
   与 three-globe 模块合并。修复：CSS2DRenderer 单文件独立成 `vendor-css2d` 组。
   ⚠ 不能对整个 `jsm-compat/` 大粒度分组——其中混有顶层就访问 DOM 的示例应用
   （`mygrapics/bezier` 等的 `document.querySelector('canvas').getContext`），
   曾因此让首页加载时直接崩溃（实测复现，见 `KNOWN_PITFALLS.md` C6 补记）。
3. **贴图未压缩**：地表/凹凸贴图由 JPG(1428 KB)+PNG(372 KB) 转 WebP q80，
   合计 1800 KB → 672 KB（−63%）。原图备份在仓库外，转换无代码逻辑变化
   （`EarthCanvas.vue` 两处路径引用同步更新）。

---

## 3. 剩余机会（按性价比排序）

| 机会 | 预估收益 | 说明 |
|---|---|---|
| 首屏数据延迟加载 | ~500 KB | `gdp.json`(237) + `worldZh.json`(215) + `gdp-timeline`(48) 在首页初始化即加载；若默认模式改为按需，首屏可再降近三成。属产品决策（默认展示什么），未做 |
| 地表贴图 | 627 KB | 已是 WebP q80；再降需降分辨率（4096→2048，肉眼可感），不建议 |
| `vendor-three` | 369 KB | 首页必需，进一步压缩需裁剪 three.js 构建（风险高，不建议） |
| 产物总量 34 MB / 3200+ chunks | — | 按需加载的示例块，不在首屏路径上。不必为总量优化 |

**不建议做**：为了降低「产物总量」而做全量瘦身——那 34 MB 分散在 3200 个按需块里，
用户每次只下载其中极小一部分。优化目标应该是**首屏与常用路径**，而不是磁盘上的产物大小。

---

## 4. 防回归

`tests/perf.spec.js` 只测量、不做性能断言（避免 CI 抖动误杀）——这正是本轮
「首屏从 539 涨到 2999 无任何闸门变红」的原因。当前约定：

- 数字打印在 CI 日志里，**每次发布前人工对比一次**本文档基线；
- 涉及 `vite.config.js` 分组的改动，必须用第 1 节口径实测首页传输并更新本文档；
- 若将来要加自动断言，建议只对「JS 传输量」设宽阈值（如 ≤ 650 KB），图片/数据另议。

给库新增 `codeSplitting.groups` 条目前，务必确认：它是否真的出现在首页/常用页的
依赖图里、以及它的依赖是否被别处共享——分组会把依赖一并变成共享块
（`includeDependenciesRecursively` 陷阱见成因 1）。
