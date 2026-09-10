/// <reference types="vite/client" />

declare module '*.vue' {
  import type { DefineComponent } from 'vue'
  const component: DefineComponent<{}, {}, any>
  export default component
}

interface ImportMetaEnv {
  /** 百度地图开放平台 AK（浏览器端 / WebGL 版）。仅在构建期注入，不入库。 */
  readonly VITE_BMAP_AK?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
