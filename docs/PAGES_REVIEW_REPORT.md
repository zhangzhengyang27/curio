# 数字地球平台 · 四页面审查报告（任务 A 产出）

> 审查对象与基线见 [PAGES_ENHANCEMENT_PLAN.md](./PAGES_ENHANCEMENT_PLAN.md) 第 3 节。
> 审查时间：2026-09-15。方法：源码逐行审查（红线逐条核对）+ 真实浏览器走查
> （IAB 手工走查 + Playwright 探针用例 `tests/walkthrough.spec.js`，跑完即删）。
> **每条发现均已在真实页面复现，无凭猜测条目。**

## 结论速览

| 页面 | 结论 |
|---|---|
| `/tools` | 功能链路全部正常；**2 个 P1**：工具状态机与按钮高亮脱钩、`?debug=1` 自诊断 HUD 整体静默失效 |
| `/analysis` | 核心联动正常；**1 个 P1**：时间轴「暂停」无效（暂停后年份继续走） |
| `/monitor` | **全部正常**，处置流转/统计/推送/`?nostream=1` 全链路实测通过，无新增缺陷 |
| `/workbench` | **1 个 P0**：GDP 主题把「世界」等聚合项当国家排进 Top10/摘要/导出报告；**1 个 P1**：碳排放 mock 数据失真导致结论荒谬 |

红线合规情况：串行瓦片加载（`requestsPerServer=1` + 单子域名 t0）✓、
WMTS 模板含 `tilematrix/tilerow/tilecol` ✓、影像层按高度显隐**实测通过**
（高度 194 万米时影像层隐藏、117 万米恢复）✓、token 仅经 env 注入 ✓、
`/examples` 与旧首页未触碰 ✓。**未发现任何红线违例。**

严重级定义：P0 功能坏/结论错误 · P1 体验受损 · P2 建议。

---

## 1. `/tools` 地图工具箱

### 1.1 正常项（逐项操作通过）

量距（实测 11.43 km，测地线有效无 NaN）、量面积（闭合多边形 + 面积结果）、
标点/标线/标面（左键采点、双击结束、实时预览）、撤销/清空（实体登记制，
主体+附属同步移除）、书签（保存 → 视角拉远 → 回跳恢复高度 350,000m 完全一致 →
刷新持久 → 删除）、底图 img/vec 来回切换 ×3 无错误、影像层高度门控（见红线结论）、
GeoJSON 导出（Polygon 环闭合 `first==last` ✓，LineString 坐标有限 ✓）、
PNG 截图导出 ✓、画布渲染正常（80×80 采样 98 个独立色块，非黑屏/非纯色）。
全页无 `pageerror`、无 `console.error`。

### 1.2 [P1] 工具结束后/Esc 取消后，按钮高亮不消除，再点画布无任何反馈

- **复现**：激活「量距离」→ 采点 → 双击结束（或激活后直接按 Esc）→
  左侧按钮**仍高亮**，但 `controller.activeTool` 已被置 null。
  此时再点画布：无预览、无 hint、无结果——`_onClick` 无「无激活工具」守卫，
  采点数组静默积累（直到下次右键被丢弃或切换工具时被清空）。
- **证据**（walkthrough 探针）：
  - `tools-state-desync`：结束后 `distanceBtn.classList.contains('active') === true`，
    随后连点画布两下 hint/result 均无变化；
  - `tools-esc-desync`：Esc 后 `activeAfterEsc: true`（hint 已清空）。
- **根因**：`MapToolsView.vue` 的 `activeTool` ref 与 `mapToolsController.js` 的
  `this.activeTool` 是两份独立状态。`_finish()`/`_cancel()` 只改 controller 侧，
  不通知 View；且 `MapToolsController._onClick` 缺 `if (!this.activeTool) return` 守卫。
- **修复方向**：单一事实源——controller 在 `_finish/_cancel/setTool` 时经
  `onStatus` 广播 activeTool，View 侧高亮跟随；顺手补 `_onClick` 守卫。

### 1.3 [P1] `?debug=1` 自诊断 HUD 整体静默失效（远程排查工具不可用）

- **复现**：打开 `/tools?debug=1`，HUD 永远显示
  「相机高度 0m · 瓦片队列 0 · 图层 0」，与真实状态
  （实测高度 350,000m、图层 2、瓦片错误 0）不符，等待 30s+ 亦不变。
- **根因**：`MapToolsView.vue:330`
  `Cesium.TileProviderError.addEventListener(...)` —— Cesium 1.142 中
  `TileProviderError` 是**类而非事件**（实测 `typeof === 'function'`，
  `addEventListener` 与静态 `Event` 均不存在，正确挂点是各
  `imageryLayers.get(n).imageryProvider.errorEvent`）。该行抛 TypeError，
  **静默中断整个 debug 块**：瓦片错误计数、瓦片队列监听、500ms HUD
  定时器全部没装上。异常被外层 try/catch 吞掉，而 loadError 的显示条件是
  `v-if="loadError && !ready"`（此时 `ready` 已为 true），UI 上零提示。
