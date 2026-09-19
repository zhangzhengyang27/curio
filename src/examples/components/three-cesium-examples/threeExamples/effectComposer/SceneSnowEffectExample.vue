<template>
  <ExampleScene
    camera="perspective"
    :camera-options="{ fov: 75, near: 0.1, far: 10000 }"
    :camera-position="[0, 100, 300]"
    :camera-look-at="[0, 0, 0]"
    antialias
    alpha
    custom-render
    @ready="onReady"
    @resize="onResize"
    @before-dispose="onBeforeDispose"
  />
</template>

<script setup lang="ts">
import * as THREE from 'three'
import Stats from 'three/examples/jsm/libs/stats.module.js'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js'
import { GUI } from 'three/examples/jsm/libs/lil-gui.module.min.js'
import ExampleScene from '@/examples/components/ExampleScene.vue'

const props = defineProps({
  example: {
    type: Object,
    default: () => ({})
  }
})

const FILE_HOST = props.example?.globals?.FILE_HOST || '/external-examples/3d-file-server/'
const HOST = props.example?.globals?.HOST || '/external-examples/three-cesium-examples/'

const gui = new GUI()
let statsRef: any = null
let pointMeshRef: any = null
let cityModelRef: any = null
let postprocessingRef: any = null
let cameraRef: any = null
let rendererRef: any = null
let controlsRef: any = null
let sceneRef: any = null
let paramsRef: any = null
let verticesRef: any = null
let offsetRef: any = null
let sizeRef: any = null

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

const fsFinal = /* glsl */ `
  precision highp float;
  precision highp int;

  #define EMISSIVE 10

  uniform sampler2D tPosition;
  uniform sampler2D tNormal;
  uniform sampler2D tDiffuse;
  uniform vec2 resolution;
  uniform float time;
  uniform vec3 uCameraPosition;
  uniform float snowAmount;
  uniform float snowNoise;
  uniform float snowEdge;

  in vec2 vUv;
  out vec4 fragColor;

  float rand(vec2 co) {
    return fract(sin(dot(co.xy, vec2(12.9898, 78.233))) * 43758.5453);
  }

  float noise(vec2 p) {
    vec2 ip = floor(p);
    vec2 fp = fract(p);
    float a = rand(ip);
    float b = rand(ip + vec2(1.0, 0.0));
    float c = rand(ip + vec2(0.0, 1.0));
    float d = rand(ip + vec2(1.0, 1.0));
    vec2 u = fp * fp * (3.0 - 2.0 * fp);
    return mix(a, b, u.x) + (c - a) * u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
  }

  float fbm(vec2 p) {
    float total = 0.0;
    float amplitude = 1.0;
    for (int i = 0; i < 4; i++) {
      total += noise(p) * amplitude;
      p *= 2.0;
      amplitude *= 0.5;
    }
    return total;
  }

  void main() {
    vec3 position = texture(tPosition, vUv).rgb;
    vec3 normal = normalize(texture(tNormal, vUv).rgb);
    vec4 diffuseSample = texture(tDiffuse, vUv);
    vec3 diffuse = diffuseSample.rgb;
    if (diffuseSample.a < 0.01) discard;

    float snowFactor = max(0.0, dot(normal, vec3(0.0, 1.0, 0.0)));
    snowFactor = pow(snowFactor, 3.0);

    vec2 noiseCoord = position.xz * 0.5 + vec2(time * 0.05);
    float noiseVal = fbm(noiseCoord);
    snowFactor = clamp(snowFactor + (noiseVal - 0.5) * snowNoise, 0.0, 1.0);
    snowFactor *= snowAmount;

    vec2 texelSize = 1.0 / resolution;
    float depthCenter = texture(tPosition, vUv).z;
    float depthRight = texture(tPosition, vUv + vec2(texelSize.x, 0.0)).z;
    float depthBottom = texture(tPosition, vUv + vec2(0.0, texelSize.y)).z;
    float depthDiff = max(abs(depthCenter - depthRight), abs(depthCenter - depthBottom));
    snowFactor = max(snowFactor, smoothstep(0.0, 0.1, depthDiff) * snowEdge);

    vec3 snowColor = mix(vec3(0.95, 0.96, 0.98), vec3(1.0), noiseVal * 0.2);
    vec3 finalColor = mix(diffuse, snowColor, smoothstep(0.3, 0.7, snowFactor));

    if (snowFactor > 0.3) {
      vec3 lightDir = normalize(vec3(1.0, 1.0, 1.0));
      vec3 viewDir = normalize(uCameraPosition - position);
      vec3 halfDir = normalize(lightDir + viewDir);
      float spec = pow(max(0.0, dot(normal, halfDir)), 32.0);
      finalColor += spec * 0.1 * vec3(1.0) * snowFactor;
    }

    finalColor = mix(finalColor, vec3(1.0), snowFactor * 0.3);
    fragColor = vec4(finalColor, 1.0);
  }
`

