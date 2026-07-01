<template>
  <div class="mygrapics-root" ref="mgContainer">
    <canvas width="300" height="300"></canvas>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'

const mgContainer = ref(null)
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

async function initMyGrapicsExample() {
  {
    const canvas = mgContainer.value.querySelector('canvas');
        const gl = canvas.getContext('webgl');
        
        const vertex = `
          attribute vec2 position;
          varying vec3 color;
    
          void main() {
            gl_PointSize = 1.0;
            color = vec3(0.5 + position * 0.5, 0.0);
            gl_Position = vec4(position * 0.5, 1.0, 1.0);
          }
        `;
    
        const fragment = `
          precision mediump float;
          varying vec3 color;
    
          void main()
          {
            gl_FragColor = vec4(color, 1.0);
          }    
        `;
    
        const vertexShader = gl.createShader(gl.VERTEX_SHADER);
        gl.shaderSource(vertexShader, vertex);
        gl.compileShader(vertexShader);
    
        const fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
        gl.shaderSource(fragmentShader, fragment);
        gl.compileShader(fragmentShader);
    
    
        const program = gl.createProgram();
        gl.attachShader(program, vertexShader);
        gl.attachShader(program, fragmentShader);
        gl.linkProgram(program);
        gl.useProgram(program);
    
        const points = new Float32Array([
          -1, -1,
          0, 1,
          1, -1,
        ]);
    
        const bufferId = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, bufferId);
        gl.bufferData(gl.ARRAY_BUFFER, points, gl.STATIC_DRAW);
    
        const vPosition = gl.getAttribLocation(program, 'position');
        gl.vertexAttribPointer(vPosition, 2, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(vPosition);
    
        gl.clear(gl.COLOR_BUFFER_BIT);
        gl.drawArrays(gl.TRIANGLES, 0, points.length / 2);
  }
}

onMounted(() => {
  installCleanupHooks()
  initMyGrapicsExample().catch(err => {
    console.error('MyGrapics example init failed:', err)
  })
})

onUnmounted(() => {
  cleanupFns.forEach(fn => fn())
  cleanupFns.length = 0
})
</script>