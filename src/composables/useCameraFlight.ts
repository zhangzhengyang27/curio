import * as THREE from 'three'
import type { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { lon2xyz } from '../three/geo/coord'

/**
 * 相机飞行动画
 * @param controls
 * @param camera
 * @param R - 地球半径
 */
export function useCameraFlight(
  controls: OrbitControls,
  camera: THREE.Camera,
  R = 100
): { flyTo(longitude: number, latitude: number, duration?: number): void; cancel(): void } {
  let animationId: number | null = null

  function flyTo(longitude: number, latitude: number, duration = 1000): void {
    const target = lon2xyz(R, longitude, latitude)
    const targetVec = new THREE.Vector3(target.x, target.y, target.z)

    // 直达：不进 rAF。duration 为 0 时 elapsed/duration 会产生 NaN
    // 写入相机与 controls.target（巡游「开场即位」的镜头是 0 时长）
    if (animationId) cancelAnimationFrame(animationId)
    if (duration <= 0) {
      controls.target.copy(targetVec)
      camera.position.copy(targetVec.clone().normalize().multiplyScalar(R * 2.5))
      controls.update()
      return
    }

    const startTarget = controls.target.clone()
    const startCam = camera.position.clone()
    const startTime = performance.now()

    function animate(now: number): void {
      const elapsed = now - startTime
      const t = Math.min(elapsed / duration, 1.0)
      // easeInOutCubic
      const ease = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2

      controls.target.lerpVectors(startTarget, targetVec, ease)
      // 相机靠近到 R * 2.5
      const dir = targetVec.clone().normalize()
      const idealPos = dir.clone().multiplyScalar(R * 2.5)
      camera.position.lerpVectors(startCam, idealPos, ease)

      controls.update()
      if (t < 1) {
        animationId = requestAnimationFrame(animate)
      }
    }
    animationId = requestAnimationFrame(animate)
  }

  function cancel(): void {
    if (animationId) {
      cancelAnimationFrame(animationId)
      animationId = null
    }
  }

  return { flyTo, cancel }
}
