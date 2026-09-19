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
          uniform float uTime;
    
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
    
          float easing(in float p) {
            return smoothstep(0.0, 1.0, p);
            // return clamp(p * p, 0.0, 1.0);
            // return clamp(p * (2 - p) * 0.0, 1.0);
          }
    
          varying vec2 vUv;
          uniform vec4 fromColor;
          uniform vec4 toColor;
    
          void main() {
            float d = easing(vUv.x);
            gl_FragColor = mix(fromColor, toColor, d);
          }
        `;
        const canvas = mgContainer.value!.querySelector('canvas') as HTMLCanvasElement;
        const renderer = new GlRenderer(canvas);
        const program = renderer.compileSync(fragment, vertex);
        renderer.useProgram(program);
    
        renderer.uniforms.fromColor = [1, 0, 0, 1];
        renderer.uniforms.toColor = [0, 0.5, 0, 1];
    
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