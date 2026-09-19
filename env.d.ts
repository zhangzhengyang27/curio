/// <reference types="vite/client" />

declare module '*.vue' {
  import type { DefineComponent } from 'vue'
  const component: DefineComponent<{}, {}, any>
  export default component
}

/** coordtransform（CJS、无官方类型）：BD-09/GCJ-02/WGS-84 互转，入参出参均为 [lon, lat] */
declare module 'coordtransform' {
  export function wgs84togcj02(lon: number, lat: number): [number, number]
  export function gcj02towgs84(lon: number, lat: number): [number, number]
  export function wgs84tobd09(lon: number, lat: number): [number, number]
  export function bd09towgs84(lon: number, lat: number): [number, number]
  export function gcj02tobd09(lon: number, lat: number): [number, number]
  export function bd09togcj02(lon: number, lat: number): [number, number]
  const coordtransform: {
    wgs84togcj02: typeof wgs84togcj02
    gcj02towgs84: typeof gcj02towgs84
    wgs84tobd09: typeof wgs84tobd09
    bd09towgs84: typeof bd09towgs84
    gcj02tobd09: typeof gcj02tobd09
    bd09togcj02: typeof bd09togcj02
  }
  export default coordtransform
}

interface ImportMetaEnv {
  /** 百度地图开放平台 AK（浏览器端 / WebGL 版）。仅在构建期注入，不入库。 */
  readonly VITE_BMAP_AK?: string
  /** 天地图访问令牌（逗号分隔多 key 轮询）。仅在构建期注入，不入库。 */
  readonly VITE_TDT_TOKEN?: string
  /** 高德开放平台 Web 服务 key（地名搜索兜底通道 M1）。仅在构建期注入，不入库。 */
  readonly VITE_AMAP_KEY?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

/** 预编译版 Cesium 由 src/map/cesiumLoader.ts 动态挂载（npm 侧经 cesium-interop shim 引用），引擎无类型 */
interface Window {
  Cesium?: any
  iChannel0?: any
  iChannel1?: any
  iChannel2?: any
  iChannel3?: any
  /** AnalysisView ?debug=1 时暴露的渲染器调试钩子 */
  __tvMapDebug?: any
}

/** @turf v6 无自带类型：仅声明本仓用到的两个入口 */
declare module '@turf/area' {
  const area: (polygon: any) => number
  export default area
}

declare module '@turf/helpers' {
  export function polygon(coordinates: any, properties?: any, options?: any): any
}

/** lil-gui 内部入口（由 vite 别名重定向到真实路径），仅本仓 GUI 包装层使用 */
declare module 'lil-gui/original-internal' {
  export class GUI {
    constructor(options?: Record<string, any>)
    destroy(): void
    [key: string]: any
  }
}

/**
 * jsm-compat 排除区（docs/TS_MIGRATION.md §1.2）的 vendored .js 库无类型:
 * 按「外部代码」语义整体声明为 any,不逐文件类型化
 */
declare module '@/examples/jsm-compat/*'

declare module '@mkkellogg/gaussian-splats-3d'
declare module '@/examples/jsm-compat/*'

/**
 * graphics 系 demo 转换遗留的原 HTML 全局变量(原页面由 CDN <script> 注入,
 * 本仓无对应依赖 —— 使用到这些名字的代码路径与迁移前一致为运行时坏死,
 * 按 parity 声明以通过类型检查;修复需接入对应依赖,超出迁移范围)
 */
declare const spritejs: any
declare const qcharts: any
declare const topojson: any
declare const Canvas2Video: any
declare const glMatrix: any
declare const mat4: any
declare const vec3: any
declare const mat2: any
declare const mat3: any
declare const vec2: any
declare const vec4: any
declare const iChannel0: any
declare const iChannel1: any
declare const iChannel2: any
declare const iChannel3: any
