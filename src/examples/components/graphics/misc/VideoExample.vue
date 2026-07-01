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

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'

const gContainer = ref(null)
const cleanupFns = []

async function loadScript(src) {
  return new Promise((resolve, reject) => {
    const s = document.createElement('script')
    s.src = src
    s.onload = resolve
    s.onerror = reject
    document.head.appendChild(s)
  })
}


function installCleanupHooks() {
  const origRaf = window.requestAnimationFrame
  const origCancelRaf = window.cancelAnimationFrame
  const rafIds = []
  window.requestAnimationFrame = (cb) => {
    const id = origRaf((time) => {
      const idx = rafIds.indexOf(id)
      if (idx !== -1) rafIds.splice(idx, 1)
      cb(time)
    })
    rafIds.push(id)
    return id
  }
  window.cancelAnimationFrame = (id) => {
    const idx = rafIds.indexOf(id)
    if (idx !== -1) rafIds.splice(idx, 1)
    return origCancelRaf(id)
  }
  cleanupFns.push(() => {
    rafIds.forEach(id => origCancelRaf(id))
    window.requestAnimationFrame = origRaf
    window.cancelAnimationFrame = origCancelRaf
  })

  const listeners = []
  const origWindowAdd = window.addEventListener
  const origDocAdd = document.addEventListener
  window.addEventListener = (type, fn, opts) => {
    listeners.push(['window', type, fn, opts])
    return origWindowAdd.call(window, type, fn, opts)
  }
  document.addEventListener = (type, fn, opts) => {
    listeners.push(['document', type, fn, opts])
    return origDocAdd.call(document, type, fn, opts)
  }
  cleanupFns.push(() => {
    listeners.forEach(([target, type, fn, opts]) => {
      if (target === 'window') window.removeEventListener(type, fn, opts)
      else if (target === 'document') document.removeEventListener(type, fn, opts)
    })
    window.addEventListener = origWindowAdd
    document.addEventListener = origDocAdd
  })

  const glContexts = []
  const origGetContext = HTMLCanvasElement.prototype.getContext
  HTMLCanvasElement.prototype.getContext = function(type, attrs) {
    const ctx = origGetContext.call(this, type, attrs)
    if (ctx && /^(webgl|webgl2|experimental-webgl)$/.test(type)) {
      glContexts.push(ctx)
    }
    return ctx
  }
  cleanupFns.push(() => {
    glContexts.forEach((ctx) => {
      const ext = ctx.getExtension('WEBGL_lose_context')
      if (ext) ext.loseContext()
    })
    HTMLCanvasElement.prototype.getContext = origGetContext
  })
}

async function initGraphicsExample() {
  await loadScript("/graphics/assets/external/spritejs.min.js");
  await loadScript("/graphics/assets/external/canvas2video.js");
  // TODO: failed to localize external script https://unpkg.com/@ffmpeg/ffmpeg/dist/ffmpeg.min.js: Download failed: https://unpkg.com/@ffmpeg/ffmpeg@0.12.15/dist/ffmpeg.min.js status 404
  {
    const { Scene, Label, Group } = spritejs;
          const container = gContainer.value.querySelector('#container');
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
            canvas: gContainer.value.querySelector('canvas'),
            outVideoType: "webm",
          });
          canvas2videoInstance.startRecord();
    
          setTimeout(() => {
            canvas2videoInstance.stopRecord();
          }, 3000);
          canvas2videoInstance
            .getStreamURL()
            .then((url) => {
              console.log("url", url);
              gContainer.value.querySelector('#videoContainer').style.display = "block";
              gContainer.value.querySelector("video").src = url;
            })
            .catch((err) => console.error(err));
  }
}

onMounted(() => {
  installCleanupHooks()
  initGraphicsExample().catch(err => {
    console.error('Graphics example init failed:', err)
  })
})

onUnmounted(() => {
  cleanupFns.forEach(fn => fn())
  cleanupFns.length = 0
})
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