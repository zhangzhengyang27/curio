<template>
  <div class="mygrapics-root" ref="mgContainer">
    <canvas id="paper" width="0" height="0"></canvas>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import {loadImage, getImageData, traverse} from '@/examples/jsm-compat/mygrapics/pixels/lib/util.js'
import {transformColor} from '@/examples/jsm-compat/mygrapics/pixels/lib/color-matrix.js'

const mgContainer = ref(null)
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

async function initMyGrapicsExample() {
  {
    function brightness(p) {
          return [
            p, 0, 0, 0, 0,
            0, p, 0, 0, 0,
            0, 0, p, 0, 0,
            0, 0, 0, 1, 0,
          ];
        }
    
        function saturate(p) {
          const r = 0.212 * (1 - p);
          const g = 0.714 * (1 - p);
          const b = 0.074 * (1 - p);
          return [
            r + p, g, b, 0, 0,
            r, g + p, b, 0, 0,
            r, g, b + p, 0, 0,
            0, 0, 0, 1, 0,
          ];
        }
    
        function grayscale(p) {
          const r = 0.212 * p;
          const g = 0.714 * p;
          const b = 0.074 * p;
    
          return [
            r + 1 - p, g, b, 0, 0,
            r, g + 1 - p, b, 0, 0,
            r, g, b + 1 - p, 0, 0,
            0, 0, 0, 1, 0,
          ];
        }
    
        function channel({r = 1, g = 1, b = 1}) {
          return [
            r, 0, 0, 0, 0,
            0, g, 0, 0, 0,
            0, 0, b, 0, 0,
            0, 0, 0, 1, 0,
          ];
        }
    
        const canvas = mgContainer.value.querySelector('#paper');
        const context = canvas.getContext('2d');
    
        (async function () {
          const img = await loadImage('assets/girl1.jpg');
          const imageData = getImageData(img);
    
          traverse(imageData, ({r, g, b, a}) => {
            return transformColor(
              [r, g, b, a],
              channel({r: 1.2}),
              brightness(1.2),
              saturate(1.2),
            );
          });
    
          canvas.width = imageData.width;
          canvas.height = imageData.height;
          context.putImageData(imageData, 0, 0);
        }());
  }
}

onMounted(() => {
  installCleanupHooks()
  initMyGrapicsExample().catch(err => {
    console.error('MyGrapics example init failed:', err)
  })
})

onUnmounted(() => {
  cleanupFns.forEach(fn => fn())
  cleanupFns.length = 0
})
</script>