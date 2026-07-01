import * as THREE from 'three'
import { LayerManager } from './LayerManager.js'
import {
  loadPopulationData,
  loadCarbonData,
  loadTradeFlows,
  loadFlightsData,
  loadEarthquakeData,
  loadNightLightsData
} from '../data/DataLoader.js'
import { PopulationLayer } from './PopulationLayer.js'
import { CarbonLayer } from './CarbonLayer.js'
import { TradeLayer } from './TradeLayer.js'
import { FlightsLayer } from './FlightsLayer.js'
import { EarthquakeLayer } from './EarthquakeLayer.js'
import { NightLightsLayer } from './NightLightsLayer.js'
import { ChinaLayer } from './ChinaLayer.js'
import { LandmarksLayer } from './LandmarksLayer.js'
import { CustomScatterLayer } from './CustomScatterLayer.js'
import { HeatmapLayer } from './HeatmapLayer.js'

/**
 * 可视化图层复合控制器
 * 持有 LayerManager，负责 GDP/默认模式的颜色恢复、图层注册与切换
 */
export class VisualizationLayer {
  /**
   * @param {object} params
   * @param {THREE.Scene} params.scene
   * @param {THREE.Group} params.earthGroup
   * @param {number} params.R
   * @param {THREE.Object3D} params.parent - 图层挂载节点
   * @param {function} [params.flyToFn]
   * @param {object} [params.originalGdpColors]
   * @param {object} [params.earthStore]
   * @param {TWEEN.Group} [params.tweenGroup] - 共享 Tween 组
   */
  constructor({ scene, earthGroup, R, parent, flyToFn, originalGdpColors, earthStore, tweenGroup } = {}) {
    this.scene = scene
    this.earthGroup = earthGroup
    this.R = R
    this.parent = parent
    this.flyToFn = flyToFn
    this.originalGdpColors = originalGdpColors || {}
    this.earthStore = earthStore
    this.tweenGroup = tweenGroup

    this.layerManager = new LayerManager({ scene, earthGroup, R, parent, tweenGroup })
    this._registerLayers()
  }

  _registerLayers() {
    this.layerManager
      .register('population', PopulationLayer, 'visualization')
      .register('carbon', CarbonLayer, 'visualization')
      .register('trade', TradeLayer, 'visualization')
      .register('flights', FlightsLayer, 'visualization')
      .register('earthquake', EarthquakeLayer, 'visualization')
      .register('nightlights', NightLightsLayer, 'visualization')
      .register('china', ChinaLayer, 'visualization')
      .register('landmarks', LandmarksLayer, 'visualization')
      .register('import', CustomScatterLayer, 'visualization')
      .register('heatmap', HeatmapLayer, 'visualization')
  }

  /**
   * 切换到指定可视化模式
   * @param {string} mode
   * @param {*} [data] - 可选的外部数据，未提供时自动加载
   * @returns {Promise<BaseLayer|null>}
   */
  async switchVisualization(mode, data) {
    if (mode === 'gdp') {
      this.clearOverlays()
      this._restoreGdpColors()
      this.earthStore?.setVisualization('gdp')
      return null
    }

    if (mode === 'default') {
      this.clearOverlays()
      this._setDefaultColors()
      this.earthStore?.setVisualization('default')
      return null
    }

    this.earthStore?.setVisualization(mode)
    const layerData = data !== undefined ? data : await this._loadData(mode)
    const options = mode === 'china' ? { flyTo: this.flyToFn } : {}
    return this.layerManager.switch(mode, layerData, options)
  }

  /**
   * 清除所有可视化叠加图层
   */
  clearOverlays() {
    this.layerManager.destroyAll()
  }

  /**
   * 每帧更新所有活动图层的动画
   * @param {number} time
   */
  update(time) {
    this.layerManager.layers.forEach(layer => {
      if (typeof layer.updateAnimation === 'function') {
        layer.updateAnimation(time)
      }
    })
  }

  /**
   * 销毁所有图层并释放资源
   */
  dispose() {
    this.layerManager.dispose()
  }

  async _loadData(mode) {
    switch (mode) {
      case 'population': return loadPopulationData()
      case 'carbon': return loadCarbonData()
      case 'trade': return loadTradeFlows()
      case 'flights': return loadFlightsData()
      case 'earthquake': return loadEarthquakeData()
      case 'nightlights': return loadNightLightsData()
      case 'china': return fetch('/data/mock/china-provinces.json').then(r => r.json())
      case 'landmarks': return null
      case 'import': return null
      case 'heatmap': return fetch('/data/mock/heatmap-points.json').then(r => r.json())
      default: return null
    }
  }

  _restoreGdpColors() {
    this.earthGroup?.meshArr?.forEach(mesh => {
      const orig = this.originalGdpColors[mesh.name]
      if (orig) {
        mesh.material.color.copy(orig.color)
        mesh.color = orig.color.clone()
        mesh.gdp = orig.gdp
      }
    })
  }

  _setDefaultColors() {
    this.earthGroup?.meshArr?.forEach(mesh => {
      mesh.material.color.set(0xffffff)
      mesh.color = new THREE.Color(0xffffff)
    })
  }
}
