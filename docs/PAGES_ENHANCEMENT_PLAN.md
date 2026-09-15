# 数字地球平台 · 四页面审查与增强计划（AI 任务书）

> **本文档是自包含任务书**：面向被指派「审查现有功能并添加增强」的 AI 代理。
> 无需其他上下文，从这里出发即可开工。动手前必读第 2 节红线与第 8 节验收标准。

---

## 1. 背景

本仓库是 TerraVista 3D——基于 Vue 3.5 + Vite 8（内核 Rolldown）+ Three.js + **CesiumJS 1.142** 的数字地球平台。
平台由四个功能页面组成（共享顶部导航与同一套 Cesium 底座），已全部交付 MVP：

| 页面 | 路由 | 主题 |
|---|---|---|
| ② 地图工具箱 | `/tools` | 量测/标绘/书签/导出 |
| ① 全球数据分析 | `/analysis` | 国家多指标联动 + 多国对比 + GDP 时间演进 |
| ③ 业务监控 | `/monitor` | 地震应急监测：实时流→定位→处置→统计 |
| ④ 分析工作台 | `/workbench` | 主题（GDP/碳排放）组合图表 → 导出 HTML 报告 |

首页 `/`（three.js 手绘地球）、`/three-globe`、`/bmap`、`/examples`（166 条示例库，**冻结勿动**）不在本计划范围内。

你的任务分两段：**A. 审查**（第 4 节）→ **B. 增强**（第 5 节候选菜单，与需求方确认后实施）。

> **执行状态（2026-09-15）**：任务 A 已完成，产出
> [`PAGES_REVIEW_REPORT.md`](./PAGES_REVIEW_REPORT.md)（1 P0 + 4 P1，全部实测复现）；
> 任务 B 经需求方确认实施「缺陷全部修复 + A1/K1/W1/M3」，**均已交付**
> （见第 5 节打勾项与 ROADMAP 1.2）。

---

## 2. 硬性约束（红线，违反即返工）

以下全部是**真实踩过的事故**，详见 `docs/KNOWN_PITFALLS.md`（D1/D3/D3-0 必读）：

1. **天地图必须串行加载**：`src/map/createViewer.js` 已设单子域名 t0 × `requestsPerServer=1`。
   并发拉瓦片会触发**频率限流**——服务端不报错，而是返回占位图（vec 103B 素色 / img 4769B
   带字「无影像」水印，数分钟后自恢复），画面呈满屏米白或水印。**任何新页面/新图层
   必须走 `createMapViewer`，禁止绕过或调高并发。** 个人 key 影像底图日配额仅 1 万次。
2. **WMTS URL 模板**必须包含 `tilematrix={TileMatrix}&tilerow={TileRow}&tilecol={TileCol}`
   ——漏写或把 `{TileCol}` 写成 `{TileColumn}` 都会导致「地图永远出不来」且零报错（D3-0）。
3. **影像层按相机高度显隐**（≤150 万米）+ `maximumZoomDistance=1000 万米`：天地图卫星影像
   在 L3~5 是「无影像」占位区。矢量层永远兜底。
4. **范围约束**：仅 PC 端；**不出现疫情主题内容**；`/examples` 冻结（不修不改不新增）。
5. **底图凭据**只经 `VITE_TDT_TOKEN`（支持逗号分隔多 key 轮询）注入，严禁入库；
   `check:secrets` 会在本地钩子与 CI 双重拦截。

## 2.1 质量闸门（每次交付前必须全绿）

```bash
npm install --legacy-peer-deps      # 首次安装
npm run verify                      # 凭据/注册表/漂移/封面/兼容层 五项一致性
npm run typecheck                   # vue-tsc 全量，0 error
npm run lint:ci
npm run test:e2e                    # dev 模式，playwright 独立端口 5299
E2E_TARGET=preview E2E_PREVIEW_OUT_DIR=/tmp/<dir> npm run build \
  && node scripts/copy-example-deps.js --outDir /tmp/<dir> \
  && E2E_TARGET=preview E2E_PREVIEW_OUT_DIR=/tmp/<dir> npm run test:e2e
# ⚠ 裸 vite build 少 copy-example-deps 会让 /tools /analysis /monitor /workbench 全部
#   因缺 cesium 静态资源而 404（KNOWN_PITFALLS C8/DEPLOY.md）
```

