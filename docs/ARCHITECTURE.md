# 架构说明

## 1. 总体形态

项目由两条相互独立、仅共享顶栏导航的主线组成：

| 主线 | 入口 | 目标 |
|---|---|---|
| 首页地球应用 | `/`（`src/views/EarthView.vue`） | 用 3D 地球承载多类数据可视化图层 |
| 示例中心 | `/examples`（`src/examples/`） | 浏览 / 运行 / 查看 1417 条示例源码 |

技术栈：Vue 3.5（`<script setup>`）· Vite 8 · Three.js 0.185（+ r186dev 本地兼容层）·
Cesium 1.142 · Pinia 3 · vue-router（全部路由懒加载）。

路由表见 `src/router/index.js`：`/`、`/three-globe`、`/three-globe/:example`、
`/examples`、`/examples/:source/:pathMatch(.*)*`、`/bmap`。

---

## 2. 首页地球应用

```
EarthView.vue
├── EarthCanvas.vue          # 3D 画布宿主（大组件，渲染 + 拾取 + 相机）
│   ├── src/three/objects/   # EarthSphere / AtmosphereGlow / TileEngine / CloudLayer / …
│   └── src/three/layers/    # 17 个可视化图层（人口/GDP/航线/地震/疫情/灯光/贸易…）
├── src/composables/         # useScene / useRenderLoop / useOrbitControls / useRaycaster / …
├── src/stores/              # Pinia：useEarthStore / useLayerStore / useTimelineStore / …
└── 面板组件                 # LayerPanel / InfoPanel / Toolbar / TimelineSlider / LegendBar / …
```

关键设计：

- **渲染循环与场景**统一由 `src/composables/useScene.js` 管理；它按容器尺寸初始化渲染器
  并把 `devicePixelRatio` 限制在 2 以内，同时处理 `webglcontextlost` / `webglcontextrestored`。
- **图层切换的竞态**由 `src/three/layers/VisualizationLayer.js` 的递增序列号防护：
  每次切换自增 `_switchSeq`，异步数据返回后校验序列号，过期结果直接丢弃。
- **数据加载**集中在 `src/three/data/DataLoader.js`，颜色映射在 `src/three/utils/colorScale.js`。

---

## 3. 示例中心（核心机制）

### 3.1 注册表聚合与懒加载

```
src/examples/registry/
├── index.js                       # 聚合入口，按 source 懒加载
├── threejsOfficialExamples.js     # 587 条
├── threeCesiumExamples.js         # 266 条
├── webglExamples.js               # 134 条
├── graphicsExamples.js            # 109 条
├── threeProjectExamples.js        # 108 条
├── mygrapicsExamples.js           #  97 条
├── cesiumExamples.js              #  78 条
├── threejsLesson.js               #  29 条
├── earthLessons.js                #   6 条
├── cityRealtimeWebglExamples.js   #   2 条
└── granary3dExamples.js           #   1 条
```

- 每条示例的结构：`{ source, category, id, title, description, tags, thumbnail, runner, entry }`。
- 聚合入口按 source 动态 `import()`，避免首屏加载全部注册表。
- **重要**：`getAllExamples()` 是同步读取缓存的版本，**必须先 `await loadAllRegistries()` /
  `getAllExamplesAsync()`**，否则返回空数组。脚本里误用会导致「校验静默通过」的假阳性
  （曾真实发生，见 `docs/KNOWN_PITFALLS.md`）。

### 3.2 组件解析约定（无类型保护，靠约定 + CI 校验）

`src/examples/components/index.js` 用 `import.meta.glob('./**/*.vue')` 建立映射，按顺序尝试：

```
./{source}/{category}/{PascalCase(id)}Example.vue
./{source}/{category}/{id}.vue
./{source}/{category}/{id}/index.vue
```

例如 `source=threejs-official, category=css2d, id=css2d_label`
→ `threejs-official/css2d/Css2dLabelExample.vue`。

约定失配不会有任何构建报错，用户侧表现是「未找到 Vue 组件」。
因此 **`scripts/verify-registry.mjs` 会逐条校验组件文件是否存在，并在 CI 中强制通过**。

### 3.3 画廊与详情页

