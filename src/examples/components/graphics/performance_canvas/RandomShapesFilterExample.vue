<template>
  <div class="graphics-root" ref="gContainer">
    <canvas width="600" height="600"></canvas>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'

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
    const canvas = gContainer.value.querySelector('canvas');
        const ctx = canvas.getContext('2d');
    
        function regularShape(x, y, r, edges = 3) {
          const points = [];
          const delta = 2 * Math.PI / edges;
          for(let i = 0; i < edges; i++) {
            const theta = i * delta;
            points.push([x + r * Math.sin(theta), y + r * Math.cos(theta)]);
          }
          return points;
        }
    
        function drawShape(context, points) {
          context.lineWidth = 2;
          context.beginPath();
          context.moveTo(...points[0]);
          for(let i = 1; i < points.length; i++) {
            context.lineTo(...points[i]);
          }
          context.closePath();
          context.stroke();
          context.fill();
        }
    
        const shapeTypes = [3, 4, 5, 6, -1];
        const TAU = Math.PI * 2;
    
        function createCache() {
          const ret = [];
          for(let i = 0; i < shapeTypes.length; i++) {
            const cacheCanvas = new OffscreenCanvas(20, 20);
            const type = shapeTypes[i];
            const context = cacheCanvas.getContext('2d');
            context.fillStyle = 'red';
            context.strokeStyle = 'black';
            if(type > 0) {
              const points = regularShape(10, 10, 10, type);
              drawShape(context, points);
            } else {
              context.beginPath();
              context.arc(10, 10, 10, 0, TAU);
              context.stroke();
              context.fill();
            }
            ret.push(cacheCanvas);
          }
          return ret;
        }
    
        const shapes = createCache();
        const COUNT = 1000;
    
        ctx.filter = 'blur(5px)';
        // ctx.filter = 'grayscale(100%)';
        function draw() {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          for(let i = 0; i < COUNT; i++) {
            const shape = shapes[Math.floor(Math.random() * shapeTypes.length)];
            const x = Math.random() * canvas.width;
            const y = Math.random() * canvas.height;
            ctx.drawImage(shape, x, y);
          }
          requestAnimationFrame(draw);
        }
    
        draw();
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