/**
 * Cesium 热力图辅助库
 * 原文件来自 three-cesium-examples 中的 heatMap.js / 3DheatMap.js
 * 改造点：所有依赖 Cesium 的 API 均通过参数传入，避免在模块顶层 import cesium（由 CesiumExampleScene 动态加载）
 */

/* ------------------------------ 通用 heatmap.js 核心（不依赖 Cesium） ------------------------------ */
const HeatmapConfig = {
  defaultRadius: 40,
  defaultRenderer: 'canvas2d',
  defaultGradient: {
    0.25: 'rgb(0,0,255)',
    0.55: 'rgb(0,255,0)',
    0.85: 'yellow',
    1.0: 'rgb(255,0,0)'
  },
  defaultMaxOpacity: 1,
  defaultMinOpacity: 0,
  defaultBlur: 0.85,
  defaultXField: 'x',
  defaultYField: 'y',
  defaultValueField: 'value',
  plugins: {} as Record<string, any>
}

const Store = (function StoreClosure() {
  const Store = function Store(this: any, config: any) {
    this._coordinator = {}
    this._data = []
    this._radi = []
    this._min = 0
    this._max = 1
    this._xField = config['xField'] || config.defaultXField
    this._yField = config['yField'] || config.defaultYField
    this._valueField = config['valueField'] || config.defaultValueField
    if (config['radius']) this._cfgRadius = config['radius']
  }

  const defaultRadius = HeatmapConfig.defaultRadius

  Store.prototype = {
    _organiseData(dataPoint: any, forceRender: any) {
      const x = dataPoint[this._xField]
      const y = dataPoint[this._yField]
      const radi = this._radi
      const store = this._data
      let max = this._max
      const min = this._min
      const value = dataPoint[this._valueField] || 1
      const radius = dataPoint.radius || this._cfgRadius || defaultRadius

      if (!store[x]) {
        store[x] = []
        radi[x] = []
      }
      if (!store[x][y]) {
        store[x][y] = value
        radi[x][y] = radius
      } else {
        store[x][y] += value
      }
      if (store[x][y] > max) {
        if (!forceRender) {
          this._max = store[x][y]
        } else {
          this.setDataMax(store[x][y])
        }
        return false
      }
      return { x, y, value, radius, min, max }
    },
    _unOrganizeData() {
      const unorganizedData: any[] = []
      const data = this._data
      const radi = this._radi
      for (const x in data) {
        for (const y in data[x]) {
          unorganizedData.push({ x, y, radius: radi[x][y], value: data[x][y] })
        }
      }
      return { min: this._min, max: this._max, data: unorganizedData }
    },
    _onExtremaChange() {
      this._coordinator.emit('extremachange', { min: this._min, max: this._max })
    },
    addData() {
      if (arguments[0].length > 0) {
        const dataArr = arguments[0]
        let dataLen = dataArr.length
        while (dataLen--) {
          this.addData.call(this, dataArr[dataLen])
        }
      } else {
        const organisedEntry = this._organiseData(arguments[0], true)
        if (organisedEntry) {
          this._coordinator.emit('renderpartial', { min: this._min, max: this._max, data: [organisedEntry] })
        }
      }
      return this
    },
    setData(data: any) {
      const dataPoints = data.data
      const pointsLen = dataPoints.length
      this._data = []
      this._radi = []
      for (let i = 0; i < pointsLen; i++) {
        this._organiseData(dataPoints[i], false)
      }
      this._max = data.max
      this._min = data.min || 0
      this._onExtremaChange()
      this._coordinator.emit('renderall', this._getInternalData())
      return this
    },
    removeData() {},
    setDataMax(max: any) {
      this._max = max
      this._onExtremaChange()
      this._coordinator.emit('renderall', this._getInternalData())
      return this
    },
    setDataMin(min: any) {
      this._min = min
      this._onExtremaChange()
      this._coordinator.emit('renderall', this._getInternalData())
      return this
    },
    setCoordinator(coordinator: any) {
      this._coordinator = coordinator
    },
    _getInternalData() {
      return { max: this._max, min: this._min, data: this._data, radi: this._radi }
    },
    getData() {
      return this._unOrganizeData()
    }
  }
  return Store
})()

