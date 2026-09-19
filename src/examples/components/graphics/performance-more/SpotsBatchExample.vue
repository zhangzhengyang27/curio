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
          attribute vec4 color;
          attribute vec2 xy;
          attribute float bias;
          uniform float uTime;
    
          varying vec4 vColor;
      
          void main() {
            vec3 pos = vec3(a_vertexPosition, 1);
            float scale = 0.7 + 0.3 * sin(6.28 * bias + 0.003 * uTime);
            mat3 m = mat3(
              scale, 0, 0,
              0, scale, 0,
              xy, 1
            );
            vColor = color;
            gl_Position = vec4(m * pos, 1);
          }
        `;
    
        const fragment = `
          #ifdef GL_ES
          precision highp float;
          #endif
    
          varying vec4 vColor;
          
          void main() {
            gl_FragColor = vColor;
          }
        `;
        const program = renderer.compileSync(fragment, vertex);
        renderer.useProgram(program);
    
        function circle(radius = 0.05) {
          const delta = 2 * Math.PI / 32;
          const positions = [];
          const cells = [];
          for(let i = 0; i < 32; i++) {
            const angle = i * delta;
            positions.push([radius * Math.sin(angle), radius * Math.cos(angle)]);
            if(i > 0 && i < 31) {
              cells.push([0, i, i + 1]);
            }
          }
          return {positions, cells};
        }
    
        const COUNT = 100000;
        function init() {
          const {positions, cells} = circle();
          const colors = [];
          const pos = [];
          const bias = [];
          for(let i = 0; i < COUNT; i++) {
            const x = 2 * Math.random() - 1;
            const y = 2 * Math.random() - 1;
            const rotation = 2 * Math.PI * Math.random();
    
            colors.push([
              Math.random(),
              Math.random(),
              Math.random(),
              1
            ]);
    
            pos.push([
              2 * Math.random() - 1,
              2 * Math.random() - 1
            ]);
    
            bias.push(
              Math.random()
            );
          }
    
          renderer.uniforms.uTime = 0;
    
          renderer.setMeshData({
            positions,
            cells,
            instanceCount: COUNT,
            attributes: {
              color: {data: [...colors], divisor: 1},
              xy: {data: [...pos], divisor: 1},
              bias: {data: [...bias], divisor: 1},
            },
          });
        }
        init();
    
    
        function update(t: number) {
          renderer.uniforms.uTime = t;
          renderer.render();
          requestAnimationFrame(update);
        }
    
        update(0);
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