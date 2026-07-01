<template>
  <div class="graphics-root" ref="gContainer">
    <div id="stage"></div>
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
  const stage = gContainer.value.querySelector('#stage')
  await loadScript("/graphics/assets/external/spritejs.min.js");
  await loadScript("/graphics/assets/external/d3.v6.js");
  {
    const {Scene, SpriteSvg} = spritejs;
        const container = gContainer.value.querySelector('#stage');
        const scene = new Scene({
          container,
          width: 1200,
          height: 1200,
        });
    
        const dataset = [125, 121, 127, 193, 309];
    
        const scale = d3.scaleLinear()
          .domain([100, d3.max(dataset)])
          .range([0, 500]);
    
        const fglayer = scene.layer('fglayer');
        const s = d3.select(fglayer);
    
        const colors = ['#fe645b', '#feb050', '#c2af87', '#81b848', '#55abf8'];
        const chart = s.selectAll('sprite')
          .data(dataset)
          .enter()
          .append('sprite')
          .attr('x', 450)
          .attr('y', (d, i) => {
            return 200 + i * 95;
          })
          .attr('width', scale)
          .attr('height', 80)
          .attr('bgcolor', (d, i) => {
            return colors[i];
          });
        
        const axis = d3.axisBottom(scale).tickValues([100, 200, 300]);
        const axisNode = new SpriteSvg({
          x: 420,
          y: 680,
        });
        d3.select(axisNode.svg)
          .attr('width', 600)
          .attr('height', 60)
          .append('g')
          .attr('transform', 'translate(30, 0)')
          .call(axis);
    
        axisNode.svg.children[0].setAttribute('font-size', 20);
        fglayer.append(axisNode);
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
      overflow: hidden;
      padding: 0;
      margin: 0;
    }
    #stage {
      display: inline-block;
      width: 100%;
      height: 0;
      padding-bottom: 100%;
    }
</style>