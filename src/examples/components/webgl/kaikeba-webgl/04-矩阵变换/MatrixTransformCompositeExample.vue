<template>
  <WebGLExampleScene @ready="onReady" />
</template>

<script setup>
import WebGLExampleScene from '@/examples/components/WebGLExampleScene.vue'
import { initShaders } from '@/examples/jsm-compat/webgl/kaikeba-webgl/04-矩阵变换/jsm/Utils.js'

function createTRSMatrix(tx, ty, angle, sx, sy) {
  const cos = Math.cos(angle)
  const sin = Math.sin(angle)
  // 列主序矩阵：M = T * R * S
  return new Float32Array([
    cos * sx, sin * sx, 0, 0,
    -sin * sy, cos * sy, 0, 0,
    0, 0, 1, 0,
    tx, ty, 0, 1,
  ])
}

async function onReady({ canvas, addUpdateCallback }) {
  const gl = canvas.getContext('webgl')

  const vsSource = `
    attribute vec4 a_Position;
    uniform mat4 u_ModelMatrix;
    void main(){
      gl_Position = u_ModelMatrix * a_Position;
    }
  `
  const fsSource = `
    void main(){
      gl_FragColor = vec4(1.0, 1.0, 0.0, 1.0);
    }
  `

  initShaders(gl, vsSource, fsSource)

  const vertices = new Float32Array([
    0.0, 0.1,
    -0.1, -0.1,
    0.1, -0.1,
  ])

  const vertexBuffer = gl.createBuffer()
  gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer)
  gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW)

  const a_Position = gl.getAttribLocation(gl.program, 'a_Position')
  gl.vertexAttribPointer(a_Position, 2, gl.FLOAT, false, 0, 0)
  gl.enableVertexAttribArray(a_Position)

  const u_ModelMatrix = gl.getUniformLocation(gl.program, 'u_ModelMatrix')

  addUpdateCallback((time) => {
    const t = time * 0.001
    const tx = Math.sin(t) * 0.5
    const ty = Math.cos(t) * 0.3
    const angle = t
    const s = 1.0 + Math.sin(t * 2) * 0.5

    const matrix = createTRSMatrix(tx, ty, angle, s, s)
    gl.uniformMatrix4fv(u_ModelMatrix, false, matrix)

    gl.clearColor(0.0, 0.0, 0.0, 1.0)
    gl.clear(gl.COLOR_BUFFER_BIT)
    gl.drawArrays(gl.TRIANGLES, 0, 3)
  })
}
</script>
