<template>
  <ExampleScene
    camera="perspective"
    :camera-position="[0, 3, 3]"
    alpha
    antialias
    @ready="onReady"
  />
</template>

<script setup lang="ts">
import * as THREE from 'three'
import ExampleScene from '@/examples/components/ExampleScene.vue'

const props = defineProps({
  example: {
    type: Object,
    default: () => ({})
  }
})

function onReady(ctx: any) {
  const scene = ctx.scene
  const camera = ctx.camera
  const renderer = ctx.renderer
  const controls = ctx.controls

  controls.enableDamping = true
  
  const plane = new THREE.PlaneGeometry(5, 5)
  
  const material = new THREE.MeshBasicMaterial({ color: 'gray' })
  
  const planeMesh = new THREE.Mesh(plane, material)
  
  planeMesh.rotation.x -= Math.PI / 2
  
  scene.add(planeMesh)
  
  const texture = new THREE.TextureLoader().load(props.example?.globals?.FILE_HOST + 'images/channels/wall_g.png')
  
  texture.wrapT = THREE.RepeatWrapping
  
  texture.repeat.y = 15
  
  ctx.addUpdateCallback(() => {
    texture.offset.y -= 0.005;
  })
  
  // 事件
  const raycaster = new THREE.Raycaster()
  
  const getPoint = (event: any) => {
  
      const mouse = new THREE.Vector2((event.offsetX / event.target.clientWidth) * 2 - 1, -(event.offsetY / event.target.clientHeight) * 2 + 1)
  
      raycaster.setFromCamera(mouse, camera)
  
      const intersects = raycaster.intersectObjects(scene.children)
  
      if (intersects.length > 0) return intersects[0].point
  
  }
  
  /* 开始绘制 */
  const pointList: any[] = []; let drawMesh: any = null; let fenceHeight = 1
  
  ctx.container?.addEventListener('click', (event: any) => {
  
      const point = getPoint(event)
  
      if (!point) return
  
      point.y += 0.001
  
      pointList.push(point)
  
      if (pointList.length < 2) return
  
      const formatPoints = pointList.reduce((i, j) => {
  
          const k = new THREE.Vector3().copy(j)
  
          k.y += fenceHeight
  
          return [...i, k, j]
  
      }, [])
  
      const { indexGroup, faceGroup, uvGroup } = multShapeGroup(formatPoints)
  
      if (!drawMesh) {
  
          const geometry = multShapePlaneGeometry(faceGroup, indexGroup, uvGroup)
  
          const material = new THREE.MeshBasicMaterial({ side: THREE.DoubleSide, map: texture, transparent: true, color: Math.random() * 0xffffff })
  
          drawMesh = new THREE.Mesh(geometry, material)
  
          scene.add(drawMesh)
  
      }
  
      else updateMultShapePlaneGeometry(drawMesh.geometry, faceGroup, indexGroup, uvGroup)
  
  })
  
  /* 处理顶点算法 */
  function multShapeGroup(formatPoints: any) {
  
      const { length } = formatPoints
  
      const indexGroup = formatPoints.map((_: any, k: any) => (k - 1 > -1 && k + 1 < length) && (k % 2 === 0 ? [k, k + 1, k - 1] : [k, k - 1, k + 1])).filter((i: any) => i).reduce((i: any, j: any) => [...i, ...j], [])
  
      const faceGroup = formatPoints.reduce((j: any, i: any) => [...j, i.x, i.y, i.z], [])
  
      const uvMaxMin = formatPoints.reduce((p: any, i: any) => ({ x: [...p['x'], i['x']], y: [...p['y'], i['y']], z: [...p['z'], i['z']] }), { x: [], y: [], z: [] })
  
      const Maxp = new THREE.Vector3(Math.max(...uvMaxMin.x), Math.max(...uvMaxMin.y), Math.max(...uvMaxMin.z))  // 最大点
  
      const Minp = new THREE.Vector3(Math.min(...uvMaxMin.x), Math.min(...uvMaxMin.y), Math.min(...uvMaxMin.z))  // 最小点
  
      const W = Maxp.x - Minp.x
  
      const H = Maxp.y - Minp.y
  
      const L = W > H ? W : H
  
      const uvGroup = formatPoints.map((i: any) => new THREE.Vector2((i.x - Minp.x) / L, (i.y - Minp.y) / L)).reduce((i: any, j: any) => [...i, ...j], [])
  
      return { indexGroup, faceGroup, uvGroup }
  
  }
  
  /* 根据顶点组生成物体 */
  function multShapePlaneGeometry(faceGroup: any, indexGroup: any, uvGroup: any) {
  
      const geometry = new THREE.BufferGeometry()
  
      const vertices = new Float32Array(faceGroup)
  
      geometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3))
  
      if (indexGroup) geometry.index = new THREE.BufferAttribute(new Uint16Array(indexGroup), 1)
  
      if (uvGroup) geometry.attributes.uv = new THREE.Float32BufferAttribute(uvGroup, 2)
  
      geometry.computeVertexNormals()
  
      return geometry
  
  }
  
  /* 更新顶点 */
  function updateMultShapePlaneGeometry(geometry: any, faceGroup: any, indexGroup: any, uvGroup: any) {
  
      geometry.setIndex(indexGroup)
  
      geometry.setAttribute('position', new THREE.Float32BufferAttribute(faceGroup, 3))
  
      geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvGroup, 2))
  
      delete geometry.attributes.normal
  
      geometry.computeVertexNormals()
  
  }
}
</script>
