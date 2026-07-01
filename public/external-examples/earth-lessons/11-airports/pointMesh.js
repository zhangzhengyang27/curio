import * as THREE from 'three'
import { lon2xyz } from './math.js'

const geometry = new THREE.PlaneGeometry(1, 1)
const textureLoader = new THREE.TextureLoader()
const texture = textureLoader.load('./机场.png')
const material = new THREE.MeshBasicMaterial({
  color: 0x22ffcc,
  map: texture,
  transparent: true,
  depthWrite: false,
})

function createPointMesh(R, lon, lat) {
  const mesh = new THREE.Mesh(geometry, material)
  const coord = lon2xyz(R * 1.001, lon, lat)
  const size = R * 0.05
  mesh.scale.set(size, size, size)
  mesh.position.set(coord.x, coord.y, coord.z)

  const coordVec3 = new THREE.Vector3(coord.x, coord.y, coord.z).normalize()
  const meshNormal = new THREE.Vector3(0, 0, 1)
  mesh.quaternion.setFromUnitVectors(meshNormal, coordVec3)

  return mesh
}

export { createPointMesh }
