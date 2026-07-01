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
  await loadScript("/graphics/assets/external/spritejs.js");
  await loadScript("/graphics/assets/external/sprite-extend-3d.js");
  // TODO: missing local script /lib/spritejs.js
  // TODO: missing local script /lib/sprite-extend-3d.js
  // TODO: missing local script /js/sprite-geo-earth.js
  {
    const {Scene} = spritejs;
        const container = gContainer.value.querySelector('#container');
        const scene = new Scene({
          container,
        });
        const layer = scene.layer3d('fglayer', {
          alpha: false,
          camera: {
            fov: 35,
          },
        });
        layer.camera.attributes.pos = [0, 0, 5000 / Math.min(layer.width, layer.height)];
        layer.camera.lookAt([0, 0, 0]);
        layer.gl.clearColor(0, 0, 0, 1);
    
        const {createGlobe,
          unproject,
          highlightMap,
          launchMissile,
          addMarker,
          cameraTo,
          addCurve,
          addBeam} = spritejs.globe;
        
        const texture = layer.createTexture('/graphics/assets/external/TB1mR3bX3nH8KJjSspcXXb3QFXa-9000-4500.jpg');
        
        const globe = createGlobe(layer, {
          orbit: true,
          raycast: true,
          rotateY: 310,
          texture,
          tick() {
            this.attributes.rotateY += 0.1;
          },
          highlight: true,
        });
    
        function randomColor() {
          const hue = Math.floor(Math.random() * 360);
          return `hsl(${hue}, 100%, 50%)`;
        }
    
        // setTimeout(() => {
        //   cameraTo(globe, {
        //     latitude: -70,
        //     longitude: 160,
        //     duration: 1500,
        //   });
        // }, 1500);
    
        // for(let i = 0; i < 100; i++) {
        //   // addMarker(globe, {
        //   //   latitude: 90 - Math.random() * 180,
        //   //   longitude: 180 - Math.random() * 360,
        //   //   // lifeTime: 1000,
        //   //   // height: 2.0,
        //   //   color: randomColor(),
        //   //   // speed: 0.5,
        //   //   // segments: 4,
        //   // });
        //   addBeam(globe, {
        //     latitude: 90 - Math.random() * 180,
        //     longitude: 180 - Math.random() * 360,
        //     // lifeTime: 1000,
        //     // height: 2.0,
        //     color: randomColor(),
        //     // speed: 0.5,
        //     // segments: 4,
        //   });
        // }
    
        setInterval(() => {
          const from = {
            latitude: 90 - 180 * Math.random(),
            longitude: 180 - 360 * Math.random(),
          };
          const to = {
            latitude: 90 - 180 * Math.random(),
            longitude: 180 - 360 * Math.random(),
          };
          const color = randomColor();
          const lifeTime = 1000;
          const height = 2.0;
          const width = 1.0;
    
          addMarker(globe, {
            ...from,
            lifeTime,
            height,
            color,
            width,
            // speed: 0.5,
            // segments: 4,
          });
    
          setTimeout(() => {
            addMarker(globe, {
              ...to,
              lifeTime,
              height,
              color,
              width,
              // speed: 0.5,
              segments: 4,
            });
          }, 0.5 * lifeTime);
    
          launchMissile(globe, {
            from,
            to,
            color,
            lifeTime,
            height,
            thickness: 0.75 * width,
          });
        }, 100);
    
        const curve = addCurve(globe, {
          from: {
            latitude: 0,
            longitude: 0,
          },
          to: {
            latitude: 30,
            longitude: 30,
          },
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
html, .graphics-root {
      width: 100%;
      height: 100%;
      padding: 0;
      margin: 0;
      overflow: hidden;
    }
    #container {
      width: 100%;
      height: 100%;
    }
</style>