<template>
  <div class="graphics-root" ref="gContainer">
    <canvas width="512" height="512"></canvas>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'

const gContainer = ref(null)
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

async function initGraphicsExample() {
  await loadScript("/graphics/common/lib/gl-renderer.js");
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
    
          uniform vec2 center;
          uniform float scale;
          uniform int iterations;
          
          vec3 palette(float t, vec3 c1, vec3 c2, vec3 c3, vec3 c4) {
            float x = 1.0 / 3.0;
            if (t < x) return mix(c1, c2, t/x);
            else if (t < 2.0 * x) return mix(c2, c3, (t - x)/x);
            else if (t < 3.0 * x) return mix(c3, c4, (t - 2.0*x)/x);
            return c4;
          }
    
          vec2 f(vec2 z, vec2 c) {
            return mat2(z, -z.y, z.x) * z + c;
          }
    
          void main() {
              vec2 uv = vUv;
              vec2 c = center + 4.0 * (uv - vec2(0.5)) / scale;
              vec2 z = vec2(0.0);
    
              bool escaped = false;
              int j;
              for (int i = 0; i < 65536; i++) {
                if(i > iterations) break;
                j = i;
                z = f(z, c);
                if (length(z) > 2.0) {
                  escaped = true;
                  break;
                }
              }
              // gl_FragColor.rgb = escaped ? vec3(1.0) : vec3(0.0);
              gl_FragColor.rgb = escaped ? max(1.0, log(scale)) * palette(float(j)/ float(iterations), vec3(0.02, 0.02, 0.03), vec3(0.1, 0.2, 0.3), vec3(0.0, 0.3, 0.2), vec3(0.0, 0.5, 0.8))
                 : vec3(0.0);
              gl_FragColor.a = 1.0;
          }
        `;
    
        const canvas = gContainer.value.querySelector('canvas');
        const renderer = new GlRenderer(canvas);
    
        // load fragment shader and createProgram
        const program = renderer.compileSync(fragment, vertex);
        renderer.useProgram(program);
    
        // renderer.uniforms.center = [0, 0];
        // renderer.uniforms.scale = 1;
        // renderer.uniforms.iterations = 255;
    
        renderer.uniforms.center = [0.367, 0.303];
        renderer.uniforms.scale = 1;
        renderer.uniforms.iterations = 256;
    
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
    
        function update() {
          const factor = Math.max(0.1, Math.log(renderer.uniforms.scale));
          renderer.uniforms.scale = (renderer.uniforms.scale += factor) % 10000;
          renderer.uniforms.iterations = factor * 500;
          requestAnimationFrame(update);
        }
        setTimeout(update, 2000);
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