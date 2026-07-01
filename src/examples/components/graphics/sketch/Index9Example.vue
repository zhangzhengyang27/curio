<template>
  <div class="graphics-root" ref="gContainer"></div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import {pen, put, right, forward, render} from '@/examples/jsm-compat/graphics/sketch/lib/doodle.js'
import { useGraphicsCleanup } from '@/examples/composables/useGraphicsCleanup.js'

const gContainer = ref(null)
const gfxLoadedScripts = []
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
          const panel = document.createElement('div');
          panel.style.width = `${width}px`;
          panel.style.height = `${height}px`;
          panel.style.position = 'relative';
          gContainer.value.appendChild(panel);
    
          render((commands) => {
            panel.innerHTML = '';
            const d = document.createDocumentFragment();
    
            function project({x, y}) { // -1 ~ 1
              return {
                x: 0.5 * (x + 1) * panel.clientWidth,
                y: 0.5 * (1 - y) * panel.clientHeight,
              };
            }
    
            let lineWidth = 0,
              color = 'black',
              x0 = 0,
              y0 = 0;
    
            function line(x1, y1, x2, y2) {
              const div = document.createElement('div');
              div.style.position = 'absolute';
              div.style.left = `${x1}px`;
              div.style.top = `${y1}px`;
    
              const dy = y2 - y1;
              const dx = x2 - x1;
              const angle = 180 * Math.atan2(dy, dx) / Math.PI;
              const length = Math.hypot(dx, dy);
    
              div.style.transformOrigin = '0 0';
              div.style.transform = `translate(0, -50%) rotate(${angle}deg)`;
              div.style.width = `${length}px`;
              div.style.height = `${lineWidth}px`;
              div.style.background = color;
              d.appendChild(div);
            }
    
            commands.forEach(({command, args}, idx) => {
              if(command === 'pen') {
                lineWidth = args.lineWidth;
                color = args.color;
              } else if(command === 'put') {
                const {x, y} = project(args);
                x0 = x;
                y0 = y;
              } else if(command === 'forward') {
                const {x, y} = project(args);
                line(x0, y0, x, y);
                x0 = x;
                y0 = y;
              }
            });
    
            panel.appendChild(d);
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