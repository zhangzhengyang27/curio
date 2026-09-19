# TypeScript 整体迁移计划

> **2026-09-17 拍板**:对 src 运行时代码做 JavaScript → TypeScript **整体迁移**,
> 包含 1429 个示例组件(**推翻本文落地前 ROADMAP 第 3 节「不追求 1429 个示例组件全部纳入 TypeScript」的边界**),
> 配置文件一并迁移;`scripts/` 与 `legacy/` 保持 JS 不迁。
> 执行节奏:计划先行落盘(本文件),迁移分阶段分批推进,每批独立提交、独立过闸门。
>
> ⚠ 文中所有计数为 **2026-09-17 实测基线**,会随迁移推进漂移;执行各批前以实测为准,
> 批次完成后顺手更新第 3 节状态表(见 AGENTS.md「文档准确性」义务)。

---

## 0. 拍板记录

| 决策点 | 结论 |
|---|---|
| 1429 个示例组件是否迁移 | **全部迁移**(推翻原 ROADMAP 边界),按 11 个来源分波,小来源先打样 |
| 外围文件 | 配置文件(vite / eslint / playwright config)与 tests/ 一并迁;**`scripts/`、`legacy/` 不迁**(Node 直跑、闸门字面依赖,收益低风险高) |
| 本次会话(2026-09-17) | 只落盘本计划(M0),不动任何代码 |

## 1. 范围

### 1.1 迁移对象(基线 2026-09-17 实测)

| 区域 | 数量 | 说明 |
|---|---|---|
| 平台侧 `.js` | **76 个 / 8,899 行** | three/layers 17、three/objects 16、composables 9、map 系 9、three/utils 5、stores 5、three/geo 4、three/data 2、three 根 2、router 1、three/tours 1、views/tools-examples 1、main.js 1。最大单文件:`map/map/tools/mapToolsController.js` 1,105 行、`three/objects/FlowLines.js` 659 行 |
| 平台侧未迁 `.vue` | **29 个** | 1512 个 .vue 中 148 个已 `lang="ts"`(非 examples 47 个 = BMap 全量;examples 101 个集中在 three-project)。剩余:App.vue、EarthView.vue、src/components/ 12 个等 |
| examples 基础设施 `.js` | **21 个** | composables 8 + components/index.js 1 + registry 12(registry 需生成器链同步,见 M3) |
| examples/utils | 3 个 | `lil-gui-tracked.js` 是 vite 别名目标,改名须同步 vite.config |
| tests | 10 个 | 9 个 `.spec.js` + helpers/tiles.js |
| 配置 | 3 个 | vite.config.ts、eslint.config.js、playwright.config.js |
| 入口 | 1 处 | `index.html:34` 的 `/src/main.js` 引用(main.js 改名时同步) |

### 1.2 硬性排除(技术约束,非范围选择)

- **`src/examples/three-build-compat/`(5 个)**:three.js 构建产物本体,vite 别名直接指向其中 `.js` 实体文件,`verify-three-compat` 对这五个文件名做哈希守卫——**不可改名**。
- **`src/examples/jsm-compat/`(586 个)**:三方库本地副本,ROADMAP §3 已定性「保留原始风格的外部代码」,豁免语义继续有效——**不迁移**。
- **`src/three/geo/delaunator.js`**:mapbox/delaunator 的 vendored 开源库副本,同「外部代码」语义——**不迁移**,由手写的 `src/three/geo/delaunator.d.ts` 提供最小类型声明(该声明长期保留)。
- **`scripts/`(顶层 15 + lib 2)与 `scripts/legacy/`**:Node 直跑,拍板不迁。
- `public/`、`.zcode/`、根目录一次性审计脚本等杂项。

## 2. 阶段与批次总览

