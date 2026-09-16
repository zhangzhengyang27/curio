# 治理变更归档

> `docs/ROADMAP.md` 只保留待办，已完成项自 2026-09 起归档到本文件。
> 下表为原 ROADMAP「已完成」小节的**原文整体迁入**（未改写），以保留背景与实测数据；
> 新完成的工作追加到对应小节即可，不要回填路线图。

## 2026-09 治理轮次

### 四页面审查与增强（2026-09-15，任务书 `docs/PAGES_ENHANCEMENT_PLAN.md`）

按 AI 任务书完成「审查 → 需求方确认 → 增强」全流程，产出
`docs/PAGES_REVIEW_REPORT.md`（1 P0 + 4 P1，全部真实浏览器复现）。

| 类别 | 项 | 说明 |
|---|---|---|
| 审查 P0 修复 | workbench 聚合项污染 | GDP 主题直接用 timeline 原始对象（264 条含「世界」等 96 个无多边形聚合项），Top10 前 7 名全是聚合项、摘要与导出报告把全球总量当经济体居首。按 countries 交集过滤修复 |
| 审查 P1 修复 | analysis 暂停失效 | `watch(playing)` 只在建播放时设 interval、暂停分支不清理，暂停后年份继续走到 2020 自停 |
| 审查 P1 修复 | tools 工具状态脱钩 | View 高亮与 controller.activeTool 双状态源，结束/Esc 后按钮仍高亮、再点画布无反馈且采点静默积累。改为 onToolChange 单一事实源广播 + 采点守卫 |
| 审查 P1 修复 | tools debug HUD 静默失效 | `Cesium.TileProviderError.addEventListener` 在 1.142 不存在（类非事件），TypeError 中断整个 debug 块且被 try/catch 吞掉。改挂 provider 级 errorEvent（见 KNOWN_PITFALLS C14） |
| 审查 P1 修复 | carbon mock 失真 | 厄立特里亚 9989 MtCO₂ 居首。population.json 同为随机数据，故按「与人口同源自洽」重造（pop^0.85 加权），碳排/人口两榜高度重合 |
| 审查 P2 顺修 | analysis handler 泄漏 / tools GeoJSON 顶点下限 / monitor 流开关 UI / 对比第 5 国静默 / workbench 数据失败死代码 / 文档漂移 | 全部修复。对比满 4 国后复选框禁用+悬停说明；workbench 数据失败显示错误面板（曾为死代码分支，静默全灰） |
| 增强 A1 | analysis 指标着色切换 | GDP/人口/碳排放三指标 choropleth 切换，图例随指标更新；图例收进左侧面板（横排版曾在 1280/1440 视口盖住时间轴滑杆） |
| 增强 K1 | monitor 处置持久化 | 处置状态存 localStorage 刷新恢复 +「重置演练」+ 自动推送页面内开关（流状态文案真实化） |
| 增强 W1 | workbench 主题扩展 | 2→4 主题（+人口规模/密度），THEMES 配置化，排行/摘要/图表/报告同一配置驱动 |
| 增强 M3 | tools 标绘持久化 + GeoJSON 导入 | 标注存 localStorage 刷新恢复；导入与导出对称（再导出坐标逐位一致）；各工具补最少顶点校验 |
| 测试 | E2E 42 → 55 条 | 新增回归 6（聚合项/暂停/脱钩/HUD/对比上限/数据失败提示）+ 功能 6（指标切换/持久化/重置/流开关/新主题/导入）+ 基线抗 flake（C13 模式：force→DOM click、serial、页面内整段脚本、时序窗口放宽） |
| 坑沉淀 | KNOWN_PITFALLS C13/C14 + D3 漂移修正 | Cesium 页 Playwright 交互静默卡死两形态与对策；TileProviderError API 形态坑；requestsPerServer 文档对齐代码（=1） |
| 第二批增强(M 组) | M1 地名搜索 / M2 标绘编辑 / M4 书签增强 / M5 量测记录 | M1 搜索为三通道:天地图(个人认证无搜索权限 404,企业认证后自动恢复优先)→ **高德 Web 服务兜底**(个人免费、国内可达、CORS 全开;GCJ-02→WGS-84 纠偏,key 经 VITE_AMAP_KEY,见 D4;原选型 Nominatim 实测国内不可达,降为末位保留)→ Nominatim;M2 拾取改为几何最近匹配(scene.pick 对细线在 headless 实测全不可靠,宽 14 不透明线也命不中);禁用 Cesium 默认双击缩放(双击是结束采点通道,zoom 动画致投影漂移) |
| 第二批增强(A 组) | A2 国家趋势图 / A3 URL 分享 / A4 CSV 导出 / A5 人均着色 | A3 与 X2 规范同套命名;A5 与 A1 同一 applyValues 通道 |
| 第二批增强(K 组) | K2 阈值告警 / K3 巡游大屏 / K4 时间回放 | **发现并修复产品缺陷**:revealAt 循环放行传增索引,而 pool 每次重建收缩导致跳号——初始 10 条实为「偶数位」事件、最新事件被跳过 |
| 第二批增强(W 组) | W3 选国下钻 / W2 报告双模板 / W4 报告 PDF | W2 含生成参数指纹(同参数生成指纹一致);W4 内嵌打印按钮与 @media print |
| 第二批增强(X 组) | X1 巡游引擎复用 / X2 URL 规范 / X3 性能度量 | X1 分镜字段可选化,监控巡游迁移至 useTourEngine(tour.spec 7 条守护旧首页);X2 命名规范沉淀到 C11;X3 perf.spec 扩四页 + PERF_BASELINE 预算表 |
| 测试 | E2E 42 → 75 条 | 两批合计:回归 6 + 功能 27;测试基建通道硬化终态——满载页交互整体收进页面内脚本(页内等待+重试),Playwright 只做读取与业务语义断言 |

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

