<template>
  <div class="mygrapics-root" ref="mgContainer">
    <canvas width="1000" height="554"></canvas>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { Renderer as GlRenderer } from '@/examples/jsm-compat/mygrapics/common/lib/ogl/core/Renderer.js'
import { useGraphicsCleanup } from '@/examples/composables/useGraphicsCleanup'

const mgContainer = ref<HTMLElement | null>(null)
const { runInit } = useGraphicsCleanup()
async function loadScript(src: any) {
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
          uniform sampler2D tCat;
          varying vec2 vUv;
    
          void main() {
              vec4 color = texture2D(tMap, vUv);
              vec2 st = vUv * 3.0 - vec2(1.2, 0.5);
              vec4 cat = texture2D(tCat, st);
    
              gl_FragColor.rgb = cat.rgb;
              if(cat.r < 0.5 && cat.g > 0.6) {
                gl_FragColor.rgb = color.rgb;
              }
              gl_FragColor.a = color.a;
          }
        `;
    
        const canvas = mgContainer.value!.querySelector('canvas') as HTMLCanvasElement;
        const renderer = new GlRenderer(canvas);
        // load fragment shader and createProgram
        const program = renderer.compileSync(fragment, vertex);
        renderer.useProgram(program);
    
        (async function () {
          const [picture, cat] = await Promise.all([
            renderer.loadTexture('/mygrapics/assets/external/t01cca5849c98837396.jpg'),
            renderer.loadTexture('/mygrapics/assets/external/t0147f674ee72c403cf.jpg'),
          ]);
    
          renderer.uniforms.tMap = picture;
          renderer.uniforms.tCat = cat;
    
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