| 阶段 | 内容 | 关键同步点 | 闸门要求 |
|---|---|---|---|
| **M0 计划落盘** | 本文件 + ROADMAP 边界改写 + AGENTS.md 文档地图 | — | 纯文档 |
| **M1 平台核心**(7 批) | ① stores(5)+router+views/tools-examples+main.js(同步 index.html)+App.vue → ② three/utils+geo+data+根散件(13,纯函数) → ③ three/objects(16) → ④ three/layers(17,BaseLayer 基类泛型化) → ⑤ composables(9) → ⑥ map 系 9 个(**cesium-interop.js 改名须同步 vite.config 的 cesiumInteropResolver 硬编码路径**) → ⑦ three/tours/routes.js(**同步 EarthView.vue 两处 `import('../three/tours/routes.js')` 字面后缀**)+ 剩余 views/components .vue | 每批 grep 复查动态 import | 每批:verify + typecheck + lint:ci + build + dev E2E;⑥ 后加 preview E2E |
| **M2 测试与配置**(3 批) | playwright.config.ts(testMatch 加 ts)+ 10 个测试文件;vite.config.ts(**同步 verify-three-compat.mjs 对 `vite.config.ts` 的字面路径检查**);eslint.config.ts(ESLint 10 若不支持 TS 配置则保持 js 并在此登记结论) | 闸门脚本字面路径 | vite.config 动过 → **必须 preview E2E**(AGENTS.md §5) |
| **M3 examples 基础设施**(2 批) | ① composables 8 + components/index.js + utils 3(lil-gui-tracked 改名同步 vite 别名);② registry 12 个 .ts 化:**先改 3 个生成器输出 .ts,再 `--check` 确认后 `--force` 重跑**(R2),同步 verify-registry.mjs 的动态 `import('registry/index.js')`、registry-guard、eslint ignores、verify:drift 逐字节比对 | R1/R2 全流程 | registry 批:verify 全链 + 双 E2E |
| **M4 示例组件分波**(11 波) | 见第 3.1 节波次表。每波:codemod 给 `<script setup>` 加 `lang="ts"` + 支撑 .js→.ts + vue-tsc 错误清零 | 每波结束更新 3.1 状态列 | 每波:全闸门 + 双 E2E |
| **M5 收尾** | 计数文档同步(README / docs / CI 注释)、KNOWN_PITFALLS 登记迁移新坑、可选开启 type-aware lint(projectService) | — | 全闸门 + 双 E2E |

## 3. 批次状态表(滚动更新)

