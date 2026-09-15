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
