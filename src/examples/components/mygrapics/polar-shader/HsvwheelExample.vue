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
    
          varying vec2 vUv;
    
          uniform vec2 uMouse;
          
          vec3 hsv2rgb(vec3 c){
            vec3 rgb = clamp(abs(mod(c.x*6.0+vec3(0.0,4.0,2.0), 6.0)-3.0)-1.0, 0.0, 1.0);
            rgb = rgb * rgb * (3.0 - 2.0 * rgb);
            return c.z * mix(vec3(1.0), rgb, c.y);
          }
    
          vec2 polar(vec2 st) {
            return vec2(length(st), atan(st.y, st.x));
          }
    
          void main() {
            vec2 st = vUv - vec2(0.5);
            st = polar(st);
            float d = smoothstep(st.x, st.x + 0.01, 0.2);
            if(st.y < 0.0) st.y += 6.28;
            float p = st.y / 6.28;
            gl_FragColor.rgb = d * hsv2rgb(vec3(p, uMouse.x, uMouse.y));
            gl_FragColor.a = 1.0;
          }
        `;
    
        const canvas = mgContainer.value.querySelector('canvas');
        const renderer = new GlRenderer(canvas);
        const program = renderer.compileSync(fragment, vertex);
        renderer.useProgram(program);
        renderer.uniforms.uMouse = [0.5, 0.5];
    
        canvas.addEventListener('mousemove', (e) => {
          const {x, y, width, height} = e.target.getBoundingClientRect();
          renderer.uniforms.uMouse = [(e.x - x) / width, 1.0 - (e.y - y) / height];
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