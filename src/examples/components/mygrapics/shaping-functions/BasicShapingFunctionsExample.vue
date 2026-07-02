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
          precision highp float;
          #endif
    
          varying vec2 vUv;
    
          void main() {
            // gl_FragColor = vec4(0, 0, 0, 1);
    
            // vec2 st = vUv * 10.0;
            // gl_FragColor.rgb = vec3(fract(st), 0.0);
            // gl_FragColor.a = 1.0;
    
            vec2 st = vUv * 10.0;
            vec2 idx = floor(st);
            vec2 grid = fract(st);
      
            vec2 t = mod(idx, 2.0);
            
            if(t.x == 1.0) {
              grid.x = 1.0 - grid.x;
            }
            if(t.y == 1.0) {
              grid.y = 1.0 - grid.y;
            }
            gl_FragColor.rgb = vec3(grid, 0.0);
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
    
        renderer.render();
  }
}

onMounted(() => {
  runInit(initMyGrapicsExample).catch(err => {
    console.error('MyGrapics example init failed:', err)
  })
})

</script>