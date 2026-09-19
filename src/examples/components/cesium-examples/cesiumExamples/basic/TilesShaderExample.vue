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

function viewerOptions(Cesium: any) {
  return {

    animation: false,//是否创建动画小器件，左下角仪表    

    baseLayerPicker: false,//是否显示图层选择器，右上角图层选择按钮

    baseLayer: Cesium.ImageryLayer.fromProviderAsync(Cesium.ArcGisMapServerImageryProvider.fromUrl('https://server.arcgisonline.com/arcgis/rest/services/World_Imagery/MapServer')),

    fullscreenButton: false,//是否显示全屏按钮，右下角全屏选择按钮

    timeline: false,//是否显示时间轴    

    infoBox: false,//是否显示信息框   

}
}

async function onReady(ctx: any) {
  Cesium = ctx.cesium
  viewer = ctx.viewer

  const FILE_HOST = props.example?.globals?.FILE_HOST || "/external-examples/3d-file-server/"
  const HOST = props.example?.globals?.HOST || "/external-examples/three-cesium-examples/"
  const GLOBAL_CONFIG = {
    getLayerUrl: () => 'https://server.arcgisonline.com/arcgis/rest/services/World_Imagery/MapServer',
    getFileUrl: (url: string) => FILE_HOST + url,
    ElMessage: (msg: any) => console.log('[ElMessage]', msg)
  }

  const tileset = await Cesium.Cesium3DTileset.fromUrl(`https://g2657.github.io/gz-city/tileset.json`)
  
  viewer.scene.primitives.add(tileset)
  
  viewer.camera.viewBoundingSphere(tileset.boundingSphere, new Cesium.HeadingPitchRange(0, -0.1, tileset.boundingSphere.radius * 0.5))
  
  class SweepShader extends Cesium.CustomShader {
  
      constructor(opt: any = {}) {
          const { sweepColor = new Cesium.Color.fromCssColorString('green'),
              mixColor1 = new Cesium.Color.fromCssColorString('red'),
              mixColor2 = new Cesium.Color.fromCssColorString('white')
          } = opt;
  
          super({
              vertexShaderText: `void vertexMain(VertexInput vsInput, inout czm_modelVertexOutput vsOutput) {
                  // 注意这里的uv，详情看本系列第一篇文章
                  v_uv = vec2(vsInput.attributes.positionMC.z / 80., vsInput.attributes.positionMC.z / 250.);
                }`,
              fragmentShaderText: `float random(vec2 st) {
  
                  return fract(sin(dot(st.xy, vec2(12.9898, 78.233))) * 43758.5453123);
                }
                
                void fragmentMain(FragmentInput fsInput, inout czm_modelMaterial material) {
                  vec3 color = vec3(0);
                  vec3 originColor = mix(u_mix_color1, u_mix_color2, v_uv.y);
                  float t = fract(u_time * 2.) * 2.;
                  vec2 absUv = abs(v_uv - t);
                
                  vec2 st = v_uv * 15.;
                  vec2 ipos = floor(st + u_time * 5.);
                  float r = random(ipos)+.2;
                
                  float d = clamp(distance(0., absUv.y) / .2, 0., 1.);
                  float diffuse = dot(czm_sunDirectionEC, fsInput.attributes.normalEC);
                  diffuse = clamp(-diffuse, 0., .45);
                  color += originColor;
                  color = mix(u_sweep_color * r + u_sweep_color * .8, color, d);
                  material.diffuse = color;
                
                  material.emissive = vec3(diffuse) * (1. - d);
                }`,
              uniforms: {
                  u_sweep_color: {
                      value: sweepColor,
                      type: Cesium.UniformType.VEC3
                  },
                  u_mix_color1: {
                      value: mixColor1,
                      type: Cesium.UniformType.VEC3
                  },
                  u_mix_color2: {
                      value: mixColor2,
                      type: Cesium.UniformType.VEC3
                  },
                  u_time: {
                      value: 0, // initial value
                      type: Cesium.UniformType.FLOAT
                  },
  
              },
              varyings: {
                  v_selectedColor: Cesium.VaryingType.VEC3,
                  v_uv: Cesium.VaryingType.VEC2,
              },
          })
  
  
          this.sweepColor = sweepColor
          this.mixColor1 = mixColor1
          this.mixColor2 = mixColor2
  
          const task = (t: number) => {
              this.setUniform("u_time", t * .0001)
              requestAnimationFrame(task)
          }
          requestAnimationFrame(task)
      }
  }
  
  tileset.customShader = new SweepShader()
}

function onBeforeDispose() {
  if (viewer && !viewer.isDestroyed()) {
    try {
      viewer.entities.removeAll()
    } catch (e) {}
  }
  Cesium = null
  viewer = null
}
</script>
