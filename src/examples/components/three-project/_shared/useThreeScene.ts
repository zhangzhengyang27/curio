/**
 * Three.js 场景通用逻辑（适配 earth-app 示例容器）
 */
import { shallowRef, onMounted, onUnmounted, type ShallowRef } from "vue"
import * as THREE from "three"
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js"

export interface ThreeSceneOptions {
  /** 相机视角 */
  fov?: number
  /** 相机近裁剪面 */
  near?: number
  /** 相机远裁剪面 */
  far?: number
  /** 相机位置 */
  cameraPosition?: { x: number; y: number; z: number }
  /** 是否启用轨道控制器 */
  enableControls?: boolean
  /** 轨道控制器配置 */
  controlsConfig?: {
    enableDamping?: boolean
    dampingFactor?: number
    minDistance?: number
    maxDistance?: number
  }
  /** 是否添加坐标轴辅助器 */
  showAxesHelper?: boolean
  /** 坐标轴大小 */
  axesHelperSize?: number
  /** 是否添加网格辅助器 */
  showGridHelper?: boolean
}

export function useThreeScene(containerRef: ShallowRef<HTMLDivElement | null>, options: ThreeSceneOptions = {}) {
  const {
    fov = 45,
    near = 0.1,
    far = 1000,
    cameraPosition = { x: 2, y: 2, z: 5 },
    enableControls = true,
    controlsConfig = {
      enableDamping: true,
      dampingFactor: 0.05,
      minDistance: 2,
      maxDistance: 10
    },
    showAxesHelper = true,
    axesHelperSize = 5,
    showGridHelper = false
  } = options

  // Three.js 对象 - 使用 shallowRef 避免深度响应式
  const scene = shallowRef<THREE.Scene | null>(null)
  const camera = shallowRef<THREE.PerspectiveCamera | null>(null)
  const renderer = shallowRef<THREE.WebGLRenderer | null>(null)
  const controls = shallowRef<OrbitControls | null>(null)
  let animationId = 0
  let resizeObserver: ResizeObserver | null = null

  /**
   * 获取容器尺寸
   */
  const getContainerSize = () => {
    if (!containerRef.value) return { width: window.innerWidth, height: window.innerHeight }
    const rect = containerRef.value.getBoundingClientRect()
    return { width: rect.width, height: rect.height }
  }

  /**
   * 初始化场景
   */
  const initScene = (): void => {
    if (!containerRef.value) return

    const { width, height } = getContainerSize()

    // 创建场景
    scene.value = new THREE.Scene()

    // 创建相机
    camera.value = new THREE.PerspectiveCamera(fov, width / height, near, far)
    camera.value.position.set(cameraPosition.x, cameraPosition.y, cameraPosition.z)
    camera.value.lookAt(0, 0, 0)

    // 创建渲染器
    renderer.value = new THREE.WebGLRenderer({ antialias: true })
    renderer.value.setSize(width, height)
    renderer.value.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    containerRef.value.appendChild(renderer.value.domElement)

    // 添加坐标轴辅助器
    if (showAxesHelper) {
      const axesHelper = new THREE.AxesHelper(axesHelperSize)
      scene.value.add(axesHelper)
    }

    // 添加网格辅助器
    if (showGridHelper) {
      const gridHelper = new THREE.GridHelper(10, 10)
      scene.value.add(gridHelper)
    }

    // 添加轨道控制器
    if (enableControls && camera.value && renderer.value) {
      controls.value = new OrbitControls(camera.value, renderer.value.domElement)
      if (controlsConfig.enableDamping !== undefined) {
        controls.value.enableDamping = controlsConfig.enableDamping
      }
      if (controlsConfig.dampingFactor !== undefined) {
        controls.value.dampingFactor = controlsConfig.dampingFactor
      }
      if (controlsConfig.minDistance !== undefined) {
        controls.value.minDistance = controlsConfig.minDistance
      }
      if (controlsConfig.maxDistance !== undefined) {
        controls.value.maxDistance = controlsConfig.maxDistance
      }
    }
  }

  /**
   * 动画循环（由外部调用）
   */
  const startAnimation = (callback?: () => void): void => {
    const animate = (): void => {
      animationId = requestAnimationFrame(animate)

      // 更新控制器
      if (controls.value && controlsConfig.enableDamping) {
        controls.value.update()
      }

      // 执行自定义回调
      if (callback) {
        callback()
      }

      // 渲染场景
      if (renderer.value && scene.value && camera.value) {
        renderer.value.render(scene.value, camera.value)
      }
    }
    animate()
  }

  /**
   * 场景初始化完成后的回调
   */
  const onSceneReady = (callback: () => void): void => {
    // 在 nextTick 中确保场景已初始化
    onMounted(() => {
      callback()
    })
  }

  /**
   * 处理容器大小变化
   */
  const handleResize = (): void => {
    if (!camera.value || !renderer.value || !containerRef.value) return

    const { width, height } = getContainerSize()
    camera.value.aspect = width / height
    camera.value.updateProjectionMatrix()
    renderer.value.setSize(width, height)
  }

  /**
   * 清理资源
   */
  const dispose = (): void => {
    if (animationId) {
      cancelAnimationFrame(animationId)
      animationId = 0
    }

    if (resizeObserver) {
      resizeObserver.disconnect()
      resizeObserver = null
    }

    // 清理控制器
    controls.value?.dispose()

    // 清理场景中的几何体、纹理和材质
    scene.value?.traverse((object: THREE.Object3D) => {
      const mesh = object as THREE.Mesh
      if (mesh.geometry) {
        mesh.geometry.dispose()
      }
      // 清理纹理（遍历材质中所有 texture/map 属性）
      if (mesh.material) {
        const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material]
        materials.forEach((mat) => {
          const texKeys = Object.keys(mat).filter(
            (k) => k.toLowerCase().includes("texture") || k.toLowerCase().includes("map")
          )
          texKeys.forEach((key) => {
            const tex = (mat as unknown as Record<string, unknown>)[key]
            if (tex && typeof tex === 'object' && 'dispose' in tex && typeof tex.dispose === 'function') {
              (tex as THREE.Texture).dispose()
            }
          })
        })
      }
      // 清理材质
      if (mesh.material) {
        if (Array.isArray(mesh.material)) {
          mesh.material.forEach((material: THREE.Material) => material.dispose())
        } else {
          mesh.material.dispose()
        }
      }
    })

    // 清理渲染器
    renderer.value?.dispose()

    // 移除 DOM 元素
    if (renderer.value?.domElement && renderer.value.domElement.parentNode) {
      renderer.value.domElement.parentNode.removeChild(renderer.value.domElement)
    }
  }

  // 生命周期
  onMounted(() => {
    initScene()
    resizeObserver = new ResizeObserver(() => {
      handleResize()
    })
    if (containerRef.value) {
      resizeObserver.observe(containerRef.value)
    }
  })

  onUnmounted(() => {
    dispose()
  })

  return {
    scene,
    camera,
    renderer,
    controls,
    startAnimation,
    onSceneReady,
    handleResize,
    dispose
  }
}
