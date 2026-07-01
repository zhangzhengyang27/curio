import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'

/**
 * Three.js 轨道控制器
 * @param {THREE.Camera} camera
 * @param {HTMLCanvasElement} domElement
 */
export function useOrbitControls(camera, domElement) {
  const controls = new OrbitControls(camera, domElement)
  controls.enableDamping = true
  controls.dampingFactor = 0.05

  function dispose() {
    controls.dispose()
  }

  return { controls, dispose }
}
