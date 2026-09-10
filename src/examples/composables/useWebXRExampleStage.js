import { ref, shallowRef, onMounted, onUnmounted, provide } from 'vue'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { VRButton } from 'three/examples/jsm/webxr/VRButton.js'
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

export function useWebXRExampleStage(canvasRef, containerRef, overlayRef, options = {}) {
  const {
    camera: cameraType = 'perspective',
    cameraOptions = {},
    cameraPosition,
    cameraLookAt,
    clearColor = 0x0a0a1a,
    clearAlpha: userClearAlpha,
    alpha = false,
    antialias = true,
    preserveDrawingBuffer = false,
    enableControls = true,
    controlOptions = {},
    shadowMap = false,
    defaultLights = false,
    fitContainer = true,
    _autoStart = true,
    maxPixelRatio = 2,
    grid = false,
    customRender = false,
    rendererOptions = {},
    onReady,
    onResize: onResizeCallback,
    onBeforeDispose,
  } = options

  const clearAlpha = userClearAlpha ?? (alpha ? 0 : 1)

  const scene = new THREE.Scene()
  const cameraRef = shallowRef(null)
  const rendererRef = shallowRef(null)
  const controlsRef = shallowRef(null)
  const isReady = ref(false)
  const size = ref({ width: 0, height: 0 })

  const clock = new THREE.Clock()
  const updateCallbacks = new Set()

  let mounted = false
  let resizeObserver = null
  let gridHelper = null
  let vrButton = null
  let xrLoopSet = false
  const trackedListeners = []

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
    const renderer = new THREE.WebGLRenderer({
      canvas: canvasRef.value,
      antialias,
      alpha,
      preserveDrawingBuffer,
      ...rendererOptions,
    })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, maxPixelRatio))
    renderer.setClearColor(clearColor, clearAlpha)
    renderer.xr.enabled = true
    if (shadowMap) {
      renderer.shadowMap.enabled = true
      renderer.shadowMap.type =
        typeof shadowMap === 'object' && shadowMap.type ? shadowMap.type : THREE.PCFSoftShadowMap
    }
    rendererRef.value = renderer

    if (containerRef?.value) {
      vrButton = VRButton.createButton(renderer)
      containerRef.value.appendChild(vrButton)
    }
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

    rendererRef.value.setSize(width, height, false)
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
    if (!customRender) rendererRef.value.render(scene, cameraRef.value)
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

  /**
   * 追踪事件监听器，dispose 时自动移除。
   */
  function listen(target, type, fn, opts) {
    target.addEventListener(type, fn, opts)
    trackedListeners.push([target, type, fn, opts])
  }

  function dispose() {
    if (!mounted) return
    mounted = false

    if (onBeforeDispose) onBeforeDispose(ctx)

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

    if (xrLoopSet && rendererRef.value) {
      rendererRef.value.setAnimationLoop(null)
      xrLoopSet = false
    }

    updateCallbacks.clear()
    clock.stop()

    if (controlsRef.value) {
      controlsRef.value.dispose()
      controlsRef.value = null
    }

    if (rendererRef.value) {
      disposeObject3D(scene)
      rendererRef.value.dispose()
      rendererRef.value = null
    }

    if (vrButton && vrButton.parentNode) {
      vrButton.parentNode.removeChild(vrButton)
      vrButton = null
    }

    cameraRef.value = null
    isReady.value = false
  }

  function mount() {
    if (mounted) return
    if (!canvasRef.value) {
      console.warn('[useWebXRExampleStage] canvas element is not available')
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

    if (rendererRef.value) {
      rendererRef.value.setAnimationLoop(renderFrame)
      xrLoopSet = true
    }

    isReady.value = true
    if (onReady) {
      const origWinAdd = window.addEventListener
      const origDocAdd = document.addEventListener
      window.addEventListener = function (type, fn, opts) {
        trackedListeners.push([window, type, fn, opts])
        return origWinAdd.call(window, type, fn, opts)
      }
      document.addEventListener = function (type, fn, opts) {
        trackedListeners.push([document, type, fn, opts])
        return origDocAdd.call(document, type, fn, opts)
      }
      try {
        const result = onReady(ctx)
        if (result && typeof result.catch === 'function') {
          result.catch((err) => {
            console.warn('[useWebXRExampleStage] onReady async error:', err)
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

  const renderLoop = {
    isRunning: ref(true),
    start() {},
    stop() {},
    setRenderFn() {},
  }

  const ctx = {
    scene,
    get camera() {
      return cameraRef.value
    },
    get renderer() {
      return rendererRef.value
    },
    get controls() {
      return controlsRef.value
    },
    get canvas() {
      return canvasRef.value
    },
    get container() {
      return containerRef.value
    },
    get overlay() {
      return overlayRef?.value
    },
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
