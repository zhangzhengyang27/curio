<template>
  <ExampleScene
    camera="perspective"
    :camera-options="{ fov: 50, near: 0.1, far: 100000000 }"
    :camera-position="[0, 600, 300]"
    :camera-look-at="[0, 0, 0]"
    css-renderer="css2d"
    @ready="onReady"
    @before-dispose="onBeforeDispose"
  />
</template>

<script setup>
import * as THREE from 'three'
import gsap from 'gsap'
import { CSS2DObject } from 'three/examples/jsm/renderers/CSS2DRenderer.js'
import ExampleScene from '@/examples/components/ExampleScene.vue'

const props = defineProps({
  example: {
    type: Object,
    default: () => ({})
  }
})

const FILE_HOST = props.example?.globals?.FILE_HOST || '/external-examples/3d-file-server/'

const PAEAMS = { DEPTH: 15, coordsMaxCounts: 500 }

let rootGroup = null
let clickHandler = null
let texture = null
let rootGeoJson = null
let labels = []
let containerRef = null

async function fetchJson(url) {
  const res = await fetch(url)
  return res.json()
}

function coordToVector(coord, type = 2, slace = 10000) {
  const [lng, lat] = coord
  const x = (lng * 20037508.34) / 180
  let y = Math.log(Math.tan((90 + lat) * Math.PI / 360)) / (Math.PI / 180)
  y = (y * 20037508.34) / 180
  return type === 2
    ? new THREE.Vector2(x / slace, y / slace)
    : new THREE.Vector3(x / slace, y / slace, 0)
}

function createShapeWithCoord(coordinates, materials) {
  while (coordinates.length > PAEAMS.coordsMaxCounts) {
    coordinates = coordinates.filter((_, i) => i % 2 === 0)
  }

  const path = new THREE.Path(coordinates.map((k) => coordToVector(k)))
  const parameters = {
    bevelThickness: 0,
    bevelSize: 0,
    bevelOffset: 0,
    depth: PAEAMS.DEPTH || 2,
    bevelEnabled: true
  }

  const emptyGeometry = new THREE.BufferGeometry().setFromPoints(path.getPoints(1000))
  const lineMaterial = new THREE.LineBasicMaterial({
    color: 0xffffff,
    linewidth: 2,
    transparent: true,
    depthTest: false
  })
  const emptyMesh = new THREE.Line(emptyGeometry, lineMaterial)
  emptyMesh.position.z += parameters.depth + 0.01

  const shape = new THREE.Shape()
  shape.curves.push(path)
  const geometry = new THREE.ExtrudeGeometry(shape, parameters)
  const mesh = new THREE.Mesh(geometry, materials)
  mesh.add(emptyMesh)

  return mesh
}

function createGeo(geoJson, scene) {
  const group = new THREE.Group()
  group.info = geoJson

  const materials = [
    new THREE.MeshStandardMaterial({ color: Math.random() * 0xffffff, transparent: true, metalness: 0.5, roughness: 0.5 }),
    new THREE.MeshBasicMaterial({ map: texture, color: 0xffffff * Math.random() })
  ]

  geoJson.features.forEach((info) => {
    if (info?.properties.center) info.properties.centerCoord3 = coordToVector(info.properties.center, 3)
    if (info?.properties?.centroid) info.properties.centroidCoord3 = coordToVector(info.properties.centroid, 3)

    const areaGroup = new THREE.Group()
    areaGroup.info = info
    areaGroup.name = info.properties?.name
    group.add(areaGroup)

    if (info.geometry.type === 'MultiPolygon') {
      info.geometry.coordinates.forEach((j) => j.forEach((z) => areaGroup.add(createShapeWithCoord(z, materials))))
    } else if (info.geometry.type === 'Polygon') {
      info.geometry.coordinates.forEach((j) => areaGroup.add(createShapeWithCoord(j, materials)))
    }

    const div = document.createElement('div')
    div.textContent = info.properties?.name || ''
    div.style.color = '#dbdbdb'
    div.style.fontSize = '10px'
    div.style.pointerEvents = 'auto'
    const css = new CSS2DObject(div)

    if (info?.properties?.centroidCoord3 || info?.properties?.centerCoord3) {
      css.position.copy(info?.properties?.centroidCoord3 || info?.properties?.centerCoord3)
    } else {
      const box = new THREE.Box3().setFromObject(areaGroup)
      const center = box.getCenter(new THREE.Vector3())
      css.position.copy(center)
    }

    css.position.z += PAEAMS.DEPTH || 2
    areaGroup.label = css
    areaGroup.attach(css)
    labels.push(css)
  })

  return group
}

function getLavelObj(obj) {
  if (obj.info) return obj
  if (obj.parent) return getLavelObj(obj.parent)
}

function onReady(ctx) {
  const scene = ctx.scene
  const camera = ctx.camera
  const container = ctx.container
  containerRef = container

  const light = new THREE.DirectionalLight(0xffffff, 1)
  light.position.set(100, 100, 100)
  scene.add(new THREE.AmbientLight(0xffffff, 1.5), light)

  texture = new THREE.TextureLoader().load(FILE_HOST + 'images/channels/texture.png')
  texture.wrapT = THREE.RepeatWrapping
  texture.repeat.y = 0.1

  ctx.addUpdateCallback(() => {
    if (texture) texture.offset.y += 0.003
  })

  ;(async () => {
    rootGeoJson = await fetchJson(FILE_HOST + 'files/json/china.json')
    rootGroup = createGeo(rootGeoJson, scene)
    rootGroup.rotation.x = -Math.PI / 2
    rootGroup.position.sub(new THREE.Box3().setFromObject(rootGroup).getCenter(new THREE.Vector3()))
    scene.add(rootGroup)
  })()

  const raycaster = new THREE.Raycaster()
  const mouse = new THREE.Vector2()

  clickHandler = async (e) => {
    if (!rootGroup) return
    const rect = container.getBoundingClientRect()
    mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1
    mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1
    raycaster.setFromCamera(mouse, camera)
    const intersects = raycaster.intersectObjects(rootGroup.children, true)
    if (intersects.length > 0) {
      const item = getLavelObj(intersects[0].object)
      const info = item.info
      try {
        const json = await fetchJson(FILE_HOST + 'geojson/' + info.properties.adcode + '.json')
        if (!json.features.length) return
        if (item.label) item.label.visible = false

        const childGeo = createGeo(json, scene)
        gsap.to(childGeo.position, { z: PAEAMS.DEPTH, duration: 1.5, ease: 'power2.out' })
        item.child_geo = childGeo
        item.add(childGeo)
      } catch (err) {
        console.warn('geojson 加载失败', err)
      }
    }
  }
  container.addEventListener('click', clickHandler)
}

function onBeforeDispose() {
  if (clickHandler && containerRef) {
    containerRef.removeEventListener('click', clickHandler)
    clickHandler = null
  }
  containerRef = null
  rootGroup = null
  labels = []
}
</script>
