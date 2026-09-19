<script setup lang="ts">
import WebGLExampleScene from '@/examples/components/WebGLExampleScene.vue'
import { useGraphicsCleanup } from '@/examples/composables/useGraphicsCleanup'

const { runInit } = useGraphicsCleanup()

function onReady({ canvas }: { canvas: HTMLCanvasElement }) {
  runInit(() => init(canvas))
}

function init(canvas: HTMLCanvasElement) {
  const gl = canvas.getContext('webgl')!
  if (!gl) return

  const vertexShaderSource = `
    attribute vec4 aPosition;
    varying vec4 vPosition;

    void main() {
      vPosition = aPosition;
      gl_Position = aPosition;
      gl_PointSize = 10.0;
    }
  `

  const fragmentShaderSource = `
    precision lowp float;
    uniform float uHeight;
    varying vec4 vPosition;

    void main() {
      vec2 coord = vPosition.xy;
      float step = 0.4;
      bool visible = false;

      for (int i = 0; i < 5; i++) {
        float upper = 1.0 - float(i) * step;
        float lower = upper - step;

        if (coord.y > lower && coord.y < upper) {
          if (coord.y > uHeight - float(i) * 0.08) {
            visible = true;
          }
        }
      }

      if (visible) {
        gl_FragColor = vec4(1.0, 0.0, 0.0, 1.0);
      } else {
        discard;
      }
    }
  `

  function createShader(type: number, source: string) {
    const shader = gl.createShader(type)!
    gl.shaderSource(shader, source)
    gl.compileShader(shader)
    return shader
  }

  const program = gl.createProgram()
  const vertexShader = createShader(gl.VERTEX_SHADER, vertexShaderSource)
  const fragmentShader = createShader(gl.FRAGMENT_SHADER, fragmentShaderSource)

  gl.attachShader(program, vertexShader)
  gl.attachShader(program, fragmentShader)
  gl.linkProgram(program)
  gl.useProgram(program)

  const aPosition = gl.getAttribLocation(program, 'aPosition')
  const uHeight = gl.getUniformLocation(program, 'uHeight')

  const points = new Float32Array([
    -1.0, -1.0,
     1.0, -1.0,
    -1.0,  1.0,
     1.0,  1.0
  ])

  const buffer = gl.createBuffer()
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer)
  gl.bufferData(gl.ARRAY_BUFFER, points, gl.STATIC_DRAW)
  gl.vertexAttribPointer(aPosition, 2, gl.FLOAT, false, 0, 0)
  gl.enableVertexAttribArray(aPosition)

  let value = 1.0

  function draw() {
    value -= 0.005
    if (value < -1.0) {
      value = 1.0
    }

    gl.viewport(0, 0, canvas.width, canvas.height)
    gl.clearColor(0.0, 0.0, 0.0, 1.0)
    gl.clear(gl.COLOR_BUFFER_BIT)

    gl.uniform1f(uHeight, value)
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)

    requestAnimationFrame(draw)
  }

  draw()
}
</script>

<template>
  <WebGLExampleScene @ready="onReady" />
</template>
