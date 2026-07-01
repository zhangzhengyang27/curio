<template>
  <div class="graphics-root" ref="gContainer"></div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import {pen, put, left, right, forward, render} from '@/examples/jsm-compat/graphics/sketch/lib/doodle.js'

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
    pen(1, '#3a7');
        put(0, -1);
        left(90);
        forward(1);
        function tree(depth) {
          const l = 0.1;
          if(depth <= 0) return;
          forward(l);
          tree(depth - 1);
          forward(-l);
          left(30);
          forward(l);
          tree(depth - 1);
          forward(-l);
          right(60);
          forward(l);
          tree(depth - 1);
          forward(-l);
          left(30);
        }
    
        tree(10);
    
        {
          const width = 512,
            height = 512;
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          gContainer.value.appendChild(canvas);
    
          render((commands) => {
            const ctx = canvas.getContext('2d');
            function project({x, y}) { // -1 ~ 1
              return {
                x: 0.5 * (x + 1) * canvas.width,
                y: 0.5 * (1 - y) * canvas.height,
              };
            }
    
            commands.forEach(({command, args}, idx) => {
              if(command === 'pen') {
                if(idx > 0) ctx.stroke();
                const {color, lineWidth} = args;
                ctx.strokeStyle = color;
                ctx.lineWidth = lineWidth;
                ctx.beginPath();
              } else if(command === 'put') {
                const {x, y} = project(args);
                ctx.moveTo(x, y);
              } else if(command === 'forward') {
                const {x, y} = project(args);
                ctx.lineTo(x, y);
              }
            });
            ctx.stroke();
          });
        }
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