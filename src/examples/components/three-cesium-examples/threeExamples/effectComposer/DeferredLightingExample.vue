<template>
  <ExampleScene
    camera="perspective"
    :camera-options="{ fov: 75, near: 0.1, far: 10000 }"
    :camera-position="[400, 400, 400]"
    antialias
    alpha
    custom-render
    @ready="onReady"
    @resize="onResize"
    @before-dispose="onBeforeDispose"
  />
</template>

<script setup>
import * as THREE from 'three'
import Stats from 'three/examples/jsm/libs/stats.module.js'
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader.js'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js'
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js'
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js'
import { GUI } from 'three/examples/jsm/libs/lil-gui.module.min.js'
import ExampleScene from '@/examples/components/ExampleScene.vue'

const props = defineProps({
  example: {
    type: Object,
    default: () => ({})
  }
})

const HOST = props.example?.globals?.HOST || '/external-examples/three-cesium-examples/'

const gui = new GUI()
const bloomParams = {
  exposure: 1,
  bloomStrength: 0.01,
  bloomThreshold: 0,
  bloomRadius: 0.5
}

let statsRef = null
let cameraRef = null
let rendererRef = null
let controlsRef = null
let postprocessingRef = null
let effectComposerRef = null
let lightGroupRef = null
let lightTextureRef = null
let numLightsRef = 1000
let dataRef = null
let widthRef = null
let heightRef = null

const vsGBuffer = /* glsl */ `
  out vec3 vNormal;
  out vec3 vWorldPosition;
  void main() {
    vNormal = normal;
    vec4 worldPosition = modelMatrix * vec4(position, 1.0);
    vWorldPosition = worldPosition.xyz;
    gl_Position = projectionMatrix * viewMatrix * worldPosition;
  }
`

const fsGBuffer = /* glsl */ `
  in vec3 vNormal;
  in vec3 vWorldPosition;
  layout(location = 0) out vec4 gPosition;
  layout(location = 1) out vec4 gNormal;
  void main() {
    gPosition = vec4(vWorldPosition, 1.0);
    gNormal = normalize(vec4(vNormal, 1.0));
  }
`

const vsLight = /* glsl */ `
  out vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * viewMatrix * modelMatrix * vec4(position, 1.0);
  }
`

const fsLight = /* glsl */ `
  precision highp float;
  precision highp int;

  #define EMISSIVE 10

  uniform sampler2D tPosition;
  uniform sampler2D tNormal;
  uniform sampler2D tDiffuse;
  uniform sampler2D tLightData;
  uniform vec2 resolution;
  uniform int offset;

  in vec2 vUv;
  out vec4 pc_FragColor;

  const int MAX_LIGHTS_PER_PASS = 50;
  float maxDistance = 100.0;
  float smoothFactor = 300.0;

  void main() {
    vec3 diffuse = texture(tDiffuse, vUv).rgb;
    vec3 normal = texture(tNormal, vUv).rbg;
    vec3 position = texture(tPosition, vUv).rgb;
    vec3 resultColor = vec3(0.0);
    int numLights = int(resolution.x);
    for (int i = 0; i < numLights; i++) {
      vec2 uvPosition = vec2(float(i) / resolution.x, 0.0);
      vec4 positionData = texture2D(tLightData, uvPosition);
      vec3 lightPosition = positionData.xyz;
      vec3 lightDir = normalize(lightPosition - position);
      float NdotL = max(dot(normal, lightDir), 0.0);
      if (NdotL <= 0.0) {
        continue;
      }
      vec2 uvColorIntensity = vec2(float(i) / resolution.x, 1.0 / resolution.y);
      vec4 colorIntensityData = texture2D(tLightData, uvColorIntensity);
      vec3 lightColor = colorIntensityData.rgb;
      float distance = length(lightPosition - position);
      float attenuation = smoothstep(maxDistance, maxDistance - smoothFactor, distance);
      float intensity = colorIntensityData.a * attenuation;
      if (intensity > 0.0) {
        vec3 lightContribution = lightColor * diffuse * NdotL * intensity;
        resultColor += lightContribution;
      }
    }
    pc_FragColor = vec4(resultColor + diffuse, 1.0);
  }
`

