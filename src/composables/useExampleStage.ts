import { ref, shallowRef, onMounted, onUnmounted, provide } from 'vue'
import type { Ref } from 'vue'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { CSS2DRenderer } from 'three/examples/jsm/renderers/CSS2DRenderer.js'
import { CSS3DRenderer } from 'three/examples/jsm/renderers/CSS3DRenderer.js'
import { useRenderLoop } from './useRenderLoop'
import { disposeObject3D } from '../three/gc'

/** 相机位置输入：数组 / {x,y,z} 局部对象 / null */
type Vector3Input = [number, number, number] | { x?: number; y?: number; z?: number } | null

/**
 * 将相机位置/目标统一转为 THREE.Vector3
 */
function toVector3(value: Vector3Input | undefined, fallback: [number, number, number]): THREE.Vector3 {
  if (!value) return new THREE.Vector3(...fallback)
  if (Array.isArray(value)) return new THREE.Vector3(value[0] ?? fallback[0], value[1] ?? fallback[1], value[2] ?? fallback[2])
  return new THREE.Vector3(
    value.x ?? fallback[0],
    value.y ?? fallback[1],
    value.z ?? fallback[2]
  )
}

export interface ExampleStageOptions {
  camera?: 'perspective' | 'orthographic'
  cameraOptions?: { fov?: number; near?: number; far?: number; size?: number }
  cameraPosition?: Vector3Input
  cameraLookAt?: Vector3Input
  clearColor?: THREE.ColorRepresentation
  clearAlpha?: number
  alpha?: boolean
  antialias?: boolean
  preserveDrawingBuffer?: boolean
  enableControls?: boolean
  controlOptions?: Record<string, any>
  shadowMap?: boolean | { type?: THREE.ShadowMapType }
  defaultLights?: boolean | {
    ambientColor?: THREE.ColorRepresentation
    ambientIntensity?: number
    dirColor?: THREE.ColorRepresentation
    dirIntensity?: number
    dirPosition?: Vector3Input
  }
  fitContainer?: boolean
  autoStart?: boolean
  maxPixelRatio?: number
  grid?: boolean
  customRender?: boolean
  /** 'css2d' | 'css3d' | 'both' */
  cssRenderer?: string
  rendererOptions?: Record<string, any>
  onReady?: (ctx: ExampleStageCtx) => Promise<void> | void
  onResize?: (size: { width: number; height: number }) => void
  onBeforeDispose?: (ctx: ExampleStageCtx) => void
}

/** useExampleStage 注入给示例回调的上下文 */
export interface ExampleStageCtx {
  scene: THREE.Scene
  readonly camera: THREE.Camera | null
  readonly renderer: THREE.WebGLRenderer | null
  readonly controls: OrbitControls | null
  readonly canvas: HTMLCanvasElement | null
  readonly container: HTMLElement | null
  readonly overlay: HTMLElement | null
  renderLoop: ReturnType<typeof useRenderLoop>
  isReady: Ref<boolean>
  size: Ref<{ width: number; height: number }>
  add(obj: THREE.Object3D): void
  remove(obj: THREE.Object3D): void
  addUpdateCallback(fn: (delta: number, elapsed: number) => void): void
  removeUpdateCallback(fn: (delta: number, elapsed: number) => void): void
  setCamera(camera: THREE.Camera): void
  renderOnce(): void
  resize(): void
  listen(target: EventTarget, type: string, fn: EventListener, opts?: AddEventListenerOptions | boolean): void
  dispose(): void
}

/**
 * ExampleScene 基座逻辑
 * 统一管理 Three.js 场景、相机、渲染器、轨道控制器与渲染循环。
 *
 * @param canvasRef
 * @param containerRef
 */
