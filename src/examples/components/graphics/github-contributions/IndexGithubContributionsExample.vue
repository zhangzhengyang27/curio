<template>
  <div class="graphics-root" ref="gContainer">
    <div id="stage"></div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import {Scene} from '@/examples/jsm-compat/graphics/github-contributions/graphics/assets/external/spritejs.esm.js'
import {Cube, Light, shaders} from '@/examples/jsm-compat/graphics/github-contributions/graphics/assets/external/sprite-extend-3d.esm.js'

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
  await loadScript("/graphics/assets/external/d3.v5.js");
  {
    let cache = null;
        async function getData(toDate = new Date()) {
          if(!cache) {
            const data = await (await fetch('/graphics/assets/github_contributions_akira-cn.json')).json();
            cache = data.contributions.map((o) => {
              o.date = new Date(o.date.replace(/-/g, '/'));
              return o;
            });
          }
          // 要拿到 toData 日期之前大约一年的数据（52周）
          let start = 0,
            end = cache.length;
    
          // 用二分法查找
          while(start < end - 1) {
            const mid = Math.floor(0.5 * (start + end));
            const {date} = cache[mid];
            if(date <= toDate) end = mid;
            else start = mid;
          }
    
          // 获得对应的一年左右的数据
          let day;
          if(end >= cache.length) {
            day = toDate.getDay();
          } else {
            const lastItem = cache[end];
            day = lastItem.date.getDay();
          }
          // 根据当前星期几，再往前拿52周的数据
          const len = 7 * 52 + day + 1;
          const ret = cache.slice(end, end + len);
          if(ret.length < len) {
            // 日期超过了数据范围，补齐数据
            const pad = new Array(len - ret.length).fill({count: 0, color: '#ebedf0'});
            ret.push(...pad);
          }
    
          return ret;
        }
    
        (async function () {
          const container = gContainer.value.querySelector('#stage');
    
          const scene = new Scene({
            container,
            displayRatio: 2,
          });
    
          const layer = scene.layer3d('fglayer', {
            ambientColor: [0.5, 0.5, 0.5, 1],
            camera: {
              fov: 35,
            },
          });
          layer.camera.attributes.pos = [2, 6, 9];
          layer.camera.lookAt([0, 0, 0]);
    
          const light = new Light({
            direction: [-3, -3, -1],
            color: [1, 1, 1, 1],
          });
    
          layer.addLight(light);
    
          const program = layer.createProgram({
            vertex: shaders.GEOMETRY.vertex,
            fragment: shaders.GEOMETRY.fragment,
            // cullFace: null,
          });
    
          const dataset = await getData();
          const max = d3.max(dataset, (a) => {
            return a.count;
          });
    
          
          const selection = d3.select(layer);
          const chart = selection.selectAll('cube')
            .data(dataset)
            .enter()
            .append(() => {
              return new Cube(program);
            })
            .attr('width', 0.14)
            .attr('depth', 0.14)
            .attr('height', 1)
            // Note: use scaleY. DONT use height directly because the change of height
            // will rebuild geometry(much slower).
            .attr('scaleY', 0.001)
            // .attr('scaleY', (d) => {
            //   return d.count / max;
            // })
            .attr('pos', (d, i) => {
              const x0 = -3.8 + 0.0717 + 0.0015;
              const z0 = -0.5 + 0.05 + 0.0015;
              const x = x0 + 0.143 * Math.floor(i / 7);
              const z = z0 + 0.143 * (i % 7);
              // return [x, 0.5 * d.count / max, z];
              return [x, 0, z];
            })
            .attr('colors', (d, i) => {
              return d.color;
            });
    
    
          const fragment = `
            precision highp float;
            precision highp int;
            varying vec4 vColor;
            varying vec2 vUv;
            void main() {
              float x = fract(vUv.x * 53.0);
              float y = fract(vUv.y * 7.0);
              x = smoothstep(0.0, 0.1, x) - smoothstep(0.9, 1.0, x);
              y = smoothstep(0.0, 0.1, y) - smoothstep(0.9, 1.0, y);
              gl_FragColor = vColor * (x + y);
            }    
          `;
    
          const axisProgram = layer.createProgram({
            vertex: shaders.TEXTURE.vertex,
            fragment,
            // cullFace: null,
          });
    
          const ground = new Cube(axisProgram, {
            width: 7.6,
            height: 0.1,
            y: -0.049, // not 0.05 to avoid z-fighting
            depth: 1,
            colors: 'rgba(0, 0, 0, 0.1)',
          });
    
          layer.append(ground);
    
          const linear = d3.scaleLinear()
            .domain([0, max])
            .range([0, 1.0]);
    
          chart.transition()
            .duration(2000)
            .attr('scaleY', (d, i) => {
              return linear(d.count);
            })
            .attr('y', (d, i) => {
              return 0.5 * linear(d.count);
            });
    
          layer.setOrbit();
    
          window.layer = layer;
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
#stage {
      width: 600px;
      height: 600px;
    }
</style>