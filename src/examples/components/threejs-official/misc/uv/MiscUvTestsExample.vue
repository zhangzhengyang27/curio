<template>
  <div
    ref="containerRef"
    class="uv-tests-container"
  />
</template>

<script setup>
import { ref, onMounted } from 'vue'
import * as THREE from 'three'
import { UVsDebug } from 'three/examples/jsm/utils/UVsDebug.js'

const containerRef = ref(null)

function test(container, name, geometry) {
  const d = document.createElement('div')
  d.innerHTML = '<h3>' + name + '</h3>'
  d.appendChild(UVsDebug(geometry))
  container.appendChild(d)
}

onMounted(() => {
  if (!containerRef.value) return

  const points = []
  for (let i = 0; i < 10; i++) {
    points.push(new THREE.Vector2(Math.sin(i * 0.2) * 15 + 50, (i - 5) * 2))
  }

  const container = containerRef.value
  test(container, 'new THREE.PlaneGeometry( 100, 100, 4, 4 )', new THREE.PlaneGeometry(100, 100, 4, 4))
  test(container, 'new THREE.SphereGeometry( 75, 12, 6 )', new THREE.SphereGeometry(75, 12, 6))
  test(container, 'new THREE.IcosahedronGeometry( 30, 1 )', new THREE.IcosahedronGeometry(30, 1))
  test(container, 'new THREE.OctahedronGeometry( 30, 2 )', new THREE.OctahedronGeometry(30, 2))
  test(container, 'new THREE.CylinderGeometry( 25, 75, 100, 10, 5 )', new THREE.CylinderGeometry(25, 75, 100, 10, 5))
  test(container, 'new THREE.BoxGeometry( 100, 100, 100, 4, 4, 4 )', new THREE.BoxGeometry(100, 100, 100, 4, 4, 4))
  test(container, 'new THREE.LatheGeometry( points, 8 )', new THREE.LatheGeometry(points, 8))
  test(container, 'new THREE.TorusGeometry( 50, 20, 8, 8 )', new THREE.TorusGeometry(50, 20, 8, 8))
  test(container, 'new THREE.TorusKnotGeometry( 50, 10, 12, 6 )', new THREE.TorusKnotGeometry(50, 10, 12, 6))
})
</script>

<style scoped>
.uv-tests-container {
  width: 100%;
  height: 100%;
  overflow: auto;
  background: #ffffff;
  color: #000000;
  text-align: center;
  font-family: sans-serif;
}

.uv-tests-container :deep(h3) {
  margin-top: 60px;
  margin-bottom: 30px;
  font-weight: normal;
}

.uv-tests-container :deep(canvas) {
  width: 100%;
  max-width: 512px;
}
</style>
