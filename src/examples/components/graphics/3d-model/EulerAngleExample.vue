<template>
  <div class="graphics-root" ref="gContainer">
    <canvas width="512" height="512"></canvas>
  </div>
</template>

<script setup lang="ts">

let gui: any = null
import { ref, onMounted, onUnmounted } from 'vue'
import {Renderer, Camera, Transform, Program, Geometry, Mesh, Orbit, Texture} from '@/examples/jsm-compat/graphics/common/lib/ogl/index.mjs'
import { GUI } from 'lil-gui'
import { useGraphicsCleanup } from '@/examples/composables/useGraphicsCleanup'

const gContainer = ref<HTMLElement | null>(null)
const gfxLoadedScripts: any[] = []
const { runInit } = useGraphicsCleanup(gfxLoadedScripts)




async function initGraphicsExample() {
  {
    const canvas = gContainer.value!.querySelector('canvas') as HTMLCanvasElement;
        const renderer = new Renderer({
          canvas,
          width: 512,
          height: 512,
        });
    
        const gl = renderer.gl;
        gl.clearColor(1, 1, 1, 1);
        const camera = new Camera(gl, {fov: 35});
        camera.position.set(0, 0, 10);
        camera.lookAt([0, 0, 0]);
    
        const scene = new Transform();
    
        const vertex = /* glsl */ `
          precision highp float;
    
          attribute vec3 position;
          attribute vec3 normal;
          attribute vec2 uv;
    
          uniform mat4 modelViewMatrix;
          uniform mat4 projectionMatrix;
    
          varying vec2 vUv;
    
          void main() {
            vUv = uv;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `;
    
        const fragment = /* glsl */ `
          precision highp float;
    
          uniform sampler2D tMap;
          varying vec2 vUv;
    
          void main() {
            gl_FragColor = texture2D(tMap, vUv);
          }
        `;
    
        async function loadModel(src: any) {
          const data = await (await fetch(src)).json();
    
          const geometry = new Geometry(gl, {
            position: {size: 3, data: new Float32Array(data.position)},
            uv: {size: 2, data: new Float32Array(data.uv)},
            normal: {size: 3, data: new Float32Array(data.normal)},
          });
    
          return geometry;
        }
    
        function loadTexture(src: any) {
          const texture = new Texture(gl);
          return new Promise((resolve) => {
            const img = new Image();
            img.onload = () => {
              texture.image = img;
              resolve(texture);
            };
            img.src = src;
          });
        }
    
        (async function () {
          const geometry = await loadModel('/graphics/assets/airplane.json');
          const texture = await loadTexture('/graphics/assets/airplane.jpg');
    
          const program = new Program(gl, {
            vertex,
            fragment,
            uniforms: {
              tMap: {value: texture},
            },
          });
          const mesh = new Mesh(gl, {geometry, program});
          mesh.setParent(scene);
          renderer.render({scene, camera});
    
          gui = new GUI();
          const palette = {
            alpha: 0,
            beta: 0,
            theta: 0,
          };
          gui.add(palette, 'alpha', -180, 180).onChange((val: any) => {
            mesh.rotation.y = val / 180 * Math.PI;
            renderer.render({scene, camera});
          });
          gui.add(palette, 'beta', -180, 180).onChange((val: any) => {
            mesh.rotation.x = val / 180 * Math.PI;
            renderer.render({scene, camera});
          });
          gui.add(palette, 'theta', -180, 180).onChange((val: any) => {
            mesh.rotation.z = val / 180 * Math.PI;
            renderer.render({scene, camera});
          });
        }());
  }
}

onMounted(() => {
  runInit(initGraphicsExample).catch(err => {
    console.error('Graphics example init failed:', err)
  })
})

// cleanup is handled by useGraphicsCleanup
// onUnmounted not needed

onUnmounted(() => {
  gui?.destroy()
})
</script>