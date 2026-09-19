<template>
  <div class="graphics-root" ref="gContainer">
    <canvas width="500" height="500"></canvas>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import {Renderer, Program, Geometry, Transform, Mesh} from '@/examples/jsm-compat/graphics/common/lib/ogl/index.mjs'
import { useGraphicsCleanup } from '@/examples/composables/useGraphicsCleanup'

const gContainer = ref<HTMLElement | null>(null)
const gfxLoadedScripts: any[] = []
const { runInit } = useGraphicsCleanup(gfxLoadedScripts)




async function initGraphicsExample() {
  {
    const canvas = gContainer.value!.querySelector('canvas') as HTMLCanvasElement;
        const renderer = new Renderer({
          canvas,
          antialias: true,
          width: 500,
          height: 500,
        });
        const gl = renderer.gl;
        gl.clearColor(1, 1, 1, 1);
    
        function circleGeometry(gl: any, radius = 0.04, count = 3000, segments = 20) {
          const tau = Math.PI * 2;
          const position = new Float32Array(segments * 2 + 2);
          const index = new Uint16Array(segments * 3);
          const id = new Uint16Array(count);
    
          for(let i = 0; i < segments; i++) {
            const alpha = i / segments * tau;
            position.set([radius * Math.cos(alpha), radius * Math.sin(alpha)], i * 2 + 2);
          }
          for(let i = 0; i < segments; i++) {
            if(i === segments - 1) {
              index.set([0, i + 1, 1], i * 3);
            } else {
              index.set([0, i + 1, i + 2], i * 3);
            }
          }
          for(let i = 0; i < count; i++) {
            id.set([i], i);
          }
          return new Geometry(gl, {
            position: {
              data: position,
              size: 2,
            },
            index: {
              data: index,
            },
            id: {
              instanced: 1,
              size: 1,
              data: id,
            },
          });
        }
        // const geometry = new Box(gl);
        const geometry = circleGeometry(gl);
        const vertex = `
          precision highp float;
          attribute vec2 position;
          attribute float id;
    
          uniform float uTime;
    
          highp float random(vec2 co) {
            highp float a = 12.9898;
            highp float b = 78.233;
            highp float c = 43758.5453;
            highp float dt= dot(co.xy ,vec2(a,b));
            highp float sn= mod(dt,3.14);
            return fract(sin(sn) * c);
          }
    
          //  Function from Iñigo Quiles
          //  https://www.shadertoy.com/view/MsS3Wc
          vec3 hsb2rgb(vec3 c){
            vec3 rgb = clamp(abs(mod(c.x*6.0+vec3(0.0,4.0,2.0), 6.0)-3.0)-1.0, 0.0, 1.0);
            rgb = rgb * rgb * (3.0 - 2.0 * rgb);
            return c.z * mix(vec3(1.0), rgb, c.y);
          }
    
          varying vec3 vColor;
      
          void main() {
            vec2 offset = vec2(
              1.0 - 2.0 * random(vec2(id + uTime, 100000.0)),
              1.0 - 2.0 * random(vec2(id + uTime, 200000.0))
            );
            vec3 color = vec3(
              random(vec2(id + uTime, 300000.0)),
              1.0,
              1.0
            );
            vColor = hsb2rgb(color);
            gl_Position = vec4(position * 20.0 + offset, 0, 1);
          }
        `;
    
        const fragment = `
          precision highp float;
          varying vec3 vColor;
          void main() {
            gl_FragColor = vec4(vColor, 1);
          }
        `;
    
        const program = new Program(gl, {
          vertex,
          fragment,
          uniforms: {
            uTime: {value: 0},
          },
        });
    
        const scene = new Transform();
        const mesh = new Mesh(gl, {geometry, program});
        mesh.setParent(scene);
    
        function update(t: number) {
          program.uniforms.uTime.value = t / 1000;
          renderer.render({scene});
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