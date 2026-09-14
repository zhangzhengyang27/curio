# 路线图与范围声明

## 0. 范围声明（重要）

**自本文件生效起，示例中心冻结接入新的示例来源。**

理由：项目已从「地球数据可视化应用」蔓延为 11 个来源、1417 条示例的聚合体，
而工程治理（版本控制、CI、测试、文档）严重滞后。继续接新源会持续放大维护成本，
且每个新源都是「半集成」状态（如 `city-realtime-webgl` 的 source 改名后组件路径一度失配）。

允许的动作：修复存量示例、优化已有机制。
需要评审的动作：接入新来源（必须先在本文档登记并说明长期归属）。

**示例中心的终态定位：归档模式（只读）。**
在「不接新源」之上进一步明确：示例中心的目标状态是**稳定可用的只读归档**——
只修坏死（构建失败、组件白屏、封面缺失、闸门变红），不加新功能、不做存量风格整改
（与第 3 节「明确不做」一致）。在此定性下，它的维护成本应趋近于零，而非持续投入。

---

## 1. 产品路线图：数字地球平台

> 2026-09-14 二次拍板：地球应用从「数据可视化 demo 集合」重构为**数字地球平台**——
> 四个功能页面、真实 GIS 底座、新旧并存过渡。引擎底座选型 **CesiumJS**
> （项目已有 cesium 1.142 依赖、天地图 token、266 个 cesium 示例存货；
> 备选 tellux——three.js 系数字地球引擎、MIT，作为效果对标参考）。
> 底座接入复用示例侧已验证的「预编译 Build 产物动态加载」模式
> （`src/map/cesiumLoader.js`），prod 静态资源由 copy-example-deps 拷入。

### 1.1 定位（不变）

作品集展示（2026-09-14 拍板）：面向招聘/同行，核心交付是可分享的真实功能演示。
范围约束不变：仅 PC 端；巡游不含疫情主题。

### 1.2 平台蓝图（四页面 × 各自闭环）

| 页面 | 路由 | 用户旅程（闭环） | 状态 |
|---|---|---|---|
| ② 地图工具箱 | `/tools` | 搜索/定位 → 量距/量面 → 标绘点线面 → 书签保存/回跳 → 导出 GeoJSON/截图 | **P0 已完成 MVP**：量距（测地线）、量面（切平面鞋靴公式）、标点/线/面、撤销/清空、书签（localStorage 持久化）、GeoJSON/截图导出。天地图底图（token 缺省降级 OSM）。待补：地名搜索（需接天地图搜索 API）、标绘样式编辑 |
| ① 全球数据分析 | `/analysis` | 全球 GDP 着色图（choropleth）+ 搜索/点选国家 → 指标卡联动（GDP/人口/人均/密度/碳排放 + 当年排名）→ 多国对比表（≤4 国）→ 时间轴播放演进（2000~2020） | **P1 MVP 已完成（2026-09-14）**，E2E 4 条守护。待扩展：碳排放/人口指标着色切换、贸易/航线图层联动 |
| ③ 业务监控 | 待定 | 告警列表 → 点击 flyTo 定位 → 详情 → 处置标记 → 统计 | P2：需先定业务主题与模拟数据流；巡游引擎可复用为大屏轮播 |
| ④ 主题分析工作台 | 待定 | 选主题 → 组合数据层与图表 → 生成并导出分析报告 | P3：巡游引擎改造为报告分镜 |

共享底座：相机/视角、拾取、实体（标注）系统、图层管理、状态持久化（localStorage + URL）。

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
| 建立远端仓库并推送 | 当前仓库 **没有任何 remote**，40+ 个提交只存在于本机磁盘 | 一次磁盘故障即全部丢失 |
| 轮换已泄露的凭据 | 百度 AK 与天地图令牌曾以明文存在于工作区，应视为已泄露 | 需在对应控制台轮换 + 配置白名单 |
| 首次跑通 CI | `.github/workflows/ci.yml` **已存在**（含 lint / typecheck / verify / build / e2e，verify 链已含新增的漂移检测），但**从未真正执行过** —— 需先建远端并推送后才可能跑。**分步已在本机手工验过**：`npm run lint` 干净、`npm run verify` 全绿、`npm run typecheck` 0 error、`vite build` EXIT=0、E2E dev + preview 各 15/15；`npm ci --dry-run --legacy-peer-deps` 亦通过，且本地 `node_modules` 同为 npm 安装 —— 即 CI 将装出的依赖树与本机一致。剩余风险主要是 GitHub 环境差异（`npx playwright install --with-deps chromium` 等）。⚠ 在这些步骤真正跑通前，仍应视为「未验证」 |

### P1（技术债）

| 项 | 说明 |
|---|---|
| 拆分巨石组件（收尾） | `ExampleGallery.vue`（895→266）与 `CodeDrawer.vue`（675→317）已拆完（过程见 `docs/CHANGELOG.md`）。**仍待拆**：`EarthCanvas.vue`（653 行）、`PersonFirstMoveExample.vue`（2081 行），均需视觉/交互回归验证，属独立任务；动手前沿用「先补特征测试再拆」的纪律 |
| 示例资源收敛 | 把裸 canvas 示例逐步收口到 `useExampleStage`，减少对 `ExampleHost` 兜底的依赖 |
| 依赖分层（长期） | 已用 `scripts/audit-deps.mjs` 建立审计口径并清掉 7 个未使用依赖（见 `docs/CHANGELOG.md`）。**仍待做**：把「产品运行时依赖」与「1400+ 示例专用依赖」分开管理（例如把纯示例依赖移到可选安装），以控制安装体积与主包大小 |
| three 兼容层退出 | 指定 owner，跟踪 npm `three` 稳定版进度，达成条件后按 `THREE_UPGRADE.md` 退出。**维护节奏：每月首周核对一次** npm `three` 稳定版是否已包含 r186 引入的 API（`MeshBasicNodeMaterial` / `CanvasTarget` 等），达成即启动退出 |

### P2（体验与工程效率）

| 项 | 说明 |
|---|---|
| `thanksBibi` 示例未登记 | `threeExamples/application/thanksBibi` 磁盘上有源文件（`.js` + 封面），但从未转换为 Vue 组件，在 `1218670` 基线快照中被移除。生成器现在会跳过它并打印提示。若想真正上线，需补 `src/examples/components/three-cesium-examples/threeExamples/application/ThanksBibiExample.vue`（参考同目录 `FlyLineExample.vue` 的 `ExampleScene` 写法，注意源示例依赖 `#box` 容器与 `CSS3DRenderer`），然后重跑生成器即可自动纳入。**属示例开发，需视觉回归验证，未在本轮做** |
| 示例层 console | 新增 `scripts/audit-console.mjs` 做分类审计。**结论：769 条里 676 条是有意的**（285 error / 21 warn / 67 个 `ElMessage` 替代实现 / 300 条教学演示输出），只清理了 47 条「无标签纯值转储」（`console.log(data)` 这类）。剩余 46 条经逐个核对多为示例的演示输出（导出结果、加载进度、着色器源码），**刻意保留**。若将来要批量降噪，建议在**生产构建**中丢弃 `console.log`（Vite `build.esbuild.pure`），而不是改示例源码 |
| 超大 vendor 块 | `vendor-spark`(4.8 MB)、`vendor-web-ifc`(3.4 MB) 仍超过 `chunkSizeWarningLimit`；可用 `codeSplitting.groups` 的 `maxSize` 进一步切分（仅在确有收益前不动） |

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
- 不追求把 1429 个示例组件全部纳入 TypeScript。
