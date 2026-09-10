import { defineStore } from 'pinia'
import { ref, shallowRef } from 'vue'

export const useEarthStore = defineStore('earth', () => {
  const earthGroup = shallowRef(null)
  const rotationSpeed = ref(0.001)
  const isRotating = ref(true)

  const meshesByCountry = shallowRef({})
  const selectedCountry = ref(null)
  const compareCountries = ref([])
  const currentVisualization = ref('gdp')
  const searchIndex = shallowRef({})

  function setEarthGroup(group) {
    earthGroup.value = group
  }

  function addLayer(layerGroup) {
    earthGroup.value?.add(layerGroup)
  }

  function removeLayer(layerGroup) {
    earthGroup.value?.remove(layerGroup)
  }

  function selectCountry(name) {
    selectedCountry.value = name
  }

  function toggleCompare(name) {
    const idx = compareCountries.value.indexOf(name)
    if (idx > -1) {
      compareCountries.value.splice(idx, 1)
    } else {
      compareCountries.value.push(name)
    }
  }

  function setVisualization(mode) {
    currentVisualization.value = mode
  }

  function setSearchIndex(index) {
    searchIndex.value = index
  }

  return {
    earthGroup, rotationSpeed, isRotating,
    meshesByCountry, selectedCountry, compareCountries, currentVisualization,
    searchIndex,
    setEarthGroup, addLayer, removeLayer,
    selectCountry, toggleCompare, setVisualization, setSearchIndex
  }
})
