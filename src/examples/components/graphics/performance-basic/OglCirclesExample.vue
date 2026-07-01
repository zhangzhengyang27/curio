<template>
  <div class="graphics-root" ref="gContainer">
    <canvas width="500" height="500"></canvas>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import {Renderer, Program, Geometry, Transform, Mesh} from '@/examples/jsm-compat/graphics/common/lib/ogl/index.mjs'

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
    const canvas = gContainer.value.querySelector('canvas');
        const renderer = new Renderer({
          canvas,
          antialias: true,
          width: 500,
          height: 500,
        });
        const gl = renderer.gl;
        gl.clearColor(1, 1, 1, 1);
    
        function circleGeometry(gl, radius = 0.04, count = 3000, segments = 20) {
          const tau = Math.PI * 2;
          const position = new Float32Array(segments * 2 + 2);
          const index = new Uint16Array(segments * 3);
          const id = new Uint16Array(count);
    
          for(let i = 0; i < segments; i++) {
            const alpha = i / segments * tau;
            position.set([radius * Math.cos(alpha), radius * Math.sin(alpha)], i * 2 + 2);
          }
          for(let i = 0; i < segments; i++) {
            if(i === segments - 1) {
              index.set([0, i + 1, 1], i * 3);
            } else {
              index.set([0, i + 1, i + 2], i * 3);
            }
          }
          for(let i = 0; i < count; i++) {
            id.set([i], i);
          }
          return new Geometry(gl, {
            position: {
              data: position,
              size: 2,
            },
            index: {
              data: index,
            },
            id: {
              instanced: 1,
              size: 1,
              data: id,
            },
          });
        }
        // const geometry = new Box(gl);
        const geometry = circleGeometry(gl);
        const vertex = `
          precision highp float;
          attribute vec2 position;
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
    
          //  Function from Iñigo Quiles
          //  https://www.shadertoy.com/view/MsS3Wc
          vec3 hsb2rgb(vec3 c){
            vec3 rgb = clamp(abs(mod(c.x*6.0+vec3(0.0,4.0,2.0), 6.0)-3.0)-1.0, 0.0, 1.0);
            rgb = rgb * rgb * (3.0 - 2.0 * rgb);
            return c.z * mix(vec3(1.0), rgb, c.y);
          }
    
          varying vec3 vColor;
      
          void main() {
            vec2 offset = vec2(
              1.0 - 2.0 * random(vec2(id + uTime, 100000.0)),
              1.0 - 2.0 * random(vec2(id + uTime, 200000.0))
            );
            vec3 color = vec3(
              random(vec2(id + uTime, 300000.0)),
              1.0,
              1.0
            );
            vColor = hsb2rgb(color);
            gl_Position = vec4(position * 20.0 + offset, 0, 1);
          }
        `;
    
        const fragment = `
          precision highp float;
          varying vec3 vColor;
          void main() {
            gl_FragColor = vec4(vColor, 1);
          }
        `;
    
        const program = new Program(gl, {
          vertex,
          fragment,
          uniforms: {
            uTime: {value: 0},
          },
        });
    
        const scene = new Transform();
        const mesh = new Mesh(gl, {geometry, program});
        mesh.setParent(scene);
    
        function update(t) {
          program.uniforms.uTime.value = t / 1000;
          renderer.render({scene});
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