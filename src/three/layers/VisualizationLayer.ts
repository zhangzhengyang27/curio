import * as THREE from 'three'
import { LayerManager } from './LayerManager'
import type { BaseLayer } from './BaseLayer'
import type { EarthGroupWithMeshes } from './BaseLayer'
import type { CountryGdpMesh } from './BaseLayer'
import type { GdpColorEntry } from '../data/DataLoader'
import {
  loadPopulationData,
  loadCarbonData,
  loadTradeFlows,
  loadFlightsData,
  loadEarthquakeData,
  loadNightLightsData
} from '../data/DataLoader'
import { PopulationLayer } from './PopulationLayer'
import { CarbonLayer } from './CarbonLayer'
import { TradeLayer } from './TradeLayer'
import { FlightsLayer } from './FlightsLayer'
import { EarthquakeLayer } from './EarthquakeLayer'
import { NightLightsLayer } from './NightLightsLayer'
import { ChinaLayer } from './ChinaLayer'
import { LandmarksLayer } from './LandmarksLayer'
import { CustomScatterLayer } from './CustomScatterLayer'
import { HeatmapLayer } from './HeatmapLayer'
import type { Group as TweenGroup } from '@tweenjs/tween.js'
import type { useEarthStore } from '../../stores/useEarthStore'

type EarthStore = ReturnType<typeof useEarthStore>

export interface VisualizationLayerParams {
  scene: THREE.Scene
  earthGroup?: EarthGroupWithMeshes | null
  R: number
  /** 图层挂载节点 */
  parent?: THREE.Object3D | null
  /** (lon, lat) => void，ChinaLayer 飞行用 */
  flyToFn?: (lon: number, lat: number) => void
  originalGdpColors?: Record<string, GdpColorEntry>
  earthStore?: EarthStore | null
  /** 共享 Tween 组 */
  tweenGroup?: TweenGroup | null
}

/**
 * 可视化图层复合控制器
 * 持有 LayerManager，负责 GDP/默认模式的颜色恢复、图层注册与切换
 */
export class VisualizationLayer {
  scene: THREE.Scene
  earthGroup?: EarthGroupWithMeshes | null
  R: number
  parent?: THREE.Object3D | null
  flyToFn?: (lon: number, lat: number) => void
  originalGdpColors: Record<string, GdpColorEntry>
  earthStore?: EarthStore | null
  tweenGroup?: TweenGroup | null

  layerManager: LayerManager
  private _switchSeq = 0 // 竞态防护序列号

  constructor(params: VisualizationLayerParams) {
    const { scene, earthGroup, R, parent, flyToFn, originalGdpColors, earthStore, tweenGroup } = params
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

  _registerLayers(): void {
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
   * @param mode
   * @param data - 可选的外部数据，未提供时自动加载
   */
  async switchVisualization(mode: string, data?: any): Promise<BaseLayer | null> {
    // 每次调用递增序列号，await 后校验是否仍为最新调用，防止快速切换乱序
    const seq = ++this._switchSeq

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

    // 数据加载期间用户可能已切换到其他模式，丢弃过期结果
    if (seq !== this._switchSeq) return null

    const options = mode === 'china' ? { flyTo: this.flyToFn } : {}
    return this.layerManager.switch(mode, layerData, options)
  }

  /**
   * 清除所有可视化叠加图层
   */
  clearOverlays(): void {
    this.layerManager.destroyAll()
  }

  /**
   * 每帧更新所有活动图层的动画
   * @param time
   */
  update(time: number): void {
    this.layerManager.layers.forEach(layer => {
      if (typeof layer.updateAnimation === 'function') {
        layer.updateAnimation(time)
      }
    })
  }

  /**
   * 销毁所有图层并释放资源
   */
  dispose(): void {
    this.layerManager.dispose()
  }

  async _loadData(mode: string): Promise<any> {
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

  _restoreGdpColors(): void {
    this.earthGroup?.meshArr?.forEach((mesh: CountryGdpMesh) => {
      const orig = this.originalGdpColors[mesh.name]
      if (orig) {
        mesh.material.color.copy(orig.color)
        mesh.color = orig.color.clone()
        mesh.gdp = orig.gdp
      }
    })
  }

  _setDefaultColors(): void {
    this.earthGroup?.meshArr?.forEach((mesh: CountryGdpMesh) => {
      mesh.material.color.set(0xffffff)
      mesh.color = new THREE.Color(0xffffff)
    })
  }
}
