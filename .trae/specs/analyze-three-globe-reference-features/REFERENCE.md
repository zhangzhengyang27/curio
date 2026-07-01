# three-globe 源码参考借鉴清单

> 分析对象：three-globe v2.45.2（/Users/zhangzhengyang/Desktop/Code/数据可视化/data-visualization/three-globe-master）
> 目标项目：earth-app（Vue 3 + Vite + Three.js + Pinia）

## 一、项目整体借鉴

### 1.1 架构模式
| 借鉴项 | 当前项目情况 | 建议 | 优先级 |
|---|---|---|---|
| 图层即独立 Kapsule/Composable | 所有图层逻辑集中在 `EarthCanvas.vue` 一个文件 | 按图层拆分为独立 composables 或类（GlobeLayer、PointsLayer、ArcsLayer、RingsLayer 等），每个图层管理自己的 Three.js Group | 高 |
| 统一容器 + 分层 Group | `scene` 中直接添加 earth、atmosphere、cloudLayer、overlayGroup | 为每个可视化模式创建独立 `THREE.Group`，按图层管理显隐与销毁 | 高 |
| 访问器函数化配置 | 数据字段基本写死（如 `d.lon`、`d.lat`、`d.mag`） | 引入 `accessor-fn` 风格，让图层配置支持字符串字段名或回调函数 | 中 |
| 声明式 props + onChange 触发更新 | `switchVisualization` 中手动销毁再重建 | 为每个图层定义 props，数据变化时内部 diff 并局部更新 | 中 |

### 1.2 关键依赖建议
| 依赖 | 用途 | 是否建议引入 |
|---|---|---|
| `accessor-fn` | 统一字段访问器 | 是（轻量） |
| `d3-geo` | GeoJSON 投影、大圆插值、经纬网格 | 是 |
| `d3-scale` / `d3-scale-chromatic` | 颜色比例尺、Turbo 等色带 | 是 |
| `d3-color` / `d3-interpolate` | 颜色插值、透明度提取 | 是 |
| `h3-js` | H3 六边形网格聚合 | 是（如做 hexbin） |
| `three-geojson-geometry` | GeoJSON 转 Three.js 几何 | 是（替代手写三角化） |
| `three-conic-polygon-geometry` | 球面多边形挤出 | 是 |
| `frame-ticker` | requestAnimationFrame 调度 | 可选（当前用 TWEEN + renderLoop 已足够） |

---

## 二、地球基础层借鉴

| 功能 | three-globe 实现 | 对 earth-app 的价值 | 优先级 | 关键文件参考 |
|---|---|---|---|---|
| 外部纹理加载 | `TextureLoader` 异步加载，`SRGBColorSpace`，旧纹理 `dispose()` | 支持切换真实地球贴图（day/night/bump），保留当前程序化纹理作为 fallback | 高 | `src/layers/globe.js` |
| 凹凸贴图 | `bumpMap` 动态加载/释放 | 让当前“3D 地形”开关从随机噪声升级为真实地形起伏 | 中 | `src/layers/globe.js` |
| 大气辉光 | `GlowMesh`：沿法线外扩 + 自定义 Shader，支持 color/size/coefficient/power | 替换当前简单大气，效果更柔和、可控 | 高 | `src/utils/GlowMesh.js` |
| 经纬网格 | `d3-geo` 的 `geoGraticule10()` + `three-geojson-geometry` | 在工具栏新增“经纬网格”开关，一行代码即可实现 | 低 | `src/layers/globe.js` |
| 瓦片引擎 | `three-slippy-map-globe`，按相机 POV 动态 LOD | 需要真实地图时接入 OSM/Mapbox 瓦片 | 低 | `src/layers/globe.js` |
| 初始化动画 | `animateIn`：scale 从 0→1 + 旋转归位 | 页面加载时增加开场动画 | 中 | `src/globe-kapsule.js` |
| 球体曲率分辨率 | `globeCurvatureResolution` 控制 `SphereGeometry` 分段 | 当前写死 64 段，可配置以平衡性能 | 低 | `src/layers/globe.js` |

