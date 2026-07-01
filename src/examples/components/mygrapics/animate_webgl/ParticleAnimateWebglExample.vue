<template>
  <div class="mygrapics-root" ref="mgContainer">
    <canvas width="512" height="512"></canvas>
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
          attribute vec4 color;
    
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
    
          highp float random(vec2 co) {
              highp float a = 12.9898;
              highp float b = 78.233;
              highp float c = 43758.5453;
              highp float dt= dot(co.xy ,vec2(a,b));
              highp float sn= mod(dt,3.14);
              return fract(sin(sn) * c);
          }
    
          // Value Noise by Inigo Quilez - iq/2013
          // https://www.shadertoy.com/view/lsf3WH
          highp float noise(vec2 st) {
              vec2 i = floor(st);
              vec2 f = fract(st);
              vec2 u = f * f * (3.0 - 2.0 * f);
              return mix( mix( random( i + vec2(0.0,0.0) ),
                              random( i + vec2(1.0,0.0) ), u.x),
                          mix( random( i + vec2(0.0,1.0) ),
                              random( i + vec2(1.0,1.0) ), u.x), u.y);
          }
    
          float sdf_circle(vec2 st, vec2 c, float r) {
            return 1.0 - length(st - c) / r;
          }
    
          varying vec2 vUv;
          uniform float uTime;
    
          void main() {
            vec2 st = vUv;
            float rx = mix(-0.2, 0.2, noise(vec2(7881.32, 0) + random(st) + uTime));
            float ry = mix(-0.2, 0.2, noise(vec2(0, 1433.59) + random(st) + uTime));
    
            float dis = distance(st, vec2(0.5));
            dis = pow((1.0 - dis), 2.0);
    
            float d = sdf_circle(st + vec2(rx, ry), vec2(0.5), 0.2);
            d = smoothstep(0.0, 0.1, d);
    
            gl_FragColor = vec4(dis * d * vec3(1.0), 1.0);
          }
        `;
        const canvas = mgContainer.value.querySelector('canvas');
        const renderer = new GlRenderer(canvas);
        const program = renderer.compileSync(fragment, vertex);
        renderer.useProgram(program);
    
        renderer.uniforms.uTime = 0;
        requestAnimationFrame(function update(t) {
          renderer.uniforms.uTime = 0.001 * t;
          requestAnimationFrame(update);
        });
        
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