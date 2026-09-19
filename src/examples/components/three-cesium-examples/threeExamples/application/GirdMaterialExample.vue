<template>
  <ExampleScene
    camera="perspective"
    :camera-position="[50, 50, 50]"
    alpha
    antialias
    @ready="onReady"
  />
</template>

<script setup lang="ts">
import { onUnmounted } from 'vue'

let gui: any = null
import * as THREE from 'three'
import { GUI } from 'lil-gui'
import ExampleScene from '@/examples/components/ExampleScene.vue'

const props = defineProps({
  example: {
    type: Object,
    default: () => ({})
  }
})

function onReady(ctx: any) {
  const scene = ctx.scene
  const camera = ctx.camera
  const renderer = ctx.renderer
  const controls = ctx.controls

  scene.add(new THREE.AxesHelper(100), new THREE.GridHelper(100, 10))
  
  // 通用网格材质
  const gridMaterial = new THREE.ShaderMaterial({
      transparent: true,
      side: THREE.DoubleSide,
      uniforms: {
          color: { value: new THREE.Color(0x00caea) },
          gridX: { value: 40.0 },
          gridY: { value: 20.0 },
          lineWidth: { value: 0.6 }
      },
      vertexShader: `
          varying vec2 vUv;
          void main() {
              vUv = uv;
              gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
      `,
      fragmentShader: `
          uniform vec3 color;
          uniform float gridX;
          uniform float gridY;
          uniform float lineWidth;
          varying vec2 vUv;
          
          void main() {
              vec2 grid = vec2(gridX, gridY);
              vec2 f = fract(vUv * grid);
              vec2 df = fwidth(vUv * grid);
              vec2 line = smoothstep(df * lineWidth, df * lineWidth * 2.0, f) * 
                          smoothstep(df * lineWidth, df * lineWidth * 2.0, 1.0 - f);
              float alpha = 1.0 - min(line.x, line.y);
              if (alpha < 0.1) discard;
              gl_FragColor = vec4(color, alpha);
          }
      `
  })
  
  // 几何体列表
  const geometries = {
      'TorusKnot': new THREE.TorusKnotGeometry(15, 4, 100, 16),
      'Cylinder': new THREE.CylinderGeometry(15, 15, 40, 64),
      'Sphere': new THREE.SphereGeometry(20, 64, 32),
      'Torus': new THREE.TorusGeometry(15, 5, 32, 64),
      'Box': new THREE.BoxGeometry(30, 30, 30),
      'Cone': new THREE.ConeGeometry(15, 40, 64),
      'Capsule': new THREE.CapsuleGeometry(10, 20, 16, 32)
  }
  
  const mesh = new THREE.Mesh(geometries['TorusKnot'], gridMaterial)
  scene.add(mesh)
  
  // GUI 控制
  gui = new GUI()
  const params = { geometry: 'TorusKnot', color: '#00ffff' }
  
  gui.add(params, 'geometry', Object.keys(geometries)).name('几何体').onChange((v: any) => mesh.geometry = (geometries as any)[v])
  gui.add(gridMaterial.uniforms.gridX, 'value', 1, 100).name('横向网格')
  gui.add(gridMaterial.uniforms.gridY, 'value', 1, 100).name('纵向网格')
  gui.add(gridMaterial.uniforms.lineWidth, 'value', 0.1, 5).name('线条粗细')
  gui.addColor(params, 'color').name('颜色').onChange((v: any) => gridMaterial.uniforms.color.value.set(v))
}

onUnmounted(() => {
  gui?.destroy()
})
</script>
