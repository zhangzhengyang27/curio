import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useLayerStore = defineStore('layer', () => {
  const layers = ref([
    { id: 'borders', name: '国家边界', visible: true, opacity: 1, children: [] },
    { id: 'countries', name: '国家色块', visible: true, opacity: 1, children: [] }
  ])

  function setLayerChildren(id, children) {
    const layer = layers.value.find(l => l.id === id)
    if (layer) layer.children = children
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
        if (child.material) {
          child.material.opacity = opacity
          child.material.transparent = true
        }
      })
    }
  }

  return { layers, setLayerChildren, setVisible, setOpacity }
})
