/**
 * Cesium npm 侧互操作层（shim）。
 *
 * 本仓库的 Cesium 由 src/map/cesiumLoader.js 以动态 <script> 加载（window.Cesium），不经 npm 打包。
 * @cesium-extends/* 通过 peerDependencies `import 'cesium'` 引用引擎，vite.config.js 的
 * cesiumInteropResolver（按 importer 限定 @cesium-extends 范围）把裸导入 'cesium'
 * 重定向到本文件，统一复用全局实例，避免把第二份 Cesium 引擎打进产物。
 *
 * ⚠ 时序约束：本文件在模块求值时读取 window.Cesium。因此依赖 cesium 的库只能在
 * loadCesium() resolve 之后动态 import（禁止静态 import，会被构建提升到加载前）。
 *
 * 具名导出清单 = @cesium-extends/{drawer,subscriber,tooltip} 的 dist 对
 * 'cesium' 的具名导入并集；升级这几个库时需同步增删。
 */
const Cesium = window.Cesium

if (!Cesium) {
  throw new Error('[cesium-interop] window.Cesium 尚未加载：必须先 await loadCesium() 再动态 import 依赖 cesium 的库')
}

export const ArcType = Cesium.ArcType
export const Cartesian2 = Cesium.Cartesian2
export const Cartesian3 = Cesium.Cartesian3
export const CallbackProperty = Cesium.CallbackProperty
export const ClassificationType = Cesium.ClassificationType
export const Color = Cesium.Color
export const Entity = Cesium.Entity
export const JulianDate = Cesium.JulianDate
export const PolygonHierarchy = Cesium.PolygonHierarchy
export const Rectangle = Cesium.Rectangle
export const ScreenSpaceEventHandler = Cesium.ScreenSpaceEventHandler
export const ScreenSpaceEventType = Cesium.ScreenSpaceEventType
export const defined = Cesium.defined

export default Cesium
