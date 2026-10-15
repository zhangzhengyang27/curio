# 治理变更归档

> `docs/ROADMAP.md` 只保留待办，已完成项自 2026-09 起归档到本文件。
> 下表为原 ROADMAP「已完成」小节的**原文整体迁入**（未改写），以保留背景与实测数据；
> 新完成的工作追加到对应小节即可，不要回填路线图。

## 2026-10 治理轮次

### 示例中心整体移除，curio 收敛为纯数字地球平台（2026-10-15）

需求方拍板：77 条 Cesium 示例已由其本人迁入 html5-dataviz 项目，本仓库移除 /examples 主线。
经三个探查代理交叉验证引用面后分五步执行（五个独立提交），全程闸门绿。

| 项 | 说明 |
|---|---|
| 迁入方核对 | `html5-dataviz/src/chart-examples/cesium-manifest.ts` 77 条 + `public/external-examples` 237M；与本仓库 78 条的差异仅为 1 条 `test` 占位示例（无实质内容）。被删内容全部在 git 历史可找回 |
| 保留边界（探查确认） | `src/examples/{three-build-compat,jsm-compat}` 是产品 three.js 的实际来源（40+ 处 `import 'three'` 经 threeCompatResolver 重定向；CSS2D/OrbitControls/EffectComposer 等 14+ 处产品导入走 jsm 别名）——**保留**；`verify:three-compat` 闸门保留。`/three-globe`（18 条硬编码数据，不依赖示例中心）与 `/bmap` 保留，ResourceShell 保留服务两者但删除搜索框（唯一数据源 registry 已删）。jsm-compat 宽松 grep 确认零文件引用被删 npm 包（命中均为注释），整目录不动 |
| ① 源码与闸门（`eefbaed9`） | 删 src/examples/{registry,metadata,runners,views,components,composables,utils}；删 useExampleStage/useCodeHighlight/CodeDrawer×2（唯一消费方是示例基座/ExampleDemo，逐个 grep 复核，GlobeDemo 的 exampleMeta 为本地变量误报）；路由删 /examples×2；ProductShell 切换链接改指 /three-globe；404 出路改 ThreeGlobe 示例集；删 registry 生成/校验/截图脚本 + legacy/ + lib/；verify 链 7→4；ci.yml 删三步；eslint 删示例 ignores 与 6 个死规则块 |
| ② 测试（`128d9de7`） | 整删 5 个 example-*.spec（约 22 条）；smoke 删 11 条示例用例 + registry 预载用例，壳分区用例改走 /three-globe 并断言搜索框归零，404/title 同步；perf 删 /examples 项；command-palette 范围探针改 /three-globe；earth-gl-context / earth-picking 壳往返改断 .gallery-page。E2E 合计减少约 35 条 |
| ③ 资产（`9b9f74e9`） | `git rm` public/{external-examples(257M), example-thumbs}；rm 三个迁出后未跟踪孤儿目录（webgl/mygrapics/three-project）。public 收敛到 17M（data/three-globe-data/textures，产品在用） |
| ④ 构建与依赖（`0eb60268`） | 依赖 50 → 19（删 31 个孤儿包，audit:deps 复核仅剩 jiti/typescript 两个工具链已知误报）；copy-example-deps 收敛为仅拷 cesium/Build/Cesium（/tools 生产运行时硬依赖）；vite.config 删 serveUnicodePublic/lil-gui 双别名/goodrays//graphics 死别名/8 个死分包组。**实测产物 1.4GB/14813 文件 → 53MB/626**（assets 56MB→8.3MB，dist/node_modules 81MB→25MB 仅 Cesium），死分包零残留；C1 的三个 peer 冲突源（three-good-godrays/postprocessing/three-tile）随之消失，`--legacy-peer-deps` flag 暂留以防万一 |
| ⑤ 文档（本提交） | README 重写（数字地球平台定位）、AGENTS §1/§2/§3（R1/R2/R3/R8 作废标注）/§4/§5/§7/§8、ROADMAP §0 拍板记录、scripts/README 重写 |
| 闸门状态 | verify 四项 / typecheck 0 error / lint:ci 0 error / 生产构建 EXIT=0 全绿；dev + preview E2E 见下补记 |

### CI 首跑全绿与远端建立（2026-10-14）

背景：10-05 / 10-08 两次示例迁出（three 侧 6 源 997 条、webgl 侧 4 源 325 条 → html5-dataviz，
`1fae38ab` / `697698f7`）之后，ROADMAP P0 三件套在本日完成两项（余「轮换凭据」）。

