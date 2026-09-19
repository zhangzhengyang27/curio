import { ref, shallowRef, onMounted, onUnmounted, provide } from 'vue'
import type { Ref } from 'vue'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { SVGRenderer } from 'three/examples/jsm/renderers/SVGRenderer.js'
import { useRenderLoop } from '../../composables/useRenderLoop'
import { disposeObject3D } from '../../three/gc'

function toVector3(value: any, fallback: number[]) {
  if (!value) return new THREE.Vector3(fallback[0], fallback[1], fallback[2])
  if (Array.isArray(value)) return new THREE.Vector3(value[0] ?? fallback[0], value[1] ?? fallback[1], value[2] ?? fallback[2])
  return new THREE.Vector3(
    value.x ?? fallback[0],
    value.y ?? fallback[1],
    value.z ?? fallback[2]
  )
}

export function useSVGExampleStage(containerRef: Ref<HTMLElement | null>, overlayRef?: Ref<HTMLElement | null>, options: Record<string, any> = {}) {
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
  const cameraRef = shallowRef<any>(null)
  const rendererRef = shallowRef<any>(null)
  const controlsRef = shallowRef<any>(null)
  const isReady = ref(false)
  const size = ref({ width: 0, height: 0 })

  const renderLoop = useRenderLoop()
  const clock = new THREE.Clock()
  const updateCallbacks = new Set<(delta: number, elapsed: number) => void>()

  let mounted = false
  let resizeObserver: ResizeObserver | null = null
  let gridHelper = null
  const trackedListeners: Array<[EventTarget, string, any, any]> = []

  function getContainerSize() {
    if (fitContainer && containerRef?.value) {
      const rect = containerRef.value.getBoundingClientRect()
      return { width: rect.width || 0, height: rect.height || 0 }
    }
    return { width: window.innerWidth, height: window.innerHeight }
  }

  function createCamera(width: number, height: number) {
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

  function setCamera(camera: any) {
    if (!camera) return
    cameraRef.value = camera
    applySize()
  }

  function addUpdateCallback(fn: (delta: number, elapsed: number) => void) {
    updateCallbacks.add(fn)
  }

  function removeUpdateCallback(fn: (delta: number, elapsed: number) => void) {
    updateCallbacks.delete(fn)
  }

  function add(obj: any) {
    scene.add(obj)
  }

  function remove(obj: any) {
    scene.remove(obj)
  }

  function renderOnce() {
    renderFrame()
  }

  function resize() {
    applySize()
  }

  /**
   * 追踪事件监听器，dispose 时自动移除。
   */
  function listen(target: any, type: string, fn: any, opts?: any) {
    target.addEventListener(type, fn, opts)
    trackedListeners.push([target, type, fn, opts])
  }

  function dispose() {
    if (!mounted) return
    mounted = false

    if (onBeforeDispose) onBeforeDispose(ctx)

    // 移除所有被追踪的事件监听器
    trackedListeners.forEach(([target, type, fn, opts]) => {
      try { target.removeEventListener(type, fn, opts) } catch { /* ignore */ }
    })
    trackedListeners.length = 0

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
    if (onReady) {
      const origWinAdd = window.addEventListener
      const origDocAdd = document.addEventListener
      window.addEventListener = function (type: string, fn: any, opts?: any) {
        trackedListeners.push([window, type, fn, opts])
        return origWinAdd.call(window, type, fn, opts)
      }
      document.addEventListener = function (type: string, fn: any, opts?: any) {
        trackedListeners.push([document, type, fn, opts])
        return origDocAdd.call(document, type, fn, opts)
      }
      try {
        const result = onReady(ctx)
        if (result && typeof result.catch === 'function') {
          result.catch((err: any) => {
            console.warn('[useSVGExampleStage] onReady async error:', err)
          })
        }
      } finally {
        window.addEventListener = origWinAdd
        document.addEventListener = origDocAdd
      }
    }
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
    listen,
    dispose,
  }

  provide('exampleScene', ctx)
  return ctx
}
