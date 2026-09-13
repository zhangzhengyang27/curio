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

## 1. 产品路线图：地球应用

> 2026-09-14 拍板：定位选 **A（作品集展示）**，本节自草案转为承诺。

### 1.1 定位（已拍板：A）

**面向招聘/同行的作品集展示**——核心诉求是「一条可分享的演示链接」。
功能按「演示完成度」取舍；部署（见 `docs/DEPLOY.md`）优先级随之提高。

**已拍板的范围约束**：仅 PC 端，不做移动端适配；巡游内容不含疫情主题。

### 1.2 已拍板与候选

| 项 | 状态 |
|---|---|
| **自动巡游（数据故事）** | **进行中（2026-09-14 拍板）**：A+B 档一起做——巡游引擎 + 播放条字幕 UI + 4 条主题路线（JSON 数据驱动）。分镜稿见 [`docs/TOUR_ROUTES.md`](./TOUR_ROUTES.md)。形态参照 GitHub Globe 自动巡游与 Cesium Stories；路线 schema 借鉴 KML Tour 四原语（FlyTo/Wait/AnimatedUpdate/TourControl） |
| 图层/视图状态分享 | 候选。巡游的 URL 状态（`?tour=&step=`）落地后顺势覆盖大半诉求，届时再评估剩余部分 |
| 图层加载体验 | **加载提示部分已完成（2026-09-14）**：异步模式切换有非阻塞 chip + 按钮 spinner（快速连切跟随最后请求）；剩余「真实硬件 FCP 复测」待有真机时做 |
| 数据源清单与许可梳理 | 候选，公开部署前必须完成（定位 A 的前置） |
| 对比视图与时间轴增强 | 候选，先明确各自支持程度再排期 |

### 1.3 成功标准

- 质量：`npm run verify` / typecheck / 双模式 E2E 保持全绿（闸门已就位）。
- 性能（2026-09-14 按 `PERF_BASELINE.md` 重测口径修订）：首页 JS 传输 ≤ 600 KB（实测 589）、
  首页总传输 ≤ 1800 KB（实测 1765，含贴图与首屏数据）；真实硬件 FCP ≤ 2 s，
  以 `tests/perf.spec.js` 前后对比为准（软渲染时间不可比）。
- 交付：至少一条公开可访问的部署链接（方案见 `docs/DEPLOY.md`）。

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