| 阶段 | 批次 | 内容 | 状态 | 提交 |
|---|---|---|---|---|
| M0 | — | 计划落盘 | ✅ 已完成(2026-09-17) | 见 git log `docs:` |
| M1 | ① | stores + router + tools-examples + main.js + index.html + App.vue | ✅ 已完成(2026-09-17)。去后缀导入在 Rolldown 构建与 vue-tsc 下解析正常,验证批结论成立;新增 useExampleFilters.d.ts shim(M3 转换后删除) | 见 git log `refactor(ts):` |
| M1 | ② | three/utils + geo + data + 根散件 | ✅ 已完成(2026-09-17)。实际 14 个文件:计划 12 个 + 应 DataLoader 依赖提前迁入 BorderLines/CountryMesh(避免 2 个 .d.ts shim);delaunator.js 按 vendored 外部代码排除(§1.2),新增 delaunator.d.ts;新增 devDependency `@types/d3`。**教训见 §3.2:构建与 E2E 并发会导致 worker 崩溃** | 见 git log `refactor(ts):` |
| M1 | ③ | three/objects(16) | ✅ 已完成(2026-09-17)。剩余 14 个全部迁移(BorderLines/CountryMesh 已随批次②先行迁入);LightPillar/ScatterPoints 为无引用方文件(后者已标 @deprecated),照常转换;three-types-fixes.d.ts 增补 isSprite | 见 git log `refactor(ts):` |
| M1 | ④ | three/layers(17) | ✅ 已完成(2026-09-17)。BaseLayer/LayerManager 构造参数改为必填(原 `= {}` 默认无真实调用方);导出 BaseLayerParams/CountryGdpMesh/EarthGroupWithMeshes 共享类型供 DataLoader 消费方对齐;layers 目录 TS 化完毕 | 见 git log `refactor(ts):` |
| M1 | ⑤ | composables(9) | ✅ 已完成(2026-09-17)。useExampleStage 导出 ExampleStageCtx/ExampleStageOptions 接口,ctx 的 onReady 拦截段以 any 收窄全局猴子补丁;useTourEngine 导出 TourStep/TourRoute/引擎返回类型 | 见 git log `refactor(ts):` |
| M1 | ⑥ | map 系(9)+ vite.config 别名同步 | ✅ 已完成(2026-09-17)。cesium-interop.ts 改名已同步 vite.config 的 cesiumInteropResolver 路径;预编译 Cesium(window.Cesium)按「无类型可依」策略以 any 命名空间承接,env.d.ts 补 Window.Cesium 与 @turf v6 声明;**TS 强制暴露存量缺陷:mapToolsController 自 M11 起缺失 getArcgisTerrainSampler import(被 try/catch 掩盖,贴地采样开启即静默失败),本批补回**;preview E2E 100 过(vite.config 动过,双模式验证) | 见 git log `refactor(ts):` |
| M1 | ⑦ | three/tours + 剩余 .vue | ✅ 已完成(2026-09-17)。routes.ts 同步 EarthView 两处动态 import;12 components + 9 views + 18 tools-examples 全部 lang="ts"(40 文件)。**TS 暴露并修复存量 bug:CodeDrawerHeader 复制按钮引用不存在的 copySection(点击必抛错),改为 $emit('copy')**;EarthCanvas 经 InstanceType 暴露方法类型;E2E 101 过 0 失败(历史首次满分) | 见 git log `refactor(ts):` |
| M1 | — | **M1 阶段完成**:非 examples 平台侧 .js 仅剩硬排除项(delaunator.js),全部 .vue 已 lang="ts" | ✅ | — |
| M2 | ① | playwright.config + tests(10) | ✅ 已完成(2026-09-17)。config 改 testMatch 双扩展名;9 个 spec + helper 改 .ts。**决策:tests/ 不纳入 tsconfig**(Playwright 原生编译 TS,typecheck 闸门范围不变),后续若要全量类型化再单独评估 | 见 git log `build(ts):` |
| M2 | ② | vite.config.ts + verify-three-compat 同步 | ✅ 已完成(2026-09-17)。闸门字面路径同步生效(verify 全绿);AGENTS/CONTRIBUTING/docs/KNOWN_PITFALLS/scripts(audit-deps 等)引用同步;构建 EXIT=0。⚠ 复发踩坑:验证构建用裸 vite build 漏跑 copy-example-deps → preview E2E Cesium 页全挂 30.6s 超时(AGENTS.md §6 已知坑再现),补齐后 preview 101 过 | 见 git log `build(ts):` |
| M2 | ③ | eslint.config.ts | ✅ 已完成(2026-09-17)。ESLint 10 支持 TS 配置,需安装 devDependency `jiti`(官方路径) | 见 git log `build(ts):` |
| M3 | ① | examples composables + components/index + utils | ✅ 已完成(2026-09-17)。12 个文件 .ts 化;249 个引用方导入去后缀;vite 的 lil-gui 别名同步 .ts;useExampleFilters.d.ts shim 按其头部约定删除。示例治理:4 个 stage composable 的 options 用 Record<string,any> 承接、useGraphicsCleanup 全局猴子补丁以 as typeof 断言收编、lil-gui/original-internal 补模块声明 | 见 git log `refactor(ts):` |
| M3 | ② | registry .ts 化(生成器先行) | ✅ 已完成(2026-09-17)。按 R2 流程:生成器输出改 .ts → git mv 12 个 → --check 字节一致(无需 --force)。Node 侧消费(verify-registry/verify-thumbnails 动态 import)走 --experimental-strip-types(npm script 已加,CI Node 22.6+ 支持);index.ts 显式 .ts 扩展导入 + tsconfig 开 allowImportingTsExtensions;RegistryExample 接口入 index.ts;eslint ignores/audit 引用同步 | 见 git log `refactor(ts):` |
| M3 | ② | registry .ts 化(生成器先行) | ⬜ | — |
| M4 | 波 1~11 | 见 3.1 | ✅ 全部完成(2026-09-17) | — |
| M5 | — | 收尾与计数同步 | ✅ 已完成(2026-09-17):残留审计(src .js=0、.vue lang=ts 100%)、AGENTS/README 计数同步、KNOWN_PITFALLS E 系新坑(E1 ASI 陷阱/E2 nocheck 消音/E3 闸门字面路径/E4 存量显形归因) | ✅ | — |

### 3.1 M4 示例组件波次(按来源,条目数为 2026-09-17 实测)