const Canvas2dRenderer = (function Canvas2dRendererClosure() {
  function _getColorPalette(config: any) {
    const gradientConfig = config.gradient || config.defaultGradient
    const paletteCanvas = document.createElement('canvas')
    const paletteCtx = paletteCanvas.getContext('2d')!
    paletteCanvas.width = 256
    paletteCanvas.height = 1
    const gradient = paletteCtx.createLinearGradient(0, 0, 256, 1)
    for (const key in gradientConfig) {
      gradient.addColorStop(key as any, gradientConfig[key])
    }
    paletteCtx.fillStyle = gradient
    paletteCtx.fillRect(0, 0, 256, 1)
    return paletteCtx.getImageData(0, 0, 256, 1).data
  }

  function _getPointTemplate(radius: any, blurFactor: any) {
    const tplCanvas = document.createElement('canvas')
    const tplCtx = tplCanvas.getContext('2d')!
    const x = radius
    const y = radius
    tplCanvas.width = tplCanvas.height = radius * 2
    if (blurFactor == 1) {
      tplCtx.beginPath()
      tplCtx.arc(x, y, radius, 0, 2 * Math.PI, false)
      tplCtx.fillStyle = 'rgba(0,0,0,1)'
      tplCtx.fill()
    } else {
      const gradient = tplCtx.createRadialGradient(x, y, radius * blurFactor, x, y, radius)
      gradient.addColorStop(0, 'rgba(0,0,0,1)')
      gradient.addColorStop(1, 'rgba(0,0,0,0)')
      tplCtx.fillStyle = gradient
      tplCtx.fillRect(0, 0, 2 * radius, 2 * radius)
    }
    return tplCanvas
  }

  function _prepareData(data: any) {
    const renderData: any[] = []
    const min = data.min
    const max = data.max
    const radi = data.radi
    const dataArr = data.data
    const xValues = Object.keys(dataArr)
    let xValuesLen = xValues.length
    while (xValuesLen--) {
      const xValue = xValues[xValuesLen]
      const yValues = Object.keys(dataArr[xValue])
      let yValuesLen = yValues.length
      while (yValuesLen--) {
        const yValue = yValues[yValuesLen]
        const value = dataArr[xValue][yValue]
        const radius = radi[xValue][yValue]
        renderData.push({ x: xValue, y: yValue, value, radius })
      }
    }
    return { min, max, data: renderData }
  }

  function Canvas2dRenderer(this: any, config: any) {
    const container = config.container
    const shadowCanvas = (this.shadowCanvas = document.createElement('canvas'))
    const canvas = (this.canvas = config.canvas || document.createElement('canvas'))
    this._renderBoundaries = [10000, 10000, 0, 0]
    const computed = getComputedStyle(config.container) || {}
    canvas.className = 'heatmap-canvas'
    this._width = canvas.width = shadowCanvas.width = +computed.width.replace(/px/, '')
    this._height = canvas.height = shadowCanvas.height = +computed.height.replace(/px/, '')
    this.shadowCtx = shadowCanvas.getContext('2d')
    this.ctx = canvas.getContext('2d')
    canvas.style.cssText = shadowCanvas.style.cssText = 'position:absolute;left:0;top:0;'
    container.style.position = 'relative'
    container.appendChild(canvas)
    this._palette = _getColorPalette(config)
    this._templates = {}
    this._setStyles(config)
  }

  Canvas2dRenderer.prototype = {
    renderPartial(data: any) {
      this._drawAlpha(data)
      this._colorize()
    },
    renderAll(data: any) {
      this._clear()
      this._drawAlpha(_prepareData(data))
      this._colorize()
    },
    _updateGradient(config: any) {
      this._palette = _getColorPalette(config)
    },
    updateConfig(config: any) {
      if (config['gradient']) this._updateGradient(config)
      this._setStyles(config)
    },
    setDimensions(width: any, height: any) {
      this._width = width
      this._height = height
      this.canvas.width = this.shadowCanvas.width = width
      this.canvas.height = this.shadowCanvas.height = height
    },
    _clear() {
      this.shadowCtx.clearRect(0, 0, this._width, this._height)
      this.ctx.clearRect(0, 0, this._width, this._height)
    },
    _setStyles(config: any) {
      this._blur = config.blur == 0 ? 0 : config.blur || config.defaultBlur
      if (config.backgroundColor) this.canvas.style.backgroundColor = config.backgroundColor
      this._opacity = (config.opacity || 0) * 255
      this._maxOpacity = (config.maxOpacity || config.defaultMaxOpacity) * 255
      this._minOpacity = (config.minOpacity || config.defaultMinOpacity) * 255
      this._useGradientOpacity = !!config.useGradientOpacity
    },
    _drawAlpha(data: any) {
      const min = (this._min = data.min)
      const max = (this._max = data.max)
      const dataArr = data.data || []
      let dataLen = dataArr.length
      const blur = 1 - this._blur
      while (dataLen--) {
        const point = dataArr[dataLen]
        const x = point.x
        const y = point.y
        const radius = point.radius
        const value = Math.min(point.value, max)
        const rectX = x - radius
        const rectY = y - radius
        const shadowCtx = this.shadowCtx
        let tpl
        if (!this._templates[radius]) {
          this._templates[radius] = tpl = _getPointTemplate(radius, blur)
        } else {
          tpl = this._templates[radius]
        }
        shadowCtx.globalAlpha = (value - min) / (max - min)
        shadowCtx.drawImage(tpl, rectX, rectY)
        if (rectX < this._renderBoundaries[0]) this._renderBoundaries[0] = rectX
        if (rectY < this._renderBoundaries[1]) this._renderBoundaries[1] = rectY
        if (rectX + 2 * radius > this._renderBoundaries[2]) this._renderBoundaries[2] = rectX + 2 * radius
        if (rectY + 2 * radius > this._renderBoundaries[3]) this._renderBoundaries[3] = rectY + 2 * radius
      }
    },
    _colorize() {
      let x = this._renderBoundaries[0]
      let y = this._renderBoundaries[1]
      let width = this._renderBoundaries[2] - x
      let height = this._renderBoundaries[3] - y
      const maxWidth = this._width
      const maxHeight = this._height
      const opacity = this._opacity
      const maxOpacity = this._maxOpacity
      const minOpacity = this._minOpacity
      const useGradientOpacity = this._useGradientOpacity
      if (x < 0) x = 0
      if (y < 0) y = 0
      if (x + width > maxWidth) width = maxWidth - x
      if (y + height > maxHeight) height = maxHeight - y
      const img = this.shadowCtx.getImageData(x, y, width, height)
      const imgData = img.data
      const len = imgData.length
      const palette = this._palette
      for (let i = 3; i < len; i += 4) {
        const alpha = imgData[i]
        const offset = alpha * 4
        if (!offset) continue
        let finalAlpha
        if (opacity > 0) {
          finalAlpha = opacity
        } else if (alpha < maxOpacity) {
          finalAlpha = alpha < minOpacity ? minOpacity : alpha
        } else {
          finalAlpha = maxOpacity
        }
        imgData[i - 3] = palette[offset]
        imgData[i - 2] = palette[offset + 1]
        imgData[i - 1] = palette[offset + 2]
        imgData[i] = useGradientOpacity ? palette[offset + 3] : finalAlpha
      }
      Object.defineProperty(img, 'data', { value: imgData, writable: true, configurable: true, enumerable: true })
      this.ctx.putImageData(img, x, y)
      this._renderBoundaries = [1000, 1000, 0, 0]
    },
    getValueAt(point: any) {
      const shadowCtx = this.shadowCtx
      const img = shadowCtx.getImageData(point.x, point.y, 1, 1)
      const data = img.data[3]
      const max = this._max
      const min = this._min
      return (Math.abs(max - min) * (data / 255)) >> 0
    },
    getDataURL() {
      return this.canvas.toDataURL()
    }
  }
  return Canvas2dRenderer
})()

