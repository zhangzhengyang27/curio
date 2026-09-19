import { shallowRef } from 'vue'
import * as THREE from 'three'

/** 可被选中的国家 Mesh（携带 DataLoader 挂载的自定义 color 字段） */
type SelectableMesh = THREE.Mesh & { color?: THREE.Color }

/**
 * 射线拾取封装
 * 相机通过 setCamera() 或 intersect() 参数传入，避免 onUnmounted 生命周期问题
 */
export function useRaycaster() {
  const raycaster = new THREE.Raycaster()
  // shallowRef: Mesh 对象无需 Vue 深度代理
  const currentMesh = shallowRef<SelectableMesh | null>(null)
  const _ndc = new THREE.Vector2()
  let _camera: THREE.Camera | null = null

  function setCamera(camera: THREE.Camera): void {
    _camera = camera
  }

  /**
   * 从鼠标事件获取命中的 Mesh
   */
  function intersect(
    event: MouseEvent,
    targets: THREE.Object3D[],
    camera?: THREE.Camera
  ): THREE.Intersection | null {
    const cam = camera || _camera
    if (!cam) return null
    const x = (event.clientX / window.innerWidth) * 2 - 1
    const y = -(event.clientY / window.innerHeight) * 2 + 1
    _ndc.set(x, y)
    raycaster.setFromCamera(_ndc, cam)
    const intersects = raycaster.intersectObjects(targets)
    return intersects.length > 0 ? intersects[0] : null
  }

  function clearSelection(): void {
    if (currentMesh.value) {
      // 被选中的是国家 Mesh（MeshPhongMaterial），three-types-fixes 把 color 并成可选
      const mat = currentMesh.value.material as THREE.MeshPhongMaterial & { color: THREE.Color }
      if (currentMesh.value.color) {
        mat.color.copy(currentMesh.value.color)
      }
      currentMesh.value = null
    }
  }

  function selectMesh(mesh: SelectableMesh | null | undefined): void {
    clearSelection()
    if (mesh) {
      currentMesh.value = mesh
      ;(mesh.material as THREE.MeshPhongMaterial & { color: THREE.Color }).color.set(0x00cccc)
    }
  }

  return { raycaster, currentMesh, setCamera, intersect, selectMesh, clearSelection }
}