| 波 | 来源(source) | 条目数 | 打样/说明 | 状态 |
|---|---|---|---|---|
| 1 | granary-3d | 1 | **打样波**(与波 2、3 合并执行) | ✅ |
| 2 | city-realtime-webgl | 2 | 支撑代码 16 个 effect .ts 已就位 | ✅ |
| 3 | earth-lessons | 6 | | ✅ |
| 4 | threejs-lesson | 29 | 33 组件 2108 行;125 初始错误→0,全部实类型(本地类 AxesGridHelper/ResourceTracker 补字段,惯用法 ctx/delta 批量注解) | ✅ |
| 5 | cesium-examples | 78 | 78 组件 + cesiumHeatmap 支撑库;2557 初始错误→0;34 重灾文件 @ts-nocheck 白名单(§3.3),其余实类型;发现并按 parity 声明 4 处 HTML 转换遗留未声明全局(box/css2dContainer/TDT_TOKEN→env/AmapMercatorTilingScheme) | ✅ |
| 6 | mygrapics | 97 | 426 初始错误→0;45 文件 @ts-nocheck 白名单(§3.3,累计 79)、52 文件实类型;**TS 暴露并修复存量坏死:57 个 demo 的 new GlRenderer 缺失 import(运行时 ReferenceError),补回 Renderer 别名导入**;env.d.ts 加 jsm-compat 通配 any 声明 | ✅ |
| 7 | three-project | 108 | 仅 8 个 .vue + firework.ts 未迁,补齐;68 错→0;10 文件 @ts-nocheck 白名单(§3.3,累计 89) | ✅ |
| 8 | graphics | 109 | 1081 初始错误→0;62 文件 @ts-nocheck 白名单(§3.3)、其余实类型;**TS 暴露并修复存量坏死:graphics 系 27 个 demo 同样缺失 GlRenderer 导入,批量补回**;spritejs/qcharts/topojson/Canvas2Video 为原 HTML CDN 全局(仓内无依赖),按 parity 声明 | ✅ |
| 9 | webgl | 134 | 2819 初始错误→0(全 M4 最重):study-webgl 裸 WebGL 教程代码;glMatrix 等原 HTML 全局入 env.d.ts parity 声明(消 285 错)、var/let 声明与 getContext/gl.program 教程惯用法批量注解;36 文件 @ts-nocheck 白名单(§3.3,累计 125) | ✅ |
| 10 | three-cesium | 266 | 3201 初始错误→0;codemod+参数脚本化注解;重灾 @ts-nocheck 白名单(§3.3);parity 修复:iChannel0-3 入 Window 声明、gaussian-splats-3d/lil-gui/three extensions 遗留参数收编;MushroomExample 冗余 uniforms 简写删除(同值,行为不变) | ✅ |
| 11 | threejs-official | 587 | 11035 初始错误(全 M4 最大)→0;**该源为 threejs.org 教程直迁,API 密集,按 §3.3 回退机制全量 @ts-nocheck**(589 文件,预算偏离已在 §3.3 登记);支撑 worker 2 个 .ts 化(修复 ?worker 引用) | ✅(含白名单偏离) |

> **打样结论(2026-09-17,波 1-3 实测)**:9 个组件 + 2 个支撑 js(1481 行)全部实类型迁移,
**@ts-nocheck 使用数 0**(预算未动)。初始类型错误 104 个,按错误类分布:隐式 any 参数/声明
约 70%(机械修复)、three-types-fixes 的 Material.color 可选污染约 15%(交叉类型收窄)、
猴子补丁签名约 10%(as typeof 断言)、其余为字面量联合 props(as const 或模板 as any)。
成本画像:47 行级 HTML 转换产物(earth-lessons 系)每文件 ≤2 错、5 分钟内;700 行级 imperative
demo(Granary3d)65 错、约 40 分钟。**外推:波 4-11 预计总错误 4~6 千个,机械修复为主,
无结构性阻塞;按波提交,每波全闸门一次。**

### 3.3 @ts-nocheck 白名单(M4 回退机制,计划 §4 决策 1)

**波 5(cesium-examples)起启用**:打样实测 cesium 系 demo 命令式代码的实类型成本
为小源 10 倍以上(波 5 初始 2557 错,codemod 后仍 1274),按计划 §4 回退机制对
重灾文件登记 @ts-nocheck;轻灾文件(≤6 错)全部实类型修复。
本波白名单 34 文件(25 .vue + cesiumHeatmap.ts 等),累计 34/1429 ≈ 2.4%,远低于 20% 预算。
后续波(6-11)同标准执行,名单滚动登记于此。

