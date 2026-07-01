<template>
  <div class="graphics-root" ref="gContainer">
    <canvas width="1024" height="512"></canvas>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useGraphicsCleanup } from '@/examples/composables/useGraphicsCleanup.js'

const gContainer = ref(null)
const gfxLoadedScripts = []
const { runInit } = useGraphicsCleanup(gfxLoadedScripts)




async function initGraphicsExample() {
  {
    const width = 1024;
        const height = 512;
        function projection([longitude, latitude]) {
          const x = width * (180 + longitude) / 360;
          const y = height * (1.0 - (90 + latitude) / 180); // Canvas坐标系y轴朝下
          return [x, y];
        }
    
        function drawPoints(ctx, points) {
          ctx.beginPath();
          ctx.moveTo(...points[0]);
          for(let i = 1; i < points.length; i++) {
            ctx.lineTo(...points[i]);
          }
          ctx.fill();
        }
        
        const canvas = gContainer.value.querySelector('canvas');
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = 'black';
    
        (async function () {
          const worldData = await (await fetch('/graphics/covid-vis/assets/data/world-geojson.json')).json();
          const features = worldData.features;
          features.forEach(({geometry}) => {
            if(geometry.type === 'MultiPolygon') {
              const coordinates = geometry.coordinates;
              if(coordinates) {
                coordinates.forEach((contours) => {
                  contours.forEach((path) => {
                    const points = path.map(projection);
                    drawPoints(ctx, points);
                  });
                });
              }
            } else if(geometry.type === 'Polygon') {
              const contours = geometry.coordinates;
              contours.forEach((path) => {
                const points = path.map(projection);
                drawPoints(ctx, points);
              });
            }
          });
        }());
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