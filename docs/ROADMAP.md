# 路线图与范围声明

## 0. 范围声明（重要）

**自本文件生效起，示例中心冻结接入新的示例来源。**

理由：项目已从「地球数据可视化应用」蔓延为 11 个来源、1417 条示例的聚合体，
而工程治理（版本控制、CI、测试、文档）严重滞后。继续接新源会持续放大维护成本，
且每个新源都是「半集成」状态（如 `city-realtime-webgl` 的 source 改名后组件路径一度失配）。

允许的动作：修复存量示例、优化已有机制。
需要评审的动作：接入新来源（必须先在本文档登记并说明长期归属）。

---

## 1. 已完成（本轮治理）

| 项 | 说明 |
|---|---|
| 资产保全 | 852 个积压改动按主题拆为 8 个语义化提交，工作树清零；移除指向他人机器路径的 `.npmrc` store-dir |
| 凭据外置 | 百度地图 AK、天地图令牌改为 `VITE_*` 环境变量注入；新增 `check-secrets.mjs` 闸门 |
| 修复静默假通过 | `verify-thumbnails.mjs` 因注册表懒加载改造而静默失效，已修复 |
| 修复真实缺陷 | 校验闸门抓出并修复 **4 个组件路径失配的示例**（2 个 city-realtime-webgl + 2 个 three-cesium） |
| 质量阀门 | 新增 `verify-registry.mjs`、`verify-three-compat.mjs`；修复 `.gitignore` 过宽规则（曾吞掉 `tests/`） |
| E2E 恢复 | 新增 `tests/smoke.spec.js`（5 条核心链路用例），`test:e2e` 不再是空阀门 |
| CI | 新增 `.github/workflows/ci.yml`：凭据扫描 → ESLint → 类型检查 → 三项校验 → 构建 → 冒烟 E2E |
| 文档 | README 重写；新增 ARCHITECTURE / KNOWN_PITFALLS / THREE_UPGRADE / ROADMAP / CONTRIBUTING |
| 兼容层守卫 | 兼容层建立哈希基线 + CI 校验，防止预发布 build 静默漂移 |
| 分包规则修复 | 原 `manualChunks` 在 Rolldown 下已废弃且只有部分生效（three.js 被重复打包进其它 vendor 块，`vendor-cesium` 混入 echarts/theatre/lil-gui 达 8.3 MB）。改用 `codeSplitting.groups` + `priority` 后 15 个分包全部生效，`vendor-three`(1.36 MB)/`vendor-echarts`(1.07 MB)/`vendor-lil-gui`(30 KB) 独立，`vendor-cesium` 降至 696 KB |
| E2E 覆盖生产产物 | 原 E2E 只跑 dev server，测不出分包/产物问题。新增 `E2E_TARGET=preview` 模式，CI 中 dev 与 preview 两种模式都跑 |
| 生成器安全化 | 新增 `scripts/lib/registry-guard.mjs`：5 个会写 registry 的脚本改为「默认拒绝写入 + `--dry-run` 预览 + `--force` 确认」。实测拦下两个生成器的破坏性覆盖（threejs-lesson 丢 29 张封面 + 全部精修文案、earth-lessons 丢 6 张封面），并通过 `preserveCuratedFields()` 根治（保留 title/description/tags/thumbnail/runner） |
| 脚本目录归档说明 | 新增 `scripts/README.md`，区分「质量闸门 / 注册表写入 / 一次性脚本」三类，标明哪些不可重跑 |
| 依赖审计与瘦身 | 新增 `scripts/audit-deps.mjs`（分层扫描 src / public / 配置 / bin / types，排除 CLI 与类型包等假阳性）。据此清掉 **7 个未使用依赖**：`@mediapipe/tasks-vision`（示例走 jsdelivr CDN）、`lottie-web`（同）、`heatmap.js`（示例自带内联实现）、`monomorph`、`solar-calculator`（零引用）、`@vue/eslint-config-prettier`、`@vue/eslint-config-typescript`（eslint 配置未引用）。移除后 28 个包被剪除、锁文件 -651 行，产物模块数与 chunk 数完全不变（5957 modules / 3203 chunks），证明确为死依赖 |
| 首屏性能优化 | 新增 `tests/perf.spec.js` 测量真实首屏（详见 `docs/PERF_BASELINE.md`）。据此发现并修复：分组把 `@sparkjsdev/spark` 变成共享块后被提升进首页 `modulepreload`，而首页并不使用它 —— 占首页首屏 JS 的 76%。去掉该分组后 **首页 JS 2246 KB → 533 KB（−76%）、FCP 4008 ms → 716 ms**；示例中心 2254 KB → 541 KB |
| 生成器输出格式对齐 | 4 个由生成器维护的 registry（`threeCesiumExamples` / `cesiumExamples` / `threejsLesson` / `earthLessons`）现已与生成器输出**逐字节一致**（此前 `--dry-run` 稳定显示 -6 / -29 行漂移）。配套三件事：① `patch-registry-thumbs.mjs` 改为**就地更新** `thumbnail`（原实现会把它插到 `"id"` 后并留下空行，是漂移的真正源头），实测重跑对 12 个 registry **零字节变化**、完全幂等；② `registry-guard` 新增 `--check` 开关做逐字节比对 —— 比 `--dry-run` 的行数统计严格得多，只改字段顺序 / 只改文案这类「行数不变」的漂移也能抓到；③ 新增 `npm run verify:drift` 与 CI 漂移检测闸门 |
| 生成器不再登记未转换的示例 | `generate-registry.js` 原先照单全收 config 里的条目，会把 `threeExamples/application/thanksBibi` 这类「有源文件、无 Vue 组件」的条目塞回 registry，直接把 `verify:registry` 搞红（用户侧表现为点进去白屏）。现按组件是否存在过滤，与校验闸门共用 `lib/example-component.mjs` 的约定；被跳过的条目会显式列出，不静默丢数据。详见 P2 待办 |
| 首页延迟加载 registry | `useExampleFilters()` 原先在 setup 阶段就 `ensureRegistryLoaded()`，而它被 App.vue 的**全局顶栏**使用、在所有路由（含首页）都挂载，导致首页拉取全部 11 个 registry 数据分块（合计约 58 KB）。改为按需触发：悬停/打开「示例中心」下拉、聚焦搜索框、或已在 `/examples`。新增 E2E 用例 `首页不为顶栏预载示例注册表` 断言首页该类请求为 0 |
| 修复冒烟用例的选择器歧义（CI 首跑必挂） | `tests/smoke.spec.js` 里 `page.locator('.search-input')` 在首页会命中 **2** 个元素：顶栏的（App.vue）和首页地球自己的（`components/SearchBox.vue`，在 `EarthView` 中无条件渲染）。dev 模式下因首页渲染慢、断言先跑完而侥幸通过；**生产产物下必然失败**。已改为 `.nav-search .search-input`。这说明「E2E 已恢复」此前并未在 preview 模式下真跑通过（CI 从未执行，见 P0） |
| 抽出画廊筛选状态机（P1 拆巨石的一部分） | `ExampleGallery.vue` 的 script 从约 173 行降到 23 行，筛选/分页/URL 同步全部迁到新增的 `src/examples/composables/useGalleryFilters.js`。**先补测试再动手**：动手前为「技术标签切换」「分页」补了 E2E（此前这两块零覆盖），改完 12 条用例在 dev 与 preview 下都通过。⚠ 注意 E2E 覆盖的是 URL 驱动的状态（`?tech=` / `?page=` / `?search=`），**点击侧栏子分类**目前仍无覆盖 |
| 画廊过滤记忆化 + 补上关键词搜索的 E2E | `ExampleGallery.vue` 的 `techTabs` / `availableSubCategories` / `filteredExamples` 原本各自全量扫 1417 条，且 `subCategoryDefinitions` 有 17 条正则、关键词匹配还逐条 `toLowerCase` —— 每敲一个字整链重算。改为一次性建索引（按技术分桶 + 预计算小写检索串）。**等价性已用真实数据校验**：技术分桶 5 组计数全等、子分类 17 项计数全等、8 个关键词的命中集合全等。同时新增 E2E「按关键词过滤」用例 —— 此前搜索过滤零测试覆盖。⚠ 选测试关键词时注意：标题/描述/标签多为中文，实测 `water` / `camera` 在这些字段里命中数为 0 |

