<template>
  <div class="graphics-root" ref="gContainer">
    <canvas width="512" height="512"></canvas>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import {Renderer, Camera, Transform, Program, Geometry, Mesh, Orbit, Texture, Polyline, Color, Vec3, Quat} from '@/examples/jsm-compat/graphics/common/lib/ogl/index.mjs'
import * as dat from '@/examples/jsm-compat/graphics/common/lib/dat.gui.js'

const gContainer = ref(null)
const cleanupFns = []


function installCleanupHooks() {
  const origRaf = window.requestAnimationFrame
  const origCancelRaf = window.cancelAnimationFrame
  const rafIds = []
  window.requestAnimationFrame = (cb) => {
    const id = origRaf((time) => {
      const idx = rafIds.indexOf(id)
      if (idx !== -1) rafIds.splice(idx, 1)
      cb(time)
    })
    rafIds.push(id)
    return id
  }
  window.cancelAnimationFrame = (id) => {
    const idx = rafIds.indexOf(id)
    if (idx !== -1) rafIds.splice(idx, 1)
    return origCancelRaf(id)
  }
  cleanupFns.push(() => {
    rafIds.forEach(id => origCancelRaf(id))
    window.requestAnimationFrame = origRaf
    window.cancelAnimationFrame = origCancelRaf
  })

  const listeners = []
  const origWindowAdd = window.addEventListener
  const origDocAdd = document.addEventListener
  window.addEventListener = (type, fn, opts) => {
    listeners.push(['window', type, fn, opts])
    return origWindowAdd.call(window, type, fn, opts)
  }
  document.addEventListener = (type, fn, opts) => {
    listeners.push(['document', type, fn, opts])
    return origDocAdd.call(document, type, fn, opts)
  }
  cleanupFns.push(() => {
    listeners.forEach(([target, type, fn, opts]) => {
      if (target === 'window') window.removeEventListener(type, fn, opts)
      else if (target === 'document') document.removeEventListener(type, fn, opts)
    })
    window.addEventListener = origWindowAdd
    document.addEventListener = origDocAdd
  })

  const glContexts = []
  const origGetContext = HTMLCanvasElement.prototype.getContext
  HTMLCanvasElement.prototype.getContext = function(type, attrs) {
    const ctx = origGetContext.call(this, type, attrs)
    if (ctx && /^(webgl|webgl2|experimental-webgl)$/.test(type)) {
      glContexts.push(ctx)
    }
    return ctx
  }
  cleanupFns.push(() => {
    glContexts.forEach((ctx) => {
      const ext = ctx.getExtension('WEBGL_lose_context')
      if (ext) ext.loseContext()
    })
    HTMLCanvasElement.prototype.getContext = origGetContext
  })
}

async function initGraphicsExample() {
  {
    const canvas = gContainer.value.querySelector('canvas');
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
    
        async function loadModel(src) {
          const data = await (await fetch(src)).json();
    
          const geometry = new Geometry(gl, {
            position: {size: 3, data: new Float32Array(data.position)},
            uv: {size: 2, data: new Float32Array(data.uv)},
            normal: {size: 3, data: new Float32Array(data.normal)},
          });
    
          return geometry;
        }
    
        function loadTexture(src) {
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
    
          const gui = new dat.GUI();
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
    
          function updateQuaternion(val) {
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
  installCleanupHooks()
  initGraphicsExample().catch(err => {
    console.error('Graphics example init failed:', err)
  })
})

onUnmounted(() => {
  cleanupFns.forEach(fn => fn())
  cleanupFns.length = 0
})
</script>