const Renderer = (function RendererClosure() {
  let rendererFn: any = false
  if (HeatmapConfig['defaultRenderer'] === 'canvas2d') rendererFn = Canvas2dRenderer
  return rendererFn
})()

const Util = {
  merge(...args: any[]) {
    const merged: any = {}
    const argsLen = arguments.length
    for (let i = 0; i < argsLen; i++) {
      const obj = arguments[i]
      for (const key in obj) merged[key] = obj[key]
    }
    return merged
  }
}

const Heatmap = (function HeatmapClosure() {
  const Coordinator = (function CoordinatorClosure() {
    function Coordinator(this: any) {
      this.cStore = {}
    }
    Coordinator.prototype = {
      on(evtName: any, callback: any, scope: any) {
        const cStore = this.cStore
        if (!cStore[evtName]) cStore[evtName] = []
        cStore[evtName].push(function (data: any) {
          return callback.call(scope, data)
        })
      },
      emit(evtName: any, data: any) {
        const cStore = this.cStore
        if (cStore[evtName]) {
          let len = cStore[evtName].length
          for (let i = 0; i < len; i++) {
            const callback = cStore[evtName][i]
            callback(data)
          }
        }
      }
    }
    return Coordinator
  })()

  function _connect(scope: any) {
    const renderer = scope._renderer
    const coordinator = scope._coordinator
    const store = scope._store
    coordinator.on('renderpartial', renderer.renderPartial, renderer)
    coordinator.on('renderall', renderer.renderAll, renderer)
    coordinator.on('extremachange', function (data: any) {
      scope._config.onExtremaChange &&
        scope._config.onExtremaChange({
          min: data.min,
          max: data.max,
          gradient: scope._config['gradient'] || scope._config['defaultGradient']
        })
    })
    store.setCoordinator(coordinator)
  }

  function Heatmap(this: any) {
    const config = (this._config = Util.merge(HeatmapConfig, arguments[0] || {}))
    this._coordinator = new (Coordinator as any)()
    if (config['plugin']) {
      const pluginToLoad = config['plugin']
      if (!HeatmapConfig.plugins[pluginToLoad]) {
        throw new Error("Plugin '" + pluginToLoad + "' not found. Maybe it was not registered.")
      } else {
        const plugin = HeatmapConfig.plugins[pluginToLoad]
        this._renderer = new plugin.renderer(config)
        this._store = new plugin.store(config)
      }
    } else {
      this._renderer = new Renderer(config)
      this._store = new (Store as any)(config)
    }
    _connect(this)
  }

  Heatmap.prototype = {
    addData() {
      this._store.addData.apply(this._store, arguments)
      return this
    },
    removeData() {
      this._store.removeData && this._store.removeData.apply(this._store, arguments)
      return this
    },
    setData() {
      this._store.setData.apply(this._store, arguments)
      return this
    },
    setDataMax() {
      this._store.setDataMax.apply(this._store, arguments)
      return this
    },
    setDataMin() {
      this._store.setDataMin.apply(this._store, arguments)
      return this
    },
    configure(config: any) {
      this._config = Util.merge(this._config, config)
      this._renderer.updateConfig(this._config)
      this._coordinator.emit('renderall', this._store._getInternalData())
      return this
    },
    repaint() {
      this._coordinator.emit('renderall', this._store._getInternalData())
      return this
    },
    getData() {
      return this._store.getData()
    },
    getDataURL() {
      return this._renderer.getDataURL()
    },
    getValueAt(point: any) {
      if (this._store.getValueAt) return this._store.getValueAt(point)
      else if (this._renderer.getValueAt) return this._renderer.getValueAt(point)
      return null
    }
  }
  return Heatmap
})()