const vsFinal = /* glsl */ `
  out vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * viewMatrix * modelMatrix * vec4(position, 1.0);
  }
`

function initPostprocessing(renderTargetWidth: any, renderTargetHeight: any, scene: any) {
  const postprocessing: any = {}
  postprocessing.scene = new THREE.Scene()
  postprocessing.camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1)
  postprocessing.scene.add(postprocessing.camera)

  postprocessing.difusse = new THREE.WebGLRenderTarget(renderTargetWidth, renderTargetHeight, {
    format: THREE.RGBAFormat,
    type: THREE.FloatType,
    colorSpace: THREE.SRGBColorSpace,
    depthBuffer: true,
    samples: 4,
    minFilter: THREE.NearestFilter,
    magFilter: THREE.NearestFilter,
    stencilBuffer: false
  })

  postprocessing.gBuffer = new THREE.WebGLRenderTarget(renderTargetWidth, renderTargetHeight, {
    format: THREE.RGBAFormat,
    type: THREE.FloatType,
    depthBuffer: true,
    samples: 4,
    count: 2
  })

  postprocessing.gBufferPass = new THREE.ShaderMaterial({
    vertexShader: vsGBuffer,
    fragmentShader: fsGBuffer,
    glslVersion: '300 es'
  })

  postprocessing.finalMaterial = new THREE.ShaderMaterial({
    vertexShader: vsFinal,
    fragmentShader: fsFinal,
    glslVersion: '300 es',
    uniforms: {
      tPosition: { value: postprocessing.gBuffer.textures[0] },
      tNormal: { value: postprocessing.gBuffer.textures[1] },
      tDiffuse: { value: postprocessing.difusse.texture },
      resolution: { value: new THREE.Vector2(renderTargetWidth, renderTargetHeight) },
      time: { value: 0 },
      uCameraPosition: { value: new THREE.Vector3() },
      snowAmount: { value: 0.7 },
      snowNoise: { value: 0.3 },
      snowEdge: { value: 0.5 }
    }
  })

  postprocessing.quad = new THREE.Mesh(
    new THREE.PlaneGeometry(2.0, 2.0),
    postprocessing.finalMaterial
  )
  postprocessing.scene.add(postprocessing.quad)

  return postprocessing
}

function updatePoints(vertices: any, offset: any, size: any, pointMesh: any) {
  for (let i = 1; i < vertices.length; i += 3) {
    vertices[i] -= 0.5
    vertices[i - 1] -= offset[i - 1]
    vertices[i + 1] -= offset[i + 1]
    if (vertices[i] < 0) {
      vertices[i] = 600
    }
    if (vertices[i - 1] < size.minX || vertices[i - 1] > size.maxX) {
      offset[i - 1] = -offset[i - 1]
    }
    if (vertices[i + 1] < size.minZ || vertices[i + 1] > size.maxZ) {
      offset[i + 1] = -offset[i + 1]
    }
  }
  pointMesh.geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3))
}

