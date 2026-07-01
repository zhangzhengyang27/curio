<template>
  <div class="graphics-root" ref="gContainer">
    <div>
      <button id="updateBtn">
        抽奖
      </button><span id="user"></span>
    </div>
    <canvas id="glDoodle" width="512" height="512"></canvas>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import GLRenderer from '@/examples/jsm-compat/graphics/gl-raffle/lib/gl-renderer.js'

const gContainer = ref(null)
const cleanupFns = []


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
  {
    const container = gContainer.value.querySelector('#glDoodle');
        const doodle = new GLRenderer(container, {autoUpdate: false});
        const width = 512,
          height = 512;
        const button = gContainer.value.querySelector('#updateBtn');
        (async function() {
          const textureCanvas = new OffscreenCanvas(width, height);
          const ctx = textureCanvas.getContext('2d');
          const program = await doodle.load('./lib/fragment.glsl');
          doodle.useProgram(program);
    
          button.addEventListener('click', () => {
            const texture = doodle.createTexture(textureCanvas.transferToImageBitmap());
            doodle.uniforms.resolution = [width, height];
            doodle.uniforms.rate = 0.2; // 30% 中奖概率
            doodle.uniforms.seed = Math.random(); // 随机种子
            doodle.uniforms.texture = texture;
            doodle.render();
            doodle.deleteTexture(texture);
            ctx.drawImage(doodle.canvas, 0, 0, width, height);
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
div, button {
      font-size: 3rem;
    }
    canvas {
      background: #000;
    }
    span {
      margin-left: 20px;
    }
</style>