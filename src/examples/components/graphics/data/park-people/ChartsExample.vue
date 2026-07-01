<template>
  <div class="graphics-root" ref="gContainer">
    <div id="container"></div>
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
  await loadScript("/graphics/assets/external/d3.v6.js");
  await loadScript("/graphics/data/park-people/spritejs.js");
  {
    const  {Scene, Sprite, Polyline, SpriteSvg} = spritejs;
        (async function() {
          const data = await (await fetch('data.json')).json();
          const dataset = d3.rollups(data, v => v.length, d => d.time).sort(([a],[b]) => a - b);
          dataset.unshift([6, 0]);
          dataset.push([22, 0]);
    
          console.log(dataset);
          const scene = new Scene({
            container,
            width: 600,
            height: 600,
            displayRatio: 2,
          });
          const fglayer = scene.layer('fglayer');
    
          const points = [];
          dataset.forEach((d, i) => {
            const x = 20 + 20 * d[0];
            const y = 300 - d[1];
            points.push(x, y);
          });
    
          const p = new Polyline();
          p.attr({
            points,
            lineWidth: 4,
            strokeColor: 'green',
            smooth: true,
          });
    
          fglayer.append(p);
          
          const scale = d3.scaleLinear()
            .domain([0, 24])
            .range([0, 480]);
      
          const axis = d3.axisBottom(scale)
            .tickValues(dataset.map(d => d[0]));
    
          const axisNode = new SpriteSvg({
            x: 20,
            y: 300,
            flexible: true,
          });
    
          d3.select(axisNode.svg)
            .attr('width', 600)
            .attr('height', 60)
            .append('g')
            .call(axis);
    
          axisNode.svg.children[0].setAttribute('font-size', 20);
          fglayer.append(axisNode);
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
    }
</style>