<template>
  <div class="mygrapics-root" ref="mgContainer">
    <canvas width="1000" height="554"></canvas>
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
    
          uniform sampler2D tMap;
          uniform mat4 colorMatrix;
          varying vec2 vUv;
    
          void main() {
              vec4 color = texture2D(tMap, vUv);
              gl_FragColor = colorMatrix * vec4(color.rgb, 1.0);
              gl_FragColor.a = color.a;
          }
        `;
    
        const canvas = mgContainer.value.querySelector('canvas');
        const renderer = new GlRenderer(canvas);
        // load fragment shader and createProgram
        const program = renderer.compileSync(fragment, vertex);
        renderer.useProgram(program);
    
        (async function () {
          const texture = await renderer.loadTexture('/mygrapics/assets/external/t01cca5849c98837396.jpg');
          renderer.uniforms.tMap = texture;
          const r = 0.2126,
            g = 0.7152,
            b = 0.0722;
    
          renderer.uniforms.colorMatrix = [
            r, r, r, 0,
            g, g, g, 0,
            b, b, b, 0,
            0, 0, 0, 1,
          ];
    
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
        }());
  }
}

onMounted(() => {
  runInit(initMyGrapicsExample).catch(err => {
    console.error('MyGrapics example init failed:', err)
  })
})

</script>