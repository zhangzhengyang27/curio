<template>
  <ExampleScene
    camera="perspective"
    :camera-position="[0, 0, 3]"
    alpha
    antialias
    @ready="onReady"
    @before-dispose="onBeforeDispose"
  />
</template>

<script setup>
import * as THREE from 'three'
import * as echarts from 'echarts'
import ExampleScene from '@/examples/components/ExampleScene.vue'

let _intervalId = null

const props = defineProps({
  example: {
    type: Object,
    default: () => ({})
  }
})

function onBeforeDispose() {
  if (_intervalId) {
    clearInterval(_intervalId)
    _intervalId = null
  }
}

function onReady(ctx) {
  const scene = ctx.scene
  const camera = ctx.camera
  const renderer = ctx.renderer
  const controls = ctx.controls

  const w = 800, h = 600
  const container = document.createElement('canvas')
  // 设置实际尺寸而不是CSS尺寸
  container.width = w
  container.height = h
  // 保持CSS尺寸以便echarts正确初始化
  container.style.width = w + "px"
  container.style.height = h + "px"
  
  const myChart = echarts.init(container, null, {
      devicePixelRatio: window.devicePixelRatio // 使用正确的设备像素比
  })
  const texture = new THREE.CanvasTexture(container)
  // 设置贴图过滤模式以提高清晰度
  texture.minFilter = THREE.LinearFilter
  texture.magFilter = THREE.LinearFilter
  
  // 计算保持纵横比的平面尺寸
  const aspectRatio = w / h
  const planeWidth = 4
  const planeHeight = planeWidth / aspectRatio
  const planeGeometry = new THREE.PlaneGeometry(planeWidth, planeHeight)
  const planeMaterial = new THREE.MeshBasicMaterial({ map: texture, side: THREE.DoubleSide, transparent: true })
  const plane = new THREE.Mesh(planeGeometry, planeMaterial)
  scene.add(plane)
  
  const uniforms = {
      iResolution: {
          type: 'v2',
          value: new THREE.Vector2(ctx.container?.clientWidth, ctx.container?.clientHeight)
      },
      iTime: {
          type: 'f',
          value: 1.0
      }
  }
  planeMaterial.onBeforeCompile = shader => {
      shader.uniforms.iResolution = uniforms.iResolution
      shader.uniforms.iTime = uniforms.iTime
      shader.fragmentShader = shader.fragmentShader.replace(/#include <common>/, `
          uniform vec2 iResolution;
          uniform float iTime;
          #include <common> 
      `)
      shader.fragmentShader = shader.fragmentShader.replace('vec4 diffuseColor = vec4( diffuse, opacity );', `
          vec3 c;
          float l,z=iTime;
          for(int i=0;i<3;i++) {
              vec2 uv,p=gl_FragCoord.xy/iResolution;
              uv=p +  2.0;
              p-=.5;
              p.x*=iResolution.x/iResolution.y;
              z+=.07;
              l=length(p);
              uv+=p/l*(sin(z)+1.)*abs(sin(l*9.-z-z));
              c[i]=.01/length(mod(uv,1.)-.5);
          }
          vec4 diffuseColor = vec4( diffuse * c  * vec3(8.,8.,8.), opacity );
      `)
  }
  
  ctx.addUpdateCallback(() => {
    texture.needsUpdate = true
        uniforms.iTime.value += 0.05
  })
  
  const data = [820, 932, 901, 934, 1290, 1330, 1320]
  const option = {
      xAxis: {
          type: 'category',
          data: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
      },
      yAxis: {
          type: 'value'
      },
      series: [
          {
              data,
              type: 'line',
              areaStyle: {}
          }
      ]
  }
  myChart.setOption(option)
  _intervalId = setInterval(() => {
      data.forEach((item, index) => {
          data[index] = Math.floor(Math.random() * 1000)
      })
      myChart.setOption({
          series: [{
              data: data
          }]
      })
  }, 2000)
}
</script>