const h337 = {
  create(config: any) {
    return new (Heatmap as any)(config)
  },
  register(pluginKey: any, plugin: any) {
    HeatmapConfig.plugins[pluginKey] = plugin
  }
}

/* ------------------------------ setCesiumHeatmap（Cesium 2D 热力图） ------------------------------ */
export class CesiumHeatmap {
  Cesium: any
  viewer: any
  initOptions: any
  bounds: any
  element: any
  heatmap: any
  heatmapDataOptions: any
  heatmapOptions: any
  initRadius: any
  lastCameraHeight: any
  primitiveType: any
  provider: any
  radius: any
  baseElevation: any
  colorGradient: any
  dataPoints: any
  cameraMoveEnd: any
  constructor(Cesium: any, viewer: any, options: any) {
    this.Cesium = Cesium
    this.viewer = viewer
    this.initOptions = { ...options }
    if (this.initOptions?.points) {
      const bounds = this.getBounds(this.initOptions.points)
      this.bounds = bounds
      const { container, width, height } = this.createContainer(bounds)
      this.element = container
      const datas: any[] = []
      const values: any[] = []
      for (const i in this.initOptions.points) {
        const point = this.initOptions.points[i]
        const x = ((point.x - bounds[0]) / (bounds[2] - bounds[0])) * width
        const y = ((bounds[3] - point.y) / (bounds[3] - bounds[1])) * height
        const dataPoint = { x, y, value: point.value }
        if (typeof point.value === 'number') values.push(point.value)
        datas.push(dataPoint)
      }
      let _min = Math.min(...values)
      let _max = Math.max(...values)
      if (this.initOptions?.heatmapDataOptions) {
        const { min, max } = this.initOptions.heatmapDataOptions
        if (typeof min === 'number') _min = min
        if (typeof max === 'number') _max = max
      }
      this.heatmapDataOptions = { min: _min, max: _max }
      const data = { max: _max, min: _min, data: datas }
      const defaultOptions = {
        maxOpacity: 0.9,
        minOpacity: 0.1,
        gradient: { '.3': 'blue', '.5': 'green', '.7': 'yellow', '.95': 'red' }
      }
      const _options = this.initOptions.heatmapOptions ? { ...defaultOptions, ...this.initOptions.heatmapOptions } : defaultOptions
      if (this.heatmapOptions?.radius) this.initRadius = this.heatmapOptions.radius
      this.heatmapOptions = { ..._options }
      const options = { ..._options, container }
      this.heatmap = h337.create(options)
      this.heatmap.setData(data)
      this.createLayer()
      if (!this.initOptions.noLisenerCamera) this.addLisener()
      if (this.initOptions.zoomToLayer && bounds) {
        this.viewer.camera.flyTo({ destination: Cesium.Rectangle.fromDegrees(...bounds) })
      }
      if (this.initOptions?.viewToLayer) {
        this.viewer.camera.setView({ destination: Cesium.Rectangle.fromDegrees(...bounds) })
      }
    }
  }

  updateHeatMapMaxMin(dataOption: any) {
    const Cesium = this.Cesium
    const { min, max } = dataOption
    if (this.heatmap) {
      if (typeof min === 'number') {
        this.heatmap.setDataMin(min)
        if (this.heatmapDataOptions) this.heatmapDataOptions.min = min
      }
      if (typeof max === 'number') {
        this.heatmap.setDataMax(max)
        if (this.heatmapDataOptions) this.heatmapDataOptions.max = max
      }
    }
    this.updateLayer()
  }

