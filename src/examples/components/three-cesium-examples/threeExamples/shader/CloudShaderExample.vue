<template>
  <ExampleScene
    camera="perspective"
    :camera-options="{ fov: 30, near: 1, far: 1200 }"
    :camera-position="[0, 0, 800]"
    antialias
    @ready="onReady"
    @resize="onResize"
    @before-dispose="onBeforeDispose"
  />
</template>

<script setup>
import {
  CanvasTexture,
  TextureLoader,
  PlaneGeometry,
  ShaderMaterial,
  InstancedMesh,
  Object3D,
  Vector2,
  InstancedBufferAttribute,
  Color
} from 'three'
import Stats from 'three/examples/jsm/libs/stats.module.js'
import { GUI } from 'dat.gui'
import ExampleScene from '@/examples/components/ExampleScene.vue'

const props = defineProps({
  example: {
    type: Object,
    default: () => ({})
  }
})

const vs = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * instanceMatrix * vec4(position, 1.0);
  }
`

const fs = /* glsl */ `
  varying vec2 vUv;
  uniform sampler2D map;
  uniform float fogNear;
  uniform float fogFar;
  uniform vec3 fogColor;
  uniform int enableFog;

  void main() {
    if (enableFog == 1) {
      float depth = gl_FragCoord.z / gl_FragCoord.w;
      float fogFactor = smoothstep(fogNear, fogFar, depth);
      gl_FragColor.w *= pow(gl_FragCoord.z, 20.0);
      gl_FragColor = mix(texture2D(map, vUv), vec4(fogColor, gl_FragColor.w), fogFactor);
    } else {
      gl_FragColor = texture2D(map, vUv);
    }
  }
`

let halfSize = new Vector2()
let params = null
let materialRef = null
let meshRef = null
let cameraRef = null
let statsRef = null
let guiRef = null
let canvasRef = null
let mouseMoveHandler = null

function createRandom(min = 0, max = 1) {
  return Math.random() * (max - min) + min
}

async function onReady(stageCtx) {
  const scene = stageCtx.scene
  const camera = stageCtx.camera
  const renderer = stageCtx.renderer
  const canvas = stageCtx.canvas
  canvasRef = canvas
  const container = stageCtx.container
  cameraRef = camera

  const domWidth = container.clientWidth || window.innerWidth
  const domHeight = container.clientHeight || window.innerHeight
  halfSize.set(domWidth / 2, domHeight / 2)

  params = {
    count: 800,
    enableFog: true,
    fogColor: '#4584b4',
    fogNear: -100,
    fogFar: 3000,
  }

  // background
  const backgroundCanvas = document.createElement('canvas')
  backgroundCanvas.width = domWidth
  backgroundCanvas.height = domHeight
  const ctx2d = backgroundCanvas.getContext('2d')
  const gradient = ctx2d.createLinearGradient(0, 0, 0, backgroundCanvas.height)
  gradient.addColorStop(0, '#1e4877')
  gradient.addColorStop(0.5, '#4584b4')
  ctx2d.fillStyle = gradient
  ctx2d.fillRect(0, 0, backgroundCanvas.width, backgroundCanvas.height)
  scene.background = new CanvasTexture(backgroundCanvas)

  // cloud
  const FILE_HOST = props.example?.globals?.FILE_HOST || '/external-examples/3d-file-server/'
  const cloudTexture = await new TextureLoader().loadAsync(FILE_HOST + 'images/channels/cloud.png')

  const geometry = new PlaneGeometry(64, 64)
  const material = new ShaderMaterial({
    uniforms: {
      map: { value: cloudTexture },
      fogColor: { value: new Color(params.fogColor) },
      fogNear: { value: params.fogNear },
      fogFar: { value: params.fogFar },
      enableFog: { value: Number(params.enableFog) }
    },
    vertexShader: vs,
    fragmentShader: fs,
    depthWrite: false,
    depthTest: false,
    transparent: true
  })
  materialRef = material

  const mesh = new InstancedMesh(geometry, material, params.count)
  meshRef = mesh
  scene.add(mesh)

  function updateMeshCount() {
    const count = params.count
    mesh.count = count
    mesh.dispose()
    mesh.instanceMatrix = new InstancedBufferAttribute(new Float32Array(count * 16), 16)

    const dummy = new Object3D()
    for (let j = 0; j < count; j++) {
      dummy.position.x = createRandom(-500, 500)
      dummy.position.y = -Math.random() * Math.random() * 200 - 15
      dummy.position.z = j
      dummy.rotation.z = Math.random() * Math.PI
      dummy.scale.x = dummy.scale.y = Math.random() * Math.random() * 1.5 + 0.5
      dummy.updateMatrix()
      mesh.setMatrixAt(j, dummy.matrix)
    }
    mesh.instanceMatrix.needsUpdate = true

    camera.position.z = count
    camera.far = count * 1.5
    camera.updateProjectionMatrix()
  }

  updateMeshCount()

  // stats
  const stats = new Stats()
  stats.showPanel(0)
  container.appendChild(stats.dom)
  statsRef = stats

  // mouse interaction
  const mouse = new Vector2()
  const startTime = Date.now()

  mouseMoveHandler = ({ clientX, clientY }) => {
    const rect = container.getBoundingClientRect()
    mouse.set(
      (clientX - rect.left - rect.width / 2) * 0.25,
      (clientY - rect.top - rect.height / 2) * 0.15
    )
  }
  canvas.addEventListener('mousemove', mouseMoveHandler)

  stageCtx.addUpdateCallback(() => {
    camera.position.x += (mouse.x - camera.position.x) * 0.01
    camera.position.y += (-mouse.y - camera.position.y) * 0.01
    camera.position.z = -((Date.now() - startTime) * 0.03) % params.count + params.count
    stats.update()
  })

  // gui
  const gui = new GUI()
  guiRef = gui

  gui.add(params, 'count', 0, 10000).onChange(updateMeshCount).name('Count')
  const enableFogOption = gui.add(params, 'enableFog').name('Enable Fog')

  const fogFolder = gui.addFolder('Fog')
  fogFolder.show(params.enableFog)
  fogFolder.addColor(params, 'fogColor').onChange((e) => {
    material.uniforms.fogColor.value.set(e)
    material.needsUpdate = true
  }).name('Fog Color')
  fogFolder.add(params, 'fogNear', -1000, 1000).onChange((e) => {
    material.uniforms.fogNear.value = e
    material.needsUpdate = true
  }).name('Fog Near')
  fogFolder.add(params, 'fogFar', 0, 5000).onChange((e) => {
    material.uniforms.fogFar.value = e
    material.needsUpdate = true
  }).name('Fog Far')

  enableFogOption.onChange((e) => {
    material.uniforms.enableFog.value = e ? 1 : 0
    material.needsUpdate = true
    fogFolder.show(e)
  })
}

function onBeforeDispose() {
  if (mouseMoveHandler) {
    canvasRef.removeEventListener('mousemove', mouseMoveHandler)
    mouseMoveHandler = null
  }
  if (statsRef && statsRef.dom && statsRef.dom.parentNode) {
    statsRef.dom.parentNode.removeChild(statsRef.dom)
    statsRef = null
  }
  if (guiRef) {
    guiRef.destroy()
    guiRef = null
  }
}

function onResize({ width, height }) {
  halfSize.set(width / 2, height / 2)
  if (cameraRef) {
    cameraRef.aspect = width / height || 1
    cameraRef.updateProjectionMatrix()
  }
}
</script>
