# earth-app 项目记忆

## 概览
- Vue 3 + Vite 8 + Three.js(r185, 本地 `src/examples/three-build-compat` 兼容 WebGPU/TSL) + Cesium 的「地球 3D 数据可视化」示例库/应用，应用名 TerraVista 3D。
- 规模极大：registry 注册 **1410+** 个示例（持续清理中，原 1418+），`src/examples/components` 下 **1429** 个 `.vue`。本质是巨型 Three.js / Cesium 示例画廊。
- 用户后续任务类型：改 bug / 加功能 / 重构。

## 目录结构（关键）
- `src/main.js`, `src/App.vue`（顶栏 + 「示例中心」导航 + 搜索 + 主题切换）
- `src/router/index.js`：路由 `/`(EarthView) · `/three-globe`(ThreeGlobeGallery) · `/three-globe/:example`(GlobeDemo) · `/examples`(ExampleGallery) · `/examples/:source/:pathMatch`(ExampleDemo)
- `src/views`：EarthView（首页地球+侧栏/工具栏/时间轴/图例）· ThreeGlobeGallery · GlobeDemo · CompareView
- `src/components`：EarthCanvas（首页地球核心，超大组件）· SearchBox/InfoPanel/LayerPanel/Toolbar/ComparePanel/TimelineSlider/LegendBar/LoadingOverlay/ContextMenu/BreadcrumbNav
- `src/examples`：registry(11 个注册表) · components(`{source}/{category}/*.vue`) · views(ExampleGallery/ExampleDemo) · runners(IframeRunner) · composables(useExampleFilters) · jsm-compat · three-build-compat · utils
- `src/three`：objects(EarthSphere/AtmosphereGlow/TileEngine/CloudLayer/ParticleField/HtmlMarkers…) · layers(VisualizationLayer) · data(DataLoader) · geo/coord · gc(垃圾回收)
- `src/composables`：useScene/useRenderLoop/useOrbitControls/useRaycaster/useLabels/useCameraFlight/useExampleStage
- `src/stores`(Pinia)：useEarthStore/useInteractionStore/useLayerStore/useThemeStore/useTimelineStore
- `src/styles/theme.css` —— 全站用 `--tv-*` CSS 变量（含 light/dark）

## 核心机制
- **示例注册**：`src/examples/registry/index.js` 聚合 11 个 registry 文件；每条示例 = `{source, category, id, title, description, tags, thumbnail, runner, entry, globals}`。
- **组件加载**：`src/examples/components/index.js` 用 `import.meta.glob('./**/*.vue')`，`loadExampleComponent(source,category,id)` 按约定解析：
  1. `./{source}/{category}/{PascalCase(id)}Example.vue`
  2. `./{source}/{category}/{id}.vue`
  3. `./{source}/{category}/{id}/index.vue`
- **渲染**：ExampleDemo.vue 按 `runner` 选择——`vue`→动态组件(传 `:example`)；`iframe`→IframeRunner。**当前全部 1418 条均为 `runner:'vue'`。**
- **过滤分类**：`useExampleFilters.js` 用 `techGroups` + `subCategoryDefinitions` 对 `category` 字符串做正则归类（这是加/修示例分类的主要修改点）。

## ⚠️ 关键坑点
- ~~`generate-registry.js` 写死 `runner:'iframe'` 与线上 `vue` 不一致~~ —— **已于 2026-07-23 修复（安全重构）**：脚本内 `runner` 改回 `'vue'`，并加 `loadExistingExamples` + 合并保护（重跑保留手工 title/description/thumbnail/tags，且追加旧 registry 中脚本未解析到的手动条目），文件头误导注释已更正、生成前打印覆盖警告。修复后重跑该脚本已安全（验证：cesium 78 / three-cesium 267 条全 vue、0 丢失）。
- 仍需注意：`scripts/generate-registry.js` 只生成 `threeCesiumExamples.js` 与 `cesiumExamples.js` 两个源（解析 `public/external-examples/three-cesium-examples/config/*.js`）；其余 9 个 registry 非脚本生成、需手动维护。运行脚本会有「本地未找到 JS」警告（config 中部分 .js 不在本地），脚本会跳过这些项，靠合并保护保留。
- 加新 Vue 示例：在 `src/examples/components/{source}/{category}/{PascalCase(id)}Example.vue` 放组件，并手动把条目写入对应 registry 文件（其余 9 个 registry 需手动维护；cesium/three-cesium 两个若重跑脚本则会自动纳入，但建议重跑前先 git diff）。
- **⚠️ `scripts/generate-threejs-lesson-registry.js` 不要随便跑**：它扫描 `public/external-examples/threejs-lesson/*/src/view/*.js` 重新生成 `src/examples/registry/threejsLesson.js`。其 `runner` 由 `hasVueComponent()` 决定（无对应 `.vue` 就写 `iframe`），且会**整体覆盖** `threejsLesson.js`——丢掉已手工维护的 `runner:'vue'`（当前该源全部 vue）与手工优化的字段。正确删除流程：**`git rm` 源 `.js`+`.tsx` → 手动编辑 `threejsLesson.js` 删条目 → 清理 `scripts/_thumb_map.json` 映射 →（可选）删生成脚本 `titleMap` 中的死键**。因脚本只扫 `.js`，删掉 `.js` 后即便重跑也不会复现该示例。
- `three` 经 `threeCompatResolver` 插件指向本地 `three-build-compat`；`three-good-godrays` 别名 `goodrays`；`three/examples/jsm` 指向本地 `jsm-compat`。
- **封面截图流水线**：`scripts/screenshot-examples.mjs`（Playwright + 系统 Chrome + swiftshader 软渲染）用 CDP `Page.captureScreenshot` 绕过 rAF 动画导致的稳定等待超时；生成到 `public/example-thumbs/{source}/{category}/{id}.jpg`；截图前注入 CSS 隐藏 `.app-nav`/`.top-bar` 并截 `.demo-body` 元素，确保只保留示例渲染区。`vite.config.js` 的 `serveUnicodePublic` 插件(dev only)解决 macOS 中文/Unicode 文件名在 vite dev 下破图问题。
- **lil-gui 类名带 `lil-` 前缀（本项目特有坑）**：本项目用的 lil-gui 版本，根元素实际类是 `lil-root`/`lil-auto-place`/`lil-allow-touch-styles`（不是标准 `root`/`autoPlace`）。写全局样式覆盖 lil-gui 面板时务必用 `lil-` 前缀类名（如 `.lil-gui.lil-root`），否则选择器不命中、样式无效。详情页已用 `body.example-detail-active .lil-gui.root, .lil-gui.lil-root` 双选择器把 autoPlace 面板下移到顶栏之下。

