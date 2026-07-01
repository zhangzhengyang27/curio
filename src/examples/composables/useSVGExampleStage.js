import { ref, shallowRef, onMounted, onUnmounted, provide } from 'vue'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { SVGRenderer } from 'three/examples/jsm/renderers/SVGRenderer.js'
import { useRenderLoop } from '../../composables/useRenderLoop.js'
import { disposeObject3D } from '../../three/gc.js'

function toVector3(value, fallback) {
  if (!value) return new THREE.Vector3(...fallback)
  if (Array.isArray(value)) return new THREE.Vector3(value[0] ?? fallback[0], value[1] ?? fallback[1], value[2] ?? fallback[2])
  return new THREE.Vector3(
    value.x ?? fallback[0],
    value.y ?? fallback[1],
    value.z ?? fallback[2]
  )
}

export function useSVGExampleStage(containerRef, overlayRef, options = {}) {
  const {
    camera: cameraType = 'perspective',
    cameraOptions = {},
    cameraPosition,
    cameraLookAt,
    enableControls = true,
    controlOptions = {},
    fitContainer = true,
    autoStart = true,
    colorManagement = false,
    defaultLights = false,
    grid = false,
    onReady,
    onResize: onResizeCallback,
    onBeforeDispose,
  } = options

  THREE.ColorManagement.enabled = colorManagement

  const scene = new THREE.Scene()
  const cameraRef = shallowRef(null)
  const rendererRef = shallowRef(null)
  const controlsRef = shallowRef(null)
  const isReady = ref(false)
  const size = ref({ width: 0, height: 0 })

  const renderLoop = useRenderLoop()
  const clock = new THREE.Clock()
  const updateCallbacks = new Set()

  let mounted = false
  let resizeObserver = null
  let gridHelper = null

  function getContainerSize() {
    if (fitContainer && containerRef?.value) {
      const rect = containerRef.value.getBoundingClientRect()
      return { width: rect.width || 0, height: rect.height || 0 }
    }
    return { width: window.innerWidth, height: window.innerHeight }
  }

  function createCamera(width, height) {
    const aspect = width / height || 1
    if (cameraType === 'orthographic') {
      const { size = 10 } = cameraOptions
      return new THREE.OrthographicCamera(-size * aspect, size * aspect, size, -size, 0.1, 2000)
    }
    const { fov = 75, near = 0.1, far = 1000 } = cameraOptions
    return new THREE.PerspectiveCamera(fov, aspect, near, far)
  }

  function setupRenderer() {
    if (!containerRef?.value) return
    const renderer = new SVGRenderer()
    renderer.domElement.setAttribute('class', 'example-scene-svg-renderer')
    renderer.domElement.style.display = 'block'
    renderer.domElement.style.width = '100%'
    renderer.domElement.style.height = '100%'
    containerRef.value.appendChild(renderer.domElement)
    rendererRef.value = renderer
  }

  function setupCamera() {
    const { width, height } = getContainerSize()
    cameraRef.value = createCamera(width, height)

    const defaultPosition = cameraType === 'orthographic' ? [20, 20, 20] : [0, 0, 5]
    cameraRef.value.position.copy(toVector3(cameraPosition, defaultPosition))
    cameraRef.value.lookAt(toVector3(cameraLookAt, [0, 0, 0]))
  }

  function setupControls() {
    if (!enableControls || !cameraRef.value || !rendererRef.value) return
    const controls = new OrbitControls(cameraRef.value, rendererRef.value.domElement)
    controls.enableDamping = controlOptions.enableDamping ?? true
    controls.dampingFactor = controlOptions.dampingFactor ?? 0.05
    Object.assign(controls, controlOptions)
    controlsRef.value = controls
  }

  function setupLights() {
    if (!defaultLights) return
    const config = typeof defaultLights === 'object' ? defaultLights : {}
    const ambient = new THREE.AmbientLight(config.ambientColor ?? 0xffffff, config.ambientIntensity ?? 0.6)
    scene.add(ambient)

    const dir = new THREE.DirectionalLight(config.dirColor ?? 0xffffff, config.dirIntensity ?? 0.8)
    dir.position.copy(toVector3(config.dirPosition, [10, 20, 10]))
    scene.add(dir)
  }

  function setupGrid() {
    if (!grid) return
    gridHelper = new THREE.GridHelper(20, 20, 0x444444, 0x222222)
    scene.add(gridHelper)
  }

  function applySize() {
    const { width, height } = getContainerSize()
    if (width === 0 || height === 0) return
    size.value = { width, height }

    if (!rendererRef.value || !cameraRef.value) return

    if (cameraRef.value.isPerspectiveCamera) {
      cameraRef.value.aspect = width / height || 1
      cameraRef.value.updateProjectionMatrix()
    } else if (cameraRef.value.isOrthographicCamera) {
      const { size = 10 } = cameraOptions
      const aspect = width / height || 1
      cameraRef.value.left = -size * aspect
      cameraRef.value.right = size * aspect
      cameraRef.value.top = size
      cameraRef.value.bottom = -size
      cameraRef.value.updateProjectionMatrix()
    }

    rendererRef.value.setSize(width, height)
    if (onResizeCallback) onResizeCallback({ width, height })
  }

  function onWindowResize() {
    applySize()
  }

  function renderFrame() {
    const delta = clock.getDelta()
    const elapsed = clock.getElapsedTime()
    updateCallbacks.forEach((fn) => fn(delta, elapsed))
    if (controlsRef.value) controlsRef.value.update()
    if (rendererRef.value) rendererRef.value.render(scene, cameraRef.value)
  }

  function setCamera(camera) {
    if (!camera) return
    cameraRef.value = camera
    applySize()
  }

  function addUpdateCallback(fn) {
    updateCallbacks.add(fn)
  }

  function removeUpdateCallback(fn) {
    updateCallbacks.delete(fn)
  }

  function add(obj) {
    scene.add(obj)
  }

  function remove(obj) {
    scene.remove(obj)
  }

  function renderOnce() {
    renderFrame()
  }

  function resize() {
    applySize()
  }

  function dispose() {
    if (!mounted) return
    mounted = false

    if (onBeforeDispose) onBeforeDispose(ctx)

    if (resizeObserver) {
      resizeObserver.disconnect()
      resizeObserver = null
    } else {
      window.removeEventListener('resize', onWindowResize)
    }

    renderLoop.stop()
    renderLoop.setRenderFn(null)
    updateCallbacks.clear()
    clock.stop()

    if (controlsRef.value) {
      controlsRef.value.dispose()
      controlsRef.value = null
    }

    disposeObject3D(scene)

    if (rendererRef.value) {
      if (rendererRef.value.domElement.parentNode) {
        rendererRef.value.domElement.parentNode.removeChild(rendererRef.value.domElement)
      }
      rendererRef.value = null
    }

    cameraRef.value = null
    isReady.value = false
  }

  function mount() {
    if (mounted) return
    if (!containerRef.value) {
      console.warn('[useSVGExampleStage] container element is not available')
      return
    }
    mounted = true

    setupRenderer()
    setupCamera()
    setupControls()
    setupLights()
    setupGrid()
    applySize()

    if (fitContainer && containerRef?.value && window.ResizeObserver) {
      resizeObserver = new ResizeObserver(() => applySize())
      resizeObserver.observe(containerRef.value)
    } else {
      window.addEventListener('resize', onWindowResize)
    }

    renderLoop.setRenderFn(renderFrame)
    if (autoStart) renderLoop.start()

    isReady.value = true
    if (onReady) onReady(ctx)
  }

  onMounted(mount)
  onUnmounted(dispose)

  const ctx = {
    scene,
    get camera() { return cameraRef.value },
    get renderer() { return rendererRef.value },
    get rendererDomElement() { return rendererRef.value?.domElement },
    get controls() { return controlsRef.value },
    get container() { return containerRef.value },
    get overlay() { return overlayRef?.value },
    renderLoop,
    isReady,
    size,
    add,
    remove,
    addUpdateCallback,
    removeUpdateCallback,
    setCamera,
    renderOnce,
    resize,
    dispose,
  }

  provide('exampleScene', ctx)
  return ctx
}