**迁移完成时终值(2026-09-17)**:@ts-nocheck 共 **903 文件(约 59%)**,显著超出 20% 预算目标。
(2026-09-19 已通过追平计划全量清零,见下方「追平进度」与「终局」。)
偏离原因:波5-11 实测错误量(波5 2557 / 波9 2819 / 波10 3201 / 波11 11035)远超打样外推,
实类型化三个大源(尤其 threejs-official 587 文件 three.js 教程直迁)需逐文件理解场景图,
为独立后续工程。结构目标(全部 lang="ts" + 平台侧无 .js)不受影响;
typecheck 闸门在 nocheck 下仍为 0 error 且覆盖其余全部代码。
**追平路径**:按波从 nocheck 转实类型(参照打样波与波4 方法),每批 20-50 文件,
跑 vue-tsc 增量清错后移除 nocheck 行;优先级:kaikeba-webgl(新教程,质量高)> shader > basic。

**追平进度**:
- **批次1(2026-09-18)✅**:kaikeba-webgl 7 文件全部转实类型(43 错→0)。
  webgl 源 nocheck 余 29(study-webgl);总计 903→901。
  教训:本源 `addUpdateCallback` 外层签名为 `() => void`,教程代码用回调 time 参数时
  应改 `performance.now()` 自产;`lookAt` 教程函数是 Vector3 三参而非数字。
- **批次2(2026-09-18)✅**:study-webgl 29 文件全部转实类型(388 错→0),webgl 源 nocheck 清零。
  要点:`initTexture(imageFile, num)` 教程死参数(下游 handleLoadedTexture 只收 1 参)
  以可选参数保留形态不"修复"语义;修复波9 codemod 引入的 E1 运行时坏死
  (TransformCompositeExample `useProgram` 行尾无分号 + 行首 `(webgl as any)` 断言括号,
  JS 解析为调用 useProgram 返回值,进入页面即 TypeError——nocheck 消音的又一实证)。
- **批次3(2026-09-18)✅**:three-project 9 文件(8 .vue + firework.ts)全部转实类型(229 错→0)。
  此批次同时消除 HEAD 上的存量 lint 红:这 9 文件在波7 带着注解残留 @ts-nocheck 进入
  three-project(不在 eslint ignores),ban-ts-comment 12 错自波7 起潜伏,lint:ci 在
  HEAD 上实际为红——此前批次的「lint 全绿」记录不实,以本批为准修正。
  要点:firework.ts 按 firework.d.ts 契约补类属性声明后删除过时 .d.ts 垫片;
  `loadedModel`/`_loadedModel` 名称失配(卸载清理 ReferenceError 潜在崩溃)修复;
  GridHelper material 交叉断言、`morphTargets: true`(three r151+ 死参数)删除。
- **进度合计**:nocheck 总数 903(登记基线)→ **实测 858**(= 903-45:7+29+9,与实测吻合;
  批次1 行曾记 901 为误计,以实测为准)。剩余分布:threejs-official 588 /
  three-cesium-examples 154 / graphics 62 / cesium-examples 34 / mygrapics 20。
- **批次4(2026-09-18)✅ 并行代理**:mygrapics 20 文件转实类型(129 错→0)。
  唯一 env.d.ts 候选 BezierEasing 用 (globalThis as any) 局部断言绕过,未集中登记。
- **批次5(2026-09-18)✅ 并行代理**:cesium-examples 34 文件(33 .vue + cesiumHeatmap.ts)
  转实类型(约 1224 错→0)。**并行代理实测修掉 3 处必然抛错的存量坏死**:
  FlyLine/CurvePipe 裸用 Cesium.Color/Material._materialCache 等未解构(实例化材质即
  ReferenceError)、EchartsFlyLine 的 RegisterCoordinateSystem 丢 api 参数(getViewRect
  必 TypeError)。润色补遗在批次5 提交后由代理追加,随批次6 复验一并提交(fix 补遗提交)。
- **批次6(2026-09-18)✅ 并行代理+主会话收尾**:graphics 62 文件转实类型(主会话独立
  复验实测首轮 467 错→0,代理自报 0 错不实,教训见 KNOWN_PITFALLS E7)。代理 codemod
  曾把 5 处无括号单参箭头插成 `d: any =>`(17 个语法错)后自行修复;最后 21 错由主会话
  以带括号 `(d: any) =>` 形态收尾。
- **进度合计(2026-09-18 并行波后)**:nocheck 总数 903 → **实测 742**(本波 -116:
  20+34+62)。剩余只有两大源:threejs-official 588 / three-cesium-examples 154,
  后者已按子目录切好 4 份(shader 47 / application 45 / basic+particle 38 / 其余 24)
  待下一并行波。
