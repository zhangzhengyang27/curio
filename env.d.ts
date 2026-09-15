/// <reference types="vite/client" />

declare module '*.vue' {
  import type { DefineComponent } from 'vue'
  const component: DefineComponent<{}, {}, any>
  export default component
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