function onReady(stageCtx: any) {
  const scene = stageCtx.scene
  const camera = stageCtx.camera
  const renderer = stageCtx.renderer
  const controls = stageCtx.controls
  const container = stageCtx.container

  sceneRef = scene
  cameraRef = camera
  rendererRef = renderer
  controlsRef = controls

  renderer.outputColorSpace = 'srgb'
  renderer.setClearColor(0x000000)

  const ambientLight = new THREE.AmbientLight('#fff', 2)
  scene.add(ambientLight)

  const width = container.clientWidth || window.innerWidth
  const height = container.clientHeight || window.innerHeight

  sizeRef = {
    width,
    height,
    maxX: 20,
    minX: -20,
    maxY: 20,
    minY: 0,
    maxZ: 20,
    minZ: -20
  }

  const params = {
    snowEnabled: true,
    snowAmount: 0.7
  }
  paramsRef = params

  const folder = gui.addFolder('调节参数')
  folder.add(params, 'snowEnabled').name('启用雪效果').onChange((value) => {
    params.snowEnabled = value
  })
  folder.add(params, 'snowAmount', 0, 1, 0.01).name('雪量').onChange((value) => {
    if (postprocessingRef) {
      postprocessingRef.finalMaterial.uniforms.snowAmount.value = value
    }
  })

  const vertices: any[] = []
  const offset: any[] = []
  const particleCount = 1000
  for (let i = 0; i < particleCount; i++) {
    const x = 1000 * (Math.random() - 0.5)
    const y = 600 * Math.random()
    const z = 1000 * (Math.random() - 0.5)
    vertices.push(x, y, z)
    offset.push(Math.random() - 0.5, 0, Math.random() - 0.5)
  }
  verticesRef = vertices
  offsetRef = offset

  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3))

  const texture = new THREE.TextureLoader().load(HOST + 'files/images/snow.png')
  const pointMesh = new THREE.Points(
    geometry,
    new THREE.PointsMaterial({
      size: 5,
      depthTest: true,
      map: texture,
      transparent: true,
      blending: THREE.AdditiveBlending,
      opacity: 0.8,
      sizeAttenuation: true
    })
  )
  pointMeshRef = pointMesh
  scene.add(pointMesh)

  const stats = new Stats()
  stats.showPanel(0)
  container.appendChild(stats.dom)
  statsRef = stats

  controls.enableDamping = true

  const postprocessing = initPostprocessing(width, height, scene)
  postprocessingRef = postprocessing

  const gltfLoader = new GLTFLoader()
  const dracoLoader = new DRACOLoader()
  dracoLoader.setDecoderPath(FILE_HOST + 'js/three/draco/')
  gltfLoader.setDRACOLoader(dracoLoader)

  gltfLoader.load(FILE_HOST + 'models/modern_city.glb', (gltf) => {
    gltf.scene.scale.set(0.01, 0.01, 0.01)
    cityModelRef = gltf.scene
    scene.add(gltf.scene)
  }, (event) => {
    const percentComplete = (event.loaded / event.total * 100).toFixed(2)
    console.log(`模型加载进度: ${percentComplete}%`)
  })

  stageCtx.addUpdateCallback((delta: number, elapsed: number) => {
    postprocessing.finalMaterial.uniforms.time.value = elapsed
    postprocessing.finalMaterial.uniforms.uCameraPosition.value.copy(camera.position)

    if (params.snowEnabled) {
      pointMesh.visible = true
      updatePoints(vertices, offset, sizeRef, pointMesh)
      scene.overrideMaterial = null
      renderer.setRenderTarget(postprocessing.difusse)
      renderer.render(scene, camera)
      scene.overrideMaterial = postprocessing.gBufferPass
      renderer.setRenderTarget(postprocessing.gBuffer)
      renderer.render(scene, camera)
      renderer.setRenderTarget(null)
      renderer.render(postprocessing.scene, postprocessing.camera)
    } else {
      pointMesh.visible = false
      scene.overrideMaterial = null
      renderer.setRenderTarget(null)
      renderer.render(scene, camera)
    }

    stats.update()
    controls.update()
  })
}

function onResize({ width, height }: any) {
  if (!cameraRef || !rendererRef || !postprocessingRef) return
  cameraRef.aspect = width / height || 1
  cameraRef.updateProjectionMatrix()
  rendererRef.setSize(width, height)

  postprocessingRef.difusse.setSize(width, height)
  postprocessingRef.gBuffer.setSize(width, height)
  postprocessingRef.finalMaterial.uniforms.resolution.value.set(width, height)
}

function onBeforeDispose() {
  if (gui) gui.destroy()
  if (statsRef && statsRef.dom && statsRef.dom.parentNode) {
    statsRef.dom.parentNode.removeChild(statsRef.dom)
  }
  if (postprocessingRef) {
    postprocessingRef.difusse.dispose()
    postprocessingRef.gBuffer.dispose()
    postprocessingRef.gBufferPass.dispose()
    postprocessingRef.finalMaterial.dispose()
    postprocessingRef.quad.geometry.dispose()
  }
}
</script>
