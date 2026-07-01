<template>
  <div class="graphics-root" ref="gContainer">
    <canvas width="600" height="600"></canvas>
    <div id="videoContainer">
      <h2>视频</h2>
      <video
        width="300"
        height="300"
        controls="true"
        autoplay="true"
        id="video"
      ></video>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import {subtract, cross} from '@/examples/jsm-compat/graphics/common/lib/math/functions/Vec2Func.js'
import { useGraphicsCleanup } from '@/examples/composables/useGraphicsCleanup.js'

const gContainer = ref(null)
const gfxLoadedScripts = []
const { runInit } = useGraphicsCleanup(gfxLoadedScripts)




async function initGraphicsExample() {
  const videoContainer = gContainer.value.querySelector('#videoContainer')
  const video = gContainer.value.querySelector('#video')
  {
    function isCross(p1, p2, p3, p4) {
          const v1 = subtract([], p4, p3);
          const v2 = subtract([], p1, p3);
          const v3 = subtract([], p2, p3);
    
          const z1 = cross(v1, v2);
          const z2 = cross(v1, v3);
    
          return z1 * z2 <= 0;
        }
    
        function isPathIntersection(points) {
          const len = points.length;
    
          for(let i = 0; i < len - 1; i++) {
            const point = points[i];
            const nextPoint = points[i + 1];
    
            for(let j = 0; j < len - 1; j++) {
              const p1 = points[j],
                p2 = points[j + 1];
    
              if(p1 !== point && p2 !== point && p1 !== nextPoint && p2 !== nextPoint
                && isCross(p1, p2, point, nextPoint) && isCross(point, nextPoint, p1, p2)) {
                return true;
              }
            }
          }
          return false;
        }
    
        function draw(context, points) {
          context.clearRect(0, 0, context.canvas.width, context.canvas.height);
          const d = `M${points.join('L')}`;
          const color = isPathIntersection(points) ? 'red' : 'blue';
          context.strokeStyle = color;
          const path = new Path2D(d);
          context.stroke(path);
        }
    
        const canvas = gContainer.value.querySelector('canvas');
        const ctx = canvas.getContext('2d');
        ctx.lineWidth = 5;
        ctx.lineJoin = 'round';
        ctx.lineCap = 'round';
        const points = [];
        const data = [];
    
        canvas.addEventListener('click', (evt) => {
          const {x, y} = evt;
          const {x: x0, y: y0} = evt.target.getBoundingClientRect();
          points.push([x - x0, y - y0]);
          // draw(ctx, points);
          if(recorder.state !== 'recording') {
            data.length = 0;
            recorder.start();
          }
          // console.log(recorder);
        });
    
        canvas.addEventListener('dblclick', (evt) => {
          points.length = 0;
          // draw(ctx, points);
          if(recorder.state === 'recording') {
            recorder.stop();
          }
        });
    
        function update() {
          draw(ctx, points);
          requestAnimationFrame(update);
        }
        update();
    
        const stream = canvas.captureStream();
        const recorder = new MediaRecorder(stream, { mimeType: 'video/webm' });
        recorder.ondataavailable = function (event) {
          if (event.data && event.data.size) {
            data.push(event.data);
          }
        };
        recorder.onstop = () => {
          const url = URL.createObjectURL(new Blob(data, { type: 'video/webm' }));
          gContainer.value.querySelector('#videoContainer').style.display = "block";
          gContainer.value.querySelector("video").src = url;
        };
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

<style scoped>
.graphics-root {
      display: flex;
      flex-direction: row;
      justify-content: space-around;
    }
    canvas {
      background: #eee;
    }
</style>