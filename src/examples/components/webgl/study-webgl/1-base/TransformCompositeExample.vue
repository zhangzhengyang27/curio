<template>
  <WebGLExampleScene @ready="onReady" />
</template>

<script setup lang="ts">
import WebGLExampleScene from '@/examples/components/WebGLExampleScene.vue'
import { loadGlMatrixModern } from '@/examples/utils/loadGlMatrix'

async function onReady({ canvas, addUpdateCallback }: { canvas: HTMLCanvasElement; addUpdateCallback: (fn: (time?: any) => void) => void }) {
  await loadGlMatrixModern('/webgl/study-webgl/libs/gl-matrix.js')

  const vertexstring = `
    attribute vec4 a_position;
    uniform mat4 u_formMatrix;
    void main(void){
      gl_Position = u_formMatrix * a_position;
    }
  `

  const fragmentstring = `
    precision mediump float;
    void main(void){
      gl_FragColor = vec4(1.0, 1.0, 0.0, 1.0);
    }
  `

  const webgl = canvas.getContext('webgl')!!
  webgl.viewport(0, 0, canvas.clientWidth, canvas.clientHeight)

  const vsshader = webgl.createShader(webgl.VERTEX_SHADER)!
  const fsshader = webgl.createShader(webgl.FRAGMENT_SHADER)!
  webgl.shaderSource(vsshader, vertexstring)
  webgl.shaderSource(fsshader, fragmentstring)
  webgl.compileShader(vsshader)
  webgl.compileShader(fsshader)

  const program = webgl.createProgram()
  webgl.attachShader(program, vsshader)
  webgl.attachShader(program, fsshader)
  webgl.linkProgram(program)
  webgl.useProgram(program)
  ;(webgl as any).program = program

  const arr = [
    0, 0, 0, 1,
    0, 0.05, 0, 1,
    0.5, 0, 0, 1,
    0.5, 0, 0, 1,
    0, 0.05, 0, 1,
    0.5, 0.05, 0, 1,
  ]
  const pointPosition = new Float32Array(arr)
  const aPsotion = webgl.getAttribLocation((webgl as any).program, 'a_position')
  const triangleBuffer = webgl.createBuffer()
  webgl.bindBuffer(webgl.ARRAY_BUFFER, triangleBuffer)
  webgl.bufferData(webgl.ARRAY_BUFFER, pointPosition, webgl.STATIC_DRAW)
  webgl.enableVertexAttribArray(aPsotion)
  webgl.vertexAttribPointer(aPsotion, 4, webgl.FLOAT, false, 4 * 4, 0)

  const uniformMatrix = webgl.getUniformLocation((webgl as any).program, 'u_formMatrix')

  addUpdateCallback((time: any) => {
    const t = time * 0.001
    const model = glMatrix.mat4.create()

    // 缩放 -> 旋转 -> 移动，物体在原地旋转缩放后再整体移动
    const s = 1.0 + Math.sin(t * 2) * 0.3
    glMatrix.mat4.scale(model, model, [s, s, 1])
    glMatrix.mat4.rotateZ(model, model, t)
    glMatrix.mat4.translate(model, model, [Math.sin(t) * 0.3, Math.cos(t) * 0.2, 0])

    webgl.uniformMatrix4fv(uniformMatrix, false, model)

    webgl.clearColor(0.0, 1.0, 0.0, 1.0)
    webgl.clear(webgl.COLOR_BUFFER_BIT | webgl.DEPTH_BUFFER_BIT)
    webgl.enable(webgl.DEPTH_TEST)
    webgl.drawArrays(webgl.TRIANGLES, 0, 6)
  })
}
</script>
