<template>
  <div class="graphics-root" ref="gContainer">
    <canvas width="600" height="600"></canvas>
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
    const canvas = gContainer.value.querySelector('canvas');
        const renderer = new GlRenderer(canvas);
    
        const vertex = `
          attribute vec2 a_vertexPosition;
          attribute vec4 color;
          attribute vec2 xy;
          attribute float bias;
          uniform float uTime;
    
          varying vec4 vColor;
      
          void main() {
            vec3 pos = vec3(a_vertexPosition, 1);
            float scale = 0.7 + 0.3 * sin(6.28 * bias + 0.003 * uTime);
            mat3 m = mat3(
              scale, 0, 0,
              0, scale, 0,
              xy, 1
            );
            vColor = color;
            gl_Position = vec4(m * pos, 1);
          }
        `;
    
        const fragment = `
          #ifdef GL_ES
          precision highp float;
          #endif
    
          varying vec4 vColor;
          
          void main() {
            gl_FragColor = vColor;
          }
        `;
        const program = renderer.compileSync(fragment, vertex);
        renderer.useProgram(program);
    
        function circle(radius = 0.05) {
          const delta = 2 * Math.PI / 32;
          const positions = [];
          const cells = [];
          for(let i = 0; i < 32; i++) {
            const angle = i * delta;
            positions.push([radius * Math.sin(angle), radius * Math.cos(angle)]);
            if(i > 0 && i < 31) {
              cells.push([0, i, i + 1]);
            }
          }
          return {positions, cells};
        }
    
        const COUNT = 100000;
        function init() {
          const {positions, cells} = circle();
          const colors = [];
          const pos = [];
          const bias = [];
          for(let i = 0; i < COUNT; i++) {
            const x = 2 * Math.random() - 1;
            const y = 2 * Math.random() - 1;
            const rotation = 2 * Math.PI * Math.random();
    
            colors.push([
              Math.random(),
              Math.random(),
              Math.random(),
              1
            ]);
    
            pos.push([
              2 * Math.random() - 1,
              2 * Math.random() - 1
            ]);
    
            bias.push(
              Math.random()
            );
          }
    
          renderer.uniforms.uTime = 0;
    
          renderer.setMeshData({
            positions,
            cells,
            instanceCount: COUNT,
            attributes: {
              color: {data: [...colors], divisor: 1},
              xy: {data: [...pos], divisor: 1},
              bias: {data: [...bias], divisor: 1},
            },
          });
        }
        init();
    
    
        function update(t) {
          renderer.uniforms.uTime = t;
          renderer.render();
          requestAnimationFrame(update);
        }
    
        update(0);
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