<template>
  <div class="graphics-root" ref="gContainer">
    <canvas width="512" height="512"></canvas>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useGraphicsCleanup } from '@/examples/composables/useGraphicsCleanup.js'

const gContainer = ref(null)
const gfxLoadedScripts = []
const { runInit } = useGraphicsCleanup(gfxLoadedScripts)

async function loadScript(src) {
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
    
          #define PI 3.14159265358979323846
    
          varying vec2 vUv;
    
          uniform vec2 u_resolution;
          uniform int rows;
    
          float random (in vec2 _st) {
              return fract(sin(dot(_st.xy,
                                  vec2(12.9898,78.233)))*
                  43758.5453123);
          }
    
          vec2 truchetPattern(in vec2 _st, in float _index){
              _index = fract(((_index-0.5)*2.0));
              if (_index > 0.75) {
                  _st = vec2(1.0) - _st;
              } else if (_index > 0.5) {
                  _st = vec2(1.0-_st.x,_st.y);
              } else if (_index > 0.25) {
                  _st = 1.0-vec2(1.0-_st.x,_st.y);
              }
              return _st;
          }
    
          void main() {
              vec2 st = vUv * float(rows);
    
              vec2 ipos = floor(st);  // integer
              vec2 fpos = fract(st);  // fraction
    
              vec2 tile = truchetPattern(fpos, random( ipos ));
    
              float color = 0.0;
    
              color = smoothstep(tile.x-0.3,tile.x,tile.y)-
                      smoothstep(tile.x,tile.x+0.3,tile.y);
    
              gl_FragColor = vec4(vec3(color),1.0);
          }
        `;
    
        const canvas = gContainer.value.querySelector('canvas');
        const renderer = new GlRenderer(canvas);
    
        // load fragment shader and createProgram
        const program = renderer.compileSync(fragment, vertex);
        renderer.useProgram(program);
        renderer.uniforms.rows = 20;
    
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
  runInit(initGraphicsExample).catch(err => {
    console.error('Graphics example init failed:', err)
  })
})

// cleanup is handled by useGraphicsCleanup
// onUnmounted not needed
</script>