<template>
  <ExampleScene
    camera="perspective"
    :camera-position="[1, 2, 4]"
    @ready="onReady"
  />
</template>

<script setup>
import * as THREE from 'three'
import ExampleScene from '../../ExampleScene.vue'

function onReady(ctx) {
  const { scene, addUpdateCallback } = ctx

  /* 已知条件 */
  const u = new THREE.Vector3(1, 1, 1).normalize()
  const A = new THREE.Vector3(0.75, 0.1, 0.1)
  const OP = u.clone().multiplyScalar(A.dot(u))
  const PA = A.clone().sub(OP)
  const uxA = u.clone().cross(A)

  /* u轴 */
  const lineGeo = new THREE.BufferGeometry()
  lineGeo.setAttribute(
    'position',
    new THREE.Float32BufferAttribute([0, 0, 0, u.x, u.y, u.z], 3)
  )
  lineGeo.setAttribute(
    'color',
    new THREE.Float32BufferAttribute([0, 1, 0, 1, 1, 0], 3)
  )
  const lineMat = new THREE.LineBasicMaterial({ vertexColors: true })
  const line = new THREE.Line(lineGeo, lineMat)
  scene.add(line)

  /* 坐标系 */
  const axes = new THREE.AxesHelper(1)
  const axesColor = new THREE.Color(0x666666)
  axes.setColors(axesColor, axesColor, axesColor)
  scene.add(axes)

  /* 绕u旋转的轨迹 */
  const points = [A.x, A.y, A.z]
  const trackPointNum = 20
  const trackGeo = new THREE.BufferGeometry()
  const trackColors = []
  for (let i = 0; i < trackPointNum; i++) {
    const n = i / trackPointNum
    trackColors.push(1, n, 0)
  }
  trackGeo.setAttribute('color', new THREE.Float32BufferAttribute(trackColors, 3))
  const trackMat = new THREE.LineBasicMaterial({ vertexColors: true })
  const track = new THREE.Line(trackGeo, trackMat)
  scene.add(track)

  /* 时间 */
  const time = new Date().getTime()

  /* 连续旋转 */
  addUpdateCallback(function () {
    // 旋转弧度
    const theta = (new Date().getTime() - time) * 0.006
    const c = Math.cos(theta)
    const s = Math.sin(theta)
    // 旋转后的位置
    const B = OP.clone()
      .add(PA.clone().multiplyScalar(c))
      .add(uxA.clone().multiplyScalar(s))
    // 过滤极小距离点
    if (
      new THREE.Vector3(points[0], points[1], points[2]).sub(B).lengthSq() < 0.001
    ) {
      return
    }
    // 在数组前面添加点
    points.unshift(B.x, B.y, B.z)
    // 删除最后一个点
    const pointsLen = points.length
    if (pointsLen / 3 > trackPointNum) {
      points.splice(pointsLen - 4, pointsLen - 1)
    }
    // 更新position
    trackGeo.setAttribute('position', new THREE.Float32BufferAttribute(points, 3))
  })
}
</script>
