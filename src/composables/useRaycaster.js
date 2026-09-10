import { shallowRef } from 'vue'
import * as THREE from 'three'

/**
 * 射线拾取封装
 * 相机通过 setCamera() 或 intersect() 参数传入，避免 onUnmounted 生命周期问题
 */
export function useRaycaster() {
  const raycaster = new THREE.Raycaster()
  // shallowRef: Mesh 对象无需 Vue 深度代理
  const currentMesh = shallowRef(null)
  const _ndc = new THREE.Vector2()
  let _camera = null

  function setCamera(camera) {
    _camera = camera
  }

  /**
   * 从鼠标事件获取命中的 Mesh
   */
  function intersect(event, targets, camera) {
    const cam = camera || _camera
    if (!cam) return null
    const x = (event.clientX / window.innerWidth) * 2 - 1
    const y = -(event.clientY / window.innerHeight) * 2 + 1
    _ndc.set(x, y)
    raycaster.setFromCamera(_ndc, cam)
    const intersects = raycaster.intersectObjects(targets)
    return intersects.length > 0 ? intersects[0] : null
  }

  function clearSelection() {
    if (currentMesh.value) {
      if (currentMesh.value.color) {
        currentMesh.value.material.color.copy(currentMesh.value.color)
      }
      currentMesh.value = null
    }
  }

  function selectMesh(mesh) {
    clearSelection()
    if (mesh) {
      currentMesh.value = mesh
      mesh.material.color.set(0x00cccc)
    }
  }

  return { raycaster, currentMesh, setCamera, intersect, selectMesh, clearSelection }
}
