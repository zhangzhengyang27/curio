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
let primitive: any = null

function viewerOptions(Cesium: any) {
  return {
    animation: false,
    baseLayerPicker: false,
    baseLayer: Cesium.ImageryLayer.fromProviderAsync(Cesium.ArcGisMapServerImageryProvider.fromUrl('https://server.arcgisonline.com/arcgis/rest/services/World_Imagery/MapServer')),
    fullscreenButton: false,
    timeline: false,
    infoBox: false
  }
}

function onReady(ctx: any) {
  Cesium = ctx.cesium
  viewer = ctx.viewer

  const FILE_HOST = props.example?.globals?.FILE_HOST || "/external-examples/3d-file-server/"
  const HOST = props.example?.globals?.HOST || "/external-examples/three-cesium-examples/"
  const GLOBAL_CONFIG = {
    getLayerUrl: () => 'https://server.arcgisonline.com/arcgis/rest/services/World_Imagery/MapServer',
    getFileUrl: (url: string) => FILE_HOST + url,
    ElMessage: (msg: any) => console.log('[ElMessage]', msg)
  }

  const defaultvs = `
    in vec3 position;
    in vec3 normal;
    out vec3 v_color;
    out vec3 v_normal;
    uniform int irow;
    void main(){
      float instanceId = float(gl_InstanceID);
      int rows = irow * irow;
      float dz = float(gl_InstanceID / rows);
      int sub = gl_InstanceID % rows;
      float dx = float(sub / irow);
      float dy = float(sub % irow);
      float d = 2560.;
      vec3 tp = position + vec3(d * dx, d * dy, dz * d);
      v_color = vec3(dx / 128., dy / 128., dz / 128.);
      gl_Position = czm_projection  * czm_modelView * vec4( tp , 1. );
    }
  `
  const defaultfs = `
    uniform vec3 color;
    in vec3 v_color;
    out vec4 out_fragColor;
    void main(){
      out_fragColor=vec4( v_color , 1. );
    }
  `

  class GridPrimitive {
    modelMatrix: any
    drawCommand: any
    vs: any
    fs: any
    row: any
    uniformMap: any
    constructor(modelMatrix: any, vs: any, fs: any, row: any, uniformMap?: any) {
      this.modelMatrix = modelMatrix || Cesium.Matrix4.IDENTITY.clone()
      this.drawCommand = null
      this.vs = vs || defaultvs
      this.fs = fs || defaultfs
      this.row = row || 10
      this.uniformMap = uniformMap || {}
    }

    isDestroyed() {
      return false
    }

    createCommand(context: any) {
      const modelMatrix = this.modelMatrix
      const box = new Cesium.BoxGeometry({
        maximum: new Cesium.Cartesian3(250.0, 250.0, 250.0),
        minimum: new Cesium.Cartesian3(-250.0, -250.0, -250.0)
      })
      const geometry = Cesium.BoxGeometry.createGeometry(box)
      const attributeLocations = Cesium.GeometryPipeline.createAttributeLocations(geometry)
      const va = Cesium.VertexArray.fromGeometry({
        context: context,
        geometry: geometry,
        attributeLocations: attributeLocations,
        indexBuffer: Cesium.Buffer.createIndexBuffer({
          context: context,
          typedArray: geometry.indices,
          indexDatatype: Cesium.IndexDatatype.UNSIGNED_SHORT,
          usage: Cesium.BufferUsage.STATIC_DRAW
        })
      })

      const { vs, fs } = this
      const shaderProgram = Cesium.ShaderProgram.fromCache({
        context: context,
        vertexShaderSource: vs,
        fragmentShaderSource: fs,
        attributeLocations: attributeLocations
      })

      const row = this.row
      const instanceCount = row * row * row
      const uniformMap = this.uniformMap
      uniformMap.color = () => Cesium.Color.RED
      uniformMap.irow = () => row

      const renderState = Cesium.RenderState.fromCache({
        cull: { enabled: true, face: Cesium.CullFace.BACK },
        depthTest: { enabled: true }
      })

      this.drawCommand = new Cesium.DrawCommand({
        modelMatrix: modelMatrix,
        vertexArray: va,
        shaderProgram: shaderProgram,
        uniformMap: uniformMap,
        renderState: renderState,
        pass: Cesium.Pass.OPAQUE,
        instanceCount: instanceCount
      })
    }

    update(frameState: any) {
      if (!this.drawCommand) {
        this.createCommand(frameState.context)
      }
      frameState.commandList.push(this.drawCommand)
    }
  }

  const origin = Cesium.Cartesian3.fromDegrees(113, 33, 250 / 2)
  const modelMatrix = Cesium.Transforms.eastNorthUpToFixedFrame(origin)
  const row = 100

  primitive = new GridPrimitive(modelMatrix, null, null, row)
  viewer.scene.primitives.add(primitive)

  viewer.camera.flyTo({
    destination: Cesium.Cartesian3.fromDegrees(113, 33, 1600000),
    orientation: {
      heading: Cesium.Math.toRadians(0),
      pitch: Cesium.Math.toRadians(-90),
      roll: 0.0
    }
  })
}

function onBeforeDispose() {
  if (viewer && !viewer.isDestroyed() && primitive) {
    try {
      viewer.scene.primitives.remove(primitive)
    } catch (e) {}
  }
  primitive = null
  Cesium = null
  viewer = null
}
</script>
