<template>
  <ExampleScene
    camera="orthographic"
    @ready="onReady"
  />
</template>

<script setup>
import * as THREE from 'three'
import { GUI } from 'lil-gui'
import ExampleScene from '@/examples/components/ExampleScene.vue'

const props = defineProps({
  example: {
    type: Object,
    default: () => ({})
  }
})

function onReady(ctx) {
  const scene = ctx.scene
  const camera = ctx.camera
  const renderer = ctx.renderer
  const controls = ctx.controls
  const { width, height } = ctx.size

  const s = 15
  camera.left = -s
  camera.right = s
  camera.top = s * (height / width)
  camera.bottom = -s * (height / width)
  camera.position.set(0, 0, 100)
  camera.lookAt(0, 0, 0)
  camera.up.set(0, 0, 1)
  camera.zoom = 0.4
  camera.updateProjectionMatrix()

  controls.enableDamping = true

  const colors = [
    new THREE.Color(0.5, 0.0, 1.0),
    new THREE.Color(0.0, 0.0, 1.0),
    new THREE.Color(0.0, 1.0, 1.0),
    new THREE.Color(0.0, 1.0, 0.0),
    new THREE.Color(1.0, 1.0, 0.0),
    new THREE.Color(1.0, 0.0, 0.0)
  ]

  const vertexShader = /* glsl */ `
    varying vec4 vPosition;
    void main() {
      vPosition = modelMatrix * vec4(position, 1.0);
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `

  const fragmentShader = /* glsl */ `
    varying vec4 vPosition;
    uniform float uScale;
    uniform vec3 colors[6];
    void main() {
      float intensity = clamp((vPosition.y + 13.0) * uScale / 255.0, 0.0, 1.0);
      float segment = intensity * 5.0;
      int index = int(segment);
      float t = fract(segment);
      vec3 outputColor = mix(colors[index], colors[index + 1], t);
      gl_FragColor = vec4(outputColor, 1.0);
    }
  `

  const bars = []
  const barCount = 64
  const geometry = new THREE.BoxGeometry(0.5, 1, 0.5)
  const material = new THREE.ShaderMaterial({
    uniforms: {
      colors: { value: colors },
      uScale: { value: 1.0 }
    },
    vertexShader,
    fragmentShader
  })

  for (let i = 0, offset = 0; i < barCount; i++, offset = i - barCount / 2) {
    const bar = new THREE.Mesh(geometry, material.clone())
    bar.position.x = offset
    scene.add(bar)
    bars.push(bar)

    const mirrorBar = new THREE.Mesh(geometry, material.clone())
    mirrorBar.position.x = -offset
    scene.add(mirrorBar)
    bars.push(mirrorBar)

    bar.position.y = mirrorBar.position.y = -12.5
  }

  const FILE_HOST = props.example?.globals?.FILE_HOST || '/external-examples/3d-file-server/'
  const audio = new Audio(FILE_HOST + 'files/audio/YMCA.mp3')
  audio.crossOrigin = 'anonymous'

  const audioContext = new AudioContext()
  const analyser = audioContext.createAnalyser()
  const source = audioContext.createMediaElementSource(audio)
  source.connect(analyser)
  source.connect(audioContext.destination)

  analyser.fftSize = barCount * 2
  const bufferLength = analyser.frequencyBinCount
  const dataArray = new Uint8Array(bufferLength)

  const length = bars.length - 1

  ctx.addUpdateCallback(() => {
    controls.update()
    analyser.getByteFrequencyData(dataArray)
    for (let i = 0, j = length; i < barCount; i++, j = length - i) {
      const scale = dataArray[barCount - i] / 10
      const height = scale < 1 ? 1 : scale
      const y = -13 + height / 2
      bars[i].scale.y = height
      bars[j].scale.y = height
      bars[i].position.y = bars[j].position.y = y
      bars[i].material.uniforms.uScale.value = scale
      bars[j].material.uniforms.uScale.value = scale
    }
  })

  const controlsGui = {
    play() {
      audioContext.resume().then(() => {
        audio.play()
      })
    },
    pause() {
      audioContext.resume().then(() => {
        audio.pause()
      })
    }
  }

  const gui = new GUI()
  gui.add(controlsGui, 'play')
  gui.add(controlsGui, 'pause')
}
</script>