| 项 | 说明 |
|---|---|
| 远端仓库 | `github.com/zhangzhengyang27/curio`，main 全量推送（800MB 历史、最大单文件 58MB，未触发 GitHub 100MB 限制）。⚠ 到 github.com 直连不稳定（443 超时 / HTTP2 framing 错误 / Recv timeout 交替出现），推送需带重试 |
| CI 第 1 轮 | 失败于 verify:drift。根因见 KNOWN_PITFALLS **A6**：生成器用 `${id}.js` 探测源文件，上游 config 存在 id 与文件名大小写不一致条目（id=baiDu / 文件=baidu.js）——macOS 大小写不敏感全绿、Linux CI 找不到文件跳过条目报漂移；且 registry 里 baiDu 的 entry/thumbnail 是 id 派生的错误大小写路径，Linux 生产会 404（真实断链，非仅 CI 假红）。修复（`2111016f`）：生成器改按 config 声明的 codeUrl/image 精确路径探测登记、合并保护细化（仅 /example-thumbs/ 策展封面优先保留）、registry 重跑 2 行；全仓 156 条路径 readdir 字节级审计确认无同类问题 |
| CI 第 2 轮 | 失败于「图形渲染器生成物守卫」：`verify:gl-renderer` 脚本与其守护的 `gl-renderer.esm.js` 及 84 个使用方组件已随 10-08 迁出删除，package.json 已收敛为七项，ci.yml 步骤未跟上（Missing script）。修复（`8a91880e`）：删 CI 步骤；README/AGENTS「八项校验」→「七项」；typecheck 注释去掉易漂移的 .vue 计数 |
| CI 第 3 轮 | 七项校验 + 生产构建 + Playwright 安装全过；E2E dev 172/173。唯一失败：/bmap 冒烟用例的对比度回归检查写在 AK 分支之外，CI 无 `VITE_BMAP_AK` 走降级分支、tab 栏不渲染 → `getComputedStyle(null)` 抛错（本地始终配真 AK，该形态从未被覆盖）。修复（`7456f407`）：检查移入 akConfigured 分支；两个形态均本地实测（临时移走 `.env.local` 模拟 CI） |
| CI 第 4 轮 | **全绿**（run 38602375746，24m48s）：凭据扫描 → ESLint → typecheck → server 单测 → 前端单测 → 七项校验 → 生产构建 → dev E2E（173 passed / 1 skipped，12.7m）→ preview E2E（164 passed / 10 skipped，8.9m）。dev 1 skipped 为依赖 `VITE_AMAP_KEY` 的用例按设计跳过；preview 10 skipped 为 preview 形态下的既有设计。日志中 `/api/quakes ECONNREFUSED 8787` 是 monitor 后端未启动的预期降级（monitor 用例走 route 拦截，全绿） |
| 遗留（非阻塞） | DesignKitView.vue 6 处 ESLint 警告（`<CuButton>`/`<GlassPanel>` 换行，0 error）——归入迁出收尾清理轮；CI 通知 ubuntu-latest 镜像 2026-10-19 起迁 Ubuntu 26，届时关注首跑表现 |

## 2026-09 治理轮次

### 「大厂级重塑」M0–M4 全程（2026-09-29 ~ 09-30）

以「深空指挥中心」为方向的全站重塑,六个里程碑独立分支实施、每支独立
fresh-reviewer 终审 + 修复轮后快进合入 main（spec / 计划 / 审计 / ledger
见 `docs/superpowers/`）。要点:

| 里程碑 | 内容 |
|---|---|
| M0 | 16 图（8 路由 × 双主题）走查审计,产出 P0/P1/P2 底账（`specs/2026-09-29-m0-audit.md`） |
| M1 | 设计系统 v2 令牌（深空四阶表面/数据语义色板/glow/展示字阶）+ 首屏闪白修复（`index.html` 预置）+ 零依赖基础组件五组（`src/components/ui/`:GlassPanel/CuButton/EmptyState/ErrorState/LoadingSkeleton/CuTooltip）+ `/design-kit` 自检页 |
| M2 | 样板页:顶栏 pill 段控、首页浮层 GlassPanel 化 + 60ms 错峰进场、工具条四分组 + 快捷键 tooltip、首页命令面板（⌘K/,纯核心 `commandPaletteCore.ts` 可单测）;顺手修掉 `#default` URL 污染存量缺陷 |
| M3a | 平台四页 + bmap:对比度闸门转正（见下）、PageHeader、暗色图表标签修复、Cesium logo 避让、46 个分类 chips 六组收纳、终审 Minor 收编（焦点圈闭等） |
| M3b | 示例库壳层:/three-globe 页内搜索下线（双搜索合并,冻结契约逐字保留）、侧栏/分页/卡片统一按钮与面板语法;M2 终审 Important#3（首页双入口）以「分工非重复」裁决关闭 |
| M4 | 代码收尾:`tv-` 前缀代码面清零（纯样式 41 处 + DOM 钩子 2 类）、存储 4 键更名 cu-* 带一次性迁移（`src/utils/legacyStorage.ts` 收敛协议）、`EarthView.vue` 706→356 行拆分（五个迁出单元,样式全局化并加 `.earth-view` 作用域前缀） |

| 项 | 内容 |
|---|---|
| 新常驻闸门 | `verify:contrast`（`scripts/verify-contrast.mjs`）:12 对关键令牌文字对双主题 WCAG 实测 + 全仓 `::placeholder` 用法扫描（只允许 on-surface 系）——由 M2/M3a 两次终审的 placeholder 1.9:1 事故推动,verify 增至 **8 项**、CI 同步 |
| 棘轮 | 硬编码色值 169 → 165（重塑期间顺势收紧）;基线删除 EarthView 陈旧额度时手工编辑而非 `--update` 重写全局 |
| 终审产出 | 六轮 fresh review 共修复 1 Critical（M4 拆分丢失 `timelineStore.pause()`,孤儿定时器）+ 6 Important（placeholder 假绿闸门/暗色 hover 被特异性吞掉/aria-modal 假圈闭/SearchBox 并存裁决/指标网格算术错/⌘K 巡游守卫）+ 若干 Minor（延后项在各自 ledger） |
| 测试 | dev 全量 174 用例 / preview 165 用例双全量绿;新增 design-kit（6）/command-palette（5）/暗色 hover 计算样式回归钉等 |
| 教训入坑 | KNOWN_PITFALLS 新增 C19（`<script setup>` ES export 只在 dev 编译期炸,三道闸门全盲）、C20（端口被具体地址绑定抢占,strictPort 无感） |

