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
          
          void main() {
            gl_Position = vec4(a_vertexPosition, 1, 1);
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
    
        function randomTriangle(x = 0, y = 0, rotation = 0.0, radius = 0.1) {
          const a = rotation,
            b = a + 2 * Math.PI / 3,
            c = a + 4 * Math.PI / 3;
    
          return [
            [x + radius * Math.sin(a), y + radius * Math.cos(a)],
            [x + radius * Math.sin(b), y + radius * Math.cos(b)],
            [x + radius * Math.sin(c), y + radius * Math.cos(c)],
          ];
        }
    
        const COUNT = 3000;
        function render() {
          for(let i = 0; i < COUNT; i++) {
            const x = 2 * Math.random() - 1;
            const y = 2 * Math.random() - 1;
            const rotation = 2 * Math.PI * Math.random();
    
            renderer.uniforms.u_color = [
              Math.random(),
              Math.random(),
              Math.random(),
              1];
    
            const positions = randomTriangle(x, y, rotation);
            renderer.setMeshData([{
              positions,
            }]);
    
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