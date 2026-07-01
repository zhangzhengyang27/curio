<template>
  <div class="graphics-root" ref="gContainer">
    <canvas width="512" height="512"></canvas>
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
    const vertex = `
          attribute vec2 a_vertexPosition;
          attribute vec2 uv;
    
          varying vec2 vUv;
          uniform float uTime;
    
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
    
          // http://www.flong.com/texts/code/shapers_bez/
          // Helper functions:
          float slope_from_t (float t, float A, float B, float C){
            float dtdx = 1.0/(3.0*A*t*t + 2.0*B*t + C); 
            return dtdx;
          }
    
          float x_from_t (float t, float A, float B, float C, float D){
            float x = A*(t*t*t) + B*(t*t) + C*t + D;
            return x;
          }
    
          float y_from_t (float t, float E, float F, float G, float H){
            float y = E*(t*t*t) + F*(t*t) + G*t + H;
            return y;
          }
    
          float cubic_bezier (float x, float a, float b, float c, float d){
            float y0a = 0.00; // initial y
            float x0a = 0.00; // initial x 
            float y1a = b;    // 1st influence y   
            float x1a = a;    // 1st influence x 
            float y2a = d;    // 2nd influence y
            float x2a = c;    // 2nd influence x
            float y3a = 1.00; // final y 
            float x3a = 1.00; // final x 
    
            float A = x3a - 3.0 *x2a + 3.0 * x1a - x0a;
            float B = 3.0 * x2a - 6.0 * x1a + 3.0 * x0a;
            float C = 3.0 * x1a - 3.0 * x0a;   
            float D = x0a;
    
            float E = y3a - 3.0 * y2a + 3.0 * y1a - y0a;    
            float F = 3.0 * y2a - 6.0 * y1a + 3.0 * y0a;             
            float G = 3.0 * y1a - 3.0 * y0a;             
            float H = y0a;
    
            // Solve for t given x (using Newton-Raphelson), then solve for y given t.
            // Assume for the first guess that t = x.
            float currentt = x;
            const int nRefinementIterations = 5;
            for (int i=0; i < nRefinementIterations; i++){
              float currentx = x_from_t(currentt, A,B,C,D); 
              float currentslope = slope_from_t(currentt, A,B,C);
              currentt -= (currentx - x)*(currentslope);
              currentt = clamp(currentt, 0.0, 1.0);
            } 
    
            float y = y_from_t(currentt, E,F,G,H);
            return y;
          }
    
          vec3 hsb2rgb(vec3 c){
            vec3 rgb = clamp(abs(mod(c.x*6.0+vec3(0.0,4.0,2.0), 6.0)-3.0)-1.0, 0.0, 1.0);
            rgb = rgb * rgb * (3.0 - 2.0 * rgb);
            return c.z * mix(vec3(1.0), rgb, c.y);
          }
    
          varying vec2 vUv;
    
          void main() {
            // float d = vUv.x;
            float d = cubic_bezier(vUv.x, 0.5, -1.5, 0.5, 2.5);
            gl_FragColor.rgb = hsb2rgb(vec3(d, 1.0, 1.0));
            gl_FragColor.a = 1.0;
          }
        `;
        const canvas = gContainer.value.querySelector('canvas');
        const renderer = new GlRenderer(canvas);
        const program = renderer.compileSync(fragment, vertex);
        renderer.useProgram(program);
    
        renderer.setMeshData([{
          positions: [
            [-0.5, -0.25],
            [-0.5, 0.25],
            [0.5, 0.25],
            [0.5, -0.25],
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