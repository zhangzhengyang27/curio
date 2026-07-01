<template>
  <ExampleScene
    camera="perspective"
    :camera-options="{ fov: 45, near: 0.1, far: 30000 }"
    :camera-position="[0, 2000, 5000]"
    :camera-look-at="[1500, 1500, 0]"
    @ready="onReady"
  />
</template>

<script setup>
import * as THREE from 'three'
import gsap from 'gsap'
import { GUI } from 'dat.gui'
import ExampleScene from '@/examples/components/ExampleScene.vue'

const props = defineProps({
  example: {
    type: Object,
    default: () => ({})
  }
})

function onReady(ctx) {
  const scene = ctx.scene
  const controls = ctx.controls

  scene.background = new THREE.Color(0x00719e)
  controls.target.set(1500, 1500, 0)
  controls.update()

  const ambientLight = new THREE.AmbientLight(0xffffff, 5)
  scene.add(ambientLight)

  const directionalLight1 = new THREE.DirectionalLight(0xffffff, 4)
  directionalLight1.position.set(0, 10000, 20000)
  scene.add(directionalLight1)

  const directionalLight2 = new THREE.DirectionalLight(0xffffff, 8)
  directionalLight2.position.set(0, 10000, -20000)
  scene.add(directionalLight2)

  const axesHelper = new THREE.AxesHelper(200)
  scene.add(axesHelper)

  const FILE_HOST = props.example?.globals?.FILE_HOST || '/external-examples/3d-file-server/'

  const pipe = addAndGetPipe(FILE_HOST)
  scene.add(pipe)

  const gui = new GUI()
  gui.add({ startFlow: () => pipe.startFlow() }, 'startFlow').name('开始流动')
  gui.add({ stopFlow: () => pipe.stopFlow() }, 'stopFlow').name('停止流动')

  function addAndGetPipe(fileHost) {
    const p1 = new THREE.Vector3(0, 0, 0)
    const p2 = new THREE.Vector3(0, 1400, 0)
    const p3 = new THREE.Vector3(50, 1450, 0)
    const p4 = new THREE.Vector3(100, 1500, 0)
    const p5 = new THREE.Vector3(3000, 1500, 0)

    const line1 = new THREE.LineCurve3(p1, p2)
    const curve1 = new THREE.CatmullRomCurve3([p2, p3, p4])
    const line2 = new THREE.LineCurve3(p4, p5)

    const curvePath = new THREE.CurvePath()
    curvePath.curves.push(line1, curve1, line2)

    return new DemoPipe('管道1', {
      radius: 60,
      color: 0x777777,
      tubularSegments: 200,
      radiusSegments: 16,
      curve: curvePath
    }, fileHost)
  }
}

class DemoPipe extends THREE.Mesh {
  constructor(name, options, fileHost) {
    const defaultOptions = {
      radius: 70,
      color: 0x777777,
      radiusSegments: 16,
      tubularSegments: 100,
      curve: new THREE.CatmullRomCurve3()
    }
    const finalOptions = Object.assign({}, defaultOptions, options)

    const flowTexture = new THREE.TextureLoader().load(fileHost + 'threeExamples/application/flow.png')
    flowTexture.colorSpace = THREE.SRGBColorSpace
    flowTexture.wrapS = flowTexture.wrapT = THREE.RepeatWrapping
    flowTexture.repeat.set(finalOptions.curve.getLength() / 1000, 1)
    flowTexture.needsUpdate = true

    const mat = new THREE.MeshPhongMaterial({
      color: finalOptions.color,
      transparent: true,
      side: THREE.DoubleSide,
      specular: finalOptions.color,
      shininess: 15
    })

    const geo = new THREE.TubeGeometry(
      finalOptions.curve,
      finalOptions.tubularSegments,
      finalOptions.radius,
      finalOptions.radiusSegments
    )

    super(geo, mat)
    this.name = name
    this.flowTexture = flowTexture
    this.flowAnimation = gsap.to(this.flowTexture.offset, {
      x: -3,
      duration: 1,
      ease: 'none',
      repeat: -1,
      paused: true
    })
  }

  startFlow() {
    this.material.map = this.flowTexture
    this.flowAnimation.resume()
  }

  stopFlow() {
    this.flowAnimation.pause()
    this.material.map = null
  }
}
</script>