### 主题令牌前缀 --tv- → --cu-（2026-09-29）

### 主题令牌前缀 --tv- → --cu-（2026-09-29）

目录改名同日，需求方拍板把最后一处旧名痕迹也清掉：CSS 令牌前缀
`--tv-`（TerraVista 缩写）全量改为 `--cu-`。清点实测 1121 处 / 51 文件，
替换 50 个（`src` 全部样式与组件、`verify-theme-tokens.mjs` 的占位符
`__TV_VAR__` → `__CU_VAR__` 及注释与报错文案、`scripts/legacy/
tokenize-tools-examples.mjs`、ARCHITECTURE / scripts-README 中的提法）；
本文件既有归档条目中的 `--tv-` 按原文留痕。

| 项 | 内容 |
|---|---|
| 安全性论证 | 无动态拼接用法（`getPropertyValue`/`setProperty` 命中均为 jsm-compat vendored 三方代码，用的别的变量）；E2E 测试零引用变量名；棘轮基线只按文件存硬编码色值计数，不存变量名；棘轮的 var() 摘除是通用正则 `var\([^()]*\)`，不写死前缀 |
| 报错文案必须同步 | `verify-theme-tokens.mjs` 的报错文案原本引导开发者「改用 --tv-* 令牌」，不同步就会引导人去用死变量 |
| 验证 | `verify` 全绿（棘轮 169 处硬编码色值计数不变，符合预期）、typecheck 0 error、lint:ci 0 error、dev 全量 E2E 通过 |

### 目录 / 仓库名改定 curio（2026-09-29）

定名次日需求方追认：目录名与仓库名也不再保留 `earth-app`，随品牌一并改为
`curio`（`Desktop/earth-app` → `Desktop/curio`；仓库无 remote，改名即全部）。
README / AGENTS 首屏去掉「（earth-app）」注记，`DEPLOY.md` 部署示例路径与
`three-project` 两个共享组件的注释同步。上一节「保持不动：目录名 / 仓库名
`earth-app`」自本节起作废。改名后清理 `node_modules/.vite`（缓存含绝对路径），
新路径下 `git status` 干净、`verify` 全量通过。`.trae/` 与 `scripts/legacy/`
中出现的 earth-app 字样属更早时期的历史留痕（本就指向已不存在的旧路径），不动。

### 项目定名 Curio（2026-09-28）

需求方拍板项目品牌名 **Curio · 可视化珍品馆**（定位：以示例库为重点 —— 11 来源 /
1400 条 Three.js / Cesium / WebGL / 图形学示例的浏览画廊，另附数字地球数据平台）。
历经四轮候选筛选：地球系（TerraScope/TerraPulse 等）、直白示例系（DemoSphere/
GLAtlas 等）、意象系（星罗/琳琅等）后选定 Curio（与 curate「策展」同根）。

| 项 | 内容 |
|---|---|
| 改名落点 | `router/index.ts` BRAND 常量（全部路由 document.title）、`index.html` 静态标题、`ShellNav` 顶栏品牌文案、Workbench 导出报告的品牌与下载前缀（`terra-report-` → `curio-report-`，同步改 `workbench.spec.ts` 两条断言）、`theme.css` 令牌注释、`package.json` 与 `server/package.json` 包名及描述、README / AGENTS 首屏 |
| 保持不动 | 目录名 / 仓库名 `earth-app`；CSS 变量前缀 `--tv-`（内部 API，改名是纯机械大 churn，另行评估）；历史留痕文档 `PRODUCT_PLAN.md` / `PAGES_ENHANCEMENT_PLAN.md` 中的旧名按原文保留 |
| 测试影响 | E2E 只断言页面自身标题（不含品牌名），BRAND 改动不影响；`workbench.spec.ts` 两条下载文件名断言随前缀同步更新 |

### 示例缩减第一例：合并 mygrapics 17 条机械副本（2026-09-27）

「1415 条能不能缩减」议题重启（09-24 去重调研的后续）。先用对称归一化的定向扫描
复核了 `graphics` ↔ `mygrapics` 相似度全景：**≥0.85 恰好 17 对**（与 09-24 结论一致，
检测器召回验证通过）；0.78~0.85 有干净间隔；中间带 24 对呈「多对一」形态——
12 个 mygrapics 自有课程条目（造型函数/噪声/极坐标）的最佳配对全部指向**同一个**
graphics 条目，是共用模板骨架的不同 demo，**不可合并**。需求方拍板「类似且质量
不高的合并」，落地为**删旧副本、保留正本**（graphics 侧为含清理逻辑的更新版）。

