# earth-app 项目记忆

## 概览
- Vue 3 + Vite 8 + Three.js(r185, 本地 `src/examples/three-build-compat` 兼容 WebGPU/TSL) + Cesium 的「地球 3D 数据可视化」示例库/应用，应用名 TerraVista 3D。
- 规模极大：registry 注册 **1418** 个示例，`src/examples/components` 下 **1429** 个 `.vue`。本质是巨型 Three.js / Cesium 示例画廊。
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
- `three` 经 `threeCompatResolver` 插件指向本地 `three-build-compat`；`three-good-godrays` 别名 `goodrays`；`three/examples/jsm` 指向本地 `jsm-compat`。

## 当前已知问题（待处理）
- `build.log` 显示最近一次 `vite build` 曾失败于 `WebgpuTslVfxTornadoExample.vue:311 [vue/compiler-sfc] Missing semicolon`。**但 2026-07-23 用 @vue/compiler-sfc 对全部 1429 个 .vue 做 parse+compileScript+compileTemplate 静态扫描，结果 0 错误，定向复测该文件也通过** → 该错误当前大概率已修复或仅完整 `vite build` 管线才报。**待跑一次 `vite build` 最终确认**（用户当轮排除了构建/运行验证）。

## 示例中心排查发现（2026-07-23，框架层+静态扫描+性能）
- 🔴 **`city-realtime` 示例不可达（source 撞车，真实 bug）**：`cityRealtimeWebglExamples.js` 写 `source:'webgl'`，与 `webglExamples.js` 撞车；`registry/index.js` 的 `getExampleById` 用 `.find(r=>r.source===source)` 取第一个 → `getExampleById('webgl','city-realtime','Metaball')` 实测返回 `null`（画廊能列出、点开 404）。同时 `techGroups` 期待的 source 名是 `'city-realtime-webgl'`（目前该 source 完全不存在）。修复：把该文件 `source` 改 `'city-realtime-webgl'`（一行）。影响：整批 city-realtime 打不开 + `getSources()` 重复 "WebGL 基础" 标签。
- 🟠 **画廊技术切换器是死功能**：`ExampleGallery.vue` 模板只有「分类」侧栏，无切换 `currentTech`（Three.js/Cesium/WebGL/Graphics）的 UI；`currentTech` 只能靠 URL query 改变，而画廊从不写 query → 整套 tech 分组（currentTechLabel/techExamplesCount/availableSubCategories 按 tech 过滤）UI 不可达。`syncQueryToState` 读 query、`watch(route.query)` 是死监听、刷新丢筛选态。建议：加技术切换 UI + URL 双向同步，或删 dead 逻辑。
- 🟠 **registry 文件格式不统一（隐患，波及上一轮合并保护）**：5 个纯 JSON；6 个（`webglExamples`/`granary3dExamples`/`graphicsExamples`/`mygrapicsExamples`/`threeProjectExamples`/`cityRealtimeWebglExamples`）是 JS 对象字面量（键未加引号/单引号），`JSON.parse` 会失败。→ 上一轮给 `generate-registry.js` 加的 `loadExistingExamples` 用 `JSON.parse` 读旧 registry，若将来扩展到这 6 个源会抛错。修复：改成动态 `import()` 读模块。
- 🟡 **GPU/场景资源泄漏（健壮性最高优先级）**：255 个示例 `onMounted` 挂载资源，仅 220 个有 `onUnmounted`；约 35~100 个缺卸载清理。示例中心靠 `ExampleDemo` 的 `:key` 强制重挂切换，缺清理的示例会泄漏 WebGL context/纹理/几何体。已确认走 `useExampleStage` 的示例安全（其 `dispose()` 完整：renderer.dispose/disposeObject3D/controls.dispose/renderLoop.stop/resizeObserver.disconnect）。裸 canvas 示例（mygrapics、threejs-official webgpu 等）是泄漏源。建议统一收口到 `useExampleStage` 或提供 `useDispose`。
- 🟡 **其他**：`console.log` 出现在 217 个示例文件（建议清理）；registry↔文件一致性 1421 条全部命中（缺失 0，loader 命名约定 OK）；7 个顶层 `*ExampleScene.vue` 是共享场景壳（被其他示例 import），非死代码；`techGroups` 中 `ex.category==='threejsOfficialExamples'` 等精确匹配是死代码（实际 category 嵌套如 `misc/animation`）；`getSubCategoriesByTech` 与画廊 `availableSubCategories` 逻辑重复（DRY）。
