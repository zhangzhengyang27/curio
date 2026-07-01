<template>
  <ExampleScene
    camera="perspective"
    :camera-position="[16, 8, 20]"
    :camera-look-at="[0, 0, 0]"
    :clear-color="0xaaaaaa"
    :shadow-map="true"
    :enable-controls="false"
    @ready="onReady"
  ></ExampleScene>
</template>

<script setup>
import {
  BoxGeometry,
  CylinderGeometry,
  DirectionalLight,
  Group,
  Mesh,
  MeshPhongMaterial,
  PerspectiveCamera,
  PlaneGeometry,
  SphereGeometry,
  SplineCurve,
  Vector2,
  Vector3,
} from 'three'
import { GUI } from 'dat.gui'
import ExampleScene from '../../ExampleScene.vue'

function onReady(ctx) {
  const { scene, renderer, setCamera, addUpdateCallback, overlay } = ctx

  renderer.shadowMap.enabled = true

  const camera = makeCamera()
  camera.position.set(16, 8, 20)
  camera.lookAt(0, 0, 0)
  setCamera(camera)

  {
    const light = new DirectionalLight(0xffffff, 1)
    light.position.set(0, 20, 0)
    scene.add(light)
    light.castShadow = true
    light.shadow.mapSize.width = 2048
    light.shadow.mapSize.height = 2048

    const d = 50
    light.shadow.camera.left = -d
    light.shadow.camera.right = d
    light.shadow.camera.top = d
    light.shadow.camera.bottom = -d
    light.shadow.camera.near = 1
    light.shadow.camera.far = 50
  }

  {
    const light = new DirectionalLight(0xffffff, 1)
    light.position.set(1, 2, 4)
    scene.add(light)
  }

  const groundGeometry = new PlaneGeometry(50, 50)
  const groundMaterial = new MeshPhongMaterial({ color: 0xcc8866 })
  const groundMesh = new Mesh(groundGeometry, groundMaterial)
  groundMesh.rotation.x = Math.PI * -0.5
  groundMesh.receiveShadow = true
  scene.add(groundMesh)

  const tank = new Group()
  scene.add(tank)
  const carRadius = 1
  const bodyCenterY = (carRadius * 3) / 2
  const tankCameraFov = 75
  const tankCamera = makeCamera(tankCameraFov)
  tankCamera.position.y = 5
  tankCamera.position.z = -10
  tankCamera.lookAt(0, bodyCenterY, 0)
  tank.add(tankCamera)

  const bodyGeometry = new SphereGeometry(carRadius)
  const bodyMaterial = new MeshPhongMaterial({ color: 0x6688aa })
  const bodyMesh = new Mesh(bodyGeometry, bodyMaterial)
  bodyMesh.position.y = bodyCenterY
  bodyMesh.castShadow = true
  tank.add(bodyMesh)

  const wheelRadius = 0.6
  const wheelThickness = 0.5
  const wheelSegments = 8
  const wheelGeometry = new CylinderGeometry(wheelRadius, wheelRadius, wheelThickness, wheelSegments)
  const wheelMaterial = new MeshPhongMaterial({ color: 0x888888 })
  const cx = carRadius + wheelThickness / 2
  const wheelMeshes = [-cx, cx].map((x) => {
    const mesh = new Mesh(wheelGeometry, wheelMaterial)
    mesh.rotation.z = Math.PI * 0.5
    mesh.position.set(x, wheelRadius, 0)
    mesh.castShadow = true
    tank.add(mesh)
    return mesh
  })

  const barrel = new Group()
  barrel.position.y = bodyCenterY + 0.3
  tank.add(barrel)
  const barrelSize = 0.3
  const barrelLength = 5
  const barrelGeometry = new BoxGeometry(barrelSize, barrelSize, barrelLength)
  const barrelMesh = new Mesh(barrelGeometry, bodyMaterial)
  barrelMesh.position.z = barrelLength / 2
  barrelMesh.castShadow = true
  barrel.add(barrelMesh)

  const barrelCamera = makeCamera()
  barrelCamera.position.y = 1.4
  barrel.add(barrelCamera)

  const target = new Group()
  target.position.z = 2
  target.position.y = 4
  scene.add(target)
  const targetBob = new Group()
  target.add(targetBob)
  const targetGeometry = new SphereGeometry(0.5, 6, 3)
  const targetMaterial = new MeshPhongMaterial({
    color: 0x00ff00,
    flatShading: true,
  })
  const targetMesh = new Mesh(targetGeometry, targetMaterial)
  targetMesh.castShadow = true
  targetBob.add(targetMesh)

  const targetCamera = makeCamera()
  targetCamera.position.y = 1
  targetCamera.position.z = -2
  targetCamera.rotation.y = Math.PI
  const targetCameraPivot = new Group()
  targetBob.add(targetCameraPivot)
  targetCameraPivot.add(targetCamera)

  const curve = new SplineCurve([
    new Vector2(-6, -2),
    new Vector2(-6, -8),
    new Vector2(8, 0),
    new Vector2(3, 8),
    new Vector2(-6, 4),
    new Vector2(-6, -2),
  ])
  const tankPosition = new Vector2()
  const tankTarget = new Vector2()
  const targetPosition = new Vector3()

  const gui = new GUI({ autoPlace: false })
  const cameras = new Map([
    ['camera', camera],
    ['barrelCamera', barrelCamera],
    ['targetCamera', targetCamera],
    ['tankCamera', tankCamera],
  ])

  const curCamera = { name: 'camera' }
  gui.add(curCamera, 'name', [...cameras.keys()]).onChange((key) => {
    const cam = cameras.get(key)
    if (cam) {
      setCamera(cam)
    }
  })

  overlay.appendChild(gui.domElement)

  addUpdateCallback((delta, elapsed) => {
    const time = elapsed

    const tankTime = time * 0.1
    curve.getPointAt(tankTime % 1, tankPosition)
    curve.getPointAt((tankTime + 0.01) % 1, tankTarget)
    tank.position.set(tankPosition.x, 0, tankPosition.y)
    tank.lookAt(tankTarget.x, 0, tankTarget.y)

    wheelMeshes.forEach((obj) => {
      obj.rotation.x = time * 3
    })

    targetBob.position.y = Math.sin(time * 2) * 2

    targetMesh.getWorldPosition(targetPosition)
    barrel.lookAt(targetPosition)

    if (curCamera.name === 'barrelCamera') {
      barrelCamera.lookAt(targetPosition)
    } else if (curCamera.name === 'targetCamera') {
      tank.getWorldPosition(targetPosition)
      targetCameraPivot.lookAt(targetPosition)
    }
  })
}

function makeCamera(fov = 40) {
  const aspect = 2
  const zNear = 0.1
  const zFar = 1000
  return new PerspectiveCamera(fov, aspect, zNear, zFar)
}
</script>
