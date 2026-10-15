# 路线图与范围声明

## 0. 范围声明（重要）

> **2026-10-15 拍板（需求方）：示例中心整体移除。** 77 条 Cesium 示例已迁入
> html5-dataviz 项目（`src/chart-examples/cesium-manifest.ts` + 237M 资产；与本仓库
> 78 条的差异仅为 1 条 `test` 占位示例），本仓库随之删除 /examples 主线、配套闸门
> 与 31 个示例专用依赖，收敛为纯数字地球平台。以下的冻结声明与「归档模式」定性
> 随之终结，保留作历史记录。`src/examples/` 现只剩 three.js 兼容层（**产品依赖，
> 不能删**，见 AGENTS R6）；`/three-globe` 三球画廊与 `/bmap` 保留。

**自本文件生效起，示例中心冻结接入新的示例来源。**

理由：项目已从「地球数据可视化应用」蔓延为 1 个来源、78 条示例的聚合体（2026-10-08 webgl/graphics/mygrapics/city 四源迁出至 html5-dataviz），
而工程治理（版本控制、CI、测试、文档）严重滞后。继续接新源会持续放大维护成本，
且每个新源都是「半集成」状态（如 `city-realtime-webgl` 的 source 改名后组件路径一度失配）。

允许的动作：修复存量示例、优化已有机制。
需要评审的动作：接入新来源（必须先在本文档登记并说明长期归属）。

**示例中心的终态定位：归档模式（只读）。**
在「不接新源」之上进一步明确：示例中心的目标状态是**稳定可用的只读归档**——
只修坏死（构建失败、组件白屏、封面缺失、闸门变红），不加新功能、不做存量风格整改
（与第 3 节「明确不做」一致）。在此定性下，它的维护成本应趋近于零，而非持续投入。

> **2026-09-23 边界澄清（需求方拍板）**：「只修坏死」不含**可发现性缺陷**。
> 一轮实测审计（1415 条可见示例）确认了 5 个静默缺陷（翻页不回到顶部、XR 分类 75% 误分、
> 125 条任何分类都筛不到、≤1100px 整页横向溢出、返回列表丢滚动位置），
> 以及一个定位问题：库按渲染技术组织、产品按地理场景定位（搜「地图」仅 6 条）。
> 前者按「修坏死」处理；后者破例加了一个「地理 / GIS」分面 —— 它是**由 source+category
> 自动判定的只读派生**，不逐条改内容、不接新源，因此不违背归档终态。
> 明确仍不做的：批量改写 448 条同名标题、499 条重复描述、重做标签体系、收藏/推荐位。
> 逐项落点见 `docs/CHANGELOG.md` 的 2026-09-23 小节。

> **2026-09-27 拍板（修订「一个文件都不删」，需求方批准）**：允许且仅允许一类删除——
> 「同库机械副本合并」：同一 demo 在两个来源存在机械改名副本时，删旧副本、保留正本。
> 首例已执行：`mygrapics` 中 17 条 `graphics` 机械副本（可见示例 1415 → 1398，
> mygrapics 来源 97 → 80）。明细与 runbook 见 `docs/DEDUP_RESEARCH.md` 附录 B，
> 执行记录见 `docs/CHANGELOG.md` 的 2026-09-27 小节。
> 其余归档只读原则不变：仍不接新源、不做批量文案改写、不动课程序列与 WebGL/WebGPU 双后端镜像。

---

## 1. 产品路线图：数字地球平台

> 2026-09-14 二次拍板：地球应用从「数据可视化 demo 集合」重构为**数字地球平台**——
> 四个功能页面、真实 GIS 底座、新旧并存过渡。引擎底座选型 **CesiumJS**
> （项目已有 cesium 1.142 依赖、天地图 token、266 个 cesium 示例存货；
> 备选 tellux——three.js 系数字地球引擎、MIT，作为效果对标参考）。
> 底座接入复用示例侧已验证的「预编译 Build 产物动态加载」模式
> （`src/map/cesiumLoader.js`），prod 静态资源由 copy-example-deps 拷入。

