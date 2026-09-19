<template>
  <div class="graphics-root" ref="gContainer"></div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import {pen, put, right, forward, render} from '@/examples/jsm-compat/graphics/sketch/lib/doodle.js'
import { useGraphicsCleanup } from '@/examples/composables/useGraphicsCleanup'

const gContainer = ref<HTMLElement | null>(null)
const gfxLoadedScripts: any[] = []
const { runInit } = useGraphicsCleanup(gfxLoadedScripts)




async function initGraphicsExample() {
  {
    for(let i = 0; i < 180; i++) {
          pen(1, `hsl(${2 * i},50%,50%)`);
          put(0, 0);
          forward(0.5);
          right(90);
          forward(0.5);
          right(90);
          forward(0.5);
          right(90);
          forward(0.5);
          right(90);
          right(2);
        }
    
        {
          const width = 512,
            height = 512;
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          gContainer.value!.appendChild(canvas);
    
          render((commands: any) => {
            const ctx = canvas.getContext('2d')!;
            function project({x, y}: any) { // -1 ~ 1
              return {
                x: 0.5 * (x + 1) * canvas.width,
                y: 0.5 * (1 - y) * canvas.height,
              };
            }
    
            commands.forEach(({command, args}: any, idx: any) => {
              if(command === 'pen') {
                if(idx > 0) ctx.stroke();
                const {color, lineWidth} = args;
                ctx.strokeStyle = color;
                ctx.lineWidth = lineWidth;
                ctx.beginPath();
              } else if(command === 'put') {
                const {x, y} = project(args);
                ctx.moveTo(x, y);
              } else if(command === 'forward') {
                const {x, y} = project(args);
                ctx.lineTo(x, y);
              }
            });
            ctx.stroke();
          });
        }
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