| 项 | 内容 |
|---|---|
| 拍板修订 | `ROADMAP.md` §0：「一个文件都不删」→ 允许且仅允许「同库机械副本合并」类删除（`1a5ca0c8`；`TECH_ROADMAP.md` 同步注记） |
| 执行 | R8 顺序：`git rm` 17 组件 → 手工删 registry 17 条目 → 清 `_thumb_map.json` 17 行 → `git rm` 17 缩略图（`3c92a0a6`）。该 registry 文件不在 `verify:drift` 保护内，手工编辑安全；不重跑 legacy 生成器（DEDUP_RESEARCH 附录 B.3） |
| 效果 | 可见示例 1415 → **1398**（registry 合计 1417 → 1400）；mygrapics 97 → 80；该来源 `animate_webgl` / `repeat-and-random` 两分类消失（正本在 graphics 同名分类保留）；省约 0.4 MB + 17 张缩略图 |
| 踩坑记录 | `mygrapicsExamples.ts` 条目分隔行风格**不均匀**（分类内有「4 空格行」分隔、跨分类边界无）——按块删除后分隔行会堆叠成连串空白行，需收敛；两个「跨分类新邻接」边界要按既有风格还原为无分隔，才能得到纯删除 diff |
| 明确不做 | 中间带模板相似、webgl 课程序列、WebGL/WebGPU 双后端镜像、earth-lessons 数据变体均不动（覆盖面，非冗余）；「类似」的其余观感走**呈现层同族聚合**（75 组双后端卡 + 8 组课程卡，默认视图可再折约 188 格）——未做，是画廊改版落地后的独立任务 |

`verify:registry` 实测：合计 1400 条 / 11 来源、主键唯一、组件文件全部命中。

### 示例中心可发现性整改（2026-09-23）

一轮以产品/项目视角做的实测审计（1415 条可见示例 / 261 个 `source::category` 组合），
按「修坏死 → 机制优化 → 需拍板」分层落地。闸门基线：`verify` 6 项全绿、`typecheck` 0 error、
`lint:ci` 0 error、`smoke` 20/20、`tools-examples` + `viz-loading` 19/19。

| 项 | 说明 |
|---|---|
| 翻页不回到顶部（A1） | `useGalleryFilters` 的 `window.scrollTo()` 是**空操作** —— theme.css 给 `html, body, #app` 都设了 `height:100% + overflow:auto`，文档永不溢出，真实滚动容器是 `#app`。实测点第 2 页前后 `scrollTop` 恒为 838、首卡位于 `top:-603`。改为滚 `galleryScrollRoot()`，并把滚顶从 `watch(currentPage)` 移到用户动作 `goToPage`（URL 还原与越界钳制也会改页码，不该滚） |
| 返回列表丢滚动位置（A5） | 同根因：原生前进/后退恢复只作用于文档滚动根。最终实现：**在卡片 click 的捕获阶段**同步存 `fullPath + scrollTop` 到 sessionStorage，返回后每 100ms 重试直到容器长开再落位、并持续强制 1.5s（期间用户任何 wheel/pointerdown/keydown 立刻让路）。**三个踩过的坑，都记下来**：① `onBeforeUnmount` 读 `scrollTop` 拿到残值；② `onBeforeRouteLeave` 比那次残值写入还晚，守卫只能冻结不能取值；③ Chrome 的异步覆盖**不派发 scroll 事件**，所以纯事件驱动收不到，只能靠持续强制。刻意没改 `history.scrollRestoration`（全站开关，会连带 /tools） |
| ⚠ 顺带：用例里的测试假象 | 这条用例反复红 8 轮才定位到真凶 —— **Playwright 的 `locator.click()` 会先把目标滚进视口**，在 `#app` 这种嵌套滚动容器里把 700 挪成 75，应用忠实地存下了这个被测试工具造出来的值。改用 `el.click()` 派发事件（不带滚动副作用）后 8/8 稳定通过。教训：nested-scroller 页面里 `locator.click()` 之前不要断言滚动位置 |
| XR/VR/AR 分类 75% 误分（A2） | `/(xr\|vr\|ar\|webxr)/i` 无词边界，particle / parallax / clearcoat / morphtargets 全落进该桶：**116 条里 87 条只因含 "ar" 三个字母**。子分类匹配整体重写为 `seg()`（路径段整词）/ `stem()`（词元含词干）两个原语，该桶回到 29 条真 XR |
| 125 条任何分类都筛不到（A3） | 16 条旧正则合起来漏掉 125 条（`threeExamples/application` 整块 61 条）。新增「其他 / 未归类」**补集桶**，让「每条至少落在一个子分类」成为结构性不变量，该桶计数即分类质量棘轮。跨桶重叠 137 → 50，并在侧栏加一行说明「各类之和大于全部」（此前 1465 vs 1415 无任何解释） |
| ≤1100px 整页横向溢出（A4） | theme.css 的 `min-width: 1280px` 降到 1024px（≤767px 顶栏导航逐字竖排一并消失），画廊栅格补 3 列档。**不做移动适配**（仅 PC 端已拍板），只保证不横向溢出、文字不竖排 |
| 89 页翻不到底（B1） | `PAGE_SIZE` 16 → 48（1440 宽下正好 4×12），页数 89 → 30；分页器加「跳至第 N 页」（省略号原先是 `disabled`，深翻只能反复点下一页） |
| 448 条同名标题（B2） | **不动 registry**（R1/R2 + 只读归档）。实测最糟的 32 条「加载器：模型加载」连 `category`/`categoryLabel` 都完全相同，唯一带差异的是 id 尾段 → 新增 `utils/exampleMeta.ts` 从 id 剥掉分类前缀推出尾段，卡片与详情页各加一行「来源 · 分类 · 3dm」。521/1415 条可推出，那 32 条全部可区分 |
| 全库无时间/版本字段（B3） | 新增 `registry/provenance.ts` **按来源**登记上游出处与快照日期。刻意不写进 registry 条目（溯源是按来源的属性，1417 份日期只会制造 1417 个漂移点）。⚠ 不要用 registry 文件的 git 日期当数据日期 —— 11 个分片全显示 2026-09-19，那是 `.js→.ts` 改名（579b5729）掩盖的。10 个来源上游查不到出处，如实记 `null`，并由 `tests/example-provenance.spec.ts` 当作接入新源时的闸门 |
| 地理 / GIS 分面（C，需拍板项） | 库按渲染技术组织、产品按地理场景定位：搜「地图」6 条、「中国」1 条、「GIS」1 条，而「粒子」329 条。新增 `techGroups` 第 6 项 `geo`，由 source + category 规则自动判定（不逐条人工整改）。断言它**不是 Cesium 标签的别名**：覆盖 ≥4 个来源、且有一批条目落在 Cesium 之外 |

