<template>
  <div class="graphics-root" ref="gContainer">
    <div id="container">
      <canvas width="600" height="600" id="bg"></canvas>
      <canvas width="600" height="600" id="fg"></canvas>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'

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
    function drawRandomTriangle(path, context) {
          const {width, height} = context.canvas;
          context.save();
          context.translate(Math.random() * width, Math.random() * height);
          context.fill(path);
          context.restore();
        }
    
        function drawBackground(context, count = 2000) {
          context.fillStyle = '#ed7';
          const d = 'M0,0L0,10L8.66, 5z';
          const p = new Path2D(d);
          for(let i = 0; i < count; i++) {
            drawRandomTriangle(p, context);
          }
        }
    
        function loadImage(src) {
          const img = new Image();
          img.crossOrigin = 'anonymous';
          return new Promise((resolve) => {
            img.onload = resolve(img);
            img.src = src;
          });
        }
    
        async function drawForeground(context) {
          const img = await loadImage('/graphics/assets/external/t015b85b72445154fe0.png');
          const {width, height} = context.canvas;
          function update(t) {
            context.clearRect(0, 0, width, height);
            context.save();
            context.translate(0, 0.5 * height);
            const p = (t % 3000) / 3000;
            const x = width * p;
            const y = 0.1 * height * Math.sin(3 * Math.PI * p);
            context.drawImage(img, x, y);
            context.restore();
            requestAnimationFrame(update);
          }
          update(0);
        }
    
        const bgcanvas = gContainer.value.querySelector('#bg');
        const fgcanvas = gContainer.value.querySelector('#fg');
        drawBackground(bgcanvas.getContext('2d'));
        drawForeground(fgcanvas.getContext('2d'));
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
#container canvas {
      position: absolute;
    }
    #bg {
      background-color: #000;
    }
</style>