---

## 2. 待办

### P0（未完成，建议优先）

| 项 | 说明 | 备注 |
|---|---|---|
| 建立远端仓库并推送 | 当前仓库 **没有任何 remote**，8 个提交只存在于本机磁盘 | 一次磁盘故障即全部丢失 |
| 轮换已泄露的凭据 | 百度 AK 与天地图令牌曾以明文存在于工作区，应视为已泄露 | 需在对应控制台轮换 + 配置白名单 |
| 首次跑通 CI | 仓库尚无 `.github`，需推送后才能验证流水线 | 依赖安装、`npm ci` 与 lockfile 一致性需实测 |

### P1（技术债）

| 项 | 说明 |
|---|---|
| 拆分巨石组件 | 已抽出 `ExampleCard.vue`（895 → 671 行）与 `useGalleryFilters.js`（筛选状态机：URL↔状态同步、过滤、分页，205 行）：`ExampleGallery.vue` 现为 **541 行 / script 仅 23 行**，剩余 400 余行是 scoped 样式。**仍待拆**：`ExampleGallery.vue` 的侧栏与分页模板、`CodeDrawer.vue`（675 行）、`EarthCanvas.vue`（653 行）、`PersonFirstMoveExample.vue`（2081 行）。拆分需配合视觉/交互回归验证，属独立任务 |
| 类型检查（已落地，无需推进） | **实测修正**：`npm run typecheck`（`vue-tsc --noEmit`）已覆盖 **3346 个文件 / 1497 个 `.vue`**，**0 error**、退出码 0。此前误以为「全量 vue-tsc 不可用」并加了一份只查 `.ts` 的收敛配置，已删除。CI 现执行全量检查 |
| 示例资源收敛 | 把裸 canvas 示例逐步收口到 `useExampleStage`，减少对 `ExampleHost` 兜底的依赖 |
| 清理 `console.log` | 218 个示例文件含调试日志，建议对应用层代码启用 `no-console`，示例作为参考代码保留 |
| 依赖分层（长期） | 已用 `scripts/audit-deps.mjs` 建立审计口径并清掉 7 个未使用依赖（见「已完成」）。**仍待做**：把「产品运行时依赖」与「1400+ 示例专用依赖」分开管理（例如把纯示例依赖移到可选安装），以控制安装体积与主包大小 |
| three 兼容层退出 | 指定 owner，跟踪 npm `three` 稳定版进度，达成条件后按 `THREE_UPGRADE.md` 退出 |