function initPostprocessing(renderTargetWidth, renderTargetHeight, numLights) {
  const postprocessing = {}
  postprocessing.scene = new THREE.Scene()
  postprocessing.camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1)
  postprocessing.scene.add(postprocessing.camera)

  postprocessing.texture1 = new THREE.WebGLRenderTarget(renderTargetWidth, renderTargetHeight, {
    format: THREE.RGBAFormat,
    type: THREE.FloatType,
    colorSpace: THREE.SRGBColorSpace,
    depthBuffer: true,
    stencilBuffer: false
  })

  postprocessing.gBuffer = new THREE.WebGLRenderTarget(renderTargetWidth, renderTargetHeight, {
    format: THREE.RGBAFormat,
    type: THREE.FloatType,
    depthBuffer: true,
    count: 2
  })

  postprocessing.gBufferPass = new THREE.ShaderMaterial({
    vertexShader: vsGBuffer,
    fragmentShader: fsGBuffer,
    glslVersion: '300 es'
  })

  postprocessing.lightMaterial = new THREE.ShaderMaterial({
    vertexShader: vsLight,
    fragmentShader: fsLight,
    glslVersion: '300 es',
    uniforms: {
      tPosition: { value: postprocessing.gBuffer.textures[0] },
      tNormal: { value: postprocessing.gBuffer.textures[1] },
      tDiffuse: { value: postprocessing.texture1.texture },
      tLightData: { value: lightTextureRef },
      resolution: { value: new THREE.Vector2(numLights, 2) },
      offset: { value: 0 }
    }
  })

  postprocessing.quad = new THREE.Mesh(
    new THREE.PlaneGeometry(2.0, 2.0),
    postprocessing.lightMaterial
  )
  postprocessing.scene.add(postprocessing.quad)

  return postprocessing
}

function addLight(lightGroup, numLights, data, width) {
  for (let i = 0; i < numLights; i++) {
    const randomColor = Math.floor(Math.random() * 16777215)
    const light = new THREE.PointLight(randomColor, 50)
    light.userData.initialPosition = {
      x: Math.random() * (1000 - -1000) + -1000,
      y: Math.random() * 200 + 10,
      z: Math.random() * (1000 - -1000) + -1000
    }
    light.userData.movement = {
      xSpeed: Math.random() * 2 - 1,
      ySpeed: Math.random() * 2 - 1,
      zSpeed: Math.random() * 2 - 1,
      xFrequency: Math.random() * 2 + 1,
      yFrequency: Math.random() * 2 + 1,
      zFrequency: Math.random() * 2 + 1
    }
    light.position.set(light.userData.initialPosition.x, light.userData.initialPosition.y, light.userData.initialPosition.z)
    lightGroup.add(light)
  }
}

function updateLights(lightGroup, data, width) {
  const time = Date.now() * 0.001
  lightGroup.children.forEach((light, i) => {
    if (light instanceof THREE.PointLight) {
      const { initialPosition, movement } = light.userData
      light.position.x = initialPosition.x + Math.sin(time * movement.xFrequency) * movement.xSpeed * 50
      light.position.y = initialPosition.y + Math.sin(time * movement.yFrequency) * movement.ySpeed * 50
      light.position.z = initialPosition.z + Math.sin(time * movement.zFrequency) * movement.zSpeed * 50

      data[i * 4 + 0] = light.position.x
      data[i * 4 + 1] = light.position.y
      data[i * 4 + 2] = light.position.z
      data[i * 4 + 3] = 0.0

      data[(width * 4) + i * 4 + 0] = light.color.r
      data[(width * 4) + i * 4 + 1] = light.color.g
      data[(width * 4) + i * 4 + 2] = light.color.b
      data[(width * 4) + i * 4 + 3] = light.intensity
    }
  })
}

function updateBloom(bloomPass) {
  bloomPass.strength = bloomParams.bloomStrength
  bloomPass.radius = bloomParams.bloomRadius
  bloomPass.threshold = bloomParams.bloomThreshold
}

