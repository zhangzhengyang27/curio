import * as THREE from 'three'
import { createPointMesh } from './pointMesh.js'
import config from './config.js'

const R = config.R
const loader = new THREE.FileLoader()
loader.setResponseType('json')
const group = new THREE.Group()
loader.load('./airports.json', function (data) {
  data.geometries.forEach(function (obj) {
    const lon = obj.coordinates[0]
    const lat = obj.coordinates[1]
    const mesh = createPointMesh(R, lon, lat)
    group.add(mesh)
  })
})

export default group
