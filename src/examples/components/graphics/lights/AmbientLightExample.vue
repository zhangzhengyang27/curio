<template>
  <div class="graphics-root" ref="gContainer">
    <canvas width="512" height="512"></canvas>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import {Renderer, Camera, Transform, Program, Sphere, Box, Cylinder, Torus, Mesh, Orbit, Color} from '@/examples/jsm-compat/graphics/common/lib/ogl/index.mjs'
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
        camera.position.set(0, 1, 7);
        camera.lookAt([0, 0, 0]);
    
        const scene = new Transform();
        
        const sphereGeometry = new Sphere(gl);
        const cubeGeometry = new Box(gl);
        const cylinderGeometry = new Cylinder(gl);
        const torusGeometry = new Torus(gl);
    
        const vertex = /* glsl */ `
          precision highp float;
    
          attribute vec3 position;
          attribute vec3 normal;
          uniform mat4 modelViewMatrix;
          uniform mat4 projectionMatrix;
          uniform mat3 normalMatrix;
          void main() {
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `;
    
        const fragment = /* glsl */ `
          precision highp float;
    
          uniform vec3 ambientLight;
          uniform vec3 materialReflection;
    
          void main() {
            gl_FragColor.rgb = ambientLight * materialReflection;
            gl_FragColor.a = 1.0;
          }
        `;
    
        const program1 = new Program(gl, {
          vertex,
          fragment,
          uniforms: {
            ambientLight: {value: [1, 1, 1]},
            materialReflection: {value: [0, 0, 1]},
          },
        });
        const program2 = new Program(gl, {
          vertex,
          fragment,
          uniforms: {
            ambientLight: {value: [1, 1, 1]},
            materialReflection: {value: [1, 0, 1]},
          },
        });
        const program3 = new Program(gl, {
          vertex,
          fragment,
          uniforms: {
            ambientLight: {value: [1, 1, 1]},
            materialReflection: {value: [0, 0.5, 0]},
          },
        });
        const program4 = new Program(gl, {
          vertex,
          fragment,
          uniforms: {
            ambientLight: {value: [1, 1, 1]},
            materialReflection: {value: [1, 0, 0]},
          },
        });
    
        const controls = new Orbit(camera);
    
        const torus = new Mesh(gl, {geometry: torusGeometry, program: program1});
        torus.position.set(0, 1.3, 0);
        torus.setParent(scene);
    
        const sphere = new Mesh(gl, {geometry: sphereGeometry, program: program2});
        sphere.position.set(1.3, 0, 0);
        sphere.setParent(scene);
    
        const cube = new Mesh(gl, {geometry: cubeGeometry, program: program3});
        cube.position.set(0, -1.3, 0);
        cube.setParent(scene);
    
        const cylinder = new Mesh(gl, {geometry: cylinderGeometry, program: program4});
        cylinder.position.set(-1.3, 0, 0);
        cylinder.setParent(scene);
    
        requestAnimationFrame(update);
        function update() {
          requestAnimationFrame(update);
          controls.update();
    
          // torus.rotation.y -= 0.02;
          // sphere.rotation.y -= 0.03;
          // cube.rotation.y -= 0.04;
          // cylinder.rotation.y -= 0.02;
    
          renderer.render({scene, camera});
        }
    
        const gui = new dat.GUI();
        const palette = {
          light: '#FFFFFF',
          reflection1: '#0000FF',
          reflection2: '#FF00FF',
          reflection3: '#008000',
          reflection4: '#FF0000',
        };
        gui.addColor(palette, 'light').onChange((val) => {
          const color = new Color(val);
          program1.uniforms.ambientLight.value = color;
          program2.uniforms.ambientLight.value = color;
          program3.uniforms.ambientLight.value = color;
          program4.uniforms.ambientLight.value = color;
        });
        gui.addColor(palette, 'reflection1').onChange((val) => {
          program1.uniforms.materialReflection.value = new Color(val);
        });
        gui.addColor(palette, 'reflection2').onChange((val) => {
          program2.uniforms.materialReflection.value = new Color(val);
        });
        gui.addColor(palette, 'reflection3').onChange((val) => {
          program3.uniforms.materialReflection.value = new Color(val);
        });
        gui.addColor(palette, 'reflection4').onChange((val) => {
          program4.uniforms.materialReflection.value = new Color(val);
        });
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