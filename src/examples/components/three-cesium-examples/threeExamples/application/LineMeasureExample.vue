<template>
  <ExampleScene
    camera="perspective"
    :camera-options="{ fov: 40, near: 1, far: 100 }"
    :camera-position="[10, 10, 10]"
    :camera-look-at="[0, 0.5, 0]"
    :clear-color="0xbfe3dd"
    antialias
    @ready="onReady"
    @resize="onResize"
    @before-dispose="onBeforeDispose"
  />
</template>

<script setup>
import * as THREE from 'three'
import { TransformControls } from 'three/examples/jsm/controls/TransformControls.js'
import ExampleScene from '@/examples/components/ExampleScene.vue'

let sceneRef = null
let cameraRef = null
let rendererRef = null
let controlsRef = null
let transformControls = null
let plane = null
let markersGroup = null
let dashLine = null
let line = null
let distanceDom = null
let mousedownHandler = null
let mousemoveHandler = null

const markers = []
const points = []
const distanceArray = []
let distance = 0
let totalDistance = 0
let mesh = null
let index = 0
let canDrawLine = true
let nextPoint = null

const raycaster = new THREE.Raycaster()
const mouse = new THREE.Vector2()

function worldToScreenPosition(pos, camera, width, height) {
  const worldVector = new THREE.Vector3(pos.x, pos.y, pos.z)
  const standardVector = worldVector.project(camera)
  const widthHalf = width / 2
  const heightHalf = height / 2
  return {
    x: Math.round(standardVector.x * widthHalf + widthHalf),
    y: Math.round(-standardVector.y * heightHalf + heightHalf),
    z: 1
  }
}

function updatePoints(pts, idx, point) {
  if (idx === 0) {
    pts[idx] = point
  } else if (idx === pts.length / 2) {
    pts[pts.length - 1] = point
    nextPoint = pts[pts.length - 1]
  } else {
    pts[2 * idx - 1] = point
    pts[2 * idx] = point
  }
}

function updateDistanceArray(pts, array) {
  let dist = 0
  for (let i = 0; i < array.length; i++) {
    array[i] = pts[2 * i].distanceTo(pts[2 * i + 1])
    dist += array[i]
  }
  return dist
}

function updateLinePoints(targetLine, point, arrayIndex) {
  const positions = targetLine.geometry.attributes.position.array
  positions[arrayIndex] = point.x
  positions[arrayIndex + 1] = point.y
  positions[arrayIndex + 2] = point.z
  targetLine.geometry.attributes.position.needsUpdate = true
}

function createLine(scene, pts) {
  if (line) scene.remove(line)
  const geometry = new THREE.BufferGeometry().setFromPoints([...pts])
  line = new THREE.LineSegments(
    geometry,
    new THREE.LineBasicMaterial({
      color: 0xfff000,
      transparent: true,
      depthTest: false
    })
  )
  line.renderOrder = 10
  line.name = 'line'
  line.onBeforeRender = () => {
    if (distanceDom && cameraRef && nextPoint && rendererRef) {
      const { width, height } = rendererRef.domElement.getBoundingClientRect()
      const v = worldToScreenPosition(nextPoint, cameraRef, width, height)
      distanceDom.style.left = v.x + 15 + 'px'
      distanceDom.style.top = v.y - 15 + 'px'
      distanceDom.innerHTML = (distance + totalDistance).toFixed(2) + 'm'
    }
  }
  scene.add(line)
}

function onDragChanging() {
  if (points.length < 2 || !mesh) return
  const point = mesh.position
  const _idx = mesh._idx
  updatePoints(points, _idx, point)

  totalDistance = updateDistanceArray(points, distanceArray)
  if (distanceDom) distanceDom.innerHTML = totalDistance.toFixed(2) + 'm'

  if (!line) return
  const positions = line.geometry.attributes.position.array
  if (_idx === 0) {
    positions[0] = point.x
    positions[1] = point.y
    positions[2] = point.z
  } else {
    const i = (2 * _idx - 1) * 3
    positions[i] = point.x
    positions[i + 1] = point.y
    positions[i + 2] = point.z
    positions[i + 3] = point.x
    positions[i + 4] = point.y
    positions[i + 5] = point.z
  }
  line.geometry.attributes.position.needsUpdate = true
}

function onDragend() {
  if (transformControls) transformControls.detach()
}

