import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useInteractionStore = defineStore('interaction', () => {
  const showContextMenu = ref(false)
  const contextMenuPos = ref({ x: 0, y: 0 })
  const contextMenuTarget = ref(null)

  const showInfoPanel = ref(false)
  const infoPanelData = ref(null)

  function openContextMenu(x, y, countryData) {
    contextMenuPos.value = { x, y }
    contextMenuTarget.value = countryData
    showContextMenu.value = true
  }

  function closeContextMenu() {
    showContextMenu.value = false
    contextMenuTarget.value = null
  }

  function openInfoPanel(data) {
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
