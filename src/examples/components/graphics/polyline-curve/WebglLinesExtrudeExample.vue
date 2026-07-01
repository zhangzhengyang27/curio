<template>
  <div class="graphics-root" ref="gContainer">
    <canvas width="512" height="512"></canvas>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import {Renderer, Program, Geometry, Transform, Mesh, Vec2} from '@/examples/jsm-compat/graphics/common/lib/ogl/index.mjs'

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
    const vertex = `
          attribute vec2 position;
    
          void main() {
            gl_PointSize = 10.0;
            float scale = 1.0 / 256.0;
            mat3 projectionMatrix = mat3(
              scale, 0, 0,
              0, -scale, 0,
              -1, 1, 1
            );
            vec3 pos = projectionMatrix * vec3(position, 1);
            gl_Position = vec4(pos.xy, 0, 1);
          }
        `;
    
        const fragment = `
          precision highp float;
          void main() {
            gl_FragColor = vec4(1, 0, 0, 1);
          }
        `;
    
        const canvas = gContainer.value.querySelector('canvas');
        const renderer = new Renderer({
          canvas,
          width: 512,
          height: 512,
          antialias: true,
        });
    
        const gl = renderer.gl;
        gl.clearColor(1, 1, 1, 1);
    
        const program = new Program(gl, {
          vertex,
          fragment,
        });
    
        const points = [
          new Vec2(100, 100),
          new Vec2(100, 200),
          new Vec2(200, 150),
          new Vec2(300, 200),
          new Vec2(300, 100),
        ];
    
        function extrudePolyline(gl, points, {thickness = 10} = {}) {
          const halfThick = 0.5 * thickness;
          const innerSide = [];
          const outerSide = [];
    
          // 构建挤压顶点
          for(let i = 1; i < points.length - 1; i++) {
            const v1 = (new Vec2()).sub(points[i], points[i - 1]).normalize();
            const v2 = (new Vec2()).sub(points[i], points[i + 1]).normalize();
            const v = (new Vec2()).add(v1, v2).normalize(); // 得到挤压方向
            const norm = new Vec2(-v1.y, v1.x); // 法线方向
            const cos = norm.dot(v);
            const len = halfThick / cos;
            if(i === 1) { // 起始点
              const v0 = new Vec2(...norm).scale(halfThick);
              outerSide.push((new Vec2()).add(points[0], v0));
              innerSide.push((new Vec2()).sub(points[0], v0));
            }
            v.scale(len);
            outerSide.push((new Vec2()).add(points[i], v));
            innerSide.push((new Vec2()).sub(points[i], v));
            if(i === points.length - 2) { // 结束点
              const norm2 = new Vec2(v2.y, -v2.x);
              const v0 = new Vec2(...norm2).scale(halfThick);
              outerSide.push((new Vec2()).add(points[points.length - 1], v0));
              innerSide.push((new Vec2()).sub(points[points.length - 1], v0));
            }
          }
    
          const count = innerSide.length * 4 - 4;
          const position = new Float32Array(count * 2);
          const index = new Uint16Array(6 * count / 4);
    
          // 创建 geometry 对象
          for(let i = 0; i < innerSide.length - 1; i++) {
            const a = innerSide[i],
              b = outerSide[i],
              c = innerSide[i + 1],
              d = outerSide[i + 1];
    
            const offset = i * 4;
            index.set([offset, offset + 1, offset + 2, offset + 2, offset + 1, offset + 3], i * 6);
            position.set([...a, ...b, ...c, ...d], i * 8);
          }
    
          return new Geometry(gl, {
            position: {size: 2, data: position},
            index: {data: index},
          });
        }
    
        const geometry = extrudePolyline(gl, points);
    
        const scene = new Transform();
        const polyline = new Mesh(gl, {geometry, program});
        polyline.setParent(scene);
    
        renderer.render({scene});
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