**新增用例**：`tests/example-taxonomy.spec.ts`（3 条不变量）、`example-gallery-scroll.spec.ts`（5）、
`example-gallery-pagination.spec.ts`（3）、`example-geo-facet.spec.ts`（2）、`example-provenance.spec.ts`（2）。
补充分类不变量用例在旧代码上**全部先红后绿**，窄窗口「逐字竖排」的判据改用 Range 行盒计数
（原先拿元素高度比阈值，padding 会让它在 1280px 就误报 —— 已用人为压窄到 60px 做阳性对照验证）。

### 示例中心布局与交互改版（2026-09-23）

页头、侧栏、结果区整体重做，并补齐筛选维度。需求方明确**不做移动端适配**（仅 PC 端），
允许改动 URL 契约（新增参数、可改每页条数）。默认值刻意保持 `48 条/页 + 网格 + 推荐顺序`，
让既有的 `smoke` / `example-gallery-pagination` / `example-gallery-scroll` / `example-geo-facet`
四组用例无需改写即可继续守住回归。

| 项 | 说明 |
|---|---|
| 数据源完全无入口 | 11 个来源原先只能靠标题里的中文碰运气，而「WebGL 基础」这类来源名根本不进标题。侧栏新增**数据源**分区，与技术栈、专题并列为第三维度 |
| 三维度分面计数 | 每个维度的计数在「其它维度已生效」的集合上算，且**排除自身** —— 否则选中 Three.js 后同维度其它项会全部归零，用户就换不动了。为此把「每条示例的维度归属」改成注册表落地时一次性预计算（此前每敲一个字就对 1417 条重跑 17 条专题匹配器，三维度会把这个成本 ×3） |
| 已选条件不可见 | 新增 chips 条：每个生效条件一枚 chip，点击即移除该维度，另有「清除全部」。此前只能靠侧栏里各高亮一行表达，滚到网格中段就完全看不出筛了什么 |
| 1417 条浏览效率 | 新增排序（推荐 / 标题 / 来源 / 专题）、网格 ↔ 列表视图、紧凑密度、每页 24/48/96。列表视图缩略图与文本左右并排；紧凑模式收掉描述与标签，最小列宽 262px → 180px |
| 结果区工具条粘性 | 30 页的场景下改排序/换视图不该要求先滚回顶部。工具条 `position: sticky` 贴在顶栏下方，依赖 `#app` 是滚动根（见 `useGalleryFilters.galleryScrollRoot` 注释） |
| 页头信息层级 | 「这是什么库 / 封存的是哪一版 / 有多大」三件事压到一屏顶部，右侧 示例 / 来源 / 专题 三个统计位。原先那个孤零零的「共 N 个示例」并到工具条里 |
| 空态与骨架 | 注册表 11 个分片懒加载期间渲染骨架屏（**刻意不复用 `.example-card`**，那是 E2E 断言每页 48 条的选择器）；空态复述当前条件并给出「清除全部 / 恢复推荐顺序」两个出口 |

**URL 契约**：新增 `?src=`（数据源）、`?sort=`（排序）、`?size=`（每页条数）、`?view=`（视图）。
密度是个人偏好，存 localStorage（`tv:examples:density`）不进 URL —— 分享链接不该把对方的视图设成紧凑。

**新增用例**：`tests/example-gallery-facets.spec.ts`（9 条：数据源分面、分面计数联动、
`?src=` 还原、排序、列表视图、紧凑密度、每页条数、chip 逐个移除、清除全部、空态退出）。

---

### 平台页缺陷排查与修复（2026-09-20）

对四条平台页 + three.js 首页 + 示例基建做了一轮排查，逐条实测后修复。闸门基线：
`verify` 全绿、`typecheck` 0 error、`lint:ci` 0 error / 4 warning。

