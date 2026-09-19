<template>
  <ExampleScene
    camera="perspective"
    :camera-position="[40, 40, 60]"
    :camera-options="{ fov: 50 }"
    antialias
    @ready="onReady"
  />
</template>

<script setup lang="ts">
import * as THREE from 'three'
import { RapierPhysics } from 'three/examples/jsm/physics/RapierPhysics.js'
import ExampleScene from '@/examples/components/ExampleScene.vue'

const props = defineProps({
  example: {
    type: Object,
    default: () => ({})
  }
})

async function onReady(ctx: any) {
  const scene = ctx.scene
  const camera = ctx.camera
  const controls = ctx.controls

  scene.add(new THREE.AmbientLight(0xffffff, 0.5))

  const dirLight = new THREE.DirectionalLight(0xffffff, 1)
  dirLight.position.set(20, 40, 20)
  dirLight.castShadow = true
  scene.add(dirLight)

  if (controls) controls.enableDamping = true

  scene.add(new THREE.GridHelper(80, 80))

  const physics = await RapierPhysics()
  const world = physics.world
  const RAPIER = physics.RAPIER

  const keys = { w: false, a: false, s: false, d: false }

  window.addEventListener('keydown', (e: any) => {
    if (keys.hasOwnProperty(e.key.toLowerCase())) (keys as any)[e.key.toLowerCase()] = true
  })
  window.addEventListener('keyup', (e: any) => {
    if (keys.hasOwnProperty(e.key.toLowerCase())) (keys as any)[e.key.toLowerCase()] = false
  })

  // 履带板尺寸
  const trackWidth = 4.0
  const trackHeight = 0.3
  const trackDepth = 0.6
  const spacing = 0.65

  const trackSegments: any[] = []
  const wallColliders = new Set()

  function addFloor() {
    const geometry = new THREE.BoxGeometry(200, 0.2, 200)
    const material = new THREE.MeshStandardMaterial({ color: 0x333333 })
    const mesh = new THREE.Mesh(geometry, material)
    mesh.receiveShadow = true
    scene.add(mesh)
    physics.addMesh(mesh, 0, 0.5)
  }

  function addWalls() {
    const wallSize = 200
    const wallHeight = 50
    const wallThickness = 4

    const walls: any[] = [
      { pos: [0, wallHeight / 2, wallSize / 2], size: [wallSize, wallHeight, wallThickness] },
      { pos: [0, wallHeight / 2, -wallSize / 2], size: [wallSize, wallHeight, wallThickness] },
      { pos: [wallSize / 2, wallHeight / 2, 0], size: [wallThickness, wallHeight, wallSize] },
      { pos: [-wallSize / 2, wallHeight / 2, 0], size: [wallThickness, wallHeight, wallSize] }
    ]

    walls.forEach((w) => {
      const geometry = new THREE.BoxGeometry(...(w.size as [number, number, number]))
      const material = new THREE.MeshStandardMaterial({ color: 0x444444, transparent: true, opacity: 0.3 })
      const mesh = new THREE.Mesh(geometry, material)
      mesh.position.set(...(w.pos as [number, number, number]))
      scene.add(mesh)
      physics.addMesh(mesh, 0, 0.1)

      if (mesh.userData.physics && mesh.userData.physics.collider) {
        wallColliders.add(mesh.userData.physics.collider.handle)
      }
    })
  }

  function createTankTrack(count: any) {
    for (let i = 0; i < count; i++) {
      const geometry = new THREE.BoxGeometry(trackWidth, trackHeight, trackDepth)
      const material = new THREE.MeshStandardMaterial({
        color: i === 0 ? 0xff0000 : 0x555555,
        metalness: 0.8,
        roughness: 0.2
      })
      const mesh = new THREE.Mesh(geometry, material)

      mesh.position.set(0, trackHeight / 2 + 5, -i * spacing)
      mesh.castShadow = true
      mesh.receiveShadow = true
      scene.add(mesh)

      physics.addMesh(mesh, 2.0, 0.0)

      const body = mesh.userData.physics.body
      if (!body) continue

      body.setLinearDamping(1.0)
      body.setAngularDamping(2.0)

      trackSegments.push({ mesh, body })

      if (i > 0) {
        const parentBody = trackSegments[i - 1].body
        const currentBody = trackSegments[i].body

        const params = RAPIER.JointData.revolute(
          new RAPIER.Vector3(0, 0, -spacing / 2),
          new RAPIER.Vector3(0, 0, spacing / 2),
          new RAPIER.Vector3(1, 0, 0)
        )
        world.createImpulseJoint(params, parentBody, currentBody, true)
      }
    }
  }

  function updateControl() {
    if (!trackSegments.length) return

    const force = 1200
    let moveX: number = 0
    let moveZ: number = 0

    if (keys.w) moveZ -= 1
    if (keys.s) moveZ += 1
    if (keys.a) moveX -= 1
    if (keys.d) moveX += 1

    if (moveX !== 0 || moveZ !== 0) {
      const length = Math.sqrt(moveX * moveX + moveZ * moveZ)
      moveX /= length
      moveZ /= length

      const head = trackSegments[0]
      head.body.applyImpulse({ x: moveX * force * 0.1, y: 0, z: moveZ * force * 0.1 }, true)

      let isHittingWall: boolean = false
      if (head.mesh.userData.physics && head.mesh.userData.physics.collider) {
        const headCollider = head.mesh.userData.physics.collider
        world.contactPairsWith(headCollider, (otherCollider) => {
          if (wallColliders.has(otherCollider.handle)) {
            isHittingWall = true
          }
        })
      }

      if (isHittingWall) {
        for (let i = 1; i < trackSegments.length; i++) {
          const current = trackSegments[i].body
          const prev = trackSegments[i - 1].body

          const curPos = current.translation()
          const prevPos = prev.translation()

          let dirX = prevPos.x - curPos.x
          let dirY = prevPos.y - curPos.y
          let dirZ = prevPos.z - curPos.z

          const dist = Math.sqrt(dirX * dirX + dirY * dirY + dirZ * dirZ)
          if (dist > 0.4) {
            dirX /= dist
            dirY /= dist
            dirZ /= dist

            const factor = Math.pow(0.96, i)
            const attractForce = force * 1.2 * factor

            current.applyImpulse({
              x: dirX * attractForce * 0.1,
              y: dirY * attractForce * 0.1 + 0.2,
              z: dirZ * attractForce * 0.1
            }, true)
          }
        }
      }
    }

    trackSegments.forEach((seg) => {
      const body = seg.body
      const currentVel = body.linvel()
      const speed = Math.sqrt(currentVel.x ** 2 + currentVel.z ** 2)
      const maxVel = 60

      if (speed > maxVel || Math.abs(currentVel.y) > 5) {
        const ratio = speed > maxVel ? maxVel / speed : 1
        body.setLinvel({ x: currentVel.x * ratio, y: currentVel.y * 0.8, z: currentVel.z * ratio }, true)
      }
    })
  }

  addFloor()
  addWalls()
  createTankTrack(100)

  ctx.addUpdateCallback(() => {
    updateControl()
  })
}
</script>