export function useExampleStage(
  canvasRef: Ref<HTMLCanvasElement | null>,
  containerRef: Ref<HTMLElement | null>,
  overlayRef?: Ref<HTMLElement | null>,
  options: ExampleStageOptions = {}
): ExampleStageCtx {
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
    autoStart = true,
    maxPixelRatio = 2,
    grid = false,
    customRender = false,
    cssRenderer = '', // 'css2d' | 'css3d' | 'both'
    rendererOptions = {},
    onReady,
    onResize: onResizeCallback,
    onBeforeDispose,
  } = options

  const clearAlpha = userClearAlpha ?? (alpha ? 0 : 1)

  const scene = new THREE.Scene()
  const cameraRef = shallowRef<THREE.Camera | null>(null)
  const rendererRef = shallowRef<THREE.WebGLRenderer | null>(null)
  const controlsRef = shallowRef<OrbitControls | null>(null)
  const isReady = ref(false)
  const size = ref({ width: 0, height: 0 })

  const renderLoop = useRenderLoop()
  const timer = new THREE.Timer()
  const updateCallbacks = new Set<(delta: number, elapsed: number) => void>()

  let mounted = false
  const trackedRafIds = new Set<number>()
  let resizeObserver: ResizeObserver | null = null
  let gridHelper: THREE.GridHelper | null = null
  let css2dRenderer: CSS2DRenderer | null = null
  let css3dRenderer: CSS3DRenderer | null = null
  const trackedListeners: Array<[EventTarget, string, EventListener, AddEventListenerOptions | boolean | undefined]> = []

  function getContainerSize(): { width: number; height: number } {
    if (fitContainer && containerRef?.value) {
      const rect = containerRef.value.getBoundingClientRect()
      return { width: rect.width || 0, height: rect.height || 0 }
    }
    return { width: window.innerWidth, height: window.innerHeight }
  }

  function createCamera(width: number, height: number): THREE.Camera {
    const aspect = width / height || 1
    if (cameraType === 'orthographic') {
      const { size = 10 } = cameraOptions
      return new THREE.OrthographicCamera(-size * aspect, size * aspect, size, -size, 0.1, 2000)
    }
    const { fov = 75, near = 0.1, far = 1000 } = cameraOptions
    return new THREE.PerspectiveCamera(fov, aspect, near, far)
  }

  function setupRenderer(): void {
    const renderer = new THREE.WebGLRenderer({
      canvas: canvasRef.value!,
      antialias,
      alpha,
      preserveDrawingBuffer,
      ...rendererOptions,
    })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, maxPixelRatio))
    renderer.setClearColor(clearColor, clearAlpha)
    if (shadowMap) {
      renderer.shadowMap.enabled = true
      renderer.shadowMap.type =
        typeof shadowMap === 'object' && shadowMap.type ? shadowMap.type : THREE.PCFSoftShadowMap
    }
    rendererRef.value = renderer
  }

  function setupCssRenderer(): void {
    if (!cssRenderer || !containerRef?.value) return

    const container = containerRef.value
    const needCss2d = cssRenderer === 'css2d' || cssRenderer === 'both'
    const needCss3d = cssRenderer === 'css3d' || cssRenderer === 'both'

    if (needCss2d) {
      css2dRenderer = new CSS2DRenderer()
      css2dRenderer.domElement.className = 'example-scene-css-renderer example-scene-css2d'
      container.appendChild(css2dRenderer.domElement)
    }
    if (needCss3d) {
      css3dRenderer = new CSS3DRenderer()
      css3dRenderer.domElement.className = 'example-scene-css-renderer example-scene-css3d'
      container.appendChild(css3dRenderer.domElement)
    }
  }

  function updateCssRendererSize(width: number, height: number): void {
    if (css2dRenderer) css2dRenderer.setSize(width, height)
    if (css3dRenderer) css3dRenderer.setSize(width, height)
  }

  function renderCssRenderer(): void {
    if (css3dRenderer) css3dRenderer.render(scene, cameraRef.value!)
    if (css2dRenderer) css2dRenderer.render(scene, cameraRef.value!)
  }

  function setupCamera(): void {
    const { width, height } = getContainerSize()
    cameraRef.value = createCamera(width, height)

    const defaultPosition = cameraType === 'orthographic' ? [20, 20, 20] : [0, 0, 5]
    cameraRef.value.position.copy(toVector3(cameraPosition, defaultPosition as [number, number, number]))
    cameraRef.value.lookAt(toVector3(cameraLookAt, [0, 0, 0]))
  }

  function setupControls(): void {
    if (!enableControls || !cameraRef.value || !rendererRef.value) return
    const controls = new OrbitControls(cameraRef.value, rendererRef.value.domElement)
    controls.enableDamping = controlOptions.enableDamping ?? true
    controls.dampingFactor = controlOptions.dampingFactor ?? 0.05
    Object.assign(controls, controlOptions)
    controlsRef.value = controls
  }

  function setupLights(): void {
    if (!defaultLights) return
    const config = typeof defaultLights === 'object' ? defaultLights : {}
    const ambient = new THREE.AmbientLight(config.ambientColor ?? 0xffffff, config.ambientIntensity ?? 0.6)
    scene.add(ambient)

    const dir = new THREE.DirectionalLight(config.dirColor ?? 0xffffff, config.dirIntensity ?? 0.8)
    dir.position.copy(toVector3(config.dirPosition ?? null, [10, 20, 10]))
    scene.add(dir)
  }

  function setupGrid(): void {
    if (!grid) return
    gridHelper = new THREE.GridHelper(20, 20, 0x444444, 0x222222)
    scene.add(gridHelper)
  }

  function applySize(): void {
    const { width, height } = getContainerSize()
    if (width === 0 || height === 0) return
    size.value = { width, height }

    if (!rendererRef.value || !cameraRef.value) return

    if ((cameraRef.value as THREE.PerspectiveCamera).isPerspectiveCamera) {
      const pcam = cameraRef.value as THREE.PerspectiveCamera
      pcam.aspect = width / height || 1
      pcam.updateProjectionMatrix()
    } else if ((cameraRef.value as THREE.OrthographicCamera).isOrthographicCamera) {
      const ocam = cameraRef.value as THREE.OrthographicCamera
      const { size = 10 } = cameraOptions
      const aspect = width / height || 1
      ocam.left = -size * aspect
      ocam.right = size * aspect
      ocam.top = size
      ocam.bottom = -size
      ocam.updateProjectionMatrix()
    }

    rendererRef.value.setSize(width, height, false)
    updateCssRendererSize(width, height)
    if (onResizeCallback) onResizeCallback({ width, height })
  }

  function onWindowResize(): void {
    applySize()
  }

  function renderFrame(): void {
    timer.update()
    const delta = timer.getDelta()
    const elapsed = timer.getElapsed()
    updateCallbacks.forEach((fn) => fn(delta, elapsed))
    if (controlsRef.value) controlsRef.value.update()
    if (!customRender && rendererRef.value) rendererRef.value.render(scene, cameraRef.value!)
    renderCssRenderer()
  }

  function setCamera(camera: THREE.Camera): void {
    if (!camera) return
    cameraRef.value = camera
    applySize()
  }

  function addUpdateCallback(fn: (delta: number, elapsed: number) => void): void {
    updateCallbacks.add(fn)
  }

  function removeUpdateCallback(fn: (delta: number, elapsed: number) => void): void {
    updateCallbacks.delete(fn)
  }

  function add(obj: THREE.Object3D): void {
    scene.add(obj)
  }

  function remove(obj: THREE.Object3D): void {
    scene.remove(obj)
  }

  function renderOnce(): void {
    renderFrame()
  }

  function resize(): void {
    applySize()
  }

  /**
   * 追踪事件监听器，dispose 时自动移除。
   * @param target - window / document / canvas 等
   * @param type - 事件类型
   * @param fn - 回调
   * @param opts - addEventListener 选项
   */
  function listen(target: EventTarget, type: string, fn: EventListener, opts?: AddEventListenerOptions | boolean): void {
    target.addEventListener(type, fn, opts)
    trackedListeners.push([target, type, fn, opts])
  }

  function dispose(): void {
    if (!mounted) return
    mounted = false

    if (onBeforeDispose) onBeforeDispose(ctx)

    // 移除所有被追踪的事件监听器
    trackedListeners.forEach(([target, type, fn, opts]) => {
      try { target.removeEventListener(type, fn, opts) } catch { /* ignore */ }
    })
    trackedListeners.length = 0

    // 取消所有被追踪的 requestAnimationFrame 循环
    trackedRafIds.forEach(id => cancelAnimationFrame(id))
    trackedRafIds.clear()

    if (resizeObserver) {
      resizeObserver.disconnect()
      resizeObserver = null
    } else {
      window.removeEventListener('resize', onWindowResize)
    }

    renderLoop.stop()
    renderLoop.setRenderFn(null)
    updateCallbacks.clear()
    timer.dispose()

    if (controlsRef.value) {
      controlsRef.value.dispose()
      controlsRef.value = null
    }

    if (rendererRef.value) {
      disposeObject3D(scene)
      rendererRef.value.dispose()
      rendererRef.value = null
    }

    if (css2dRenderer) {
      if (css2dRenderer.domElement.parentNode) {
        css2dRenderer.domElement.parentNode.removeChild(css2dRenderer.domElement)
      }
      css2dRenderer = null
    }
    if (css3dRenderer) {
      if (css3dRenderer.domElement.parentNode) {
        css3dRenderer.domElement.parentNode.removeChild(css3dRenderer.domElement)
      }
      css3dRenderer = null
    }

    cameraRef.value = null
    isReady.value = false
  }

  function mount(): void {
    if (mounted) return
    if (!canvasRef.value) {
      console.warn('[useExampleStage] canvas element is not available')
      return
    }
    mounted = true

    setupRenderer()
    setupCssRenderer()
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
      // 在 onReady 执行期间拦截 window/document.addEventListener 和 requestAnimationFrame，
      // 自动将示例注册的全局事件监听器和 RAF 循环纳入 dispose 清理范围。
      const origWinAdd = window.addEventListener.bind(window) as (type: string, fn: EventListener, opts?: AddEventListenerOptions | boolean) => void
      const origDocAdd = document.addEventListener.bind(document) as (type: string, fn: EventListener, opts?: AddEventListenerOptions | boolean) => void
      const origRaf = window.requestAnimationFrame.bind(window)
      ;(window as any).addEventListener = function (type: string, fn: EventListener, opts?: AddEventListenerOptions | boolean) {
        trackedListeners.push([window, type, fn, opts])
        return origWinAdd(type, fn, opts)
      }
      ;(document as any).addEventListener = function (type: string, fn: EventListener, opts?: AddEventListenerOptions | boolean) {
        trackedListeners.push([document, type, fn, opts])
        return origDocAdd(type, fn, opts)
      }
      // trackedRaf 在回调执行期间重新挂载拦截，确保递归 RAF 调用也被追踪
      function trackedRaf(cb: FrameRequestCallback): number {
        const id = origRaf(function wrappedRaf(ts) {
          trackedRafIds.delete(id)
          if (!mounted) return // dispose 后不再继续循环
          // 回调执行期间重新拦截 RAF，使递归调用 requestAnimationFrame(animate) 也被追踪
          window.requestAnimationFrame = trackedRaf
          try { cb(ts) } finally { window.requestAnimationFrame = origRaf }
        })
        trackedRafIds.add(id)
        return id
      }
      window.requestAnimationFrame = trackedRaf
      try {
        const result = onReady(ctx)
        // 处理 async onReady 返回的 Promise，避免 unhandled rejection
        if (result instanceof Promise) {
          result.catch((err) => {
            console.warn('[useExampleStage] onReady async error:', err)
          })
        }
      } finally {
        ;(window as any).addEventListener = origWinAdd
        ;(document as any).addEventListener = origDocAdd
        window.requestAnimationFrame = origRaf
      }
    }
  }

  onMounted(mount)
  onUnmounted(dispose)

  const ctx: ExampleStageCtx = {
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
      return overlayRef?.value ?? null
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
