<script setup>
import WebGLExampleScene from '@/examples/components/WebGLExampleScene.vue'
import { useGraphicsCleanup } from '@/examples/composables/useGraphicsCleanup'

const { runInit } = useGraphicsCleanup()

function onReady({ canvas }) {
  runInit(() => init(canvas))
}

function init(canvas) {
  const gl = canvas.getContext('webgl')
  if (!gl) return

  const vertexShaderSource = `
    attribute vec4 aPosition;
    void main() {
      gl_Position = aPosition;
      gl_PointSize = 10.0;
    }
  `

  const fragmentShaderSource = `
    precision lowp float;
    uniform vec3 metaBalls[2];
    uniform vec2 uResolution;

    void main() {
      vec2 coord = gl_FragCoord.xy / uResolution;
      float v = 0.0;

      for (int i = 0; i < 2; i++) {
        vec3 m = metaBalls[i];
        vec2 center = m.xy;
        float r = m.z;
        float dx = center.x - coord.x;
        float dy = center.y - coord.y;
        v += r * r / (dx * dx + dy * dy);
      }

      if (v > 1.0) {
        gl_FragColor = vec4(0.0, 1.0, 0.0, 1.0);
      } else {
        discard;
      }
    }
  `

  function createShader(type, source) {
    const shader = gl.createShader(type)
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
  const uMetaBalls = gl.getUniformLocation(program, 'metaBalls')
  const uResolution = gl.getUniformLocation(program, 'uResolution')

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

  let balls = [
    { y: 0.45, speed: 0.00125 },
    { y: 0.75, speed: -0.00125 }
  ]
  let time = 0

  function draw() {
    time += 1
    const data = []

    for (let i = 0; i < balls.length; i++) {
      balls[i].y += balls[i].speed

      if (time % 100 === 0) {
        balls[i].speed = -balls[i].speed
      }

      // x=0.5 居中，半径 0.075（相对于归一化坐标）
      data.push(0.5, balls[i].y, 0.075)
    }

    gl.viewport(0, 0, canvas.width, canvas.height)
    gl.clearColor(0.0, 0.0, 0.0, 1.0)
    gl.clear(gl.COLOR_BUFFER_BIT)

    gl.uniform2f(uResolution, canvas.width, canvas.height)
    gl.uniform3fv(uMetaBalls, new Float32Array(data))
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)

    requestAnimationFrame(draw)
  }

  draw()
}
</script>

<template>
  <WebGLExampleScene @ready="onReady" />
</template>
