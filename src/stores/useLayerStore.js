import { defineStore } from 'pinia'
import { ref, markRaw } from 'vue'

export const useLayerStore = defineStore('layer', () => {
  const layers = ref([
    { id: 'borders', name: '国家边界', visible: true, opacity: 1, children: [] },
    { id: 'countries', name: '国家色块', visible: true, opacity: 1, children: [] }
  ])

  function setLayerChildren(id, children) {
    const layer = layers.value.find(l => l.id === id)
    // markRaw: Three.js 对象无需 Vue 深度代理，避免代理 geometry/material 的性能开销
    if (layer) layer.children = children.map(c => markRaw(c))
  }

  function setVisible(id, visible) {
    const layer = layers.value.find(l => l.id === id)
    if (layer) {
      layer.visible = visible
      layer.children.forEach(child => { child.visible = visible })
    }
  }

  function setOpacity(id, opacity) {
    const layer = layers.value.find(l => l.id === id)
    if (layer) {
      layer.opacity = opacity
      layer.children.forEach(child => {
        if (child.material && child.material.opacity !== undefined) {
          child.material.opacity = opacity
          child.material.transparent = true
        }
      })
    }
  }

  return { layers, setLayerChildren, setVisible, setOpacity }
})
