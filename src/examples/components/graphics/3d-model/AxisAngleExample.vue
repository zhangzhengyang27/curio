<template>
  <div class="graphics-root" ref="gContainer">
    <canvas width="512" height="512"></canvas>
  </div>
</template>

<script setup lang="ts">

let gui: any = null
import { ref, onMounted, onUnmounted } from 'vue'
import {Renderer, Camera, Transform, Program, Geometry, Mesh, Orbit, Texture, Polyline, Color, Vec3, Quat} from '@/examples/jsm-compat/graphics/common/lib/ogl/index.mjs'
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
    
        const controls = new Orbit(camera);
    
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
    
          const points = [
            new Vec3(0, 0, 0),
            new Vec3(0, 10, 0),
          ];
    
          const axis = new Polyline(gl, {
            points,
            uniforms: {
              uColor: {value: new Color('#f00')},
              uThickness: {value: 3},
            },
          });
          axis.mesh.setParent(scene);
          renderer.render({scene, camera});
    
          gui = new GUI();
          const palette = {
            alpha: 0,
            x: 0,
            y: 1,
            z: 0,
          };
    
          function updateAxis() {
            const {x, y, z} = palette;
            const v = new Vec3(x, y, z).normalize().scale(10);
            points[1].copy(v);
            axis.updateGeometry();
            renderer.render({scene, camera});
          }
    
          function updateQuaternion(val: any) {
            const theta = 0.5 * val / 180 * Math.PI;
            const c = Math.cos(theta);
            const s = Math.sin(theta);
            const p = new Vec3().copy(points[1]).normalize();
            const q = new Quat(p.x * s, p.y * s, p.z * s, c);
            mesh.quaternion = q;
            renderer.render({scene, camera});
          }
          gui.add(palette, 'x', -10, 10).onChange(updateAxis);
          gui.add(palette, 'y', -10, 10).onChange(updateAxis);
          gui.add(palette, 'z', -10, 10).onChange(updateAxis);
          gui.add(palette, 'alpha', -180, 180).onChange(updateQuaternion);
    
          requestAnimationFrame(update);
          function update() {
            requestAnimationFrame(update);
            // controls.update();
            renderer.render({scene, camera});
          }
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