### 地图工具箱改造（2026-09-16，采集交互切 Drawer + 矩形/圆/坐标转换）

调研 GitHub 同类项目（Mars3D / dc-sdk / cesium-extends / geojson.io）后拍板：
不整体换底座（Mars3D 核心闭源、dc-sdk 活跃度存疑），按需引入 MIT 的
`@cesium-extends/drawer`，坐标转换用 `coordtransform`。

| 类别 | 项 | 说明 |
|---|---|---|
| 重构 | 采集交互切 Drawer | 消掉手写采集状态机的整类缺陷（预览残留/高亮脱钩/无效 GeoJSON），controller 公开 API、registry entry 形状、持久化格式、GeoJSON 往返逐字节等契约全部不变，存量用例零修改通过。**分工：Drawer 只做视觉层（POLYLINE/RECTANGLE/CIRCLE 预览、断点标记、十字光标），落点真值由 LEFT_CLICK 自采、右击/双击/Esc 收尾**——库的 END 事件有 100ms 门控（快速右击丢事件）、POLYGON 收尾先 _cancel 移除一顶点（右击收尾丢最后真实顶点）、onPointsChange 快照尾随位同受门控（快速连点两点距离算成 0 m），均实测 |
| 依赖接入 | Cesium 互操作 shim | 本仓库 Cesium 经动态 `<script>` 加载（window.Cesium），库的 peer `import 'cesium'` 由 `cesiumInteropResolver` 按 **importer 限定**重定向到 `src/map/cesium-interop.js`（具名导出=各库 dist 导入并集）；`optimizeDeps.exclude` 同步排除防 dev 预打包打进第二份引擎。⚠ 全局重定向会让 `cesium-transform-controls` 构建期 Missing export（实测）；⚠ **不引入 `@cesium-extends/measure`**：其 turf→polygon-clipping UMD 链在 dev 裸伺服下无 ESM 导出，页面直接报错（实测） |
| 算法 | 面积换 @turf/area | 切平面鞋靴公式 → turf 测地面积（任意大小多边形稳定）；量距保留 EllipsoidGeodesic 测地线累加（库的 getDistance 是直线弦距，不适合地图量测） |
| 增强 M6 | 矩形/圆标绘 | Drawer 原生预览 + 两点自动收尾；产物与标面同构（多边形实体，编辑/导出/持久化全链路复用）；圆为圆心 ENU 系 64 边环，恢复/导入按环坐标往返逐点一致 |
| 增强 M7 | 坐标转换卡 | BD-09/GCJ-02/WGS-84 互转（coordtransform，纯前端零网络），批量/交换/复制；高德搜索通道手写 50 行纠偏替换为同源库算法 |
| 测试 | map-tools E2E 16 → 19 条 | +M6 三条（矩形量面积/圆量面积/矩形 GeoJSON 往返+刷新恢复）+ M7 一条（按库期望值精确断言、含方向交换） |
| 坑沉淀 | 临界超时用例两例修复 | M4（tools 书签增强）在 main 基线即挂：探针逐步复现证实应用逻辑全程正常，根因是该用例**两次整页加载**（goto+reload，dev 每次拉 30MB+ 未压缩 Cesium）使总时长贴着 60s 默认超时线，超时打在哪步、报错就漂到哪步（曾误归因为「导入链路缺陷」）。W2（workbench 报告模板）同型（双报告导出实测 53~57s）。均 `test.setTimeout(120s)` 修复；同型用例排查经验记入 ROADMAP P2 |
| 增强 M9 | 编辑态顶点增删 + 修存量渲染崩溃 | 编辑态边上点击插点、顶点右键删点(带 GeoJSON 合法性下限),量测记录与标签同步重算。**修存量崩溃**:polygon.hierarchy 运行期 setValue 裸数组会被 GroundPolygon updater 判非法——TypeError 致整个渲染循环停止(拖拽多边形顶点必现,构造期数组会被规范化而运行期不会);改 setValue PolygonHierarchy,顺带修闭合描边拖拽丢闭合段。M2 之前只测线类拖拽,故该雷未爆 |
