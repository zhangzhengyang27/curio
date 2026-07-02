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
          attribute vec4 color;
    
          varying vec2 vUv;
          varying vec4 vColor;
          uniform float uTime;
    
          void main() {
            gl_PointSize = 1.0;
            vUv = uv;
            vColor = color;
            gl_Position = vec4(a_vertexPosition, 1, 1);
          }
        `;
        const fragment = `
          #ifdef GL_ES
          precision highp float;
          #endif
    
          varying vec2 vUv;
          varying vec4 vColor;
    
          void main() {
            gl_FragColor = vColor;
          }
        `;
        const canvas = mgContainer.value.querySelector('canvas');
        const renderer = new GlRenderer(canvas);
        const program = renderer.compileSync(fragment, vertex);
        renderer.useProgram(program);
        
        renderer.setMeshData([{
          positions: [
            [-0.5, -0.25],
            [-0.5, 0.25],
            [0.5, 0.25],
            [0.5, -0.25],
          ],
          attributes: {
            uv: [
              [0, 0],
              [0, 1],
              [1, 1],
              [1, 0],
            ],
            color: [
              [1, 0, 0, 1],
              [1, 0, 0, 1],
              [0, 0.5, 0, 1],
              [0, 0.5, 0, 1],
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