  updateHeatmap(options: any) {
    const { heatmapOptions } = this
    this.heatmap.configure({ ...heatmapOptions, ...options })
    this.updateLayer()
  }

  updateRadius(radius: any) {
    const { heatmapOptions } = this
    const currentData = this.heatmap.getData()
    if (currentData?.data) {
      for (const i in currentData.data) currentData.data[i].radius = radius
    }
    this.heatmap.setData(currentData)
    this.heatmapOptions = { ...heatmapOptions, radius }
    this.updateLayer()
    if (this.initOptions?.onRadiusChange) this.initOptions.onRadiusChange(radius)
  }

  remove() {
    const Cesium = this.Cesium
    if (this.element) {
      document.body.removeChild(this.element)
      this.element = undefined
      if (this.provider instanceof Cesium.ImageryLayer) {
        if (this.provider) this.viewer.imageryLayers.remove(this.provider)
        this.createSingleTileImageryLayer()
      } else if (this.provider instanceof Cesium.Primitive) {
        this.viewer.scene.primitives.remove(this.provider)
      } else if (this.provider instanceof Cesium.Entity) {
        this.viewer.entities.remove(this.provider)
      }
      if (this.cameraMoveEnd) {
        this.viewer.camera.moveEnd.removeEventListener(this.cameraMoveEnd)
        this.cameraMoveEnd = undefined
      }
    }
  }

  createLayer() {
    if (this.initOptions.renderType === 'primitive') this.createPrimitive()
    else if (this.initOptions.renderType === 'imagery') this.createSingleTileImageryLayer()
    else this.createEntity()
  }

  createPrimitive() {
    const Cesium = this.Cesium
    const url = this.heatmap.getDataURL()
    this.provider = this.viewer.scene.primitives.add(
      new Cesium.Primitive({
        geometryInstances: new Cesium.GeometryInstance({
          geometry: new Cesium.RectangleGeometry({
            rectangle: Cesium.Rectangle.fromDegrees(...this.bounds),
            vertexFormat: Cesium.EllipsoidSurfaceAppearance.VERTEX_FORMAT
          })
        }),
        appearance: new Cesium.EllipsoidSurfaceAppearance({ aboveGround: false }),
        show: true
      })
    )
    if (this.provider) {
      this.provider.appearance.material = new Cesium.Material({
        fabric: { type: 'Image', uniforms: { image: url } }
      })
    }
  }

  createSingleTileImageryLayer() {
    const Cesium = this.Cesium
    const url = this.heatmap.getDataURL()
    this.provider = this.viewer.imageryLayers.addImageryProvider(
      new Cesium.SingleTileImageryProvider({ url, rectangle: Cesium.Rectangle.fromDegrees(...this.bounds) })
    )
  }

  getImageMaterialProperty() {
    const Cesium = this.Cesium
    const url = this.heatmap.getDataURL()
    return new Cesium.ImageMaterialProperty({ image: url })
  }

  createEntity() {
    const Cesium = this.Cesium
    this.provider = this.viewer.entities.add({
      show: true,
      rectangle: { coordinates: Cesium.Rectangle.fromDegrees(...this.bounds), material: this.getImageMaterialProperty() }
    })
  }

  updateLayer() {
    const Cesium = this.Cesium
    const src = this.heatmap.getDataURL()
    if (this.provider instanceof Cesium.ImageryLayer) {
      if (this.provider) this.viewer.imageryLayers.remove(this.provider)
      this.createSingleTileImageryLayer()
    } else if (this.provider instanceof Cesium.Primitive) {
      this.provider.appearance.material.uniforms.image = src
    } else if (this.provider instanceof Cesium.Entity) {
      if (this.provider.rectangle) this.provider.rectangle.material = this.getImageMaterialProperty()
    }
  }

  addLisener() {
    const maxRadius = 100
    const min = 6375000
    const max = 10000000
    this.cameraMoveEnd = () => {
      if (this.heatmapOptions && this.heatmap && this.heatmapDataOptions) {
        const h = this.viewer.camera.getMagnitude()
        const distance = this?.initOptions?.cameraHeightDistance ? this.initOptions.cameraHeightDistance : 1000
        if (Math.abs(h - this.lastCameraHeight) > distance) {
          this.lastCameraHeight = h
          if (typeof min === 'number' && typeof max === 'number') {
            const radius = parseInt((this.initRadius + ((maxRadius - this.initRadius) * (h - min)) / (max - min)).toFixed(0))
            if (radius) this.updateRadius(radius)
          }
        }
      }
    }
    this.viewer.camera.moveEnd.addEventListener(this.cameraMoveEnd)
  }

