<template>
  <div class="mygrapics-root" ref="mgContainer">
    <canvas width="512" height="512"></canvas>
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
    
          varying vec2 vUv;
          uniform float uTime;
          
          vec2 random2(vec2 st){
            st = vec2( dot(st,vec2(127.1,311.7)),
                      dot(st,vec2(269.5,183.3)) );
            return fract(sin(st) * 43758.5453123);
          }
    
          void main() {
            vec2 st = vUv * 10.0;
    
            float d = 1.0;
            vec2 i_st = floor(st);
            vec2 f_st = fract(st);
    
            // vec2 p = random2(i_st);
            // d = distance(f_st, p);
    
            for(int i = -1; i <= 1; i++) {
              for(int j = -1; j <= 1; j++) {
                vec2 neighbor = vec2(float(i), float(j));
                vec2 p = random2(i_st + neighbor);
                p = 0.5 + 0.5 * sin(uTime + 6.2831 * p);
                d = min(d, distance(f_st, neighbor + p));
              }
            }
    
            gl_FragColor.rgb = vec3(d) + step(d, 0.03);
            gl_FragColor.a = 1.0;
          }
        `;
    
        const canvas = mgContainer.value!.querySelector('canvas') as HTMLCanvasElement;
        const renderer = new GlRenderer(canvas);
    
        // load fragment shader and createProgram
        const program = renderer.compileSync(fragment, vertex);
        renderer.useProgram(program);
        renderer.uniforms.uTime = 0.0;
    
        requestAnimationFrame(function update(t: number) {
          renderer.uniforms.uTime = 0.001 * t;
          requestAnimationFrame(update);
        });
    
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