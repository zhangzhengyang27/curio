<template>
  <div class="graphics-root" ref="gContainer"></div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import {pen, put, left, right, forward, render} from '@/examples/jsm-compat/graphics/sketch/lib/doodle.js'

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
    
        tree(8);
    
        {
          const width = 512,
            height = 512;
          const panel = document.createElement('div');
          panel.style.width = `${width}px`;
          panel.style.height = `${height}px`;
          panel.style.position = 'relative';
          gContainer.value.appendChild(panel);
    
          render((commands) => {
            panel.innerHTML = '';
            const d = document.createDocumentFragment();
    
            function project({x, y}) { // -1 ~ 1
              return {
                x: 0.5 * (x + 1) * panel.clientWidth,
                y: 0.5 * (1 - y) * panel.clientHeight,
              };
            }
    
            let lineWidth = 0,
              color = 'black',
              x0 = 0,
              y0 = 0;
    
            function line(x1, y1, x2, y2) {
              const div = document.createElement('div');
              div.style.position = 'absolute';
              div.style.left = `${x1}px`;
              div.style.top = `${y1}px`;
    
              const dy = y2 - y1;
              const dx = x2 - x1;
              const angle = 180 * Math.atan2(dy, dx) / Math.PI;
              const length = Math.hypot(dx, dy);
    
              div.style.transformOrigin = '0 0';
              div.style.transform = `translate(0, -50%) rotate(${angle}deg)`;
              div.style.width = `${length}px`;
              div.style.height = `${lineWidth}px`;
              div.style.background = color;
              d.appendChild(div);
            }
    
            commands.forEach(({command, args}, idx) => {
              if(command === 'pen') {
                lineWidth = args.lineWidth;
                color = args.color;
              } else if(command === 'put') {
                const {x, y} = project(args);
                x0 = x;
                y0 = y;
              } else if(command === 'forward') {
                const {x, y} = project(args);
                line(x0, y0, x, y);
                x0 = x;
                y0 = y;
              }
            });
    
            panel.appendChild(d);
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