当前基线：**E2E 75 条**（2026-09-15 两批增强交付后：四页面 42 条 + 首页/巡游/性能 33 条，
dev 与 preview 双模式全绿）。任何交付不得使基线变红。

---

## 3. 四页面现状清单（审查基线）

### 3.1 地图工具箱 `/tools`

- **文件**：`src/views/MapToolsView.vue`、`src/map/cesiumLoader.js`（预编译 Cesium 动态加载）、
  `src/map/createViewer.js`（底图工厂，支持 `{mode, view, maxZoom}`）、
  `src/map/tools/mapToolsController.js`（五工具状态机）、`src/map/bookmarks.js`
- **E2E**：`tests/map-tools.spec.js`（4 条）
- **已有功能**：量距离（测地线）/量面积（切平面鞋靴公式）/标点/标线/标面（左键采点、
  右键双击结束、Esc 取消、实时预览）；撤销/清空（实体登记制：主体+附属）；书签
  （localStorage，`tv-map-bookmarks`）；标注导出 GeoJSON；地图截图 PNG；
  底图切换（卫星影像 ≤150 万米自动显隐 / 矢量）；初始视角武汉城区 35 万米
- **已知边界**：地名搜索未实现（需接天地图搜索 API）；标绘不可编辑/无样式面板；
  书签不可重命名/导出

### 3.2 全球数据分析 `/analysis`

- **文件**：`src/views/AnalysisView.vue`、`src/map/analysis/useCountryData.js`（数据层）、
  `src/map/analysis/choropleth.js`（等值区着色，`applyValues` 通用入口）
- **E2E**：`tests/analysis.spec.js`（4 条；时间轴播放用例满载时偶发不稳定，重跑即过）
- **数据**（全中文国名主键）：`/data/worldZh.json`（168 国多边形，`properties.nameZh`）、
  `/data/mock/gdp-timeline.json`（2000~2020，含「世界/高收入国家」等**聚合项，
  已用多边形交集过滤**）、`/data/mock/population.json`（人口/面积/密度）、
  `/data/mock/carbon.json`（碳排放 MtCO2）。⚠ 这些是演示数据，数值非真实
- **已有功能**：GDP 排名 7 级色阶 choropleth + 图例；搜索/列表/画布点选国家 → flyTo +
  指标卡（当年 GDP 及排名/人口/人均/面积/密度/碳排放）；多国对比表（≤4 国）；
  时间轴播放（0.7s/年）驱动着色与指标联动；`?debug=1` 自诊断角标 +
  `window.__tvMapDebug` 钩子
- **已知边界**：着色指标仅 GDP；无国家历史趋势图；无 URL 状态分享；无数据导出

### 3.3 业务监控 `/monitor`

- **文件**：`src/views/MonitorView.vue`、`src/map/monitor/useEarthquakeFeed.js`
- **E2E**：`tests/monitor.spec.js`（4 条；用 `?nostream=1` 关自动推送保证确定性）
- **已有功能**：地震事件流（初始 10 条 + 每 7s 自动推送 + 手动模拟）；分级列表
  （level 按 M 值）→ 点击/画布拾取 → flyTo 定位 + 详情；处置流转
  （未处理→处理中→已处置，可重开）驱动标记颜色与统计大盘；模拟推送按钮
- **已知边界**：处置状态仅内存（刷新丢失）；无历史回放；无真实数据源（mock 池轮播）

### 3.4 分析工作台 `/workbench`

- **文件**：`src/views/WorkbenchView.vue`（复用 analysis 的数据层与 choropleth）
- **E2E**：`tests/workbench.spec.js`（3 条）
- **已有功能**：双主题（GDP 2020 / 碳排放）；着色图 + Top10 排行 + echarts 横向条图
  三视图联动（echarts 动态 import 不进首屏）；自动摘要结论；一键导出**自包含 HTML
  分析报告**（内嵌地图快照 + 图表快照 + 排名明细）
