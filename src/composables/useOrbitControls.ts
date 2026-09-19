import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import type { Camera } from 'three'

/**
 * Three.js 轨道控制器
 * @param camera
 * @param domElement
 */
export function useOrbitControls(camera: Camera, domElement: HTMLElement): { controls: OrbitControls; dispose(): void } {
  const controls = new OrbitControls(camera, domElement)
  controls.enableDamping = true
  controls.dampingFactor = 0.05

  function dispose(): void {
    controls.dispose()
  }

  return { controls, dispose }
}
