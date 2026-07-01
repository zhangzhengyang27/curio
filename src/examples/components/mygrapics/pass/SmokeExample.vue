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
          uniform sampler2D tMap;
          uniform float uTime;
    
          vec2 random2(vec2 st){
            st = vec2( dot(st,vec2(127.1,311.7)),
                      dot(st,vec2(269.5,183.3)) );
            return -1.0 + 2.0 * fract(sin(st) * 43758.5453123);
          }
    
          // Gradient Noise by Inigo Quilez - iq/2013
          // https://www.shadertoy.com/view/XdXGW8
          float noise(vec2 st) {
            vec2 i = floor(st);
            vec2 f = fract(st);
    
            vec2 u = f * f * (3.0 - 2.0 * f);
    
            return mix( mix( dot( random2(i + vec2(0.0,0.0) ), f - vec2(0.0,0.0) ),
                            dot( random2(i + vec2(1.0,0.0) ), f - vec2(1.0,0.0) ), u.x),
                        mix( dot( random2(i + vec2(0.0,1.0) ), f - vec2(0.0,1.0) ),
                            dot( random2(i + vec2(1.0,1.0) ), f - vec2(1.0,1.0) ), u.x), u.y);
          }
    
          void main() {
            vec3 smoke = vec3(0);
            if(uTime <= 0.0) {
              vec2 st = vUv - vec2(0.5);
              float d = length(st);
              smoke = vec3(step(d, 0.05));
              // smoke = vec3(1.0 - smoothstep(0.05, 0.055, d));
            }
    
            vec2 st = vUv;
    
            float offset = 1.0 / 256.0;
            vec3 diffuse = texture2D(tMap, st).rgb;
    
            vec4 left = texture2D(tMap, st + vec2(-offset, 0.0));
            vec4 right = texture2D(tMap, st + vec2(offset, 0.0));
            vec4 up = texture2D(tMap, st + vec2(0.0, -offset));
            vec4 down = texture2D(tMap, st + vec2(0.0, offset));
    
            float rand = noise(st + 5.0 * uTime);
            float diff = 8.0 * 0.016 * (
              (1.0 + rand) * left.r + 
              (1.0 - rand) * right.r + 
              down.r + 
              2.0 * up.r - 
              5.0 * diffuse.r
            );
    
            gl_FragColor.rgb = (diffuse + diff) + smoke;
            gl_FragColor.a = 1.0;
          }
        `;
    
        const canvas = mgContainer.value.querySelector('canvas');
        const renderer = new GlRenderer(canvas);
        const program = renderer.compileSync(fragment, vertex);
        renderer.useProgram(program);
    
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
    
        // 创建两个fbo对象
        const fbo = {
          readFBO: renderer.createFBO(),
          writeFBO: renderer.createFBO(),
          get texture() {
            return this.readFBO.texture;
          },
          swap() {
            const tmp = this.writeFBO;
            this.writeFBO = this.readFBO;
            this.readFBO = tmp;
          },
        };
    
        function update(t) {
          renderer.bindFBO(null);
          renderer.uniforms.uTime = t / 1000;
          renderer.uniforms.tMap = fbo.texture;
          renderer.render();
          renderer.bindFBO(fbo.writeFBO);
          renderer.uniforms.tMap = fbo.texture;
          fbo.swap();
          renderer.render();
          requestAnimationFrame(update);
        }
        update(0);
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