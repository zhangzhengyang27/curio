<template>
  <div class="graphics-root" ref="gContainer">
    <div id="main">
      <div>
        <div class="landmark" style="line-height:200px;width:200px;height:200px;background:#ff0a;">
          广场
        </div>
        <div class="landmark" style="left:260px;line-height:200px;width:200px;height:200px;background:#f0fa;">
          休闲区
        </div>
        <div class="landmark" style="top:260px;line-height:200px;width:200px;height:200px;background:#00fa;">
          游乐场
        </div>
        <div class="landmark" style="top:260px;left:260px;line-height:200px;width:200px;height:200px;background:#0f0a;">
          花园
        </div>
      </div>
      <canvas width="600" height="600"></canvas>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'

const gContainer = ref(null)
const cleanupFns = []
const gfxLoadedScripts = []


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

  const timeouts = []
  const origSetTimeout = window.setTimeout
  const origSetInterval = window.setInterval
  const origClearTimeout = window.clearTimeout
  const origClearInterval = window.clearInterval
  window.setTimeout = (fn, delay, ...args) => {
    const id = origSetTimeout(fn, delay, ...args)
    timeouts.push(['timeout', id])
    return id
  }
  window.setInterval = (fn, delay, ...args) => {
    const id = origSetInterval(fn, delay, ...args)
    timeouts.push(['interval', id])
    return id
  }
  cleanupFns.push(() => {
    timeouts.forEach(([kind, id]) => {
      if (kind === 'timeout') origClearTimeout(id)
      else origClearInterval(id)
    })
    window.setTimeout = origSetTimeout
    window.setInterval = origSetInterval
    window.clearTimeout = origClearTimeout
    window.clearInterval = origClearInterval
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
    gfxLoadedScripts.forEach(s => s.remove())
  })
}

async function initGraphicsExample() {
  const main = gContainer.value.querySelector('#main')
  {
    const canvas = gContainer.value.querySelector('canvas');
        const {width, height} = canvas;
        // const data = [];
        // function randomData(count = 500) {
        //   for(let i = 0; i < count; i++) {
        //     const x = Math.floor(Math.random() * width);
        //     const y = Math.floor(Math.random() * width);
        //     const r = Math.random();
        //     const r2 = Math.random();
        //     let time;
        //     let gender = 'f';
        //     if(x < 300 && y < 300) { // 在广场
        //       if(r > 0.9) time = 8;
        //       else if(r > 0.8) time = 12;
        //       else if(r > 0.6) time = 18;
        //       else time = 20;
        //       if(r > 0.5) gender = 'm';
        //     }
        //     if(x >= 300 && y < 300) { // 在休闲区
        //       if(r > 0.7) time = 8;
        //       else if(r > 0.4) time = 12;
        //       else if(r > 0.1) time = 18;
        //       else time = 20;
        //       if(r > 0.3) gender = 'm';
        //     }
        //     if(x < 300 && y >= 300) { // 在游乐场
        //       if(r > 0.98) time = 8;
        //       else if(r > 0.4) time = 12;
        //       else if(r > 0.05) time = 18;
        //       else time = 20;
        //       if(r > 0.5) gender = 'm';
        //     }
        //     else {
        //       if(r > 0.6) time = 8;
        //       else if(r > 0.4) time = 12;
        //       else if(r > 0.05) time = 18;
        //       else time = 20;
        //       if(r > 0.7) gender = 'm';
        //     }
        //     data.push({x, y, time, gender});
        //   }
        // }
    
        // randomData();
        // console.log(JSON.stringify(data));
    
        function draw(data, filter = null) {
          if(filter) data = data.filter(filter);
          const context = canvas.getContext('2d');
          for(let i = 0; i < data.length; i++) {
            const {x, y, gender} = data[i];
            context.fillStyle = gender === 'f' ? 'rgba(255, 0, 0, 0.5)' : 'rgba(0, 0, 255, 0.5)';
            context.beginPath();
            const spot = context.arc(x, y, 10, 0, Math.PI * 2);
            context.fill();
          }
        }
    
        fetch('data.json').then((res) => {
          return res.json();
        }).then((data) => {
          draw(data, ({time}) => time === 12);
        });
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
#main {
      width: 500px;
      height: 500px;
      position: absolute;
    }

    #main > * {
      position: absolute;
      left: 0;
      top: 0;
      width: 100%;
      height: 100%;
    }

    .landmark {
      position: absolute;
      border-radius: 50%;
      text-align: center;
    }
</style>