import { defineStore } from 'pinia'
import { ref, shallowRef } from 'vue'
import type { Object3D } from 'three'

/** 右键菜单 / 信息面板携带的国家数据（地球 Mesh 拾取结果，生产方见 EarthCanvas / ContextMenu） */
export interface CountryPayload {
  name: string
  /** 上下文菜单里是原始数值（参与 /1e12 换算），信息面板里是已格式化的字符串 */
  gdp?: number | string
  lon?: number
  lat?: number
  mesh?: Object3D
  [key: string]: unknown
}

export const useInteractionStore = defineStore('interaction', () => {
  const showContextMenu = ref(false)
  const contextMenuPos = ref({ x: 0, y: 0 })
  // shallowRef：载荷里带着被拾取的国家 Mesh（Object3D）。用普通 ref 会让 Vue
  // 深度代理整棵对象树 —— 本仓对 Three 对象一律 shallowRef/markRaw（见
  // useEarthStore、useLayerStore）。消费方只读平铺字段，不依赖深层响应。
  const contextMenuTarget = shallowRef<CountryPayload | null>(null)

  const showInfoPanel = ref(false)
  const infoPanelData = shallowRef<CountryPayload | null>(null)

  function openContextMenu(x: number, y: number, countryData: CountryPayload) {
    contextMenuPos.value = { x, y }
    contextMenuTarget.value = countryData
    showContextMenu.value = true
  }

  function closeContextMenu() {
    showContextMenu.value = false
    contextMenuTarget.value = null
  }

  function openInfoPanel(data: CountryPayload) {
    infoPanelData.value = data
    showInfoPanel.value = true
  }

  function closeInfoPanel() {
    showInfoPanel.value = false
    infoPanelData.value = null
  }

  return {
    showContextMenu, contextMenuPos, contextMenuTarget,
    showInfoPanel, infoPanelData,
    openContextMenu, closeContextMenu, openInfoPanel, closeInfoPanel
  }
})
