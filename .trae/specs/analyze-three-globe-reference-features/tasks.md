# Tasks

- [x] Task 1: 梳理 three-globe 整体架构
  - [x] SubTask 1.1: 阅读 `src/index.js`、`src/three-globe.js`、`src/globe-kapsule.js`，理解 Kapsule 组合式封装与图层注册机制
  - [x] SubTask 1.2: 阅读 `package.json`，记录关键依赖（d3-*、h3-js、three-*）及其用途
  - [x] SubTask 1.3: 阅读 `example/` 目录，列出所有示例对应的功能场景

- [x] Task 2: 分析地球基础层（Globe Layer）
  - [x] SubTask 2.1: 阅读 `src/layers/globe.js`，整理纹理加载、bump 贴图、大气光晕、经纬网格、瓦片引擎的实现方式
  - [x] SubTask 2.2: 对比当前 `EarthSphere.js` 与 `useScene.js`，列出可借鉴项（初始化动画、大气、网格）

- [x] Task 3: 分析数据图层实现
  - [x] SubTask 3.1: 阅读 `src/layers/points.js`，整理点/柱图的数据映射、merge 优化、过渡动画
  - [x] SubTask 3.2: 阅读 `src/layers/arcs.js`，整理弧线高度、线宽、虚线流动、渐变色实现
  - [x] SubTask 3.3: 阅读 `src/layers/rings.js`，整理波纹环的传播、重复、颜色插值
  - [x] SubTask 3.4: 阅读 `src/layers/paths.js`，整理多点路径插值、FatLine、虚线动画
  - [x] SubTask 3.5: 阅读 `src/layers/polygons.js` / `hexedPolygons.js`，整理 GeoJSON 球面多边形与六边形聚合
  - [x] SubTask 3.6: 阅读 `src/layers/heatmaps.js`，整理高斯 KDE、色带、高度映射

- [x] Task 4: 分析动画、工具函数与生命周期
  - [x] SubTask 4.1: 阅读 `src/utils/digest.js`、`src/utils/gc.js`、`src/utils/coordTranslate.js`，理解数据绑定、销毁、坐标转换
  - [x] SubTask 4.2: 阅读 `src/utils/shaders.js`、`src/utils/color-utils.js`、`src/utils/three-utils.js`，整理颜色、Shader、BufferAttribute 工具
  - [x] SubTask 4.3: 阅读 `src/utils/GlowMesh.js`、`src/utils/CircleLineGeometry.js`，记录大气光晕与圆环几何的实现

- [x] Task 5: 形成参考借鉴清单
  - [x] SubTask 5.1: 将分析结果映射到 earth-app 当前各可视化模式
  - [x] SubTask 5.2: 按“高/中/低”优先级标注每项建议的引入程度
  - [x] SubTask 5.3: 输出结构化 Markdown 参考清单，补充到本 Spec 的 `REFERENCE.md`

# Task Dependencies
- Task 2 依赖 Task 1
- Task 3 依赖 Task 1
- Task 4 依赖 Task 1
- Task 5 依赖 Task 2、Task 3、Task 4
