<template>
  <CesiumExampleScene
    :viewer-options="viewerOptions"
    @ready="onReady"
    @before-dispose="onBeforeDispose"
  />
</template>

<script setup lang="ts">
import CesiumExampleScene from '@/examples/components/CesiumExampleScene.vue'

const props = defineProps({
  example: {
    type: Object,
    default: () => ({})
  }
})

let Cesium: any = null
let viewer: any = null
let dataSource: any = null

const MATERIAL_TYPE = 'GradientGeojsonFaceCustom'

class CustomMaterialProperty {
  _definitionChanged: any
  _color: any
  _colorSubscription: any
  color: any
  duration: any
  _time: any
  constructor(options: any = {}) {
    this._definitionChanged = new Cesium.Event()
    this._color = undefined
    this._colorSubscription = undefined

    this.color = options.color || Cesium.Color.RED
    this.duration = options.duration || 2000
    this._time = performance.now()
  }

  get isConstant() {
    return false
  }

  get definitionChanged() {
    return this._definitionChanged
  }

  getType() {
    return MATERIAL_TYPE
  }

  getValue(time: any, result: any = {}) {
    result.color = Cesium.Property.getValueOrUndefined(this.color, time)
    result.time = ((performance.now() - this._time) % this.duration) / this.duration
    return result
  }

  equals(other: any) {
    return (
      this === other ||
      (other instanceof CustomMaterialProperty && this._color === other._color)
    )
  }
}

const COLOR_CONFIGS = [
  [15, 176, 255],
  [18, 76, 154],
  [64, 196, 228],
  [66, 178, 190],
  [51, 176, 204],
  [140, 183, 229],
  [0, 244, 188],
  [19, 159, 240],
]

function viewerOptions(Cesium: any) {
  return {
    animation: false,
    baseLayerPicker: false,
    baseLayer: Cesium.ImageryLayer.fromProviderAsync(
      Cesium.ArcGisMapServerImageryProvider.fromUrl(
        'https://server.arcgisonline.com/arcgis/rest/services/World_Imagery/MapServer'
      )
    ),
    fullscreenButton: false,
    timeline: false,
    infoBox: false,
  }
}

async function onReady(ctx: any) {
  Cesium = ctx.cesium
  viewer = ctx.viewer

  Object.defineProperty(
    CustomMaterialProperty.prototype,
    'color',
    Cesium.createPropertyDescriptor('color')
  )

  const FILE_HOST = props.example?.globals?.FILE_HOST || '/external-examples/3d-file-server/'
  const HOST = props.example?.globals?.HOST || '/external-examples/three-cesium-examples/'
  const GLOBAL_CONFIG = {
    getLayerUrl: () => 'https://server.arcgisonline.com/arcgis/rest/services/World_Imagery/MapServer',
    getFileUrl: (url: string) => FILE_HOST + url,
    ElMessage: (msg: any) => console.log('[ElMessage]', msg)
  }

  Cesium.Material._materialCache.addMaterial(MATERIAL_TYPE, {
    fabric: {
      type: MATERIAL_TYPE,
      uniforms: {
        color: new Cesium.Color(1, 1, 0, 1),
        time: 1,
        spacing: 40,
        width: 1,
      },
      source: `
        uniform vec4 color;
        czm_material czm_getMaterial(czm_materialInput materialInput) {
          czm_material material = czm_getDefaultMaterial(materialInput);
          vec2 st = materialInput.st;
          float alpha = distance(st, vec2(.5));
          material.alpha = color.a * alpha * 1.5;
          material.diffuse = color.rgb * 1.3;
          return material;
        }`,
    },
    translucent: () => true,
  })

  try {
    dataSource = await Cesium.GeoJsonDataSource.load(
      '/external-examples/3d-file-server/files/json/guangdong.json'
    )

    const entities = dataSource.entities.values
    const colors = COLOR_CONFIGS.map(
      ([r, g, b]) => new Cesium.Color(r / 255, g / 255, b / 255, 1)
    )

    entities.forEach((entity: any, index: any) => {
      entity.polygon.extrudedHeight = 10000
      entity.polygon.outline = false
      entity.polygon.material = new CustomMaterialProperty({
        color: colors[index % colors.length],
      })
    })

    viewer.dataSources.add(dataSource)

    viewer.camera.flyTo({
      destination: Cesium.Cartesian3.fromDegrees(113.280637, 23.125178, 20000),
      orientation: {},
      duration: 3,
    })
  } catch (e) {
    console.error('[GradienGeojsonFace] load geojson failed:', e)
  }
}

function onBeforeDispose() {
  if (viewer && !viewer.isDestroyed()) {
    try {
      if (dataSource) {
        viewer.dataSources.remove(dataSource)
        dataSource = null
      }
    } catch (e) {}
    try {
      viewer.entities.removeAll()
    } catch (e) {}
  }
  Cesium = null
  viewer = null
}
</script>
