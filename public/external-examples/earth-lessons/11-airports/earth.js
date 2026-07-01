import * as THREE from 'three'
import { countryLine } from './line.js'
import airports from './airports.js'
import config from './config.js'

const R = config.R
const earth = new THREE.Group()
earth.add(createSphereMesh(R))
earth.add(countryLine(R * 1.001))
earth.add(airports)

function createSphereMesh(r) {
  const textureLoader = new THREE.TextureLoader()
  const texture = textureLoader.load('./earth.png')
  const geometry = new THREE.SphereGeometry(R, 40, 40)
  const material = new THREE.MeshLambertMaterial({
    map: texture,
  })
  const mesh = new THREE.Mesh(geometry, material)
  return mesh
}

export { earth }
