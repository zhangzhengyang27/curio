<template>
  <ExampleScene
    camera="perspective"
    :camera-position="[50, 90, 300]"
    alpha
    antialias
    @ready="onReady"
    @before-dispose="onBeforeDispose"
  />
</template>

<script setup>
import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { CSS3DRenderer, CSS3DObject } from 'three/examples/jsm/renderers/CSS3DRenderer.js'
import * as echarts from 'echarts'
import ExampleScene from '@/examples/components/ExampleScene.vue'

const props = defineProps({
  example: {
    type: Object,
    default: () => ({})
  }
})

let css3DRender = null
let resizeCss3D = null

function onReady(ctx) {
  const scene = ctx.scene
  const camera = ctx.camera
  const controls = ctx.controls
  const container = ctx.container

  scene.add(new THREE.AmbientLight(0xffffff, 3))

  controls.enableDamping = true

  new GLTFLoader().load(props.example?.globals?.FILE_HOST + 'files/model/Fox.glb', gltf => scene.add(gltf.scene))

  // CSS3D 渲染器
  css3DRender = new CSS3DRenderer()
  css3DRender.setSize(container.clientWidth, container.clientHeight)
  css3DRender.domElement.style.position = 'absolute'
  css3DRender.domElement.style.top = '0'
  css3DRender.domElement.style.left = '0'
  css3DRender.domElement.style.width = '100%'
  css3DRender.domElement.style.height = '100%'
  css3DRender.domElement.style.pointerEvents = 'none'
  css3DRender.domElement.style.zIndex = '1'
  container.appendChild(css3DRender.domElement)

  resizeCss3D = () => {
    css3DRender.setSize(container.clientWidth, container.clientHeight)
  }
  window.addEventListener('resize', resizeCss3D)

  ctx.addUpdateCallback(() => {
    css3DRender.render(scene, camera)
  })

  /* 图表 ---------------------------------------------------------------------- */
  const container1 = document.createElement('div')
  container1.style.width = '300px'
  container1.style.height = '200px'
  const myChart = echarts.init(container1)
  myChart.setOption({
    graphic: {
      elements: [
        {
          type: 'text',
          left: 'center',
          top: 'center',
          style: {
            text: 'Echarts',
            fontSize: 80,
            fontWeight: 'bold',
            lineDash: [0, 200],
            lineDashOffset: 0,
            fill: 'transparent',
            stroke: '#fff',
            lineWidth: 1
          },
          keyframeAnimation: {
            duration: 3000,
            loop: true,
            keyframes: [
              {
                percent: 0.7,
                style: {
                  fill: 'transparent',
                  lineDashOffset: 200,
                  lineDash: [200, 0]
                }
              },
              {
                percent: 0.8,
                style: {
                  fill: 'transparent'
                }
              },
              {
                percent: 1,
                style: {
                  fill: 'black'
                }
              }
            ]
          }
        }
      ]
    }
  })

  const css3DObject = new CSS3DObject(container1)
  css3DObject.position.set(0, 130, 0)
  scene.add(css3DObject)

  const container2 = document.createElement('div')
  container2.style.width = '300px'
  container2.style.height = '300px'
  const myChart2 = echarts.init(container2)
  myChart2.setOption({
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
    },
    yAxis: {
      type: 'value'
    },
    series: [
      {
        data: [820, 932, 901, 934, 1290, 1330, 1320],
        type: 'line',
        areaStyle: {}
      }
    ]
  })

  const css3DObject2 = new CSS3DObject(container2)
  css3DObject2.position.set(0, -80, 0)
  scene.add(css3DObject2)
}

function onBeforeDispose(ctx) {
  const container = ctx.container

  if (resizeCss3D) window.removeEventListener('resize', resizeCss3D)
  if (css3DRender?.domElement && container?.contains(css3DRender.domElement)) {
    container.removeChild(css3DRender.domElement)
  }
  css3DRender?.dispose?.()
  css3DRender = null
}
</script>