## 当前已知问题（待处理）
- ~~`build.log` 显示最近一次 `vite build` 曾失败于 `WebgpuTslVfxTornadoExample.vue:311 Missing semicolon`~~ —— **已于 2026-07-23 实测验证：跑真实 `vite build`（`--outDir /tmp/earth-build-test --emptyOutDir false`）成功，`✓ 4420 modules transformed`、`✓ built in 27.81s`、`EXIT_CODE=0`、0 error**。该旧错误来自别人机器（`zhangzhengyang`）的旧 babel/rolldown 构建链路，当前工作区代码不复现。**结论：项目可正常生产构建。**
- ⚠️ **构建/测试环境注意（WorkBuddy 沙箱）**：`vite build` 默认要清空 `dist/`，但沙箱的批量删除保护（`genie-safe-delete`，阈值 50）会拦截 2033 文件的清空 → 报 `[safe-delete][SAFE_DELETE_BULK_CONFIRM_REQUIRED]`。**解决办法**：构建时改用 `--outDir /tmp/xxx --emptyOutDir false`（输出到项目外临时目录，绕开删除保护）。dev server 冒烟：`vite --port 5180 --strictPort`，curl 各路由应 200；注意用 `run_in_background` 起服务（用 `&` 起的进程会在 Bash 调用返回后被回收，curl 连不上）；结束后 `pkill -f "vite --port 5180"`。

## 示例中心排查发现（2026-07-23，框架层+静态扫描+性能）
- ~~🔴 `city-realtime` 示例不可达（source 撞车，真实 bug）~~ **已修复（2026-07-23, commit `e9493c3`）**：`cityRealtimeWebglExamples.js` 的 `source` 改为 `'city-realtime-webgl'`、`label` 改为 '实时城市 WebGL'；运行时验证 `getExampleById('city-realtime-webgl',...)` 命中、该 source 不再为空、撞车消除、`getSources()` 不再重复。
- ~~🟠 画廊技术切换器是死功能~~ **已修复（2026-07-23, commit `23ffda3`）**：`ExampleGallery.vue` 顶部新增技术切换 tab（含各技术示例计数），并把 `currentTech`/`currentSubCategory`/`keyword` **双向同步到 URL**（`router.replace` 写、`syncQueryToState` 读），刷新可保持、可分享、可前进后退；原死监听 `watch(route.query)` 现已可正常工作。
- ~~🟠 registry 文件格式不统一（隐患，波及合并保护）~~ **已修复（2026-07-23, commit `3f855bb`）**：`loadExistingExamples` 改用动态 `import()`，兼容纯 JSON 与 JS 对象字面量写法；`buildRegistry` 及调用链相应改 `async`。即使将来把 `generate-registry.js` 扩展到那 6 个字面量源也不会抛错。
- ~~🟡 GPU/场景资源泄漏（最高优先级）~~ **已用框架级安全网兜底（2026-07-23, commit `81ccf4c`）**：新增 `ExampleHost.vue`，在 `onBeforeUnmount`（子组件卸载之前、canvas 仍在 DOM）遍历并调用 `WEBGL_lose_context` 释放 WebGL 上下文；`ExampleDemo` 改用 `ExampleHost` 包裹 Vue 示例，**无需逐个修改 1429 个组件**。彻底治理（释放纹理/几何体等 JS 层资源）仍需把裸 canvas 示例逐步收口到 `useExampleStage`（后续可选优化）。
- 🟡 **其他**：`console.log` 出现在 217 个示例文件（建议清理）；registry↔文件一致性 1421 条全部命中（缺失 0，loader 命名约定 OK）；7 个顶层 `*ExampleScene.vue` 是共享场景壳（被其他示例 import），非死代码；`techGroups` 中 `ex.category==='threejsOfficialExamples'` 等精确匹配是死代码（实际 category 嵌套如 `misc/animation`）；`getSubCategoriesByTech` 与画廊 `availableSubCategories` 逻辑重复（DRY）。