  getBounds(points: any) {
    if (points) {
      let lonMin = 180
      let lonMax = -180
      let latMin = 90
      let latMax = -180
      points.forEach((point: any) => {
        const { x: longitude, y: latitude } = point
        lonMin = longitude < lonMin ? longitude : lonMin
        latMin = latitude < latMin ? latitude : latMin
        lonMax = longitude > lonMax ? longitude : lonMax
        latMax = latitude > latMax ? latitude : latMax
      })
      const xRange = lonMax - lonMin ? lonMax - lonMin : 1
      const yRange = latMax - latMin ? latMax - latMin : 1
      return [lonMin - xRange / 10, latMin - yRange / 10, lonMax + xRange / 10, latMax + yRange / 10]
    }
    return [0, 0, 0, 0]
  }

  createContainer(bounds: any) {
    const container = document.createElement('div')
    const width = 1000
    const height = parseInt(((1000 / (bounds[2] - bounds[0])) * (bounds[3] - bounds[1])).toFixed(0))
    container.setAttribute('style', `width:${width}px;height:${height}px;display:none;`)
    document.body.appendChild(container)
    return { container, width, height }
  }
}

/* ------------------------------ create3DHeatmap（Cesium 3D 热力图） ------------------------------ */
export function create3DHeatmap(Cesium: any, viewer: any, options: any = {}) {
  const heatmapState: any = {
    viewer,
    options,
    dataPoints: options.dataPoints || [],
    containerElement: undefined,
    instanceId: Number(`${new Date().getTime()}${Number(Math.random() * 1000).toFixed(0)}`),
    canvasWidth: 200,
    boundingBox: undefined,
    boundingRect: {},
    xAxis: undefined,
    yAxis: undefined,
    xAxisLength: 0,
    yAxisLength: 0,
    baseElevation: options.baseElevation || 0,
    heatmapPrimitive: undefined,
    positionHierarchy: [],
    heatmapInstance: null
  }

  if (!heatmapState.dataPoints || heatmapState.dataPoints.length < 2) {
    console.log('热力图点位不得少于3个！')
    return
  }

  createHeatmapContainer(heatmapState)

  const heatmapConfig = {
    container: document.getElementById(`heatmap-${heatmapState.instanceId}`),
    radius: options.radius || 20,
    maxOpacity: 0.7,
    minOpacity: 0,
    blur: 0.75,
    gradient: options.colorGradient || { '.1': 'blue', '.5': 'yellow', '.7': 'red', '.99': 'white' }
  }

  heatmapState.primitiveType = options.primitiveType || 'TRIANGLES'
  heatmapState.heatmapInstance = h337.create(heatmapConfig)

  initializeHeatmap(Cesium, heatmapState)

  return {
    destroy: () => destroyHeatmap(heatmapState),
    heatmapState
  }
}

function initializeHeatmap(Cesium: any, heatmapState: any) {
  for (const [index, dataPoint] of heatmapState.dataPoints.entries()) {
    const cartesianPosition = Cesium.Cartesian3.fromDegrees(dataPoint.lnglat[0], dataPoint.lnglat[1], 0)
    heatmapState.positionHierarchy.push(cartesianPosition)
  }

  computeBoundingBox(Cesium, heatmapState.positionHierarchy, heatmapState)

  const heatmapPoints = heatmapState.positionHierarchy.map((position: any, index: any) => {
    const normalizedCoords = computeNormalizedCoordinates(Cesium, position, heatmapState)
    return { x: normalizedCoords!.x, y: normalizedCoords!.y, value: heatmapState.dataPoints[index].value }
  })

  heatmapState.heatmapInstance.addData(heatmapPoints)

  const geometryInstance = new Cesium.GeometryInstance({ geometry: createHeatmapGeometry(Cesium, heatmapState) })

  heatmapState.heatmapPrimitive = heatmapState.viewer.scene.primitives.add(
    new Cesium.Primitive({
      geometryInstances: geometryInstance,
      appearance: new Cesium.MaterialAppearance({
        material: new Cesium.Material({ fabric: { type: 'Image', uniforms: { image: heatmapState.heatmapInstance.getDataURL() } } }),
        vertexShaderSource: `
        in vec3 position3DHigh;
        in vec3 position3DLow;
        in vec2 st;
        in float batchId;
        uniform sampler2D image_0;
        out vec3 v_positionEC;
        in vec3 normal;
        out vec3 v_normalEC;
        out vec2 v_st;
        void main(){
            vec4 p = czm_computePosition();
            v_normalEC = czm_normal * normal;
            v_positionEC = (czm_modelViewRelativeToEye * p).xyz;
            vec4 positionWC=czm_inverseModelView* vec4(v_positionEC,1.0);
            v_st = st;
            vec4 color = texture(image_0, v_st);
            vec3 upDir = normalize(positionWC.xyz);
            p += vec4(color.r *upDir * 1000., 0.0);
            gl_Position = czm_modelViewProjectionRelativeToEye * p;
        }`,
        translucent: true,
        flat: true
      }),
      asynchronous: false
    })
  )
  heatmapState.heatmapPrimitive.id = 'heatmap3d'
}

