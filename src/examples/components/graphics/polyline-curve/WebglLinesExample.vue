<template>
  <div class="graphics-root" ref="gContainer">
    <canvas width="512" height="512"></canvas>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import {Renderer, Program, Geometry, Transform, Mesh} from '@/examples/jsm-compat/graphics/common/lib/ogl/index.mjs'

const gContainer = ref(null)
const cleanupFns = []
const gfxLoadedScripts = []


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

  const timeouts = []
  const origSetTimeout = window.setTimeout
  const origSetInterval = window.setInterval
  const origClearTimeout = window.clearTimeout
  const origClearInterval = window.clearInterval
  window.setTimeout = (fn, delay, ...args) => {
    const id = origSetTimeout(fn, delay, ...args)
    timeouts.push(['timeout', id])
    return id
  }
  window.setInterval = (fn, delay, ...args) => {
    const id = origSetInterval(fn, delay, ...args)
    timeouts.push(['interval', id])
    return id
  }
  cleanupFns.push(() => {
    timeouts.forEach(([kind, id]) => {
      if (kind === 'timeout') origClearTimeout(id)
      else origClearInterval(id)
    })
    window.setTimeout = origSetTimeout
    window.setInterval = origSetInterval
    window.clearTimeout = origClearTimeout
    window.clearInterval = origClearInterval
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
    gfxLoadedScripts.forEach(s => s.remove())
  })
}

async function initGraphicsExample() {
  {
    const vertex = `
          attribute vec2 position;
    
          void main() {
            gl_PointSize = 10.0;
            float scale = 1.0 / 256.0;
            mat3 projectionMatrix = mat3(
              scale, 0, 0,
              0, -scale, 0,
              -1, 1, 1
            );
            vec3 pos = projectionMatrix * vec3(position, 1);
            gl_Position = vec4(pos.xy, 0, 1);
          }
        `;
    
        const fragment = `
          precision highp float;
          void main() {
            gl_FragColor = vec4(1, 0, 0, 1);
          }
        `;
    
        const canvas = gContainer.value.querySelector('canvas');
        const renderer = new Renderer({
          canvas,
          width: 512,
          height: 512,
        });
    
        const gl = renderer.gl;
        gl.clearColor(1, 1, 1, 1);
    
        const program = new Program(gl, {
          vertex,
          fragment,
        });
    
        const geometry = new Geometry(gl, {
          position: {size: 2,
            data: new Float32Array(
              [
                100, 100,
                100, 200,
                200, 150,
                300, 200,
                300, 100,
              ],
            )},
        });
    
        const scene = new Transform();
        const polyline = new Mesh(gl, {geometry, program, mode: gl.LINE_STRIP});
        polyline.setParent(scene);
    
        renderer.render({scene});
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