- **批次7-10(2026-09-19)✅ 并行波2**:three-cesium-examples 154 文件全部转实类型,
  nocheck 总数 742 → **588**(只剩 threejs-official)。切片:rest 24(504 错,be97e69)/
  shader 47(477 错,548ce9b)/ application 45(793 错,903fa82)/ basic+particle 38
  (ec17f83)。三个长跑代理先后死于模型超时/流停滞(5-8 小时),死亡前均已接近完成,
  主会话按现场状态接管收尾。本波 TS 暴露并修复:PersonFirstMove 每帧/卸载必
  ReferenceError×3、PhysicsMesh ASI 陷阱、CharacterBlur 等 3 个 demo 的 dispose
  清理从未执行(ResizeObserver 泄漏)、**PointsEarth 模板绑定 onReady 局部变量致
  挂载即渲染崩溃**(删死对象、内联静态 '#332148' 恢复意图)。
- **收官波(2026-09-19)✅ 批次11-16**:threejs-official 588 文件全部转实类型,
  **nocheck 全仓清零(903 → 0),预算达标(0% < 20% 目标)**。
  打样批 20(416 错,91500ea)→ P04 40(f1d19f2)→ 综合提交 554 文件(66e9ae8)。
  打法:主会话机械管线(参数/声明注解 + TS2304 丢声明/TS2683 构造器 this/
  TS2339 类字段自动修)+ 残点代理小包并行;机械注解清掉约 65% 错误,
  结构残点交代理。本波修复转换期丢失声明约 40 处(赋值/调用即 ReferenceError
  ——**大量示例此前挂载即坏**)、丢失函数体约 20 处(onWindowResize/init/animate)、
  gui 作用域错位约 10 处(unmount 泄漏)。
  已知存量(未修,超出类型迁移授权):5 个 ammo 示例缺 ammo.wasm 加载器、
  3dtiles animate 未注册、ShadowContact 丢 render 语句、morphtargets-webcam
  resize 结果未应用。(上列 4 处已于收官后追加修复,见 fix 提交 a80a82e:
  ammo 懒加载按 jsm-compat/physics/AmmoPhysics.js 同源恢复,其余按原版
  语义补语句/注册,均可运行。)
- **终局(2026-09-19)**:全量 typecheck exit=0(0 语法错 + 0 语义错)、
  全仓 `@ts-nocheck` = **0 文件**、ASI 严格扫描 0 violations、
  lint:ci 0 错误、verify 5 项过、build+copy-example-deps EXIT=0。
  E2E:preview 99 过 + 失败 2 例(monitor/viz-loading,与本波无关页面)
  定点重跑全绿;dev 92 过,失败 5 例全属 §3.2 已知抖动家族
  (workbench 下载流经 stash 二分实锤为基线预存),复跑通过。**追平目标达成。**

具体清单:见 git 提交 `refactor(ts): TS 迁移 M4 波5` 中含 @ts-nocheck 注释的文件。

### 3.2 本机 E2E 已知抖动集(M1 批次①② 实测登记)

以下用例在本机存在与迁移无关的预存失败/抖动(批次① 经 **stash 二分**在未含批改动的
基线上复现同样失败;批次② 五轮运行失败集合持续漂移,且失败页面均不导入被迁移模块):
`workbench.spec.js` 导出报告(80)/选国下钻 W3(99)/碳排放演示(65)/报告模板 W2(110)/打印导出 W4(140)、
`analysis.spec.js` 对比满4国(72)/时间轴暂停(134)/趋势图 A2(221)/指标着色切换(174)、`monitor.spec.js` 处置流转(37)/流开关(97)、
`map-tools.spec.js` 坐标转换 M7(507)、`tour.spec.js` 下一站推进(48,连续两次同代码一过一败)、`viz-loading.spec.js` 即时模式(70,仅满载全量跑失败,隔离重跑 2/2 绿——地球初始化被负载拖慢时 GDP 点击落入排队窗口)。特征:页面正常渲染,交互/download/echarts canvas 在 15s 超时内
未就绪;另有 **Playwright worker 崩溃**导致「N did not run」(全量跑时 map-tools 单文件可达 13.6m)。
**后续批次遇到这些用例失败,先单独重跑该文件再归因,勿直接判定为迁移回归;
归因仍不确定时用 stash 二分对照基线。**
**铁律:后台 vite build 与 E2E 不得同时运行**(批次② 并发一轮即触发 30 条未执行)。