function destroyHeatmap(heatmapState: any) {
  const containerElement = document.getElementById(`heatmap-${heatmapState.instanceId}`)
  if (containerElement) containerElement.remove()
  if (heatmapState.heatmapPrimitive) {
    heatmapState.viewer.scene.primitives.remove(heatmapState.heatmapPrimitive)
    heatmapState.heatmapPrimitive = undefined
  }
}

function computeNormalizedCoordinates(Cesium: any, position: any, heatmapState: any) {
  if (!position) return
  const cartographic = Cesium.Cartographic.fromCartesian(position.clone())
  cartographic.height = 0
  position = Cesium.Cartographic.toCartesian(cartographic.clone())
  const originVector = Cesium.Cartesian3.subtract(position.clone(), heatmapState.boundingBox.leftTop, new Cesium.Cartesian3())
  const xOffset = Cesium.Cartesian3.dot(originVector, heatmapState.xAxis)
  const yOffset = Cesium.Cartesian3.dot(originVector, heatmapState.yAxis)
  return {
    x: Number((xOffset / heatmapState.xAxisLength) * heatmapState.canvasWidth).toFixed(0),
    y: Number((yOffset / heatmapState.yAxisLength) * heatmapState.canvasWidth).toFixed(0)
  }
}

function cartesiansToLnglats(Cesium: any, cartesians: any, viewer: any) {
  if (!cartesians || cartesians.length < 1) return
  viewer = viewer || (window as any).viewer
  if (!viewer) {
    console.log('请传入viewer对象')
    return
  }
  const coordinates: any[] = []
  for (let i = 0; i < cartesians.length; i++) {
    coordinates.push(cartesianToLnglat(Cesium, cartesians[i], viewer))
  }
  return coordinates
}

function cartesianToLnglat(Cesium: any, cartesian: any, viewer: any) {
  if (!cartesian) return []
  viewer = viewer || (window as any).viewer
  const cartographic = Cesium.Cartographic.fromCartesian(cartesian)
  const latitude = Cesium.Math.toDegrees(cartographic.latitude)
  const longitude = Cesium.Math.toDegrees(cartographic.longitude)
  const height = cartographic.height
  return [longitude, latitude, height]
}

function computeBoundingBox(Cesium: any, positions: any, heatmapState: any) {
  if (!positions) return
  const boundingSphere = Cesium.BoundingSphere.fromPoints(positions, new Cesium.BoundingSphere())
  const centerPoint = boundingSphere.center
  const sphereRadius = boundingSphere.radius
  const modelMatrix = Cesium.Transforms.eastNorthUpToFixedFrame(centerPoint.clone())
  const modelMatrixInverse = Cesium.Matrix4.inverse(modelMatrix.clone(), new Cesium.Matrix4())
  const yAxisVector = new Cesium.Cartesian3(0, 1, 0)
  const boundingVertices: any[] = []
  for (let angle = 45; angle <= 360; angle += 90) {
    const rotationMatrix = Cesium.Matrix3.fromRotationZ(Cesium.Math.toRadians(angle), new Cesium.Matrix3())
    let rotatedYAxis = Cesium.Matrix3.multiplyByVector(rotationMatrix, yAxisVector, new Cesium.Cartesian3())
    rotatedYAxis = Cesium.Cartesian3.normalize(rotatedYAxis, new Cesium.Cartesian3())
    const scaledVector = Cesium.Cartesian3.multiplyByScalar(rotatedYAxis, sphereRadius, new Cesium.Cartesian3())
    const vertex = Cesium.Matrix4.multiplyByPoint(modelMatrix, scaledVector.clone(), new Cesium.Cartesian3())
    boundingVertices.push(vertex)
  }

  const coordinates = cartesiansToLnglats(Cesium, boundingVertices, heatmapState.viewer)
  let minLatitude = Number.MAX_VALUE
  let maxLatitude = Number.MIN_VALUE
  let minLongitude = Number.MAX_VALUE
  let maxLongitude = Number.MIN_VALUE
  const vertexCount = boundingVertices.length

  coordinates!.forEach((coordinate) => {
    if (coordinate[0] < minLongitude) minLongitude = coordinate[0]
    if (coordinate[0] > maxLongitude) maxLongitude = coordinate[0]
    if (coordinate[1] < minLatitude) minLatitude = coordinate[1]
    if (coordinate[1] > maxLatitude) maxLatitude = coordinate[1]
  })

  const latitudeRange = maxLatitude - minLatitude
  const longitudeRange = maxLongitude - minLongitude

  heatmapState.boundingRect = {
    minLatitude: minLatitude - latitudeRange / vertexCount,
    maxLatitude: maxLatitude + latitudeRange / vertexCount,
    minLongitude: minLongitude - longitudeRange / vertexCount,
    maxLongitude: maxLongitude + longitudeRange / vertexCount
  }

  heatmapState.boundingBox = {
    leftTop: Cesium.Cartesian3.fromDegrees(heatmapState.boundingRect.minLongitude, heatmapState.boundingRect.maxLatitude),
    leftBottom: Cesium.Cartesian3.fromDegrees(heatmapState.boundingRect.minLongitude, heatmapState.boundingRect.minLatitude),
    rightTop: Cesium.Cartesian3.fromDegrees(heatmapState.boundingRect.maxLongitude, heatmapState.boundingRect.maxLatitude),
    rightBottom: Cesium.Cartesian3.fromDegrees(heatmapState.boundingRect.maxLongitude, heatmapState.boundingRect.minLatitude)
  }

  heatmapState.xAxis = Cesium.Cartesian3.subtract(heatmapState.boundingBox.rightTop, heatmapState.boundingBox.leftTop, new Cesium.Cartesian3())
  heatmapState.xAxis = Cesium.Cartesian3.normalize(heatmapState.xAxis, new Cesium.Cartesian3())
  heatmapState.yAxis = Cesium.Cartesian3.subtract(heatmapState.boundingBox.leftBottom, heatmapState.boundingBox.leftTop, new Cesium.Cartesian3())
  heatmapState.yAxis = Cesium.Cartesian3.normalize(heatmapState.yAxis, new Cesium.Cartesian3())
  heatmapState.xAxisLength = Cesium.Cartesian3.distance(heatmapState.boundingBox.rightTop, heatmapState.boundingBox.leftTop)
  heatmapState.yAxisLength = Cesium.Cartesian3.distance(heatmapState.boundingBox.leftBottom, heatmapState.boundingBox.leftTop)
}