function onMousedown(event) {
  if (!cameraRef) return
  raycaster.setFromCamera(mouse, cameraRef)

  if (canDrawLine) {
    if (event.button === 2) {
      canDrawLine = false
    }
    if (points.length > 0) {
      distanceArray.push(distance)
      totalDistance += distance
      distance = 0
    }

    const intersects = raycaster.intersectObject(plane)
    if (intersects.length === 0) return
    const point = intersects[0].point
    const newPoint = new THREE.Vector3(point.x, point.y, point.z)

    if (points.length > 0 && canDrawLine === true) {
      points.push(newPoint, newPoint)
    } else {
      points.push(newPoint)
    }

    const marker = new THREE.Mesh(
      new THREE.SphereGeometry(0.1, 30, 30),
      new THREE.MeshBasicMaterial({ color: 0xff5fff })
    )
    marker._idx = index
    marker.position.copy(newPoint)
    markersGroup.add(marker)
    markers.push(marker)
    index++

    if (!distanceDom && rendererRef) {
      distanceDom = document.createElement('span')
      distanceDom.style.position = 'absolute'
      distanceDom.style.top = '0'
      distanceDom.style.color = 'red'
      distanceDom.style.pointerEvents = 'none'
      rendererRef.domElement.parentNode.appendChild(distanceDom)
    }

    if (points.length > 1) {
      createLine(sceneRef, points)
    }

    if (!canDrawLine) {
      if (dashLine) sceneRef.remove(dashLine)
      return
    }

    if (dashLine) {
      const positions = dashLine.geometry.attributes.position.array
      positions[0] = positions[3]
      positions[1] = positions[4]
      positions[2] = positions[5]
      positions[3] = newPoint.x
      positions[4] = newPoint.y
      positions[5] = newPoint.z
      dashLine.geometry.attributes.position.needsUpdate = true
    } else {
      const geometry = new THREE.BufferGeometry().setFromPoints([newPoint, newPoint])
      dashLine = new THREE.LineSegments(
        geometry,
        new THREE.LineDashedMaterial({
          color: 0xff5555,
          transparent: true,
          depthTest: false,
          dashSize: 0.1,
          gapSize: 1
        })
      )
      dashLine.frustumCulled = false
      dashLine.name = 'dashLine'
      sceneRef.add(dashLine)
    }
  } else {
    const intersects = raycaster.intersectObject(markersGroup)
    if (intersects.length === 0) return
    mesh = intersects[0].object
    transformControls.attach(mesh)
  }
}

function onMousemove(event) {
  event.preventDefault()
  if (!rendererRef) return
  const rect = rendererRef.domElement.getBoundingClientRect()
  mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1
  mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1
  if (!canDrawLine || !cameraRef) return

  raycaster.setFromCamera(mouse, cameraRef)
  const intersects = raycaster.intersectObject(plane)
  if (!intersects.length) return

  nextPoint = intersects[0].point
  if (points.length > 0) {
    const pre = points[points.length - 1]
    distance = pre.distanceTo(nextPoint)
  }

  if (!dashLine) return
  updateLinePoints(dashLine, nextPoint, 3)
}

function onReady(ctx) {
  const scene = ctx.scene
  const camera = ctx.camera
  const renderer = ctx.renderer
  const controls = ctx.controls
  const canvas = ctx.canvas

  sceneRef = scene
  cameraRef = camera
  rendererRef = renderer
  controlsRef = controls

  renderer.outputColorSpace = THREE.SRGBColorSpace

  markersGroup = new THREE.Group()
  scene.add(markersGroup)

  const planeGeo = new THREE.PlaneGeometry(40, 40, 40)
  const planeMat = new THREE.MeshBasicMaterial({ color: 0x666666 })
  plane = new THREE.Mesh(planeGeo, planeMat)
  plane.rotation.x = -Math.PI / 2
  scene.add(plane)

  controls.enableDamping = true
  controls.target.set(0, 0.5, 0)
  controls.update()

  transformControls = new TransformControls(camera, renderer.domElement)
  transformControls.addEventListener('dragging-changed', (event) => {
    controls.enabled = !event.value
  })
  transformControls.addEventListener('mouseUp', onDragend)
  transformControls.addEventListener('change', onDragChanging)
  scene.add(transformControls)

  mousedownHandler = onMousedown
  mousemoveHandler = onMousemove
  canvas.addEventListener('mousedown', mousedownHandler)
  canvas.addEventListener('mousemove', mousemoveHandler)
}

function onResize({ width, height }) {
  if (!cameraRef || !rendererRef) return
  cameraRef.aspect = width / height || 1
  cameraRef.updateProjectionMatrix()
  rendererRef.setSize(width, height)
}

function onBeforeDispose() {
  if (mousedownHandler && rendererRef) {
    rendererRef.domElement.removeEventListener('mousedown', mousedownHandler)
    mousedownHandler = null
  }
  if (mousemoveHandler && rendererRef) {
    rendererRef.domElement.removeEventListener('mousemove', mousemoveHandler)
    mousemoveHandler = null
  }
  if (distanceDom && distanceDom.parentNode) {
    distanceDom.parentNode.removeChild(distanceDom)
    distanceDom = null
  }
  if (transformControls) {
    transformControls.dispose()
    transformControls = null
  }
  sceneRef = null
  cameraRef = null
  rendererRef = null
  controlsRef = null
}
</script>