> **2026-09-24 需求方拍板（四项决策，交互确认）**：
> ① **默认入口维持 `/` 开场地球**——不为「数字地球平台」改默认路由，平台四页从顶栏进入；
> ② **`/three-globe` 与 `/bmap` 维持现状**：不移出主导航、不下线
>    （推翻 PRODUCT_PLAN §4.2 对这两页的建议处置，两页仍为零功能测试覆盖，知悉）；
> ③ **部署形态：暂不部署**。先完成 `build:platform` 构建拆分与本地验证（T03 的 V1~V7），
>    T04 上线等「有明确需要」（如需对外投递材料时）再启动，届时形态为主站包先行、
>    归档站暂不部署；上线前必须补：凭据轮换 + 天地图 Referer 白名单 + 删除含旧 AK 的本地 `dist/`；
> ④ **时间盒改为一个月**，目标从「一周拿链接」改为「达到随时可发布状态」。
> 同场拍板：**远端仓库与 CI 继续搁置**（需求方明确「远程先不用管」）——
> 在此期间本地闸门（verify / typecheck / dev+preview 双跑 E2E）是唯一防线，纪律不放松；
> 另建议以 `git bundle` 做低成本异地备份对冲磁盘单点（未拍板，仅登记）。
> **T02 范围随之修订**：`/tools` 迁 ProductShell 与导航改名照做；
> `/three-globe`、`/bmap` 两个导航项不动 → smoke.spec.ts 只需同步 productLinks
> 数组（4→5 项，含 `/tools`）与顶栏计数断言，resourceLinks 需从 4 项改为
> 3 项（移除「地图工具箱」，`示例中心/ThreeGlobe/百度地图` 保留）。

### 1.1 定位（不变）

作品集展示（2026-09-14 拍板）：面向招聘/同行，核心交付是可分享的真实功能演示。
范围约束不变：仅 PC 端；巡游不含疫情主题。

### 1.2 平台蓝图（四页面 × 各自闭环）

| 页面 | 路由 | 用户旅程（闭环） | 状态 |
|---|---|---|---|
| ② 地图工具箱 | `/tools` | 示例列表 → 点击进入单个示例。当前含：综合工具箱（`/tools/toolbox`：搜索/定位 → 量距/量面/矩形/圆/贴地距离 → 标绘点线面（编辑/顶点拖拽）→ 坐标转换 → 书签保存/回跳 → 导出 GeoJSON/CSV/截图）+ vue-cesium 十六示例（量测十一种/标绘七种含贴地与顶点编辑/通视与可视域/淹没分析（ArcGIS 地形）/导航控件含 AjaxBar/鹰眼图/打印/拾取指示器/小屏导航/热力图/HTML 覆盖物/ECharts 航线图/台风路径/风场粒子/动态对象/扫描与后处理） | **P0 MVP + 两批增强已完成；示例列表改版 + vue-cesium 工具类组件补齐至全覆盖（17 卡，2026-09-17）已完成**：`/tools` 为示例列表页（`MapToolsGallery` + `src/views/tools-examples/` 注册表），综合工具箱整体迁至 `/tools/toolbox`（27 条 E2E 随 URL 同步，交互契约不变）。⚠ vue-cesium 量测/绘制组件的 props 必须传稳定数组引用（内联 .map() 会使组件内部 action 表重建、点击链静默失效，见 CHANGELOG 2026-09-17）；FAB 需显式 `direction:'left'`（默认 right 在右下角飞出视口）。贴地距离/剖面由自有实现覆盖（terrainSampler 采样源） |
| ① 全球数据分析 | `/analysis` | 全球 GDP 着色图（choropleth）+ 搜索/点选国家 → 指标卡联动（GDP/人口/人均/密度/碳排放 + 当年排名）→ 多国对比表（≤4 国）→ 时间轴播放演进（2000~2020） | **P1 MVP 已完成（2026-09-14）**，E2E 4 条守护。待扩展：碳排放/人口指标着色切换、贸易/航线图层联动 |
| ③ 业务监控 | `/monitor` | 主题：地震应急监测。**真实数据源（2026-09-21 接入）**：`server/` 零依赖后端抓 USGS feed → SQLite → 前端 30s 轮询增量；后端不可达退打包快照。告警列表分级 → 点击定位 → 处置流转（未处理→处理中→已处置，可重开）→ 统计大盘 → 巡游大屏/时间回放 | **P2 MVP 已完成（2026-09-14），真实数据链路已完成（2026-09-21）**，`tests/monitor.spec.ts` 15 条守护（route 拦截喂夹具，与后端是否启动解耦）+ `server/test` 10 条 node:test。待扩展：多源（CENC 无开放接口，已评估否）、历史统计查询（SQLite 已具备） |
| ④ 主题分析工作台 | `/workbench` | 双主题（GDP/碳排放）→ 着色图 + Top10 排行 + echarts 图表联动 → 一键导出自包含 HTML 分析报告（内嵌地图快照与图表） | **P3 MVP 已完成（2026-09-14）**，E2E 3 条守护。待扩展：巡游引擎改造为报告分镜、更多主题与自选指标组合 |