function createHeatmapGeometry(Cesium: any, heatmapState: any) {
  const meshData = generateMeshData(Cesium, heatmapState)
  return new Cesium.Geometry({
    attributes: new Cesium.GeometryAttributes({
      position: new Cesium.GeometryAttribute({
        componentDatatype: Cesium.ComponentDatatype.DOUBLE,
        componentsPerAttribute: 3,
        values: meshData.positions
      }),
      st: new Cesium.GeometryAttribute({
        componentDatatype: Cesium.ComponentDatatype.FLOAT,
        componentsPerAttribute: 2,
        values: new Float32Array(meshData.textureCoords)
      })
    }),
    indices: new Uint16Array(meshData.indices),
    primitiveType: Cesium.PrimitiveType[heatmapState.primitiveType],
    boundingSphere: Cesium.BoundingSphere.fromVertices(meshData.positions)
  })
}

function generateMeshData(Cesium: any, heatmapState: any) {
  const gridWidth = heatmapState.canvasWidth || 200
  const gridHeight = heatmapState.canvasWidth || 200
  const { maxLongitude, maxLatitude, minLongitude, minLatitude } = heatmapState.boundingRect
  const longitudeStep = (maxLongitude - minLongitude) / gridWidth
  const latitudeStep = (maxLatitude - minLatitude) / gridHeight
  const positions: any[] = []
  const textureCoords: any[] = []
  const indices: any[] = []

  for (let i = 0; i < gridWidth; i++) {
    const currentLongitude = minLongitude + longitudeStep * i
    for (let j = 0; j < gridHeight; j++) {
      const currentLatitude = minLatitude + latitudeStep * j
      const heatValue = heatmapState.heatmapInstance.getValueAt({ x: i, y: j })
      const cartesian3 = Cesium.Cartesian3.fromDegrees(currentLongitude, currentLatitude, heatmapState.baseElevation + heatValue)
      positions.push(cartesian3.x, cartesian3.y, cartesian3.z)
      textureCoords.push(i / gridWidth, j / gridHeight)
      if (j !== gridHeight - 1 && i !== gridWidth - 1) {
        indices.push(i * gridHeight + j, i * gridHeight + j + 1, (i + 1) * gridHeight + j)
        indices.push((i + 1) * gridHeight + j, (i + 1) * gridHeight + j + 1, i * gridHeight + j + 1)
      }
    }
  }

  return { positions, textureCoords, indices }
}

function createHeatmapContainer(heatmapState: any) {
  heatmapState.containerElement = window.document.createElement('div')
  heatmapState.containerElement.id = `heatmap-${heatmapState.instanceId}`
  heatmapState.containerElement.className = 'heatmap'
  heatmapState.containerElement.style.width = `${heatmapState.canvasWidth}px`
  heatmapState.containerElement.style.height = `${heatmapState.canvasWidth}px`
  heatmapState.containerElement.style.position = 'absolute'
  heatmapState.containerElement.style.display = 'none'
  const mapContainer = window.document.getElementById(heatmapState.viewer.container.id)!
  mapContainer.appendChild(heatmapState.containerElement)
}
