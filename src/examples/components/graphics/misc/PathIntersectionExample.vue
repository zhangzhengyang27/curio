<template>
  <div class="graphics-root" ref="gContainer">
    <canvas width="600" height="600"></canvas>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import {subtract, cross} from '@/examples/jsm-compat/graphics/common/lib/math/functions/Vec2Func.js'

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
    function isCross(p1, p2, p3, p4) {
          const v1 = subtract([], p4, p3);
          const v2 = subtract([], p1, p3);
          const v3 = subtract([], p2, p3);
    
          const z1 = cross(v1, v2);
          const z2 = cross(v1, v3);
    
          return z1 * z2 <= 0;
        }
    
        function isPathIntersection(points) {
          const len = points.length;
    
          for(let i = 0; i < len - 1; i++) {
            const point = points[i];
            const nextPoint = points[i + 1];
    
            for(let j = 0; j < len - 1; j++) {
              const p1 = points[j],
                p2 = points[j + 1];
    
              if(p1 !== point && p2 !== point && p1 !== nextPoint && p2 !== nextPoint
                && isCross(p1, p2, point, nextPoint) && isCross(point, nextPoint, p1, p2)) {
                return true;
              }
            }
          }
          return false;
        }
    
        function draw(context, points) {
          context.clearRect(0, 0, context.canvas.width, context.canvas.height);
          const d = `M${points.join('L')}`;
          const color = isPathIntersection(points) ? 'red' : 'blue';
          context.strokeStyle = color;
          const path = new Path2D(d);
          context.stroke(path);
        }
    
        const canvas = gContainer.value.querySelector('canvas');
        const ctx = canvas.getContext('2d');
        ctx.lineWidth = 5;
        ctx.lineJoin = 'round';
        ctx.lineCap = 'round';
        const points = [];
    
        canvas.addEventListener('click', (evt) => {
          const {x, y} = evt;
          const {x: x0, y: y0} = evt.target.getBoundingClientRect();
          points.push([x - x0, y - y0]);
          draw(ctx, points);
        });
    
        canvas.addEventListener('dblclick', (evt) => {
          points.length = 0;
          draw(ctx, points);
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

<style scoped>
canvas {
      background: #eee;
    }
</style>