共享底座：相机/视角、拾取、实体（标注）系统、图层管理、状态持久化（localStorage + URL）。

> 📋 四页面的**审查与增强计划**（含现状清单、候选功能菜单、验收标准，供 AI 代理直接执行）
> 见 [`docs/PAGES_ENHANCEMENT_PLAN.md`](./PAGES_ENHANCEMENT_PLAN.md)。
> 📋 2026-09-15 任务 A 审查产出（1 P0 + 4 P1，含复现证据与修复方向）见
> [`docs/PAGES_REVIEW_REPORT.md`](./PAGES_REVIEW_REPORT.md)。
>
> **2026-09-15 需求方拍板：本轮实施 = 审查缺陷全部修复 + 增强项 A1/K1/W1/M3**，逐项状态：
>
> | 项 | 内容 | 状态 |
> |---|---|---|
> | 修复 | workbench GDP 聚合项污染（P0）/ analysis 暂停失效（P1）/ tools 状态脱钩（P1）/ tools debug HUD 失效（P1）/ analysis handler 泄漏（P2）/ carbon mock 失真（P1，并入 W1）/ 对比第 5 国静默（P2）/ workbench 数据失败死代码（P2）/ monitor 初始放行跳号（P2，K2 实施中发现） | **已完成**（各一条回归用例守护，见 `docs/PAGES_REVIEW_REPORT.md`） |
> | A1 | 指标着色切换（GDP/人口/碳排放） | **已完成** |
> | K1 | 处置持久化 + 重置演练 + 流开关 UI | **已完成** |
> | W1 | 工作台主题扩展（人口/密度）+ carbon mock 重造 | **已完成** |
> | M3 | 标绘持久化 + GeoJSON 导入 | **已完成** |
> | M1/M2/M4/M5、A2/A3/A4/A5、K2/K3/K4、W2/W3/W4、X1/X2/X3 | **第二批（2026-09-15 增量拍板：剩余菜单全做）**——地名搜索、标绘编辑、书签增强、量测记录、趋势图、URL 分享、CSV 导出、人均着色、阈值告警、巡游大屏（复用巡游引擎）、时间回放、选国下钻、报告双模板、报告 PDF、引擎复用、URL 规范、性能度量 | **已完成**（`tests/perf.spec.js` 已扩展四页度量） |

### 1.3 分期与成功标准

- **P0（已完成）**：`/tools` 工具箱 MVP（见上表），E2E 守住（`tests/map-tools.spec.js`）。
- P1~P3：按 ①→③→④ 顺序，每期交付一个可用页面；完成一项把状态写回本表。
- 质量标准不变：`npm run verify` / typecheck / lint / 双模式 E2E 全绿。
- 性能预算见 `docs/PERF_BASELINE.md`（各新增页面按同口径实测后补记基线）。
- 交付：至少一条公开部署链接（`docs/DEPLOY.md`）。

### 1.4 存量处置（已拍板：新旧并存过渡）

- **旧首页（手绘地球 + 10 个 demo 模式）**：保留在 `/`，待四页面成型后再评估是否替换默认页。
- **巡游功能**：保留（四条路线同时是平台的效果示范），P3 改造为主题报告的分镜引擎。
- **示例中心**：维持归档模式不变。
- kepler 式「自助数据导入」方向已被四页面平台方向取代，其「配置序列化→分享」思想
  融入各页面的输出环节。

---

## 2. 待办（工程）

> 已完成项归档至 [`docs/CHANGELOG.md`](./CHANGELOG.md)，本表只保留待办。

### P0（未完成，建议优先）

| 项 | 说明 | 备注 |
|---|---|---|
| 轮换已泄露的凭据 | 百度 AK 与天地图令牌曾以明文存在于工作区，应视为已泄露 | 需在对应控制台轮换 + 配置域名白名单；公开部署前同时删除含旧 AK 的本地 `dist/`（404MB） |

