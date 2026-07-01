<template>
  <div class="mygrapics-root" ref="mgContainer">
    <canvas width="1000" height="554"></canvas>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'

const mgContainer = ref(null)
const cleanupFns = []

async function loadScript(src) {
  return new Promise((resolve, reject) => {
    const s = document.createElement('script')
    s.src = src
    s.onload = resolve
    s.onerror = reject
    document.head.appendChild(s)
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
  await loadScript("/mygrapics/common/lib/gl-renderer.js");
  {
    const vertex = `
          attribute vec2 a_vertexPosition;
          attribute vec2 uv;
    
          varying vec2 vUv;
    
          void main() {
            gl_PointSize = 1.0;
            vUv = uv;
            gl_Position = vec4(a_vertexPosition, 1, 1);
          }
        `;
    
        const fragment = `
          #ifdef GL_ES
          precision highp float;
          #endif
    
          uniform sampler2D tMap;
          uniform float uTime;
          varying vec2 vUv;
    
          float random (vec2 st) {
              return fract(sin(dot(st.xy,
                                  vec2(12.9898,78.233)))*
                  43758.5453123);
          }
    
          void main() {
              vec2 st = vUv * vec2(100, 55.4);
              vec2 uv = vUv + 1.0 - 2.0 * random(floor(st));
              vec4 color = texture2D(tMap, mix(uv, vUv, min(uTime, 1.0)));
              gl_FragColor.rgb = color.rgb;
              gl_FragColor.a = color.a * uTime;
          }
        `;
    
        const canvas = mgContainer.value.querySelector('canvas');
        const renderer = new GlRenderer(canvas);
        // load fragment shader and createProgram
        const program = renderer.compileSync(fragment, vertex);
        renderer.useProgram(program);
    
        (async function () {
          const texture = await renderer.loadTexture('/mygrapics/assets/external/t01cca5849c98837396.jpg');
          renderer.uniforms.tMap = texture;
          renderer.uniforms.uTime = 0;
    
          renderer.setMeshData([{
            positions: [
              [-1, -1],
              [-1, 1],
              [1, 1],
              [1, -1],
            ],
            attributes: {
              uv: [
                [0, 0],
                [0, 1],
                [1, 1],
                [1, 0],
              ],
            },
            cells: [[0, 1, 2], [2, 0, 3]],
          }]);
    
          renderer.render();
    
          function update(t) {
            renderer.uniforms.uTime = t / 2000;
            requestAnimationFrame(update);
          }
          update(0);
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