<template>
  <div class="graphics-root" ref="gContainer">
    <div id="app"></div>
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
  await loadScript("/graphics/assets/external/index.js");
  {
    const { Chart, Line, Bar, Legend, Axis } = qcharts;
    
        const chart = new Chart({
          container: "#app",
        });
    
        const data = [
          { date: "1月", catgory: "降水量", val: 15.2 },
          { date: "2月", catgory: "降水量", val: 19.2 },
          { date: "3月", catgory: "降水量", val: 11.2 },
          { date: "4月", catgory: "降水量", val: 45.2 },
          { date: "5月", catgory: "降水量", val: 55.2 },
          { date: "6月", catgory: "降水量", val: 75.2 },
          { date: "7月", catgory: "降水量", val: 95.2 },
          { date: "8月", catgory: "降水量", val: 135.2 },
          { date: "9月", catgory: "降水量", val: 162.2 },
          { date: "10月", catgory: "降水量", val: 32.2 },
          { date: "11月", catgory: "降水量", val: 32.2 },
          { date: "12月", catgory: "降水量", val: 15.2 },
    
          { date: "1月", catgory: "气温", val: 2.2 },
          { date: "2月", catgory: "气温", val: 3.2 },
          { date: "3月", catgory: "气温", val: 5.2 },
          { date: "4月", catgory: "气温", val: 6.2 },
          { date: "5月", catgory: "气温", val: 8.2 },
          { date: "6月", catgory: "气温", val: 15.2 },
          { date: "7月", catgory: "气温", val: 25.2 },
          { date: "8月", catgory: "气温", val: 23.2 },
          { date: "9月", catgory: "气温", val: 24.2 },
          { date: "10月", catgory: "气温", val: 16.2 },
          { date: "11月", catgory: "气温", val: 12.2 },
          { date: "12月", catgory: "气温", val: 6.6 },
        ];
    
        chart.source(data, {
          row: "catgory",
          value: "val",
          text: "date",
        });
    
        const ds = chart.dataset;
    
        const d1 = ds.selectRows("降水量");
        const line = new Line({ axisGap: true })
          .source(d1)
          .style("point", { strokeColor: "#fff" });
    
        const d2 = ds.selectRows("气温");
        const bar = new Bar().source(d2);
        bar.style("pillar", { fillColor: "#6CD3FF" });
    
        const axisLeft = new Axis({
          orient: "left",
          formatter: (val) => {
            return `${val} ml`
          },
        })
          .style("axis", false)
          .style("scale", false)
          .source(d1);
    
        const axisRight = new Axis({
          orient: "right",
          formatter: (val) => {
            return `${val} °C`
          },
        })
          .style("axis", false)
          .style("scale", false)
          .source(d2)
    
        const axisBottom = new Axis().style("scale", true).style("grid", false);
    
        const legend = new Legend({ align: ["center", "bottom"] })
          .style("point", (i, j, k) => {
            return { borderRadius: 10, bgcolor: k === 0 ? "#47A1FF" : "#6CD3FF" }
          })
          .style("text", { fontSize: 12 });
    
        chart.append([bar, line, axisBottom, axisLeft, axisRight, legend]);
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
      padding: 0;
      margin: 0;
      width: 100%;
      height: 100%;
      overflow: hidden;
    }
    #app {
      width: 100%;
      height: 100%;
    }
</style>