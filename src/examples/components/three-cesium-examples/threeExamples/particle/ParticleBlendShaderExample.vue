<template>
  <ExampleScene
    camera="perspective"
    :camera-position="[0, 10, 10]"
    alpha
    antialias
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

  controls.enableDamping = true
  
  // 粒子参数
  const parameters = {
  
      particlesSum: 100000,
  
      inner: 0,
  
      outer: 1500,
  
      maxVelocity: 30,
  
      mapUrl: 'https://z2586300277.github.io/three-editor/dist/files/channels/snow.png',
  
      sportType: '全随机',
  
  }
  
  // 几何参数
  const positions = new Float32Array(parameters.particlesSum * 3);
  
  const velocities = new Float32Array(parameters.particlesSum * 3);
  
  const setVelocities = {
  
      '全随机': (i) => {
  
          velocities[i * 3] += (Math.random() - 0.5) * parameters.maxVelocity / 1000
  
          velocities[i * 3 + 1] += (Math.random() - 0.5) * parameters.maxVelocity / 1000
  
          velocities[i * 3 + 2] += (Math.random() - 0.5) * parameters.maxVelocity / 1000
  
      },
  
      '随机向上': (i) => {
  
          velocities[i * 3] += (Math.random() - 0.5) * parameters.maxVelocity / 1000
  
          velocities[i * 3 + 1] += Math.abs((Math.random() - 0.5) * parameters.maxVelocity / 100000)
  
          velocities[i * 3 + 2] += (Math.random() - 0.5) * parameters.maxVelocity / 1000
  
      },
  
      '随机向下': (i) => {
  
          velocities[i * 3] += (Math.random() - 0.5) * parameters.maxVelocity / 1000
  
          velocities[i * 3 + 1] -= Math.abs((Math.random() - 0.5) * parameters.maxVelocity / 100000)
  
          velocities[i * 3 + 2] += (Math.random() - 0.5) * parameters.maxVelocity / 1000
  
      },
  
      '直线匀速向上': (i) => {
  
          velocities[i * 3] = 0
  
          velocities[i * 3 + 1] += parameters.maxVelocity / 2 / 100000
  
          velocities[i * 3 + 2] = 0
  
      },
  
      '直线匀速向下': (i) => {
  
          velocities[i * 3] = 0
  
          velocities[i * 3 + 1] -= parameters.maxVelocity / 2 / 100000
  
          velocities[i * 3 + 2] = 0
  
      }
  
  }[parameters.sportType]
  
  function getPosition() {
  
      let x, y, z
  
      do {
  
          x = Math.random() * 2 * parameters.outer - parameters.outer;
  
          y = Math.random() * 2 * parameters.outer - parameters.outer;
  
          z = Math.random() * 2 * parameters.outer - parameters.outer;
  
      } while (Math.abs(x) <= parameters.inner && Math.abs(y) <= parameters.inner && Math.abs(z) <= parameters.inner);
  
      return [x, y, z]
  
  }
  
  for (let i = 0; i < parameters.particlesSum; i++)  positions.set(getPosition(), i * 3)
  
  const geometry = new THREE.BufferGeometry()
  
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
  
  geometry.geometryRender = () => {
  
      for (let i = 0; i < parameters.particlesSum; i++) {
  
          setVelocities(i)
  
          positions[i * 3] += velocities[i * 3];
  
          positions[i * 3 + 1] += velocities[i * 3 + 1];
  
          positions[i * 3 + 2] += velocities[i * 3 + 2];
  
          if (
              Math.abs(positions[i * 3]) > parameters.outer ||
              Math.abs(positions[i * 3 + 1]) > parameters.outer ||
              Math.abs(positions[i * 3 + 2]) > parameters.outer ||
              Math.abs(positions[i * 3]) < parameters.inner &&
              Math.abs(positions[i * 3 + 1]) < parameters.inner &&
              Math.abs(positions[i * 3 + 2]) < parameters.inner
          ) {
  
              const [x, y, z] = getPosition()
  
              positions[i * 3] = x
  
              positions[i * 3 + 1] = y
  
              positions[i * 3 + 2] = z
  
              velocities[i * 3] = 0
  
              velocities[i * 3 + 1] = 0
  
              velocities[i * 3 + 2] = 0
  
          }
  
      }
  
      geometry.attributes.position.needsUpdate = true;
  
  }
  
  // 材质参数
  const uniforms = {
  
      iResolution: { type: 'vec2', value: new THREE.Vector2(ctx.container?.clientWidth, ctx.container?.clientHeight), unit: 'vec2' },
  
      iTime: { type: 'number', value: 1.0, unit: 'float' },
  
      speed: { type: 'number', value: 0.01, unit: 'float' },
  
      intensity: { type: 'number', unit: 'float', value: 8 },
  
      mixRatio: { type: 'number', unit: 'float', value: 0.7 },
  
      mixColor: { type: 'color', unit: 'vec3', value: new THREE.Color(0xffffff) },
  
      hasUv: { type: 'bool', unit: 'bool', value: true }
  
  }
  
  const blendFrag = `
      vec3 c;
      float l,z=iTime;
      for(int i=0;i<3;i++) {
          vec2 uv,p=gl_FragCoord.xy/iResolution/2.0;
          uv=p;
          p-=.3;
          if(hasUv) uv=vUv;
          z+=.07;
          l=length(p);
          uv+=p/l*(sin(z)+1.)*abs(sin(l*9.-z-z));
          c[i]=.01/length(mod(uv,1.)-.5);
      }
      vec3 effect_color = c;
  `
  
  const _uniforms = {
  
      pointTexture: {
  
          value: new THREE.TextureLoader().load(parameters.mapUrl),
  
          type: 'texture',
  
          unit: 'sampler2D'
  
      },
  
      size: {
  
          value: 30,
  
          type: 'number',
  
          unit: 'float'
  
      },
  
      discardVal: {
  
          value: 0.5,
  
          type: 'number',
  
          unit: 'float'
  
      },
  
      opacity: {
  
          value: 1,
  
          type: 'opacity',
  
          unit: 'float'
  
      },
  
      // 衰减
      isdecaySize: {
  
          value: true,
  
          type: 'bool',
  
          unit: 'bool'
  
      }
  
  }
  
  const uniforms_all = Object.assign(uniforms, _uniforms)
  
  const material = new THREE.ShaderMaterial({
  
      uniforms: uniforms_all,
  
      vertexShader: `
  
          uniform float size;
  
          uniform bool isdecaySize;
  
          void main() {
  
              vec4 mvPosition = modelViewMatrix * vec4( position, 1.0 );
  
              gl_PointSize = isdecaySize ? size * ( 300.0 / -mvPosition.z ) : size;
  
              gl_Position = projectionMatrix * mvPosition;
  
          } `,
  
      fragmentShader: Object.keys(uniforms_all).map(i => 'uniform ' + uniforms[i].unit + ' ' + i + ';').join('\n') + `
  
          void main() {
  
              vec2 vUv = gl_PointCoord.xy - .5;` +
  
          blendFrag +
  
          `vec3 useColor = effect_color;
              vec4 textureColor = texture2D( pointTexture, gl_PointCoord );
              if (textureColor.a < discardVal) discard;
              else useColor *= textureColor.rgb;
              gl_FragColor = vec4( mix( mixColor, useColor * vec3( intensity, intensity, intensity), mixRatio ) , opacity );
          }`,
  
      transparent: true,
  
      depthTest: true,
  
      blending: THREE.AdditiveBlending
  
  })
  
  const mesh = new THREE.Points(geometry, material)
  
  scene.add(mesh)
  
  ctx.addUpdateCallback(() => {
    mesh.geometry.geometryRender?.()
        uniforms.iTime.value += uniforms.speed.value
  })
  
  const gui = new GUI()

  gui.add(uniforms.intensity, 'value', 0, 100).name('intensity')

  gui.add(uniforms.speed, 'value', 0, 0.1).name('speed')

  gui.add(uniforms.mixRatio, 'value', 0, 1).name('mixRatio')

  gui.addColor(uniforms.mixColor, 'value').name('mixColor')

  gui.add(uniforms.hasUv, 'value').name('hasUv')

  gui.add(_uniforms.size, 'value', 0, 100).name('size')

  gui.add(_uniforms.discardVal, 'value', 0, 1).name('discardVal')

  gui.add(_uniforms.opacity, 'value', 0, 1).name('opacity')

  gui.add(_uniforms.isdecaySize, 'value').name('isdecaySize')
}
</script>
