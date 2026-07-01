<template>
  <div class="graphics-root" ref="gContainer">
    <div id="container">
      <div id="square"></div>
      <div id="sections"></div>
      <div id="garden"></div>
      <div id="playground"></div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'

const gContainer = ref(null)
const cleanupFns = []
const gfxLoadedScripts = []

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
  const container = gContainer.value.querySelector('#container')
  const square = gContainer.value.querySelector('#square')
  const sections = gContainer.value.querySelector('#sections')
  const garden = gContainer.value.querySelector('#garden')
  const playground = gContainer.value.querySelector('#playground')
  await loadScript("/graphics/data/park-people/spritejs.js");
  await loadScript("/graphics/assets/external/index.js");
  {
    const  {Scene, Sprite, Polyline, SpriteSvg} = spritejs;
        (async function() {
          const data = await (await fetch('data.json')).json();
          console.log(data);
          // group data
    
          function count(d, dataset) {
            let place;
            if(d.x < 300 && d.y < 300) {
              place = 'square';
            } else if (d.x >= 300 && d.y < 300) {
              place = 'sections';
            } else if (d.x >= 300 && d.y >= 300) {
              place = 'garden';
            } else {
              place = 'playground';
            }
            dataset[place] = dataset[place] || [
              {
                gender: '男游客',
                people: 0,
              },
              {
                gender: '女游客',
                people: 0,
              }
            ];
            if(d.gender === 'f') {
              dataset[place][0].people++;
            } else {
              dataset[place][1].people++;
            }
    
            return dataset;
          }
    
          function groupData(data) {
            const dataset = {};
    
            for(let i = 0; i < data.length; i++) {
              const d = data[i];
              
              if(d.time === 12) {
                const p = count(d, dataset);
              }
            }
    
            return dataset;
          }
    
          const dataset = groupData(data);
          console.log(dataset);
    
          const { Chart, Pie, Legend, Tooltip, theme} = qcharts;
    
          theme.set({
            colors: ['#71dac7', '#d57a77'],
          });
    
          Object.entries(dataset).forEach(([key, dataset]) => {
            const chart = new Chart({
              container: `#${key}`
            });
    
            chart.source(dataset, {
              row: 'gender',
              value: 'people',
              text: 'gender'
            });
    
            const pie = new Pie({
              radius: 0.7,
              animation: {
                duration: 700,
                easing: 'bounceOut'
              }
            });
    
            const legend = new Legend({ orient: 'vertical', align: ['right', 'center'] });
            const toolTip = new Tooltip();
    
            chart.append([pie, legend, toolTip]);
          });
        }());
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
html, .graphics-root {
      width: 100%;
      height: 100%;
    }
    #container {
      width: 600px;
      height: 600px;
      display: flex;
      flex-wrap: wrap;
      justify-content: space-between;
    }

    #container > div {
      width: 300px;
      height: 300px;
      flex-shrink: 0;
    }
</style>