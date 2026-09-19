import { defineStore } from 'pinia'
import { ref, shallowRef } from 'vue'
import type { Group, Object3D } from 'three'

/** searchIndex 的值：国家名 → 经纬度（SearchBox 建议列表与人口/碳排放图层共用） */
export interface CountryCoord {
  lon: number
  lat: number
}

export const useEarthStore = defineStore('earth', () => {
  const earthGroup = shallowRef<Group | null>(null)
  const rotationSpeed = ref(0.001)
  const isRotating = ref(true)

  const meshesByCountry = shallowRef<Record<string, Object3D>>({})
  const selectedCountry = ref<string | null>(null)
  const compareCountries = ref<string[]>([])
  const currentVisualization = ref('gdp')
  const searchIndex = shallowRef<Record<string, CountryCoord>>({})
  // 正在加载数据的可视化模式（key），null = 无加载中。非阻塞提示用，见 EarthCanvas
  const vizLoading = ref<string | null>(null)

  function setEarthGroup(group: Group | null) {
    earthGroup.value = group
  }

  function addLayer(layerGroup: Object3D) {
    earthGroup.value?.add(layerGroup)
  }

  function removeLayer(layerGroup: Object3D) {
    earthGroup.value?.remove(layerGroup)
  }

  function selectCountry(name: string | null) {
    selectedCountry.value = name
  }

  function toggleCompare(name: string) {
    const idx = compareCountries.value.indexOf(name)
    if (idx > -1) {
      compareCountries.value.splice(idx, 1)
    } else {
      compareCountries.value.push(name)
    }
  }

  function setVisualization(mode: string) {
    currentVisualization.value = mode
  }

  function setVizLoading(modeOrNull: string | null) {
    vizLoading.value = modeOrNull
  }

  function setSearchIndex(index: Record<string, CountryCoord>) {
    searchIndex.value = index
  }

  return {
    earthGroup, rotationSpeed, isRotating,
    meshesByCountry, selectedCountry, compareCountries, currentVisualization,
    searchIndex, vizLoading,
    setEarthGroup, addLayer, removeLayer,
    selectCountry, toggleCompare, setVisualization, setVizLoading, setSearchIndex
  }
})