```
/examples              → ExampleGallery.vue
  · 技术栈 tab / 子分类侧栏 / 搜索 / 分页
  · 筛选状态（tech / sub / keyword / page）双向同步到 URL（可刷新、可分享、可前进后退）
  · src/examples/composables/useExampleFilters.js 负责 techGroups 与 subCategoryDefinitions 归类

/examples/:source/...  → ExampleDemo.vue
  · 按 runner 选择渲染方式：vue → ExampleHost 动态组件；iframe → IframeRunner
  · 「查看代码」：loadExampleSource() 用 ?raw 懒加载源码，连带展示引用的 ExampleScene 共享壳
  · 顶部浮动卡片（返回 / 标题 / 标签 / 查看代码）Teleport 到 body，避开示例内部的层叠上下文
```

### 3.4 资源清理（防止 WebGL 上下文与 GUI 面板泄漏）

示例是 1429 个互相独立、质量参差的组件，无法逐个整改，因此采用**框架级安全网**：

| 机制 | 位置 | 作用 |
|---|---|---|
| WebGL 上下文释放 | `ExampleHost.vue` | 卸载时对宿主子树（含 teleport 到 body 的 canvas）调用 `WEBGL_lose_context` |
| lil-gui 实例追踪 | `src/examples/utils/guiTracker.js` + `lil-gui-tracked.js` | 通过 vite alias 包装 `GUI` 构造，卸载时统一 `destroy()` |
| GUI 面板 DOM 清底 | `ExampleHost.vue` 的 `disposeGUI()` | 清理挂在 `document.body` 上的 `.lil-gui` 容器 |
| 各技术栈 stage | `src/examples/composables/use*ExampleStage.js` | 新写的示例建议走这套统一生命周期（收口方向） |

### 3.5 封面截图流水线

- `scripts/screenshot-examples.mjs`：Playwright + 系统 Chrome + swiftshader 软渲染，
  用 CDP `Page.captureScreenshot` 绕过 rAF 动画导致的稳定等待超时。
- 截图前注入 CSS 隐藏 `.app-nav` / `.top-bar`，并只截 `.demo-body`，保证封面只含渲染区。
- 产物落在 `public/example-thumbs/{source}/{category}/{id}.jpg`，
  清单记录在 `scripts/_thumb_map.json`，回填脚本为 `scripts/patch-registry-thumbs.mjs`。
- 完整性由 `scripts/verify-thumbnails.mjs` 在 CI 中校验。

---

## 4. three.js 兼容层

```
vite.config.js  → threeCompatResolver：three / three/webgpu / three/tsl
                  ↳ src/examples/three-build-compat/*（上游 r186dev 预发布 build）
支持本地 addons → src/examples/jsm-compat/（three/examples/jsm 的本地副本）
```

- 该兼容层是**临时技术债**，基线与退出条件见 [`THREE_UPGRADE.md`](THREE_UPGRADE.md)。
- `scripts/verify-three-compat.mjs` + `compat-manifest.json` 在 CI 中防止静默漂移。

## 5. 构建与分包

`vite.config.js` 用 **`codeSplitting.groups`** 按体积大的三方库分包
（`vendor-three` / `vendor-cesium` / `vendor-echarts` / `vendor-d3` / `vendor-postprocessing` …），
并启用 gzip + brotli 压缩。三条维护约定：

1. **不要用 `manualChunks`** —— Vite 8 的打包内核是 Rolldown，该选项已废弃且会**静默失效**
   （只有部分规则生效，且 three.js 被重复打包进其它 vendor 块）。
2. **给 three.js 最高 `priority`（100）**，其余 80 / 90。group 的
   `includeDependenciesRecursively` 默认为 `true`，高优先级组先捕获才能避免
   核心库被 `3d-tiles-renderer` / `postprocessing` 这类依赖吞走。
3. **新增分组前，先确认该库是否真的出现在首页 / 常用页的依赖图里** ——
   分组会把库变成**共享 chunk**，可能被提升进 `modulepreload`。
   曾因此让首页预载一个它根本不用的 1.7 MB 高斯泼溅库。

正则里用 `[\\/]` 匹配路径分隔符（Windows 兼容）。机制细节与实测数据见
[`KNOWN_PITFALLS.md` C6](KNOWN_PITFALLS.md) 与 [`PERF_BASELINE.md`](PERF_BASELINE.md)。

## 6. 质量阀门

见根 `README.md` 的「质量阀门」一节。核心是 `npm run verify` + `npm run test:e2e`，
两者都在 CI 中强制执行。