| 项 | 说明 |
|---|---|
| `/analysis` 对比勾选不重着色 | 多源 `watch([year, selected, compare, metric])` 对 ref 只读 `.value` 不做 traverse，`toggleCompare` 的 `push/splice` 原地改数组永不触发（KNOWN_PITFALLS A4）。改为 `() => compare.value.length` |
| `/analysis` 多部件国家只着色一块 | `byName` 由 `nameZh → entity` 改存 `nameZh → entity[]`。修复前实测 **175 块**多边形从未被 `applyValues` 碰过（343 实体 / 168 国名 / 37 国多部件），修复后归零且各国各块色值统一；`flyTo` 顺带传数组，多部件国家可整体框进视野 |
| `EarthCanvas` 卸载竞态 | `onMounted` 为 async，期间切走路由后续跑打在已置 null 的 `tweenGroup` 上抛 `TypeError`，被外层 catch 静默吞掉。加 `disposed` 守卫。**排查过程中更正了结论**：原判断「僵尸 rAF + 整体泄漏」经同窗对照实测（留在首页 27 帧 vs 切走后 0 帧）不成立，已降级为加固 |
| `worldZh.json` 双重 fetch+parse | 数据层与 `Choropleth.load` 各读一遍 2.4 MB；改为数据层把已解析结果交下去（`shallowRef` 承载，避免深响应代理）。浏览器实测请求数 2 → 1 |
| E2E 11 条红 | 根因是三处超时预算与重型页冷启动不匹配，且 spec 里写死了 32 处 `{ timeout: 15_000 }` 使配置改动空转。`expect`/`actionTimeout` 各提到 30s、字面量删除、图表用 `tests/helpers/timeouts.ts` 的 `CHART_FIRST_RENDER`；用例级按「≥2 次整页加载」定点 `test.setTimeout(120_000)`。workbench 实测 11/11 绿、analysis+workbench 24/24 绿 |
| 教训沉淀 | ① **子代理与结构推演给出的「泄漏」级结论必须实测**——本轮一条 P0 被判据推翻（见上）。② 放宽超时要区分「慢」与「卡死」：文件级 `test.slow()` 会让卡死用例烧 3 分钟才失败，已改回定点。③ 断言要打在真正受影响的一侧——对比表断言天然生效、地图断言才暴露了 A4 |

### 遗留（本轮发现未修）

- `/analysis` 色阶方向存疑：`entries` 按数值**降序**后排百分位，`rampColor` 注释写「0=最弱」，
  实际 rank 0（最强）取到 `RAMP[0]`（最浅）。即 GDP 最高的 24 个经济体着色最浅，与等值区图惯例相反。
  属产品/视觉决策（也可能是刻意反向），未擅自改动。
- ROADMAP P0 三项未动：**无 git remote**（全部提交仅存本机磁盘）、**已泄露凭据未轮换**、**CI 从未真跑**。

### vue-cesium 工具类组件补齐至全覆盖（2026-09-17）

对照官方文档 90 组件页盘点：工具/控件/覆盖物/后处理四族组件全部迁入，`/tools` 示例列表 6 → 17 卡片。
构建块类（图层/数据源/实体/几何/基元等 ~70 个 API 组件）不属「示例」范畴，维持不入列。

| 项 | 说明 |
|---|---|
| 量测补齐 | 8 → **11 种**全覆盖：补矩形/正多边形/圆（`getMeasurementCmp` 支持集实测 3.2.12） |
| 控件类 5 | 鹰眼图 `VcOverviewMap`（小窗底图走 Cesium 本地 NaturalEarthII 离线瓦片，不耗天地图配额）/ 打印 `VcPrint`（`printAutomatically:false` 防系统打印对话框打断自动化）/ 拾取指示器 `VcSelectionIndicator`（关 `allowFeatureInfoRequests` 避免逐点击发 WMTS pickFeatures）/ 小屏导航 `VcNavigationSm` / 原导航页并入 `VcAjaxBar` |
| 覆盖物 6 | 热力图（伪随机点分布固定，截图可比对）/ HTML 卡片（样式须**全局** style——overlay 内容挂 viewer 容器，scoped 作用不到）/ ECharts（echarts 是 vue-cesium 自带依赖，无需安装；不用远程图片 symbol）/ 台风（按 `VcTyphoonRoute/Point` 类型合成轨迹含风圈四象限）/ 风场（按实现结构合成 Float32Array 网格）/ 动态对象（**必须在 viewer-ready 拿到 Cesium 后**再构造条目） |
| 后处理 1 | `VcPostProcessStageScan`（radar/circle 可切）+ 自定义夜视 shader（GLSL3：`colorTexture` 采样 + `out_FragColor`），经 `VcPostProcessStageCollection` 挂载 |
| 探针驱动的三处修复 | E2E「组件 ready」盖不住渲染层问题，11 页截图探针揪出：**① echarts**：容器 div 无内置宽高 → `echarts.init` 建 0×0 画布，zrender 逐帧抛 drawImage 异常且不渲染；显式铺满后真机核显仍仅 2 FPS——组件每帧 `chart.resize` 整图重绘叠加涟漪/飞线动画，改静态 scatter/lines 后 **40 FPS**。**② dynamic**：条目必须自带 `sampledPositions` 数组（内部逐条 `addPosition`），传 Entity 式 `position` 在 transform 阶段 `forEach` 崩溃**打断渲染循环（球面全黑）**。**③ wind**：d.ts 注释称 `array` 为 `Array<Float32Array>` 分层，实现却把 `array[0]` 当数值、`createTexture` 当扁平 `arrayBufferView`——照类型注释传被**静默吞掉（零粒子零报错）**；改扁平 TypedArray，并调参（8192→2048 粒子/慢速/短拖尾，否则白色流线盖死底图） |
| 教训沉淀 | ① 「E2E 绿」≠「渲染正确」：覆盖物/后处理这类渲染型组件必须有**截图/帧差目视探针**兜底（帧差采样即判粒子是否在动）。② vue-cesium 的 **d.ts 类型注释与实现可能不一致，以实现为准**（wind 数据结构一例）。③ 无头 Playwright 默认 SwiftShader 软渲染，FPS 探测必须加 `--use-angle=metal`（本机）取真值——软渲染下 healthy 页面也会显示为 0~2 FPS，而 echarts 页的 2 FPS 在硬件 GL 下复现才是真问题 |
| 已知非问题 | 近景页偶发底图空白 = 天地图频控占位（探针 11 页连打触发，限流窗口自动恢复），与 KNOWN_PITFALLS D3 同源 |
| E2E | tools-examples.spec.js 4 → **15 条**：卡片数改为按 `TOOLS_EXAMPLES.length` 自适应；11 个新页「面板出现 + 就绪文案」独立用例（拆独立用例是因个别页在软渲染下偏慢会耗尽共享超时） |