---

## 三、数据图层借鉴

### 3.1 点/柱图层（Points Layer）
| 借鉴项 | 当前实现 | 改进建议 | 优先级 |
|---|---|---|---|
| 统一圆柱体对象 | `ScatterPoints.js` 使用 `THREE.Points` | 对于人口/碳排放/GDP/地标等需要高度的场景，改用圆柱体（CylinderGeometry）并沿法线方向放置 | 高 |
| 字段访问器 | 字段写死 | 支持 `pointLat`、`pointLng`、`pointColor`、`pointAltitude`、`pointRadius` 配置化映射 | 中 |
| 几何合并 | 无 | 大量点时开启 `pointsMerge`，合并为单一 Mesh 并使用顶点色，减少 draw call | 高 |
| 过渡动画 | 无 | 数据切换时使用 Tween 从地面生长、缩放半径/高度 | 中 |
| 适用模式 | — | 人口、碳排放、地震、灯光、中国省份、地标、自定义导入 | — |

### 3.2 弧线/流向图层（Arcs Layer）
| 借鉴项 | 当前实现 | 改进建议 | 优先级 |
|---|---|---|---|
| 弧线高度自动缩放 | `FlowLines.js` 使用固定 `arcHeight` | 根据大圆距离自动计算弧线高度（`arcAltitudeAutoScale`），长距离飞得更高 | 高 |
| 线宽模式 | 当前使用 TubeGeometry | 支持三种模式：普通 Line（1px）、TubeGeometry（管状）、FatLine（`three/examples/jsm/lines/Line2`） | 中 |
| 虚线流动动画 | `FlowLines.js` 有简单粒子动画 | 使用 shader uniform `dashTranslate` 实现沿弧线流动的虚线效果 | 高 |
| 渐变色 | 当前为纯色或两端渐变 | 支持颜色数组/插值函数，实现沿弧线颜色渐变 | 中 |
| 适用模式 | — | 贸易、航班 | — |

### 3.3 波纹环图层（Rings Layer）
| 借鉴项 | 当前实现 | 改进建议 | 优先级 |
|---|---|---|---|
| 可重复脉冲环 | `WaveRipple.js` 单次扩散 | 支持 `ringRepeatPeriod` 周期性发射新环，`ringPropagationSpeed` 控制扩散速度 | 高 |
| 颜色渐变插值 | 当前固定颜色 | 支持颜色数组/函数，随半径扩大逐渐变淡 | 中 |
| 自动背面隐藏 | 无 | 结合 `setPointOfView` 的可见性判断，地球背面不渲染 | 中 |
| 适用模式 | — | 疫情、台风/风暴（当前 `createStorm`） | — |

### 3.4 路径线图层（Paths Layer）
| 借鉴项 | 当前实现 | 改进建议 | 优先级 |
|---|---|---|---|
| 多点路径插值 | 无 | 对连续轨迹（飓风路径、迁徙路线）按球面插值，贴合地表 | 中 |
| FatLine 线宽 | 无 | 使用 `Line2` 实现可缩放线宽 | 中 |
| 虚线流动动画 | 无 | 支持路径虚线流动效果 | 中 |
| 适用模式 | — | 可作为新增模式：航线轨迹、飓风路径 | — |