- **影响**：HUD 是任务书指定「远程排查用户浏览器地图不可见」的唯一自诊工具；
  它坏了且坏得无声，正属于本项目「静默假通过」类缺陷。
- **修复方向**：错误计数改挂 provider 级 `errorEvent`；debug 块的初始化放
  try 外或单独 try；`loadError` 显示条件与 `ready` 解耦。

### 1.4 [P2] 采点数无下限校验，可产出无效 GeoJSON

`line/distance` 1 点、`polygon/area` <3 点时右键也会完成登记，导出的
LineString 只有 1 个坐标 / Polygon 环 <4 个坐标（无效几何）。正常操作影响小，
建议 `_finish` 按工具校验最小顶点数并提示。

### 1.5 [P2] 已知边界确认（与计划书一致）

地名搜索未实现、标绘不可编辑、标绘/量测不持久（刷新全丢）、书签不可重命名/导出。
预览实体每次 MOUSE_MOVE 全删全建（顶点多时 O(n)/帧），当前规模无感。

---

## 2. `/analysis` 全球数据分析

### 2.1 正常项

166 国列表就绪、搜索/选国 → 指标卡联动（GDP「14.68 万亿」量级 + GDP 排名徽标）、
对比表（正式 E2E 基线守护，本轮回车路径未重验上限，见 §2.4）、时间轴拖动到
2000 年 + 播放推进正常、choropleth 着色与年份联动正常。无 `pageerror`。

### 2.2 [P1] 时间轴「暂停」无效：暂停后年份继续演进

- **复现**：拖到 2000 年 → 播放 → 等约 3 年 → 点「⏸ 暂停」→ 年份**继续走**
  （实测 `afterPlay: 2001 → afterPause: 2005 → afterPauseMore: 2006`），
  直到 2020 年末尾才自停。**暂停按钮形同虚设。**
- **根因**：`AnalysisView.vue:306-316`：
  ```js
  watch(playing, (on) => {
    if (!on) return            // ← 暂停时直接 return,不清理 playTimer
    playTimer = setInterval(...)
  })
  ```
  `togglePlay` 把 `playing` 置 false 后，interval 继续每 700ms `yearIndex++`。
- **为什么 E2E 没拦住**：基线用例只断言「播放后年份 > 2000 且 ≠ 2020」，
  从未测暂停语义。
- **修复方向**：watch 回调在 `!on` 时 `clearInterval(playTimer)`；
  补一条「暂停后年份 2s 不变」的回归用例（本报告的探针用例可直接转正）。

### 2.3 [P2] 画布点选的 ScreenSpaceEventHandler 未销毁

`AnalysisView.vue:346` 局部创建的 `handler`（画布点选国家）在
`onUnmounted` 中没有 `destroy()`——其余三个页面都有（本项目自身惯例）。
SPA 路由往返会累积监听与对旧 viewer 的引用。建议与 2.2 一并修复。

### 2.4 [P2] 已知边界确认

- 刷新后选国/对比/年份全部丢失（无 URL 状态，候选 A3 解决）；
- 对比满 4 国后勾选第 5 国**静默无效**（`toggleCompare` 的 `else if` 丢弃，
  无任何提示）——建议加 toast/禁用态；
- 对比表口径混合：GDP 列随时间轴年份变，人口/碳排放列是静态年，
  表头未标注年份。

---

## 3. `/monitor` 业务监控

### 3.1 全链路实测通过，无新增缺陷

- 初始 10 条事件 + 统计（未处理 10）✓；
- 处置流转：open → processing → resolved（统计联动 10→9、resolved 0→1）✓，
  重新打开 ✓；
- 「+ 模拟事件」：列表 10 → 11 ✓；
- `?nostream=1`：8 秒窗口内无自动推送（确定性开关有效）✓；
- 点击列表项 flyTo 定位、右侧详情联动 ✓（正式 E2E 已守护）；
- 资源释放干净：handler.destroy ✓、stopStream ✓、poolTimer 清理 ✓、viewer.destroy ✓。
- 全页无 `pageerror`。

### 3.2 [P2] 自动推送无 UI 开关；streaming 文案是死状态

启停自动推送只有 URL 参数 `?nostream=1`，页面无开关；左侧列表底部的
「每 7s 自动推送 / 自动推送已停」文案取决于一个初始化后永不再变的本地 ref，
不是数据层的真实流状态。若做候选 K1/K3 建议顺手把流状态收敛到
`useEarthquakeFeed` 内部并暴露开关。

### 3.3 已知边界确认

处置状态仅内存（刷新丢失，候选 K1）、无历史回放（候选 K4）、mock 池轮播。

---

## 4. `/workbench` 分析工作台

### 4.1 [P0] GDP 主题把「世界」等聚合项当国家：Top10/摘要/导出报告全部失真

- **复现**：打开 `/workbench`（GDP 主题默认），Top10 第 1 名是
  **「世界 92.63 万亿美元」**；前 7 名依次为
  世界 / 人口紅利之後 / 高收入国家 / 经合组织成员 / 中等收入国家 /
  中低收入国家 / IBRD与IDA ——**全是无地理多边形的聚合项**，美国（真实第 1 国）
  只排第 8。摘要文本「世界 以 92.63 万亿美元居首」、导出 HTML 报告的排行表
  同样错误（实测 471KB 报告含错误表格）。
