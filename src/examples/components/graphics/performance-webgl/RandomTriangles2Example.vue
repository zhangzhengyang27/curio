<template>
  <div class="graphics-root" ref="gContainer">
    <canvas width="600" height="600"></canvas>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { Renderer as GlRenderer } from '@/examples/jsm-compat/graphics/common/lib/ogl/core/Renderer.js'
import { useGraphicsCleanup } from '@/examples/composables/useGraphicsCleanup'

const gContainer = ref<HTMLElement | null>(null)
const gfxLoadedScripts: any[] = []
const { runInit } = useGraphicsCleanup(gfxLoadedScripts)

async function loadScript(src: string) {
  return new Promise((resolve, reject) => {
    const s = document.createElement('script')
    s.src = src
    s.onload = resolve
    s.onerror = reject
    document.head.appendChild(s)
    gfxLoadedScripts.push(s)
  })
}




async function initGraphicsExample() {
  await loadScript("/graphics/common/lib/gl-renderer.js");
  {
    const canvas = gContainer.value!.querySelector('canvas') as HTMLCanvasElement;
        const renderer = new GlRenderer(canvas);
    
        const vertex = `
          attribute vec2 a_vertexPosition;
    
          uniform mat3 modelMatrix;
          
          void main() {
            vec3 pos = modelMatrix * vec3(a_vertexPosition, 1);
            gl_Position = vec4(pos, 1);
          }
        `;
    
        const fragment = `
          #ifdef GL_ES
          precision highp float;
          #endif
    
          uniform vec4 u_color;
          
          void main() {
            gl_FragColor = u_color;
          }
        `;
    
        const program = renderer.compileSync(fragment, vertex);
        renderer.useProgram(program);
    
        const alpha = 2 * Math.PI / 3;
        const beta = 2 * alpha;
    
        renderer.setMeshData({
          positions: [
            [0, 0.1],
            [0.1 * Math.sin(alpha), 0.1 * Math.cos(alpha)],
            [0.1 * Math.sin(beta), 0.1 * Math.cos(beta)],
          ],
        });
    
        const COUNT = 3000;
        function render() {
          for(let i = 0; i < COUNT; i++) {
            const x = 2 * Math.random() - 1;
            const y = 2 * Math.random() - 1;
            const rotation = 2 * Math.PI * Math.random();
    
            renderer.uniforms.modelMatrix = [
              Math.cos(rotation), -Math.sin(rotation), 0,
              Math.sin(rotation), Math.cos(rotation), 0,
              x, y, 1,
            ];
    
            renderer.uniforms.u_color = [
              Math.random(),
              Math.random(),
              Math.random(),
              1];
    
            renderer._draw();
          }
          requestAnimationFrame(render);
        }
    
        render();
  }
}

onMounted(() => {
  runInit(initGraphicsExample).catch(err => {
    console.error('Graphics example init failed:', err)
  })
})

// cleanup is handled by useGraphicsCleanup
// onUnmounted not needed
</script>