### 3.5 多边形/国家区域图层（Polygons Layer）
| 借鉴项 | 当前实现 | 改进建议 | 优先级 |
|---|---|---|---|
| GeoJSON 球面多边形 | `CountryMesh.js` + `BorderLines.js` 手写三角化 | 使用 `three-conic-polygon-geometry` 或 `three-geojson-geometry` 替代手写三角化，减少 bug | 高 |
| 顶面/侧面分别着色 | 当前单一颜色 | 支持 `polygonCapColor` / `polygonSideColor` 分别配置 | 中 |
| 挤出高度 | 当前 GDP 柱体是单独 BoxGeometry | 可直接对国家 Mesh 设置 `polygonAltitude` 挤出高度 | 中 |
| 边界描边 | 当前 `BorderLines.js` 是 LineLoop | 使用 `polygonStrokeColor` 统一控制描边 | 低 |
| 适用模式 | — | GDP、人口、碳排放、中国省份 | — |

### 3.6 六边形聚合图层（Hex Bin / Hexed Polygons）
| 借鉴项 | 当前实现 | 改进建议 | 优先级 |
|---|---|---|---|
| H3 网格聚合 | 无 | 使用 `h3-js` 将散点聚合为六边形柱体，支持按权重映射高度与颜色 | 中 |
| 区域六边形栅格化 | 无 | 将 GeoJSON 区域按 H3 层级离散化为六边形 | 中 |
| 适用模式 | — | 人口密度、航班起降、疫情分布 | — |

### 3.7 热力图层（Heatmaps Layer）
| 借鉴项 | 当前实现 | 改进建议 | 优先级 |
|---|---|---|---|
| 高斯 KDE | 当前无真正热力图 | 在球面计算高斯核密度，用 Turbo 色带映射密度 | 中 |
| 顶点半径扩展 | 无 | 通过 shader 根据密度值动态拉伸球面顶点高度 | 中 |
| 透明度立方根衰减 | 无 | `c.opacity = Math.cbrt(t)` 让低值区域更柔和 | 低 |
| 适用模式 | — | 疫情、人口密度、夜间灯光 | — |

---

## 四、标签与 HTML 标记借鉴

| 功能 | three-globe 实现 | 对 earth-app 的价值 | 优先级 | 关键文件参考 |
|---|---|---|---|---|
| 3D 文字标签 | `src/layers/labels.js`：使用 Three.js 文字几何 + 字体 JSON | 替换当前单一浮动标签，支持国家名、GDP 值等 3D 标签 | 中 | `src/layers/labels.js` |
| HTML DOM 标记 | `src/layers/htmlElements.js` + `CSS2DRenderer` | 支持复杂 tooltip、卡片、SVG 标记，并自动处理背面隐藏 | 中 | `src/layers/htmlElements.js` |
| 背面消隐 | `setPointOfView` 计算可见锥体 | 标签/标记在地球背面时自动隐藏 | 中 | `src/globe-kapsule.js` |

---

## 五、动画与生命周期借鉴

| 功能 | three-globe 实现 | 对 earth-app 的价值 | 优先级 | 关键文件参考 |
|---|---|---|---|---|
| 统一 TweenGroup | `globe-kapsule` 内部维护 `TweenGroup`，每帧 `update()` | 避免使用全局 `TWEEN`，支持按实例暂停/恢复 | 高 | `src/globe-kapsule.js` |
| 数据驱动更新（ThreeDigest） | `data-bind-mapper` 绑定数据 ↔ Three.js 对象 | 数据变化时只创建/更新/删除差异对象，避免全量重建 | 高 | `src/utils/digest.js` |
| 资源释放 | `gc.js` 递归释放 geometry/material/texture/children | 当前 `disposeGroup` 较简单，应增强对材质数组、纹理 map、bumpMap 的释放 | 高 | `src/utils/gc.js` |
| 图层销毁 | 每个图层提供 `_destructor()` | `switchVisualization` 时按图层销毁，避免内存泄漏 | 高 | `src/layers/*.js` |
| 动画暂停/恢复 | `pauseAnimation()` / `resumeAnimation()` | 页面隐藏或模式切换时暂停 `frame-ticker` 和 Tween | 中 | `src/globe-kapsule.js` |

---

## 六、坐标与工具函数借鉴