- **根因**：`WorkbenchView.vue:115` `gdp: computed(() => gdpByYear.value['2020'])`
  直接用原始 timeline（2020 年 264 条 = 168 国 + 96 聚合项）。
  `/analysis` 页经 `useCountryData` 的「多边形 ∩ GDP」交集过滤（166 国），
  工作台没有复用该过滤。地图着色因 `Choropleth.byName` 天然过滤不受影响——
  **纯展示层污染，恰好最难被看出。**
- **修复方向**（一行级）：gdp map 按 `countries.value` 过滤；
  carbon map 已按 countries 构建（`c.emission != null`），不受此问题影响。
  转正一条断言「Top10 首位不等于『世界』」的 E2E。

### 4.2 [P1] 碳排放 mock 数据失真：厄立特里亚全球第一

- **实测**：carbon 主题 Top1 = 厄立特里亚 9,989.48 MtCO₂；前十占样本仅 12.2%。
  数据文件本身如此（`public/data/mock/carbon.json`：厄立特里亚 9989 / 伯利兹
  9919 / 吉布提 9774 …；中国仅 1919、美国 896）——随机生成未按国家规模加权。
- **影响**：代码无 bug，但工作台的摘要/报告会把荒谬结论放大输出
  （「厄立特里亚以 9,989 MtCO₂ 居首」）。演示场景下损害可信度。
- **修复方向**：按 GDP 或人口量级加权重造 carbon mock（保持「演示数据」
  定位即可，无需真实数值），或报告模板标注「随机演示数据」。
  与候选 W1（主题扩展）一起做最顺。

### 4.3 [P2] loadError 数据失败分支是死代码

`WorkbenchView.vue:234` `if (loadError.value) return`，但
`loadError` 只在 Cesium 初始化失败时设置；`useCountryData()` 的 `error`
ref 从未被解构。数据加载失败时页面**静默全灰**（着色全灰、排行空、摘要空），
无错误提示。对比 `/analysis` 有「数据加载中/失败」面板。

### 4.4 正常项

主题切换联动（单位/排行/摘要同步切换）、echarts 动态加载不进首屏、
排行点击 flyTo、报告导出自包含（内嵌地图 + 图表快照 + 表格，471KB 可离线打开）
全部正常；resize/dispose 资源释放干净。

---

## 5. 跨页面与文档

| # | 级别 | 发现 |
|---|---|---|
| 5.1 | P2 | `docs/KNOWN_PITFALLS.md` D3 缓解清单写 `RequestScheduler.requestsPerServer = 3`，代码实际为 `1`（`createViewer.js:50`，注释明确单子域名 ×1 = 全局串行）。文档漂移，应改文档对齐代码。 |
| 5.2 | P2 | 测试技巧沉淀：Cesium 渲染繁忙时 Playwright 的 actionability 检查（fill/click 的 stability 采样）会长时间拿不到 rAF 而超时——表现为「元素 visible、enabled、stable 都过了，performing click 卡死」。对策：面板交互用 `click({ force: true })`；这也解释了计划书提到的「时间轴播放用例满载时偶发不稳定」。建议进 KNOWN_PITFALLS。 |
| 5.3 | — | 性能观感：串行瓦片（红线要求）加载节奏正常；四页首屏无可感知异常；无内存增长类实锤（handler 泄漏见 2.3，属静态审查结论）。 |

## 6. 缺陷 → 修复建议汇总（供任务 B 排期）

> **处置状态（2026-09-15 任务 B 完成后回填）**：P0 与全部 P1 已修复并各带回归用例；
> P2 已全部修复（analysis handler 泄漏、tools GeoJSON 下限、monitor 流开关、文档漂移随
> 修复批次与增强项落地；对比第 5 国静默、workbench 死代码分支为收尾批次修复）。

| 优先 | 缺陷 | 建议归属 | 状态 |
|---|---|---|---|
| **P0** | workbench GDP 聚合项污染（§4.1） | 立即修复（独立小 commit，先补失败断言再改） | ✅ 已修复 |
| **P1** | analysis 暂停失效（§2.2） | 立即修复 + 回归用例 | ✅ 已修复 |
| **P1** | tools 状态脱钩（§1.2） | 修复（controller 广播 activeTool） | ✅ 已修复 |
| **P1** | tools debug HUD 失效（§1.3） | 修复（provider.errorEvent + 错误提示解耦） | ✅ 已修复 |
| **P1** | carbon mock 失真（§4.2） | 数据重造（可与 W1 合并） | ✅ 随 W1 重造（与人口同源） |
| P2 | analysis handler 泄漏（§2.3）、对比第 5 国静默（§2.4）、GeoJSON 下限（§1.4）、workbench 死代码（§4.3）、monitor 流开关（§3.2）、文档漂移（§5.1/5.2） | 随对应增强项顺手修 | ✅ 全部已修复 |
