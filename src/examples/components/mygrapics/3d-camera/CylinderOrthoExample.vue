<template>
  <div class="mygrapics-root" ref="mgContainer">
    <canvas width="512" height="512"></canvas>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import {Mat4} from '@/examples/jsm-compat/mygrapics/common/lib/math/Mat4.js'
import {multiply, ortho} from '@/examples/jsm-compat/mygrapics/common/lib/math/functions/Mat4Func.js'
import {cross, subtract, normalize} from '@/examples/jsm-compat/mygrapics/common/lib/math/functions/Vec3Func.js'
import {normalFromMat4} from '@/examples/jsm-compat/mygrapics/common/lib/math/functions/Mat3Func.js'

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
          attribute vec3 a_vertexPosition;
          attribute vec4 color;
          attribute vec3 normal;
    
          varying vec4 vColor;
          varying float vCos;
          uniform mat4 projectionMatrix;
          uniform mat4 modelMatrix;
          uniform mat4 viewMatrix;
          uniform mat3 normalMatrix;
          
          const vec3 lightPosition = vec3(10, 0, 0);
    
          void main() {
            gl_PointSize = 1.0;
            vColor = color;
            vec4 pos = viewMatrix * modelMatrix * vec4(a_vertexPosition, 1.0);
            vec4 lp = viewMatrix * vec4(lightPosition, 1.0);
            vec3 invLight = lp.xyz - pos.xyz;
            vec3 norm = normalize(normalMatrix * normal);
            vCos = max(dot(normalize(invLight), norm), 0.0);
            gl_Position = projectionMatrix * pos;
          }
        `;
        const fragment = `
          #ifdef GL_ES
          precision highp float;
          #endif
    
          uniform vec4 lightColor;
          varying vec4 vColor;
          varying float vCos;
    
          void main() {
            gl_FragColor.rgb = vColor.rgb + vCos * lightColor.a * lightColor.rgb;
            gl_FragColor.a = vColor.a;
          }
        `;
    
        const canvas = mgContainer.value.querySelector('canvas');
        const renderer = new GlRenderer(canvas, {
          depth: true,
        });
        const program = renderer.compileSync(fragment, vertex);
        renderer.useProgram(program);
    
        function cylinder(radius = 1.0, height = 1.0, segments = 30, colorCap = [0, 0, 1, 1], colorSide = [1, 0, 0, 1]) {
          const positions = [];
          const cells = [];
          const color = [];
          const cap = [[0, 0]];
          const h = 0.5 * height;
          const normal = [];
    
          // 顶和底的圆
          for(let i = 0; i <= segments; i++) {
            const theta = Math.PI * 2 * i / segments;
            const p = [radius * Math.cos(theta), radius * Math.sin(theta)];
            cap.push(p);
          }
    
          positions.push(...cap.map(([x, y]) => [x, y, -h]));
          normal.push(...cap.map(() => [0, 0, -1]));
          for(let i = 1; i < cap.length - 1; i++) {
            cells.push([0, i, i + 1]);
          }
          cells.push([0, cap.length - 1, 1]);
    
          let offset = positions.length;
          positions.push(...cap.map(([x, y]) => [x, y, h]));
          normal.push(...cap.map(() => [0, 0, 1]));
          for(let i = 1; i < cap.length - 1; i++) {
            cells.push([offset, offset + i, offset + i + 1]);
          }
          cells.push([offset, offset + cap.length - 1, offset + 1]);
    
          color.push(...positions.map(() => colorCap));
    
          const tmp1 = [];
          const tmp2 = [];
          // 侧面
          offset = positions.length;
          for(let i = 1; i < cap.length; i++) {
            const a = [...cap[i], h];
            const b = [...cap[i], -h];
            const nextIdx = i < cap.length - 1 ? i + 1 : 1;
            const c = [...cap[nextIdx], -h];
            const d = [...cap[nextIdx], h];
    
            positions.push(a, b, c, d);
    
            const norm = [];
            cross(norm, subtract(tmp1, b, a), subtract(tmp2, c, a));
            normalize(norm, norm);
            normal.push(norm, norm, norm, norm);
    
            color.push(colorSide, colorSide, colorSide, colorSide);
            cells.push([offset, offset + 1, offset + 2], [offset, offset + 2, offset + 3]);
            offset += 4;
          }
    
          return {positions, cells, color, normal};
        }
    
        const geometry = cylinder(0.5, 1.0, 30, [0, 0, 1, 1], [0.5, 0.5, 0.5, 1]);
    
        renderer.uniforms.lightColor = [1, 0, 0, 0.8];
    
        function projection(left, right, bottom, top, near, far) {
          return ortho([], left, right, bottom, top, near, far);
        }
    
        const projectionMatrix = projection(-2, 2, -2, 2, -2, 2);
        renderer.uniforms.projectionMatrix = projectionMatrix;
    
        function updateCamera(eye, target = [0, 0, 0]) {
          const [x, y, z] = eye;
          const m = new Mat4(
            1, 0, 0, 0,
            0, 1, 0, 0,
            0, 0, 1, 0,
            x, y, z, 1,
          );
          const up = [0, 1, 0];
          m.lookAt(eye, target, up).inverse();
          renderer.uniforms.viewMatrix = m;
        }
    
        updateCamera([0.5, 0, 0.5]); // 设置相机位置
    
        renderer.setMeshData([{
          positions: geometry.positions,
          attributes: {
            color: geometry.color,
            normal: geometry.normal,
          },
          cells: geometry.cells,
        }]);
    
        renderer.uniforms.modelMatrix = new Mat4(
          1, 0, 0, 0,
          0, 1, 0, 0,
          0, 0, 1, 0,
          0, 0, 0, 1,
        );
        function update() {
          // rotationX += 0.003;
          // rotationY += 0.005;
          // rotationZ += 0.007;
          // const modelMatrix = fromRotation(rotationX, rotationY, rotationZ);
          const modelViewMatrix = multiply([], renderer.uniforms.viewMatrix, renderer.uniforms.modelMatrix);
          renderer.uniforms.modelViewMatrix = modelViewMatrix;
          renderer.uniforms.normalMatrix = normalFromMat4([], modelViewMatrix);
          requestAnimationFrame(update);
        }
        update();
    
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