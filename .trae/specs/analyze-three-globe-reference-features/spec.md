# three-globe 源码参考借鉴分析 Spec

## Why
当前 earth-app 已具备 GDP、人口、碳排放、贸易、航班、疫情、地震、灯光、中国省份、地标、自定义导入等 3D 地球可视化模式。为了提升图层表现力、动画流畅度与代码可维护性，需要系统分析 three-globe（v2.45.2）源码中可借鉴的功能与需求，形成可直接指导后续迭代的参考清单。

## What Changes
- 不产生代码改动；本 Spec 为纯分析型文档。
- 输出一份结构化参考需求清单，覆盖地球基础层、数据图层、动画与交互、工程组织四个维度。
- 为后续每个可落地功能提供“当前项目是否已有、建议引入程度、关键实现要点”。

## Impact
- Affected specs: 地球可视化各模式（GDP/人口/碳排放/贸易/航班/疫情/地震/灯光/中国/地标/导入）。
- Affected code: `src/three/objects/*`、`src/three/data/DataLoader.js`、`src/components/EarthCanvas.vue`、`src/composables/*`、`src/stores/*`。

## ADDED Requirements

### Requirement: 地球基础层增强
The system SHALL 支持可配置的地球基础渲染能力，参考 three-globe 的 Globe Layer 实现。

#### Scenario: 纹理与地形
- **WHEN** 用户切换可视化模式或手动开启地形时
- **THEN** 地球表面可加载外部 equirectangular 投影纹理（day/night/bump）、支持程序化 bump 贴图、并保留当前程序化纹理作为 fallback

#### Scenario: 大气与经纬网格
- **WHEN** 地球初始化或用户通过工具栏切换时
- **THEN** 可独立控制大气光晕（颜色、高度）、经纬网格（graticules）显隐，且大气光晕始终面向相机

#### Scenario: 地球初始化动画
- **WHEN** 页面首次加载地球时
- **THEN** 支持 `animateIn` 配置：地球从 scale≈0 放大到 1，并伴随自转归位动画

### Requirement: 数据图层通用化
The system SHALL 将现有各模式封装为可复用的数据图层，统一数据接入、更新与销毁逻辑。

#### Scenario: 点/柱图层（Points Layer）
- **WHEN** 用户切换到人口、地震、灯光、中国省份、地标或自定义导入模式时
- **THEN** 使用统一的点/柱图层，支持按字段映射颜色、高度、半径，支持 `merge` 模式提升性能，并支持过渡动画

#### Scenario: 弧线/流向图层（Arcs Layer）
- **WHEN** 用户切换到贸易或航班模式时
- **THEN** 弧线支持高度自动按大圆距离缩放、支持 Tube/FatLine/普通 Line 三种线宽模式、支持虚线流动动画、支持渐变色

#### Scenario: 波纹环图层（Rings Layer）
- **WHEN** 用户切换到疫情模式或触发台风/疫情扩散时
- **THEN** 使用可重复的波纹环，支持半径、传播速度、重复周期、颜色渐变插值，并自动在地球背面隐藏

#### Scenario: 路径线图层（Paths Layer）
- **WHEN** 需要展示航线、飓风路径、迁徙路线等连续轨迹时
- **THEN** 支持多点路径插值贴合球面、支持 FatLine 线宽、支持虚线流动动画

#### Scenario: 多边形/国家区域图层（Polygons Layer）
- **WHEN** 用户切换到 GDP、人口、碳排放等国家着色模式时
- **THEN** 支持按 GeoJSON 生成球面多边形、支持顶部/侧面分别着色、支持挤出高度（altitude）、支持边界描边

#### Scenario: 六边形聚合图层（Hex Bin Layer）
- **WHEN** 需要展示高密度点聚合（如全球航班起降、人口聚集）时
- **THEN** 使用 H3 索引进行六边形聚合，支持按权重映射高度与颜色

#### Scenario: 热力图层（Heatmaps Layer）
- **WHEN** 需要展示连续密度分布（如疫情扩散、人口密度）时
- **THEN** 基于高斯 KDE 在球面计算密度，支持 Turbo 等色带、透明度立方根衰减、基准/顶部高度映射

### Requirement: 标签与 HTML 标记
The system SHALL 支持将球面坐标映射为屏幕标签或自定义 HTML 标记。

#### Scenario: 3D 标签（Labels Layer）
- **WHEN** 用户点击国家或 hover 地标时
- **THEN** 在对应位置显示可配置的 3D 文字标签，支持颜色、大小、方向、是否带点

#### Scenario: HTML 标记（HTML Elements Layer）
- **WHEN** 需要显示复杂 UI（如 tooltip、卡片）时
- **THEN** 将 DOM 元素固定到球面坐标，并自动处理背面隐藏与遮挡

### Requirement: 动画与渲染机制
The system SHALL 参考 three-globe 的动画系统，统一 Tween、FrameTicker 与生命周期管理。

#### Scenario: 统一 Tween 组
- **WHEN** 任何图层需要过渡动画时
- **THEN** 使用共享的 TweenGroup 管理，避免与全局 TWEEN 冲突，支持暂停/恢复

#### Scenario: 数据驱动更新（ThreeDigest）
- **WHEN** 数据变化时
- **THEN** 通过数据绑定映射（data → three object）实现创建、更新、删除，避免全量重建

#### Scenario: 图层销毁与内存回收
- **WHEN** 切换可视化模式或离开页面时
- **THEN** 每个图层提供 `_destructor`，释放 geometry、material、texture、ticker，防止内存泄漏

### Requirement: 坐标与工具函数
The system SHALL 复用或参考 three-globe 的坐标转换与工具函数。

#### Scenario: 球面坐标转换
- **WHEN** 需要经纬度与笛卡尔坐标互转时
- **THEN** 提供 `polar2Cartesian` / `cartesian2Polar`，并支持获取地球半径

#### Scenario: 可见性判断
- **WHEN** 标签、HTML 标记、点需要避免在地球背面渲染时
- **THEN** 基于相机位置计算“是否在地球可见锥体内”，并动态显隐

## MODIFIED Requirements
无。本 Spec 为分析型文档，不修改现有需求。

## REMOVED Requirements
无。