- **已知边界**：主题仅两个；图表类型仅条图；报告模板单一；无选国联动图表下钻

---

## 4. 任务 A：审查（先做，产出报告）

对四个页面逐一执行并产出结构化报告（每页一节）：

1. **走查清单**（用真实浏览器，建议 `npm run dev` 后逐项操作）：
   - 每个既有功能按第 3 节清单操作一遍，记录：正常 / 异常（截图+控制台）
   - 控制台 error/warning 分类（`?debug=1` 有 HUD；`window.__tvMapDebug` 可编程读取）
   - 极端操作：快速连点、缩放到上下限、切主题/底图来回切、刷新后状态恢复
   - 性能观感：首屏、瓦片加载节奏（串行，比并发慢属预期，勿报为缺陷）
2. **代码审查**：对照第 2 节红线逐条核对；关注 `show`/`alpha` 状态机、实体登记制
   （主体+extras）、事件处理器销毁（`handler.destroy()`）、内存释放（`dispose` 链）
3. **报告格式**：每条发现 = 严重级（P0 功能坏 / P1 体验 / P2 建议）+ 复现步骤 +
   证据（截图/控制台文本/文件行号）。**禁止凭猜测报告**——每条必须先复现。

---

## 5. 任务 B：增强候选菜单（与需求方确认后实施）

> 排序按「价值/成本」经验预估；每项含验收标准草案。实施前把选定项登记进
> `docs/ROADMAP.md` 第 1.2 表，做完更新状态——路线图是唯一进度事实源。

### 5.1 地图工具箱（约 0.5~1 天/项）

| 候选 | 说明 | 验收标准 |
|---|---|---|
| ✅ M1 地名搜索（2026-09-15 交付） | 地名搜索三通道：天地图 V2.0（个人认证无权限 404，企业认证后自动恢复优先）→ 高德 Web 服务兜底（GCJ-02→WGS-84 纠偏，key 经 VITE_AMAP_KEY）→ Nominatim 末位兜底；全部失败输入框提示 | 搜「武汉」出现候选，点击飞达（E2E mock 高德通道验证）；全部服务不可用时输入框提示 |
| ✅ M2 标绘编辑（2026-09-15 交付） | 已绘实体可选中：拖拽顶点、改颜色/线宽、删除单个 | 顶点可拖、样式即时生效 |
| ✅ M3 标绘持久化（2026-09-15 交付） | 标注存 localStorage，刷新恢复；GeoJSON 导入（与导出对称） | 导出的 GeoJSON 重新导入后画面一致（E2E `tests/map-tools.spec.js` 断言坐标逐位一致） |
| ✅ M4 书签增强（2026-09-15 交付） | 重命名、导出/导入 JSON、缩略图 | 书签列表可改名，导出可再导入 |
| ✅ M5 量测记录（2026-09-15 交付） | 量测结果历史列表 + CSV 导出 | 多次量测可回看、可导出 |

### 5.2 全球数据分析（约 0.5~1 天/项）

| 候选 | 说明 | 验收标准 |
|---|---|---|
| ✅ A1 指标着色切换（2026-09-15 交付） | choropleth 指标切换 GDP/人口/碳排放（`applyValues` 已通用，只差 UI 与色阶） | 切指标后 1s 内全图重着色、图例更新（E2E `tests/analysis.spec.js` 三指标切换用例） |
| ✅ A2 国家趋势图（2026-09-15 交付） | 选中国家 → echarts 折线（2000~2020 GDP），echarts 动态 import | 折线与指标卡数值一致 |
| ✅ A3 URL 状态分享（2026-09-15 交付） | `?country=&year=` 进 query（复用 `useGalleryFilters` 模式），刷新/分享还原 | 分享链接打开后选国与年份一致 |
| ✅ A4 数据导出（2026-09-15 交付） | 当前视图国家表导出 CSV（UTF-8 BOM） | Excel 打开中文不乱码 |
| ✅ A5 人均 GDP 着色（2026-09-15 交付） | GDP/人口 派生指标 + 图例 | 排名合理（卢森堡类应靠前） |

