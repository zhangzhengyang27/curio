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
let appearance: any = null
let primitive: any = null
let preRenderListener: any = null
let lastTime: number = 0

function viewerOptions(Cesium: any) {
  return {
    animation: false,
    baseLayerPicker: false,
    baseLayer: Cesium.ImageryLayer.fromProviderAsync(
      Cesium.ArcGisMapServerImageryProvider.fromUrl('https://server.arcgisonline.com/arcgis/rest/services/World_Imagery/MapServer')
    ),
    fullscreenButton: false,
    timeline: false,
    infoBox: false,
  }
}

function onReady(ctx: any) {
  Cesium = ctx.cesium
  viewer = ctx.viewer

  const FILE_HOST = props.example?.globals?.FILE_HOST || '/external-examples/3d-file-server/'
  const HOST = props.example?.globals?.HOST || '/external-examples/three-cesium-examples/'
  const GLOBAL_CONFIG = {
    getLayerUrl: () => 'https://server.arcgisonline.com/arcgis/rest/services/World_Imagery/MapServer',
    getFileUrl: (url: string) => FILE_HOST + url,
    ElMessage: (msg: any) => console.log('[ElMessage]', msg)
  }

  const customMaterial = new Cesium.Material({
    translucent: false,
    fabric: {
      type: 'CustomBoxShader',
      uniforms: {
        iTime: 0.0,
        iResolution: new Cesium.Cartesian2(1024, 1024),
      },
      source: `
        uniform float iTime;
        uniform vec2 iResolution;
        void mainImage( out vec4 o, vec2 u )
        {
            vec2 v = iResolution.xy;
            u = .2*(u+u-v)/v.y;    
            vec4 z = o = vec4(1,2,3,0);
            for (float a = .5, t = iTime, i; ++i < 19.; 
                o += (1. + cos(z+t))  / length((1.+i*dot(v,v)) * sin(1.5*u/(.5-dot(u,u)) - 9.*u.yx + t))
                )  
                v = cos(++t - 7.*u*pow(a += .03, i)) - 5.*u, 
                u += tanh(40. * dot(u *= mat2(cos(i + .02*t - vec4(0,11,33,0))), u)
                * cos(1e2*u.yx + t)) / 2e2 + .2 * a * u + cos(4./exp(dot(o,o)/1e2) + t) / 3e2;
            o = 25.6 / (min(o, 13.) + 164. / o) - dot(u, u) / 250.;
        }
        czm_material czm_getMaterial(czm_materialInput materialInput) {
            czm_material material = czm_getDefaultMaterial(materialInput);
            vec4 color = vec4(0.0, 0.0, 0.0, 1.0);
            mainImage(color, materialInput.st * iResolution);
            material.diffuse = color.rgb;
            material.alpha = 1.0;
            return material;
        }
      `,
    },
  })

  appearance = new Cesium.MaterialAppearance({
    material: customMaterial,
    flat: false,
    faceForward: true,
    translucent: true,
    closed: true,
    materialCacheKey: 'shadertoy-material-appearance',
  })

  const scene = viewer.scene
  viewer.clock.currentTime.secondsOfDay = 65398
  scene.globe.enableLighting = true
  scene.fog.enabled = true

  const destination = {
    x: -2280236.925141378,
    y: 5006991.049189922,
    z: 3215839.258024074,
  }
  const boxSize = 25

  const boxGeometry = Cesium.BoxGeometry.fromDimensions({
    dimensions: new Cesium.Cartesian3(boxSize, boxSize, boxSize),
  })
  const modelMatrix = Cesium.Transforms.eastNorthUpToFixedFrame(destination)
  const boxInstance = new Cesium.GeometryInstance({ geometry: boxGeometry })

  primitive = new Cesium.Primitive({
    geometryInstances: boxInstance,
    appearance,
    asynchronous: false,
    modelMatrix,
  })
  scene.primitives.add(primitive)

  lastTime = Date.now()
  preRenderListener = () => {
    const now = Date.now()
    appearance.material.uniforms.iTime += (now - lastTime) / 1000
    lastTime = now
  }
  scene.preRender.addEventListener(preRenderListener)

  viewer.camera.lookAt(
    destination,
    new Cesium.HeadingPitchRange(6.283185307179577, -0.4706003213405664, 100),
  )
}

function onBeforeDispose() {
  if (viewer && !viewer.isDestroyed()) {
    try {
      if (preRenderListener) {
        viewer.scene.preRender.removeEventListener(preRenderListener)
        preRenderListener = null
      }
    } catch (e) {}
    try {
      if (primitive) {
        viewer.scene.primitives.remove(primitive)
        primitive = null
      }
    } catch (e) {}
    try {
      viewer.entities.removeAll()
    } catch (e) {}
  }
  appearance = null
  Cesium = null
  viewer = null
}
</script>