## 4. 关键技术决策

1. **不用 @ts-nocheck 起步**(全仓现例 0 处,仅 jsm-compat vendored 文件内有 5 处历史遗留):
   M1/M2/M3 平台与基础设施代码 strict 实类型;M4 示例组件允许 @ts-nocheck 作为最后手段,
   但须登记白名单并设预算(目标使用率 <20%),避免三方 demo 类型修复成本失控。
2. **相对导入去后缀**:`./x.js` → `./x`(`moduleResolution: "bundler"` 支持),用一次性 codemod 批量处理
   (非 examples 平台侧实测 102 处显式 `.js` 后缀静态导入);脚本先 dry-run 后执行。
3. **改名一律 `git mv`**;R3(.vue 文件名 ↔ 示例 id 约定)不受影响——.vue 组件只改 `<script>` 标签,不改文件名。
4. **`import.meta.glob` 仅 2 处且只匹配 `./**/*.vue`**(src/examples/components/index.js),组件改名不碰它,已确认安全。
5. **构建统一走仓库外输出**:`npx vite build --outDir /tmp/earth-build-verify --emptyOutDir true`,
   后台任务跑(本机构建 7~37 分钟;规避 dist 清空触发批量删除保护)。
6. **JSDoc 是现成的类型迁移素材**:平台侧 76 个 .js 已有 320 处 `@param`、54 处 `@returns`,迁移时转为 TS 注解而非重推。

## 5. 风险与对策

| 风险 | 对策 |
|---|---|
| M4 体量占整个计划 90%+ | 波 1-3 打样实测成本后再承诺后续节奏;@ts-nocheck 预算制;最大波(threejs-official 587 条)允许再拆分多次提交 |
| verify:drift 逐字节比对 | M3 之前不碰 registry 任何文件;M3 严格「先改生成器 → `--check` → `--force`」顺序(R2) |
| 闸门脚本字面路径 | vite.config.ts(M2)与 registry/index.js(M3)的改名都有脚本硬编码依赖,同步清单已列入批次表,漏一项即 CI 假红 |
| 动态 import 字面后缀 | 全仓动态 import 27 处中 2 处带 `.js` 字面后缀(EarthView.vue:326/372),每批改名后强制 grep 复查模块名 |
| Rolldown 对 `.js` 后缀解析到 `.ts` 的行为未验证 | 决策 2 的去后缀方案直接绕开;M1 批次①(最小批次)作为解析行为验证批,若发现意外立即登记 KNOWN_PITFALLS |
| 构建时长吞噬闸门时间 | 统一 /tmp 输出 + 后台任务;dev E2E 快反馈,preview E2E 只在批次表要求的批次跑 |

## 6. 完成定义(验收标准)

- `npm run verify` / `typecheck` / `lint:ci` / `build` / 双模式 E2E **全程保持全绿**;
- src 下除 1.2 节硬排除目录外**无 `.js` 残留**;所有 `.vue` 均为 `lang="ts"`;
- `@ts-nocheck` 数量在预算内且逐文件登记于本文;
- README / docs / CI 注释中的 js、ts、vue 计数同步为终态(AGENTS.md §9 义务);
- ROADMAP 第 3 节表述与本计划一致(jsm-compat 等「外部代码」豁免语义保留)。

## 7. 单批执行手册(SOP)

1. `git status` 确认干净回退点;批次涉及 registry 时先 `--check`(R2)。
2. `git mv x.js x.ts`(禁 cp+rm);.vue 批次只改 `<script setup>` 标签。
3. 跑后缀 codemod(或手工)处理相对导入,`grep -rn "模块名"` 全仓复查引用点。
4. strict 实类型修复;禁止新增 @ts-nocheck(M4 白名单除外,登记)。
5. 闸门:`npm run verify` → `typecheck` → `lint:ci` → build(/tmp 输出、后台)→ `test:e2e`(dev);
   批次表标注的批次追加 `E2E_TARGET=preview npm run test:e2e`。
6. 更新第 3 节状态表;中文小步提交(`type(scope): 摘要`,正文写为什么)。

> 本机环境注意:zsh 损坏态用绝对路径 node(`~/.nvm/versions/node/v24.21.0/bin`);
> E2E 端口固定 5299(`E2E_PORT`),见 AGENTS.md §6。
