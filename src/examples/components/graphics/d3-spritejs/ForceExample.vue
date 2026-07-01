<template>
  <div class="graphics-root" ref="gContainer">
    <div id="stage"></div>
      
    <!--  -->
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
  await loadScript("/graphics/assets/external/d3.js");
  await loadScript("/graphics/assets/external/d3.v6.js");
  {
    const {Scene} = spritejs;
        const container = gContainer.value.querySelector('#stage');
        const scene = new Scene({
          container,
          width: 1200,
          height: 900,
          mode: 'stickyWidth',
        });
    
        const layer = scene.layer('fglayer', {
          handleEvent: false,
          autoRender: false,
        });
    
        const simulation = d3.forceSimulation()
          .force('link', d3.forceLink().id(d => d.id))
          .force('charge', d3.forceManyBody())
          .force('center', d3.forceCenter(400, 300));
    
        d3.json('/graphics/assets/external/f74a79ccf53d8147.json').then(graph => {
          function ticked() {
            d3.select(layer).selectAll('path')
              .attr('d', (d) => {
                const [sx, sy] = [d.source.x, d.source.y];
                const [tx, ty] = [d.target.x, d.target.y];
                return `M${sx} ${sy} L ${tx} ${ty}`;
              })
              .attr('strokeColor', 'white')
              .attr('lineWidth', 1);
            d3.select(layer).selectAll('sprite')
              .attr('pos', (d) => {
                return [d.x, d.y];
              });
            layer.render();
          }
    
          simulation
            .nodes(graph.nodes)
            .on('tick', ticked);
    
          simulation.force('link')
            .links(graph.links);
    
          // draw spots
          // ! due to d3 rules, you have to set attributes seperatly
          d3.select(layer).selectAll('sprite')
            .data(graph.nodes)
            .enter()
            .append('sprite')
            .attr('pos', (d) => {
              return [d.x, d.y];
            })
            .attr('size', [10, 10])
            .attr('border', [1, 'white'])
            .attr('borderRadius', 5)
            .attr('anchor', 0.5);
    
          // draw lines
          d3.select(layer).selectAll('path')
            .data(graph.links)
            .enter()
            .append('path')
            .attr('d', (d) => {
              const [sx, sy] = [d.source.x, d.source.y];
              const [tx, ty] = [d.target.x, d.target.y];
              return `M${sx} ${sy} L ${tx} ${ty}`;
            })
            .attr('name', (d, index) => {
              return `path${index}`;
            })
            .attr('strokeColor', 'white');
    
          d3.select(layer.canvas)
            .call(d3.drag()
              .container(layer.canvas)
              .subject(dragsubject)
              .on('start', dragstarted)
              .on('drag', dragged)
              .on('end', dragended));
    
          function dragsubject() {
            const [x, y] = layer.toLocalPos(event.x, event.y);
            return simulation.find(x, y);
          }
        });
    
        function dragstarted(event) {
          if(!event.active) simulation.alphaTarget(0.3).restart();
    
          const [x, y] = [event.subject.x, event.subject.y];
          event.subject.fx0 = x;
          event.subject.fy0 = y;
          event.subject.fx = x;
          event.subject.fy = y;
    
          const [x0, y0] = layer.toLocalPos(event.x, event.y);
          event.subject.x0 = x0;
          event.subject.y0 = y0;
        }
    
        function dragged(event) {
          const [x, y] = layer.toLocalPos(event.x, event.y),
            {x0, y0, fx0, fy0} = event.subject;
          const [dx, dy] = [x - x0, y - y0];
    
          event.subject.fx = fx0 + dx;
          event.subject.fy = fy0 + dy;
        }
    
        function dragended(event) {
          if(!event.active) simulation.alphaTarget(0);
          event.subject.fx = null;
          event.subject.fy = null;
        }
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
      padding-bottom: 75%;
    }
    #stage canvas {
      background-color: #313131;
    }
</style>