### P2（体验与工程效率）

| 项 | 说明 |
|---|---|
| 脚本物理归档 | 已在 `scripts/README.md` 用文档区分「质量闸门 / 注册表写入 / 一次性脚本」，但一次性脚本仍与主流程脚本混在同一目录。可进一步移入 `scripts/legacy/`（注意 `test-convert.js` 与 `convert-threejs-official-to-vue.js` 存在 import 依赖，移动时需同步改路径） |
| ~~生成器输出格式对齐~~ | **已完成并升级**：4 个 registry 已与生成器逐字节一致；漂移检测用**逐字节比对**的 `npm run verify:drift`（而非原先设想的 `--dry-run` 行数统计），已接进 `npm run verify` 与 CI。见「已完成」 |
| `thanksBibi` 示例未登记 | `threeExamples/application/thanksBibi` 磁盘上有源文件（`.js` + 封面），但从未转换为 Vue 组件，在 `1218670` 基线快照中被移除。生成器现在会跳过它并打印提示。若想真正上线，需补 `src/examples/components/three-cesium-examples/threeExamples/application/ThanksBibiExample.vue`（参考同目录 `FlyLineExample.vue` 的 `ExampleScene` 写法，注意源示例依赖 `#box` 容器与 `CSS3DRenderer`），然后重跑生成器即可自动纳入。**属示例开发，需视觉回归验证，未在本轮做** |
| ~~首页延迟加载 registry~~ | **已完成**：`useExampleFilters()` 不再在 setup 阶段触发加载，改由调用方按需触发。首页实测不再请求任何 registry 数据分块，并由新增 E2E 用例在 dev + preview 两种模式下守住（见「已完成」与 `docs/PERF_BASELINE.md`） |
| 示例层 console | 新增 `scripts/audit-console.mjs` 做分类审计。**结论：769 条里 676 条是有意的**（285 error / 21 warn / 67 个 `ElMessage` 替代实现 / 300 条教学演示输出），只清理了 47 条「无标签纯值转储」（`console.log(data)` 这类）。剩余 46 条经逐个核对多为示例的演示输出（导出结果、加载进度、着色器源码），**刻意保留**。若将来要批量降噪，建议在**生产构建**中丢弃 `console.log`（Vite `build.esbuild.pure`），而不是改示例源码 |
| ~~构建产物瘦身~~ | **不建议做**：34 MB / 3203 chunks 分散在按需加载的示例块里，不在首屏路径上。优化目标应是首屏与常用路径，而非磁盘产物大小（见 `docs/PERF_BASELINE.md`） |
| ~~画廊性能：过滤缺少记忆化~~ | **已完成**：改为一次性构建「按技术分桶 + 小写检索串」索引，`techTabs` / `availableSubCategories` / `filteredExamples` 全部复用。等价性已用真实数据逐条校验（技术分桶 5 组 + 子分类 17 项计数全等，关键词过滤 8 组集合全等）。见「已完成」 |
| 超大 vendor 块 | `vendor-spark`(4.8 MB)、`vendor-web-ifc`(3.4 MB) 仍超过 `chunkSizeWarningLimit`；可用 `codeSplitting.groups` 的 `maxSize` 进一步切分（仅在确有收益前不动） |

