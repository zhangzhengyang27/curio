<template>
  <div class="mygrapics-root" ref="mgContainer">
    <canvas width="512" height="512"></canvas>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useGraphicsCleanup } from '@/examples/composables/useGraphicsCleanup.js'

const mgContainer = ref(null)
const { runInit } = useGraphicsCleanup()
async function loadScript(src) {
  return new Promise((resolve, reject) => {
    const s = document.createElement('script')
    s.src = src
    s.onload = resolve
    s.onerror = reject
    document.head.appendChild(s)
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
          precision mediump float;
          #endif
    
          varying vec2 vUv;
          uniform float rows;
    
          void main() {
            vec2 st = fract(vUv * rows);
            float d1 = step(st.x, 0.9);
            float d2 = step(0.1, st.y);
            gl_FragColor.rgb = mix(vec3(0.8), vec3(1.0), d1 * d2);
            gl_FragColor.a = 1.0;
          }
        `;
    
        const canvas = mgContainer.value.querySelector('canvas');
        const renderer = new GlRenderer(canvas);
    
        // load fragment shader and createProgram
        const program = renderer.compileSync(fragment, vertex);
        renderer.useProgram(program);
        renderer.uniforms.rows = 1;
    
        const rows = [1, 4, 16, 32, 64];
        let idx = 0;
        const timerId = setInterval(() => {
          renderer.uniforms.rows = rows[idx++];
          if(idx > 4) {
            clearInterval(timerId);
          }
        }, 1000);
    
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
  runInit(initMyGrapicsExample).catch(err => {
    console.error('MyGrapics example init failed:', err)
  })
})

</script>