> 2026-10-14：「建立远端仓库并推送」与「首次跑通 CI」两项完成——远端 `github.com/zhangzhengyang27/curio`，
> CI 经四轮修复后全绿（过程与根因归档见 `docs/CHANGELOG.md` 2026-10-14 小节）。

### P1（技术债）

| 项 | 说明 |
|---|---|
| 大厂级重塑收尾项 | 主体已全部合入（见 `docs/CHANGELOG.md` 2026-09-29/30 轮次）。**仍待做**:① 迁移协议补 Node 单测(`src/utils/legacyStorage.ts` 的读旧迁新是纯 localStorage 协议,jsdom 可仿真——终审建议,ledger 里的「无法仿真」只对 E2E 成立);② 示例中心双主题下「M0 审计 P1 残留」按底账(`specs/2026-09-29-m0-audit.md`)逐项消化;③ palette 在 /examples 等页的推广范围决策(spec §11 决策点 2,当前仅首页) |
| 拆分巨石组件（收尾） | `ExampleGallery.vue`（895→266）与 `CodeDrawer.vue`（675→317）已拆完（过程见 `docs/CHANGELOG.md`）。`EarthView.vue` 已拆（706→356,2026-09-30）。**仍待拆**：`EarthCanvas.vue`（653 行）、`PersonFirstMoveExample.vue`（2081 行），均需视觉/交互回归验证，属独立任务；动手前沿用「先补特征测试再拆」的纪律 |
| 拆分巨石组件（收尾） | `ExampleGallery.vue`（895→266）与 `CodeDrawer.vue`（675→317）已拆完（过程见 `docs/CHANGELOG.md`）。**仍待拆**：`EarthCanvas.vue`（653 行）、`PersonFirstMoveExample.vue`（2081 行），均需视觉/交互回归验证，属独立任务；动手前沿用「先补特征测试再拆」的纪律 |
| 示例资源收敛 | 把裸 canvas 示例逐步收口到 `useExampleStage`，减少对 `ExampleHost` 兜底的依赖 |
| 依赖分层（长期） | 已用 `scripts/audit-deps.mjs` 建立审计口径并清掉 7 个未使用依赖（见 `docs/CHANGELOG.md`）。**仍待做**：把「产品运行时依赖」与「1400+ 示例专用依赖」分开管理（例如把纯示例依赖移到可选安装），以控制安装体积与主包大小（2026-10-05 three 侧 6 源已迁出 html5-dataviz，示例专用依赖已大幅缩减） |
| three 兼容层退出 | 指定 owner，跟踪 npm `three` 稳定版进度，达成条件后按 `THREE_UPGRADE.md` 退出。**维护节奏：每月首周核对一次** npm `three` 稳定版是否已包含 r186 引入的 API（`MeshBasicNodeMaterial` / `CanvasTarget` 等），达成即启动退出 |

### P2（体验与工程效率）