### 5.3 业务监控（约 0.5~1 天/项）

| 候选 | 说明 | 验收标准 |
|---|---|---|
| ✅ K1 处置持久化（2026-09-15 交付） | 事件处置状态存 localStorage，刷新恢复；「重置演练」按钮清空；顺带补自动推送 UI 开关 | 刷新后状态与统计一致（E2E `tests/monitor.spec.js` 持久化/重置/流开关三条用例） |
| ✅ K2 阈值告警规则（2026-09-15 交付） | M≥7 自动标「重大」并列顶；规则可在 UI 调 | 改阈值后列表即时重排 |
| ✅ K3 巡游大屏模式（2026-09-15 交付） | 复用 `useTourEngine` 思路：自动轮播未处置事件（flyTo + 详情卡） | 播放/暂停/步进可用 |
| ✅ K4 时间回放（2026-09-15 交付） | 按发震时间回放事件到达过程 | 回放顺序与时间戳一致 |

### 5.4 分析工作台（约 1~2 天/项）

| 候选 | 说明 | 验收标准 |
|---|---|---|
| ✅ W1 主题扩展（2026-09-15 交付） | 人口规模 / 人口密度主题（数据已在 useCountryData）；碳排放演示数据按人口同源重造 | 每主题图表与摘要正确（E2E `tests/workbench.spec.js` 新主题与数据自洽用例） |
| ✅ W2 报告模板（2026-09-15 交付） | 摘要版 / 完整版两套模板；报告含生成参数指纹 | 两种模板产出均可离线打开 |
| ✅ W3 选国下钻（2026-09-15 交付） | 点排行条目 → 地图 flyTo + 该国多年趋势小图 | 图表与排行数值一致 |
| ✅ W4 报告 PDF（2026-09-15 交付） | 报告页 @media print 样式 + 引导浏览器打印为 PDF | 打印预览排版完整 |

### 5.5 跨页面共享（架构级，约 1 天）

| 候选 | 说明 |
|---|---|
| ✅ X1 巡游引擎复用（2026-09-15 交付） | `src/composables/useTourEngine.js` 抽象化（分镜 schema 已通用），供监控轮播与报告分镜接入 |
| ✅ X2 URL 状态规范（2026-09-15 交付） | 各页 query 参数命名统一（`?country=&year=&theme=`），沉淀到 KNOWN_PITFALLS |
| ✅ X3 性能预算（2026-09-15 交付） | 每页首屏传输预算写进 `docs/PERF_BASELINE.md` 并用 `tests/perf.spec.js` 度量 |

---

## 6. 实施纪律

1. **小步提交**：一个候选项一个（或多个有序）提交，中文 `type(scope): 摘要`，正文写「为什么」。
2. **先测后改**：增强项先补/改 E2E 断言（在旧代码上应失败），再实现。
3. **每项完成**：更新 `docs/ROADMAP.md` 1.2 表状态 + 本文档对应候选打勾；
   触碰计数/路由/行为时同步 README 与 AGENTS.md。
4. **踩坑即沉淀**：新坑写入 `docs/KNOWN_PITFALLS.md`（格式照 D3/D3-0：现象→根因→排查→缓解）。
5. **不动**：`/examples`、旧首页 `/`、`/three-globe`、`/bmap` 的既有功能。

---

## 7. 快速上手命令

```bash
npm install --legacy-peer-deps
npm run dev                 # http://localhost:5173
npm run test:e2e            # 全量 75 条基线，必须保持全绿
```

天地图 token 在 `.env.local` 的 `VITE_TDT_TOKEN`（已配置；支持逗号分隔多 key 轮询）。
启动后先用 `?debug=1` 看各页 HUD 确认瓦片加载正常，再开始审查。
