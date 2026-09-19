<template>
  <ExampleScene
    camera="perspective"
    :camera-position="[1, 2, 4]"
    @ready="onReady"
  />
</template>

<script setup lang="ts">
import * as THREE from 'three'
import ExampleScene from '../../ExampleScene.vue'

function onReady(ctx: any) {
  const { scene, addUpdateCallback } = ctx

  /* 已知条件 */
  const u = new THREE.Vector3(1, 1, 1).normalize()
  const A = new THREE.Vector3(0.75, 0.4, 0.4)

  const alpha = Math.atan2(u.z, u.y)
  const ca = Math.cos(alpha)
  const sa = Math.sin(alpha)
  const Mx = new THREE.Matrix3().set(
    1, 0, 0,
    0, ca, -sa,
    0, sa, ca
  )
  const u1 = u.clone().applyMatrix3(Mx)
  const beta = -Math.atan2(u1.x, u1.z)
  const cb = Math.cos(beta)
  const sb = Math.sin(beta)
  const My = new THREE.Matrix3().set(
    cb, 0, sb,
    0, 1, 0,
    -sb, 0, cb
  )
  const N = new THREE.Matrix3().multiplyMatrices(My, Mx)
  const Ni = N.clone().transpose()

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
  const trackColors: any[] = []
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

    // 旋转矩阵
    const M = new THREE.Matrix3().set(
      c, -s, 0,
      s, c, 0,
      0, 0, 1
    )
    const rotateMatrix = Ni.clone().multiply(M).multiply(N)

    // 旋转后的位置
    const B = A.clone().applyMatrix3(rotateMatrix)

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