---

## 2.5 文档与计划的存放约定

| 位置 | 用途 |
|---|---|
| `README.md` / `CONTRIBUTING.md` | 项目说明、上手与提交规范（**当前有效**） |
| `docs/` | 架构、坑点、路线图、three.js 升级（**当前有效，随代码一起维护**） |
| `.trae/specs/`、`.trae/documents/` | 历史 spec 与实施计划归档（各示例源接入时期）。文档里的路径是当时机器的绝对路径，**已失效**，仅作决策留痕；如需重启某个计划，请先把结论提炼进 `docs/ROADMAP.md` |

> 教训：`.trae/documents/fix-three-project-typescript-errors.md` 里早已写明
> 「目标：`pnpm typecheck` 退出码为 0」，而该目标后来确实达成了（实测 0 error）。
> 这份存档没被纳入 `docs/`，导致后来误判「全量类型检查不可用」并多写了一份收敛配置。
> **归档 ≠ 可忽略**：计划文档里的结论必须同步到 `docs/`。

## 3. 明确不做

- 不再接入新的示例来源（见第 0 节）。
- 不为历史遗留的转换产物（`src/examples/components/{webgl,graphics,mygrapics}` 等由 HTML 批量转换而来的示例）
  做逐文件代码风格整改 —— 它们在 ESLint 配置中已被整体豁免，视为「保留原始风格的外部代码」。
- 不追求把 1429 个示例组件全部纳入 TypeScript。
