import { defineStore } from 'pinia'
import { ref, markRaw } from 'vue'
import type { Mesh, Object3D } from 'three'

export interface LayerNode {
  id: string
  name: string
  visible: boolean
  opacity: number
  children: Object3D[]
}

export const useLayerStore = defineStore('layer', () => {
  const layers = ref<LayerNode[]>([
    { id: 'borders', name: '国家边界', visible: true, opacity: 1, children: [] },
    { id: 'countries', name: '国家色块', visible: true, opacity: 1, children: [] }
  ])

  function setLayerChildren(id: string, children: Object3D[]) {
    const layer = layers.value.find(l => l.id === id)
    // markRaw: Three.js 对象无需 Vue 深度代理，避免代理 geometry/material 的性能开销
    if (layer) layer.children = children.map(c => markRaw(c))
  }

  function setVisible(id: string, visible: boolean) {
    const layer = layers.value.find(l => l.id === id)
    if (layer) {
      layer.visible = visible
      layer.children.forEach(child => { child.visible = visible })
    }
  }

  function setOpacity(id: string, opacity: number) {
    const layer = layers.value.find(l => l.id === id)
    if (layer) {
      layer.opacity = opacity
      layer.children.forEach(child => {
        const mesh = child as Mesh
        // 数组形式的 multi-material 不参与统一透明度调整（与原 `opacity !== undefined` 守卫等价）
        if (mesh.material && !Array.isArray(mesh.material)) {
          mesh.material.opacity = opacity
          mesh.material.transparent = true
        }
      })
    }
  }

  return { layers, setLayerChildren, setVisible, setOpacity }
})