### vue-cesium 量测/绘制全量接入 + 根因修正（2026-09-17）

推翻 2026-09-16「Rolldown 构建链不兼容」的错误结论，量测/绘制/分析/淹没四示例页全量回归。

| 项 | 说明 |
|---|---|
| 根因修正 | 降级 Vite 7 后本项目**依然失效** → 内核非根因。toy 变量二分（Cesium 注入方式/双击移除/viewer props/天地图层/缩放约束/RequestScheduler/camera prop 逐一排除）后 A/B 定位，真因有二：**① 不稳定 props 引用**：模板里 `:measurements="ACTIONS.map(...)"` 内联 map，激活量测 → activeEvt → 父组件重渲染 → 新数组引用使 vue-cesium 内部 `drawingActionInstances` computed 失效重建（全新 cmpRef），而 `selectedDrawingActionInstance` 残留旧对象 → 分发器打到空 cmp 上，点击全被静默吞掉。修复：`:measurements` 等**必须传 script 常量稳定引用**（toy 当初"正常"只是因为没传该 prop 且用 JS click 激活，两个偏差叠加造成误判）。**② FAB 方向**：VcFab `direction` 默认 `'right'`，bottom-right 位置动作条飞出视口、撑出容器横向溢出；Playwright 点击动作按钮的 scroll-into-view 把 `overflow:hidden` 容器 scrollLeft 拉到 465，**整个 fixed 地图被视觉拉偏**，坐标拾取全错。修复：`main-fab-opts: { direction: 'left' }` |
| 教训沉淀 | 对照实验的"正常组"必须与"失败组"**完全同路径**（toy 用 JS click 激活、无状态响应——恰绕开了真因触发链），否则会得出错误的归因。"唯一变量"的确认要穷尽到触发链层级，而不是文件/依赖层级 |
| 降级撤销 | vite 8→7 降级 + manualChunks 改写在 vite7-downgrade 分支完成并验证可用，但根因既明，**降级不必要**，分支保留备查后删除；main 维持 Vite 8（Rolldown）+ codeSplitting.groups |
| 全量接入 | 恢复量测（距离/折线/三角/水平/垂直/高度/面积/坐标）+ 标绘（图钉/点/线/面/矩形/圆/正多边形，clampToGround）+ 通视/可视域 + 淹没（ArcGIS 地形仅该页挂载渲染）四示例页，`/tools` 列表 6 卡片。修复后 probe 实测两点收线出值（drawEvt finished） |
| E2E | tools-examples.spec.js 4 条：6 卡片列表跳转、量测 FAB 激活→两点→量测完成、导航控件渲染、未知 slug 兜底 |

### tools 工具箱改版为示例列表（2026-09-16）

`/tools` 从单页工具改为「示例列表 → 点击进入单个示例」结构（与示例中心同模式），
并引入 vue-cesium（MIT，Vue3 原生 Cesium 组件库）作为导航控件来源。

