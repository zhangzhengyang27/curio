import * as THREE from 'three'
import { createCylinderScatterPoints } from '../src/three/objects/CylinderScatterPoints.js'
import { createSequentialScale } from '../src/three/utils/colorScale.js'

const R = 100
const data = await import('../public/data/mock/population.json', { with: { type: 'json' } })
const popData = data.default
const world = await import('../public/data/worldZh.json', { with: { type: 'json' } })
const worldData = world.default

// 重建 searchIndex
const index = {}
worldData.features.forEach(c => {
  const name = c.properties.nameZh || c.properties.name
  if (!name) return
  let coords = c.geometry.coordinates
  if (c.geometry.type === 'Polygon') coords = [coords]
  const ring = coords[0]?.[0]
  if (!ring?.length) return
  let sl = 0, st = 0
  ring.forEach(p => { sl += p[0]; st += p[1] })
  index[name] = { lon: sl / ring.length, lat: st / ring.length }
})

const densities = Object.fromEntries(Object.entries(popData).map(([k, v]) => [k, v.density]))
const densityValues = Object.values(densities)
const maxD = Math.max(...densityValues, 0.0001)
const colorScale = createSequentialScale('YlOrRd', [0, maxD])

const scatterData = Object.entries(popData)
  .map(([name, d]) => {
    const i = index[name]
    return i ? { lon: i.lon, lat: i.lat, value: d.density } : null
  })
  .filter(Boolean)

console.log('scatterData count:', scatterData.length)

const scatter = createCylinderScatterPoints(scatterData, R, {
  getValue: item => item.value,
  maxValue: maxD,
  heightScale: 30,
  minHeight: 1,
  radius: 0.8,
  colorScale,
  opacity: 0.85,
  segments: 6,
  merge: true
})

const mesh = scatter.children.find(c => c.isMesh)
if (mesh) {
  const pos = mesh.geometry.attributes.position
  let nanCount = 0
  const nanPoints = []
  for (let i = 0; i < pos.count; i++) {
    if (!isFinite(pos.getX(i)) || !isFinite(pos.getY(i)) || !isFinite(pos.getZ(i))) {
      nanCount++
      if (nanPoints.length < 5) nanPoints.push([i, pos.getX(i), pos.getY(i), pos.getZ(i)])
    }
  }
  console.log('total vertices:', pos.count, 'NaN vertices:', nanCount)
  console.log('sample NaN:', JSON.stringify(nanPoints))
}