function onReady(stageCtx) {
  const scene = stageCtx.scene
  const camera = stageCtx.camera
  const renderer = stageCtx.renderer
  const controls = stageCtx.controls
  const container = stageCtx.container

  cameraRef = camera
  rendererRef = renderer
  controlsRef = controls

  renderer.outputColorSpace = 'srgb'
  renderer.setClearColor(0x000000)

  scene.add(camera)

  const ambientLight = new THREE.AmbientLight('#fff', 2)
  scene.add(ambientLight)

  const stats = new Stats()
  stats.showPanel(0)
  container.appendChild(stats.dom)
  statsRef = stats

  controls.enableDamping = true

  const geometry = new THREE.PlaneGeometry(10000, 10000)
  const material = new THREE.MeshBasicMaterial({ color: 0xcccccc })
  const plane = new THREE.Mesh(geometry, material)
  plane.rotation.x = -Math.PI / 2
  scene.add(plane)

  new FBXLoader().load(HOST + '/files/model/city.FBX', (object3d) => {
    object3d.scale.multiplyScalar(0.1)
    object3d.position.set(0, -1, 0)
    scene.add(object3d)
  })

  const numLights = 1000
  numLightsRef = numLights
  widthRef = numLights
  heightRef = 2

  const data = new Float32Array(widthRef * heightRef * 4)
  dataRef = data

  lightTextureRef = new THREE.DataTexture(data, widthRef, heightRef, THREE.RGBAFormat, THREE.FloatType)

  const lightGroup = new THREE.Group()
  lightGroupRef = lightGroup
  scene.add(lightGroup)
  addLight(lightGroup, numLights, data, widthRef)

  const width = container.clientWidth || window.innerWidth
  const height = container.clientHeight || window.innerHeight

  const postprocessing = initPostprocessing(width, height, numLights)
  postprocessingRef = postprocessing

  const effectComposer = new EffectComposer(renderer)
  effectComposerRef = effectComposer

  const renderPass = new RenderPass(postprocessing.scene, postprocessing.camera)
  effectComposer.addPass(renderPass)

  const bloomPass = new UnrealBloomPass(
    new THREE.Vector2(width, height),
    bloomParams.bloomStrength,
    bloomParams.bloomRadius,
    bloomParams.bloomThreshold
  )
  effectComposer.addPass(bloomPass)

  const bloomFolder = gui.addFolder('Bloom Effect')
  bloomFolder.add(bloomParams, 'bloomStrength', 0, 1).name('强度').onChange(() => updateBloom(bloomPass))
  bloomFolder.add(bloomParams, 'bloomRadius', 0, 1).name('半径').onChange(() => updateBloom(bloomPass))
  bloomFolder.add(bloomParams, 'bloomThreshold', 0, 1).name('阈值').onChange(() => updateBloom(bloomPass))
  bloomFolder.open()

  stageCtx.addUpdateCallback(() => {
    updateLights(lightGroup, data, widthRef)
    lightTextureRef.needsUpdate = true

    scene.overrideMaterial = null
    renderer.setRenderTarget(postprocessing.texture1)
    renderer.render(scene, camera)

    scene.overrideMaterial = postprocessing.gBufferPass
    renderer.setRenderTarget(postprocessing.gBuffer)
    renderer.render(scene, camera)

    renderer.setRenderTarget(null)
    renderer.render(postprocessing.scene, postprocessing.camera)

    effectComposer.render()
    stats.update()
    controls.update()
  })
}

function onResize({ width, height }) {
  if (!cameraRef || !rendererRef || !postprocessingRef || !effectComposerRef) return
  cameraRef.aspect = width / height || 1
  cameraRef.updateProjectionMatrix()
  rendererRef.setSize(width, height)

  postprocessingRef.texture1.setSize(width, height)
  postprocessingRef.gBuffer.setSize(width, height)
  effectComposerRef.setSize(width, height)
}

function onBeforeDispose() {
  if (gui) gui.destroy()
  if (statsRef && statsRef.dom && statsRef.dom.parentNode) {
    statsRef.dom.parentNode.removeChild(statsRef.dom)
  }
  if (postprocessingRef) {
    postprocessingRef.texture1.dispose()
    postprocessingRef.gBuffer.dispose()
    postprocessingRef.gBufferPass.dispose()
    postprocessingRef.lightMaterial.dispose()
    postprocessingRef.quad.geometry.dispose()
  }
  if (effectComposerRef) {
    effectComposerRef.dispose()
  }
  if (lightTextureRef) {
    lightTextureRef.dispose()
  }
}
</script>