| 功能 | three-globe 实现 | 对 earth-app 的价值 | 优先级 | 关键文件参考 |
|---|---|---|---|---|
| 经纬度 ↔ 笛卡尔转换 | `polar2Cartesian(lat, lng, alt)` / `cartesian2Polar({x,y,z})` | 当前 `lon2xyz` 可保留，但建议统一命名并支持 altitude 参数 | 中 | `src/utils/coordTranslate.js` |
| 地球半径常量 | `GLOBE_RADIUS = 100` | 当前写死 `R = 100`，可提取为常量 | 低 | `src/constants.js` |
| 虚线 Shader | `dashedLineShaders()` | 为弧线、路径提供虚线流动效果 | 高 | `src/utils/shaders.js` |
| 半径 Shader 扩展 | `setRadiusShaderExtend` | 热力图、变形效果中按顶点半径拉伸 | 中 | `src/utils/shaders.js` |
| 地下像素剔除 | `invisibleUndergroundShaderExtend` | 多边形挤出时避免侧面穿到地球内部 | 中 | `src/utils/shaders.js` |
| 颜色工具 | `colorStr2Hex`、`colorAlpha`、`color2ShaderArr`、`setMaterialOpacity` | 统一颜色解析、透明度处理、shader 颜色数组 | 中 | `src/utils/color-utils.js` |
| BufferAttribute 工具 | `array2BufferAttr` | 简化 `BufferGeometry` attribute 创建 | 低 | `src/utils/three-utils.js` |
| 圆环几何 | `CircleLineGeometry` | 疫情/地震波纹环可复用 | 中 | `src/utils/CircleLineGeometry.js` |

---

## 七、各可视化模式优先级落地建议

| earth-app 模式 | 高优先级借鉴 | 中优先级借鉴 | 低优先级借鉴 |
|---|---|---|---|
| **GDP** | 多边形顶面/侧面分别着色、数据驱动更新 | 国家挤出高度、3D 标签 | 六边形区域栅格化 |
| **人口** | Points 圆柱体、颜色/高度/半径映射 | 六边形聚合、热力图 | 经纬网格 |
| **碳排放** | Points 圆柱体、多边形着色 | 弧线跨国流动 | 热力图 |
| **贸易** | Arcs 自动高度、虚线流动、渐变色 | 路径线 | 标签 |
| **航班** | Arcs 自动高度、虚线流动 | Rings 机场脉冲、Points 机场 | 六边形聚合 |
| **疫情** | Rings 可重复脉冲环 | 热力图、Points | 六边形聚合 |
| **地震** | Rings 脉冲环、Points 圆柱体 | 颜色/大小映射优化 | — |
| **灯光** | Heatmaps、Points | — | — |
| **中国省份** | Polygons GeoJSON 球面化 | Points 省会标记 | 3D 标签 |
| **地标** | Points 圆柱体、Rings 高亮 | 3D 标签、HTML 标记 | — |
| **自定义导入** | Points 圆柱体、数据驱动更新 | 根据数据类型选择图层 | — |

---

## 八、工程化建议

1. **不要直接把 Three.js 对象放进 Pinia 的 reactive/ref**
   - 使用 `markRaw` 或仅在 store 中保存纯数据配置，Three.js 实例由组件/composable 持有。
2. **按图层拆分 composables**
   - 参考 three-globe 的图层结构，将 `EarthCanvas.vue` 中的图层逻辑逐步拆出。
3. **统一 dispose 规范**
   - 每个图层/composable 提供 `dispose()`，释放 geometry、material、texture、ticker、event listener。
4. **引入 d3 颜色与比例尺**
   - 用 `d3-scale` 和 `d3-scale-chromatic` 替换当前手写的热力颜色计算。
5. **考虑外部 three-* 几何库**
   - `three-geojson-geometry` 和 `three-conic-polygon-geometry` 可显著简化当前国家 Mesh 生成逻辑。
