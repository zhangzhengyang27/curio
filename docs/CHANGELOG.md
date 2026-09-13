# 治理变更归档

> `docs/ROADMAP.md` 只保留待办，已完成项自 2026-09 起归档到本文件。
> 下表为原 ROADMAP「已完成」小节的**原文整体迁入**（未改写），以保留背景与实测数据；
> 新完成的工作追加到对应小节即可，不要回填路线图。

## 2026-09 治理轮次

### 工程治理

| 项 | 说明 |
|---|---|
| 资产保全 | 852 个积压改动按主题拆为 8 个语义化提交，工作树清零；移除指向他人机器路径的 `.npmrc` store-dir |
| 凭据外置 | 百度地图 AK、天地图令牌改为 `VITE_*` 环境变量注入；新增 `check-secrets.mjs` 闸门 |
| 修复静默假通过 | `verify-thumbnails.mjs` 因注册表懒加载改造而静默失效，已修复 |
| 修复真实缺陷 | 校验闸门抓出并修复 **4 个组件路径失配的示例**（2 个 city-realtime-webgl + 2 个 three-cesium） |
| 质量阀门 | 新增 `verify-registry.mjs`、`verify-three-compat.mjs`；修复 `.gitignore` 过宽规则（曾吞掉 `tests/`） |
| E2E 恢复 | 新增 `tests/smoke.spec.js`（5 条核心链路用例），`test:e2e` 不再是空阀门 |
| CI | 新增 `.github/workflows/ci.yml`：凭据扫描 → ESLint → 类型检查 → 四项校验 → 构建 → 冒烟 E2E |
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
| 拆出侧栏与分页组件 + 补子分类点击 E2E | `ExampleGallery.vue` 541 → 266 行：侧栏与分页（模板 + 各自样式）拆成 `GalleryFilterSidebar.vue` / `GalleryPagination.vue`，两者都是纯展示组件（props 进、事件出）。同时补上「点击侧栏子分类」E2E，至此画廊的四种筛选入口（技术标签 / 子分类 / 关键词 / 分页）都有覆盖。**样式搬迁用脚本按选择器切片、不手抄**：400 行 CSS 手抄极易出错 |
| 画廊过滤记忆化 + 补上关键词搜索的 E2E | `ExampleGallery.vue` 的 `techTabs` / `availableSubCategories` / `filteredExamples` 原本各自全量扫 1417 条，且 `subCategoryDefinitions` 有 17 条正则、关键词匹配还逐条 `toLowerCase` —— 每敲一个字整链重算。改为一次性建索引（按技术分桶 + 预计算小写检索串）。**等价性已用真实数据校验**：技术分桶 5 组计数全等、子分类 17 项计数全等、8 个关键词的命中集合全等。同时新增 E2E「按关键词过滤」用例 —— 此前搜索过滤零测试覆盖。⚠ 选测试关键词时注意：标题/描述/标签多为中文，实测 `water` / `camera` 在这些字段里命中数为 0 |
### 自待办转入已完成

| 项 | 结论 |
|---|---|
| CI job 超时余量不足 | `timeout-minutes` 30 → 60：生产构建实测 7~37 分钟（本机），叠加全量 typecheck、verify 链与 dev+preview 双模式 E2E，30 分钟余量不足。为「首次跑通 CI」（ROADMAP P0）扫清已知障碍 |
| 双 lockfile 隐患（原 P0） | 已解决：删除 `pnpm-lock.yaml` 与 `package.json` 的 `pnpm.onlyBuiltDependencies` 字段，统一为 npm（CI 走 `npm ci --legacy-peer-deps`），「两棵依赖树静默分叉而 CI 不报错」的风险随之消除 |
| 类型检查（原 P1） | **已落地**：`npm run typecheck`（`vue-tsc --noEmit`）覆盖 `src` 下全部 `.vue`（实测 1500 个）与自有 `.ts`，0 error，CI 执行全量检查。此前误以为「全量 vue-tsc 不可用」并写过一份只查 `.ts` 的收敛配置，已删除 |
| 清理 console.log（原 P1） | **无需再做**：`eslint.config.js` 的 `no-console` 闸门本来就在生效，实测 530 处 `console.log/debug` 全部落在有意豁免范围（示例参考代码 / vendored 兼容层），**应用层为 0 处**；另已清理 47 条无标签纯值转储（`scripts/audit-console.mjs` 可复审计） |
| 脚本物理归档（原 P2） | 已完成：38 个一次性脚本移入 `scripts/legacy/`（提交 `d730801`），主目录只剩质量闸门 / registry 写入 / 截图流水线脚本，分类见 `scripts/README.md` |
| 构建产物瘦身（原 P2） | 决策：**不做**。34 MB / 3203 chunks 分散在按需加载的示例块里，不在首屏路径上，优化目标应是首屏与常用路径（见 `docs/PERF_BASELINE.md`） |
| 拆分巨石组件（原 P1，部分完成） | `ExampleGallery.vue` 895 → 266 行（ExampleCard / useGalleryFilters / GalleryFilterSidebar / GalleryPagination）、`CodeDrawer.vue` 675 → 317 行（CodeDrawerHeader + 全局高亮配色外移）。剩余待拆项见 ROADMAP P1 |
