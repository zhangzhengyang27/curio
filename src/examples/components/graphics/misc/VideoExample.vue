<template>
  <div class="graphics-root" ref="gContainer">
    <div style="width: 300px; margin: auto;">
      <h1>canvas2video(webm)</h1>
      <div id="container"></div>
      <div id="videoContainer" style="display: none;">
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
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
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
  await loadScript("/graphics/assets/external/spritejs.min.js");
  await loadScript("/graphics/assets/external/canvas2video.js");
  await loadScript("/graphics/assets/external/ffmpeg.js");
  {
    const { Scene, Label, Group } = spritejs;
          const container = gContainer.value!.querySelector('#container');
          const scene = new Scene({
            container,
            width: 300,
            height: 300,
          });
    
          const fglayer = scene.layer("fglayer", {
            bgcolor: 'red'
          });
          // fglayer.canvas.style.backgroundColor = "#3f097a";
    
          const group = new Group();
          group.attr({
            pos: [150, 150],
          });
    
          fglayer.append(group);
    
          const text1 = new Label("Hello World !");
    
          text1.attr({
            anchor: [0.5, 0.5],
            font: "bold 24px Arial",
            fillColor: "#ffdc45",
          });
    
          const text2 = new Label("SpriteJS.org");
          text2.attr({
            anchor: [0.5, 0.5],
            y: 60,
            font: "bold 24px Arial",
            fillColor: "#ffdc45",
          });
    
          group.animate(
            [
              { scale: 1.5, rotate: -30 },
              { scale: 1, rotate: 0 },
              { scale: 1.5, rotate: 30 },
            ],
            {
              duration: 3000,
              iterations: Infinity,
              direction: "alternate",
            }
          );
    
          group.append(text1, text2);
  }
  {
    const canvas2videoInstance = new Canvas2Video({
            canvas: gContainer.value!.querySelector('canvas') as HTMLCanvasElement,
            outVideoType: "webm",
          });
          canvas2videoInstance.startRecord();
    
          setTimeout(() => {
            canvas2videoInstance.stopRecord();
          }, 3000);
          canvas2videoInstance
            .getStreamURL()
            .then((url: any) => {
              console.log("url", url);
              (gContainer.value!.querySelector('#videoContainer') as HTMLElement).style.display = "block";
              (gContainer.value!.querySelector("video") as HTMLVideoElement).src = url;
            })
            .catch((err: any) => console.error(err));
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
* {
        padding: 0;
        margin: 0;
      }
      #container {
        width: 300px;
        height: 300px;
      }
</style>