| 项 | 说明 |
|---|---|
| 路由改版 | `/tools` → `MapToolsGallery`（卡片列表）；`/tools/:slug` → `MapToolsExampleView` 按 `src/views/tools-examples/index.js` 注册表懒加载。新增示例 = 注册表加条目 + 一个 .vue 文件，列表与路由自动生效。综合工具箱整体 `git mv` 至 `tools-examples/ToolboxExample.vue`（内容不变），现挂 `/tools/toolbox`——**27 条 E2E 仅同步 URL（`/tools` → `/tools/toolbox`），交互契约与断言零改动** |
| 共享壳 | `ToolsExampleShell.vue`：`loadCesium()` 先建 `window.Cesium`（vue-cesium 的 `getCesiumScript` 首行 `if (!globalThis.Cesium)` 直接复用，源码级确认不产生双引擎）→ `VcConfigProvider` 必须包 `VcViewer`（否则 `globalConfig` 未初始化，`__scriptPromise` TypeError）→ viewer 由 vc-viewer 默认路径自建，`@ready` 后叠加 `applyTdtStack`（天地图栈）与 `applyViewerConstraints`（从 createViewer 抽出的缩放边界/双击禁用/影像门控，两条创建路径行为一致）。**必须显式传 `:camera`**：vc-viewer 会无条件用默认相机（105°E/30°N/1900 万米）覆盖初始化视角 |
| vue-cesium 量测/绘制/分析不可用（重要结论） | VcMeasurements/VcDrawings/VcAnalyses/VcAnalysisFlood 的点击链路在本项目环境**静默失效**：组件挂载（cmpRef 有值）、FAB 激活（activeEvt 正常）、场景渲染（相机/瓦片/手动 ScreenSpaceEventHandler 均正常）逐一验证过，但地图点击始终不进入绘制处理链。**三形态复现**：dev 预打包、dev 裸伺服（optimizeDeps.exclude）、preview（Rolldown 全量打包）；且**纯官方三行接入形态**（VcConfigProvider+VcViewer+VcMeasurements，零自定义 props）同样复现，并伴随 FAB 动作按钮展开方向渲染反转（元素定位到视口外）。遂收缩交付：仅保留验证可靠的 VcNavigation（`/tools/navigation`，罗盘/缩放/定位/打印/状态栏），量测/绘制/贴地能力仍由自有 mapToolsController 提供（27 条 E2E 守护）。挂账见 ROADMAP P2「vue-cesium 量测/绘制组件集成（受阻挂账）」。**根因已对照实验实锤（同日）**：在 /tmp 搭建最小官方形态项目，锁定同版本 vue@3.5.39/vue-cesium@3.2.12/cesium@1.142，仅构建内核不同——Vite 7（esbuild serve + rollup build）下 dev/生产双形态量测交互完全正常（drawEvt new→new→finished:true），本项目 Vite 8（Rolldown）双形态均失效 → 不兼容点在构建链内核。FAB 方向反转在两种内核下均存在，属库自身独立 bug，与构建无关。最小复现项目保留在 /tmp/vc-esbuild-test（含 drawEvt 判据），可直接用于提 issue。（⚠ **2026-09-17 该"Rolldown 实锤"结论被推翻**——真实根因见下节） |
| vue-cesium 裸伺服不可行 | optimizeDeps.exclude 'vue-cesium' 后其依赖链里的 CJS 包在 dev 下 named export 失效：`lodash`（cesium-helpers.mjs 混用 CJS 版）、`@zouyaoji/heatmap.js` 等逐个爆错（与 KNOWN_PITFALLS 中 @cesium-extends/measure 的 turf→polygon-clipping 链同型，且 dev 无 tree-shaking 会拖出全量依赖图）。**vue-cesium 必须走预打包**；dev 下曾用 `resolve.alias { /^lodash$/ → 'lodash-es' }` 兜底，回滚 exclude 后保留（无害） |
| E2E | 新增 `tests/tools-examples.spec.js` 3 条：列表渲染与点击进入、导航控件渲染、未知 slug 兜底。总 27+3 |
| 依赖 | 新增 `vue-cesium@3.2.12`（MIT，承诺框架与文档永久免费；peerDep 仅 vue^3.5） |

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
| 增强 M10 | 标注列表管理 | 左面板标注列表(名称/飞达/重命名/单删),与书签同交互;标注名进持久化与 GeoJSON properties(往返稳定)。**地形可行性实测**:天地图 swdx 服务本机 key 补 Referer 后有权限,但协议非标准 quantized-mesh——官方走闭源 Cesium 扩展包、社区实现无许可证,自研 TerrainProvider 工作量大,贴地量测/剖面继续缓办(三选一待评审,见 ROADMAP P2) |
| 打磨批(M11/M12) | 记录飞达 + 快捷键帮助 + 修 flyToEntry 缺 new | 量测记录条目点击飞达对应产物;ⓘ 快捷键帮助浮层(Enter/Esc/Delete/右键/编辑态增删点)。**修 M10 引入的 bug**:flyToEntry 的 `Cesium.Rectangle(...)` 少 `new`(ES 类不可作函数调用),点击飞达一直静默 TypeError——M10 用例当时只断言「不报错、计数稳定」太弱未兜住,M11 断言相机实际位移后探针直调才暴露。地形接入深度评估结论(不收费/不强制开源/兼容性不通过→维持放弃)见 ROADMAP P2 |
| 地形接入(M11) | 贴地距离 + 高程剖面 + 采样源开关 | **决策反转并落地**:官方闭源扩展包评估不通过后,改用 Cesium 内置 ArcGISTiledElevationTerrainProvider.fromUrl 接 ArcGIS World Elevation 公开高程服务(无需 token/无协议逆向)。**架构关键:provider 只做 sampleTerrain 采样源、不赋 viewer.terrainProvider**——实测地形渲染在 CN 网络+全局串行调度下连续产生 2.9~3.6s 长任务拖死主线程,纯采样则零渲染开销。实现:贴地距离沿测地线插值+逐段高程勾股合成(异步收尾「采样中…」)、高程剖面 SVG 卡片、编辑后自动重算;5s 兜底防采样挂起。真实验证:珠峰区域采样高程 7.9~8.7km。坑:Cesium 1.121+ EllipsoidGeodesic.interpolate 改名 interpolateUsingFraction;ArcGIS provider 1.104+ 必须走 fromUrl 异步工厂(new 出的实例 tilingScheme undefined)。换数据源只需改 src/map/terrainSampler.js |