| 项 | 说明 |
|---|---|
| `thanksBibi` 示例未登记 | `threeExamples/application/thanksBibi` 磁盘上有源文件（`.js` + 封面），但从未转换为 Vue 组件，在 `1218670` 基线快照中被移除。生成器现在会跳过它并打印提示。若想真正上线，需补 `src/examples/components/three-cesium-examples/threeExamples/application/ThanksBibiExample.vue`（参考同目录 `FlyLineExample.vue` 的 `ExampleScene` 写法，注意源示例依赖 `#box` 容器与 `CSS3DRenderer`），然后重跑生成器即可自动纳入。**属示例开发，需视觉回归验证，未在本轮做** |
| 示例层 console | 新增 `scripts/audit-console.mjs` 做分类审计。**结论：769 条里 676 条是有意的**（285 error / 21 warn / 67 个 `ElMessage` 替代实现 / 300 条教学演示输出），只清理了 47 条「无标签纯值转储」（`console.log(data)` 这类）。剩余 46 条经逐个核对多为示例的演示输出（导出结果、加载进度、着色器源码），**刻意保留**。若将来要批量降噪，建议在**生产构建**中丢弃 `console.log`（Vite `build.esbuild.pure`），而不是改示例源码 |
| 超大 vendor 块 | `vendor-spark`(4.8 MB)、`vendor-web-ifc`(3.4 MB) 仍超过 `chunkSizeWarningLimit`；可用 `codeSplitting.groups` 的 `maxSize` 进一步切分（仅在确有收益前不动） |
| 临界超时用例排查 | 已修 M4（tools 书签）与 W2（workbench 报告模板）：均为「双整页加载/双报告导出」型用例，实测 52~57s 贴着默认 60s 超时线，机器稍慢即在任意一步超时（报错位置漂移）。已按 M2 先例 `test.setTimeout(120s)`。同型用例再出现超时漂移报错时，先查总时长再查逻辑 |
| tools 地形接入（**已接入，2026-09-16**） | 官方闭源扩展包评估不通过（49k 行 bundle/仅适配 1.52~1.63.1/协议黑盒，详见 CHANGELOG），最终改用 **Cesium 内置 `ArcGISTiledElevationTerrainProvider.fromUrl`** 接 ArcGIS World Elevation3D 公开高程服务（无需 token/无协议逆向）。**架构关键决策：provider 只做 sampleTerrain 的采样源，刻意不赋给 viewer.terrainProvider**——实测地形渲染在 CN 网络+全局串行调度下持续产生 3s 级长任务拖卡主线程；纯采样则零渲染开销、页面流畅。已实现：贴地距离（沿测地线插值 + sampleTerrain 高程 + 段内勾股合成，异步收尾）、高程剖面 SVG、编辑后重算。真实验证：珠峰区域采样高程 7.9~8.7km。换数据源只需改 `src/map/terrainSampler.js` |
| tools 贴地面积缓办 | 贴地面积需要多边形网格细分 + 逐格高程采样 + 3D 面积累加（贴地距离的二维推广），在 sampleTerrain 通道上可实现但工作量独立；待下一轮 |
| vue-cesium 量测/绘制组件集成 | **已解决（2026-09-17）**：此前误判为 Rolldown 构建链不兼容（对照实验的正常组激活路径不同，未触达真因）。真实根因：① `:measurements` 等 props 传内联 `.map()` 不稳定引用，激活后父组件重渲染使组件内部 action 表 computed 失效重建，selected 残留旧对象致点击被静默吞掉——修复为 script 常量稳定引用；② VcFab `direction` 默认 `'right'`，右下角动作条飞出视口并触发容器滚动拉偏地图——修复为 `main-fab-opts:{direction:'left'}`。四示例页已回归，Vite 8 无需降级。坑记录见 CHANGELOG 2026-09-17 |

---

## 2.5 文档与计划的存放约定

| 位置 | 用途 |
|---|---|
| `README.md` / `CONTRIBUTING.md` | 项目说明、上手与提交规范（**当前有效**） |
| `docs/` | 架构、坑点、路线图、three.js 升级（**当前有效，随代码一起维护**） |
| `docs/CHANGELOG.md` | 治理轮次的已完成项归档（**当前有效**，新完成的工作追加于此） |
| `.trae/specs/`、`.trae/documents/` | 历史 spec 与实施计划归档（各示例源接入时期）。文档里的路径是当时机器的绝对路径，**已失效**，仅作决策留痕；如需重启某个计划，请先把结论提炼进 `docs/ROADMAP.md` |

> 教训：`.trae/documents/fix-three-project-typescript-errors.md` 里早已写明
> 「目标：`pnpm typecheck` 退出码为 0」，而该目标后来确实达成了（实测 0 error）。
> 这份存档没被纳入 `docs/`，导致后来误判「全量类型检查不可用」并多写了一份收敛配置。
> **归档 ≠ 可忽略**：计划文档里的结论必须同步到 `docs/`。

## 3. 明确不做

- 不再接入新的示例来源（见第 0 节）。
- **地球应用不做移动端适配**（2026-09-14 拍板，仅 PC 端）。
- **巡游路线不包含疫情主题**（2026-09-14 拍板；`disease` 图层保留在应用中，但不进巡游分镜）。
- 不为历史遗留的转换产物（`src/examples/components/{webgl,graphics,mygrapics}` 等由 HTML 批量转换而来的示例）
  做逐文件代码风格整改 —— 它们在 ESLint 配置中已被整体豁免，视为「保留原始风格的外部代码」。
- ~~不追求把 1429 个示例组件全部纳入 TypeScript。~~
  （**2026-09-17 推翻**：拍板对 src 做 TypeScript 整体迁移，示例组件按 11 个来源分波纳入，
  见 [`docs/TS_MIGRATION.md`](./TS_MIGRATION.md)。
  上一条的「外部代码」豁免语义不变 —— `jsm-compat` / `three-build-compat` 等三方副本仍不迁移。）
