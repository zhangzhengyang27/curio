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

async function loadScript(src) {
  return new Promise((resolve, reject) => {
    const s = document.createElement('script')
    s.src = src
    s.onload = resolve
    s.onerror = reject
    document.head.appendChild(s)
    gfxLoadedScripts.push(s)
  })
}


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
  await loadScript("/graphics/common/lib/gl-renderer.js");
  {
    const canvas = gContainer.value.querySelector('canvas');
        const renderer = new GlRenderer(canvas);
    
        const vertex = `
          attribute vec2 a_vertexPosition;
          attribute float id;
    
          uniform float uTime;
      
          highp float random(vec2 co) {
            highp float a = 12.9898;
            highp float b = 78.233;
            highp float c = 43758.5453;
            highp float dt= dot(co.xy ,vec2(a,b));
            highp float sn= mod(dt,3.14);
            return fract(sin(sn) * c);
          }
    
          varying vec3 vColor;
    
          void main() {
            float t = id / 10000.0;
            float alpha = 6.28 * random(vec2(uTime, 2.0 + t));
            float c = cos(alpha);
            float s = sin(alpha);
    
            mat3 modelMatrix = mat3(
              c, -s, 0,
              s, c, 0,
              2.0 * random(vec2(uTime, t)) - 1.0, 2.0 * random(vec2(uTime, 1.0 + t)) - 1.0, 1
            );
            vec3 pos = modelMatrix * vec3(a_vertexPosition, 1);
            vColor = vec3(
              random(vec2(uTime, 4.0 + t)),
              random(vec2(uTime, 5.0 + t)),
              random(vec2(uTime, 6.0 + t))
            );
            gl_Position = vec4(pos, 1);
          }
        `;
    
        const fragment = `
          #ifdef GL_ES
          precision highp float;
          #endif
    
          varying vec3 vColor;
          
          void main() {
            gl_FragColor.rgb = vColor;
            gl_FragColor.a = 1.0;
          }
        `;
    
        const program = renderer.compileSync(fragment, vertex);
        renderer.useProgram(program);
    
        const alpha = 2 * Math.PI / 3;
        const beta = 2 * alpha;
        
        const COUNT = 6000;
        renderer.setMeshData({
          positions: [
            [0, 0.1],
            [0.1 * Math.sin(alpha), 0.1 * Math.cos(alpha)],
            [0.1 * Math.sin(beta), 0.1 * Math.cos(beta)],
          ],
          instanceCount: COUNT,
          attributes: {
            id: {data: [...new Array(COUNT).keys()], divisor: 1},
          },
        });
    
        function render(t) {
          renderer.uniforms.uTime = t / 1e6;
          renderer.render();
          requestAnimationFrame(render);
        }
    
        render(0);
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