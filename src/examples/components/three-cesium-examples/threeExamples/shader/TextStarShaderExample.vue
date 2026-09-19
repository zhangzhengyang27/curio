<template>
  <ExampleScene
    camera="perspective"
    :camera-position="[100, 400, 600]"
    antialias
    @ready="onReady"
  />
</template>

<script setup lang="ts">
import * as THREE from 'three';
import { TrackballControls } from 'three/examples/jsm/controls/TrackballControls.js';
import { TessellateModifier } from 'three/examples/jsm/modifiers/TessellateModifier.js';
import { FontLoader } from 'three/examples/jsm/loaders/FontLoader.js';
import { TextGeometry } from 'three/examples/jsm/geometries/TextGeometry.js';
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
  const renderer = ctx.renderer
  const controls = ctx.controls

  const data = await new Promise<any>((r) => {
      fetch('https://api.github.com/repos/z2586300277/three-cesium-examples').then(res => res.json()).then(d => r(d))
      setTimeout(() => r({
          stargazers_count: 230,
          forks_count: 40
      }), 1000)
  })
  
  let mesh, uniforms: any;
  let trackballControls: any;

  const loader = new FontLoader()
  loader.load(props.example?.globals?.FILE_HOST + 'files/json/font.json', font => init(font))
  
  const text =
      `three-cesium-examples 
  
  Stars ${data.stargazers_count}   Fork ${data.forks_count}
  
  Thanks for your star
  `
  
  function init(font: any) {
  
      
  
      
      scene.background = new THREE.Color(0x050505);
  
      let geometry = new TextGeometry(text, {
          font: font,
          size: 30,
          depth: 5,
          curveSegments: 3,
          bevelThickness: 2,
          bevelSize: 1,
          bevelEnabled: true
      })
  
      geometry.center();
      const tessellateModifier = new TessellateModifier(4, 3);
      geometry = tessellateModifier.modify(geometry);
      const numFaces = geometry.attributes.position.count / 3;
      const colors = new Float32Array(numFaces * 3 * 3);
      const displacement = new Float32Array(numFaces * 3 * 3);
      const color = new THREE.Color();
  
      for (let f = 0; f < numFaces; f++) {
          const index = 9 * f;
          if (Math.random() > 0.5) {
  
              const h = 0.2 * Math.random();
              const s = 0.5 + 0.5 * Math.random();
              const l = 0.5 + 0.5 * Math.random();
  
              color.setHSL(h, s, l);
          }
          else color.set(0xa58fb5);
          const d = 60 * (0.5 - Math.random());
          for (let i = 0; i < 3; i++) {
              colors[index + (3 * i)] = color.r;
              colors[index + (3 * i) + 1] = color.g;
              colors[index + (3 * i) + 2] = color.b;
              displacement[index + (3 * i)] = d;
              displacement[index + (3 * i) + 1] = d;
              displacement[index + (3 * i) + 2] = d;
          }
      }
  
      geometry.setAttribute('customColor', new THREE.BufferAttribute(colors, 3));
      geometry.setAttribute('displacement', new THREE.BufferAttribute(displacement, 3));
  
      uniforms = { amplitude: { value: 0.0 }, opacityf: { value: 0.8 } }
  
      const shaderMaterial = new THREE.ShaderMaterial({
          uniforms: uniforms,
          vertexShader: `uniform float amplitude;
          attribute vec3 customColor;
          attribute vec3 displacement;
          varying vec3 vNormal;
          varying vec3 vColor;
          varying vec2 vUv;
          void main() {
              vUv = uv;
              vNormal = normal;
              vColor = customColor;
              vec3 newPosition = position + normal * amplitude * displacement;
              gl_Position = projectionMatrix * modelViewMatrix * vec4( newPosition, 1.0 );
          }`,
          fragmentShader: `
              varying vec3 vNormal;
              varying vec3 vColor;
              varying vec2 vUv;
              uniform float opacityf;
              uniform float amplitude;
              void main() {
  
                  vec2 uv = vUv;
                  float iTime = amplitude;
                  vec3 wave_color = vec3(0.0);
                  float wave_width = 0.0;
                  for(float i = 0.0; i <= 28.0; i++) {
                      uv.y += (0.2+(0.9*sin(iTime*0.4) * sin(uv.x + i/3.0 + 3.0 *iTime )));
                      uv.x += 1.7* sin(iTime*0.4);
                      wave_width = abs(1.0 / (200.0*abs(cos(iTime)) * uv.y));
                      wave_color += vec3(wave_width *( 0.4+((i+1.0)/18.0)), wave_width * (i / 9.0), wave_width * ((i+1.0)/ 8.0) * 1.9);
                  }
                  
                  const float ambient = 0.4;
                  vec3 light = vec3( 1.0 );
                  light = normalize( light );
                  float directional = max( dot( vNormal, light ), 0.0 );
                  gl_FragColor = vec4( mix(( directional + ambient ) * vColor, wave_color,  0.6), opacityf );
              }
          `,
          transparent: true,
          wireframe: true,
          wireframeLinewidth: 4
      })
      mesh = new THREE.Mesh(geometry, shaderMaterial);
      scene.add(mesh);
  
      
      trackballControls = new TrackballControls(camera, renderer.domElement)
  }
  
  function onWindowResize() {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
  }
  
  function render() {
      uniforms.amplitude.value = Math.sin(Date.now() * 0.001);
      trackballControls.update();
  }
}
</script>
