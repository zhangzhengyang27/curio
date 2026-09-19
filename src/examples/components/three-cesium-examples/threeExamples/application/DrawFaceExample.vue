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
  
  const directionalLight = new THREE.DirectionalLight(0xffffff, 1)
  
  directionalLight.position.set(0, 20, 0)
  
  scene.add(directionalLight, new THREE.AmbientLight(0xffffff, 1))
  
  /* 增加一个面 */
  const plane = new THREE.PlaneGeometry(5, 5)
  
  const material = new THREE.MeshStandardMaterial({ color: 0xffffff })
  
  const planeMesh = new THREE.Mesh(plane, material)
  
  planeMesh.rotation.x -= Math.PI / 2
  
  scene.add(planeMesh)
  
  // 事件
  const raycaster = new THREE.Raycaster()
  
  const getPoint = (event: any) => {
  
    const mouse = new THREE.Vector2(
  
      (event.offsetX / event.target.clientWidth) * 2 - 1,
  
      -(event.offsetY / event.target.clientHeight) * 2 + 1
  
    )
  
    raycaster.setFromCamera(mouse, camera)
  
    const intersects = raycaster.intersectObjects(scene.children)
  
    if (intersects.length > 0) return intersects[0].point
  
  }
  
  const setPointBox = (point: any) => {
  
    const box = new THREE.BoxGeometry(0.04, 0.04, 0.04)
  
    const material = new THREE.MeshStandardMaterial({ color: 0xff0000 })
  
    const boxMesh = new THREE.Mesh(box, material)
  
    boxMesh.position.copy(point)
  
    scene.add(boxMesh)
  
  }
  
  /* 开始绘制 */
  const pointList: any[] = []; let drawMesh: any = null; let stop = false
  
  ctx.container?.addEventListener('contextmenu', () => {
  
    stop = true
  
    const { indexGroup, faceGroup, uvGroup } = multShapeGroup(pointList)
  
    if (drawMesh) updateMultShapePlaneGeometry(drawMesh.geometry, faceGroup, indexGroup, uvGroup)
  
  })
  
  // 移动
  ctx.container?.addEventListener('mousemove', (event: any) => {
  
    if (stop) return
  
    const point = getPoint(event)
  
    if (!point || !drawMesh || pointList.length < 2) return
  
    const { indexGroup, faceGroup, uvGroup } = multShapeGroup([...pointList, point])
  
    updateMultShapePlaneGeometry(drawMesh.geometry, faceGroup, indexGroup, uvGroup)
  
  })
  
  ctx.container?.addEventListener('click', (event: any) => {
  
    const point = getPoint(event)
  
    if (!point || stop) return
  
    setPointBox(point)
  
    point.y += 0.001
  
    pointList.push(point)
  
    const { indexGroup, faceGroup, uvGroup } = multShapeGroup(pointList)
  
    if (pointList.length < 3) return
  
    if (!drawMesh) {
  
      const geometry = multShapePlaneGeometry(faceGroup, indexGroup, uvGroup)
  
      const material = new THREE.MeshStandardMaterial({ color: 0x00ff00, side: THREE.DoubleSide })
  
      drawMesh = new THREE.Mesh(geometry, material)
  
      scene.add(drawMesh)
  
    }
  
    else updateMultShapePlaneGeometry(drawMesh.geometry, faceGroup, indexGroup, uvGroup)
  
  })
  
  /* 处理顶点算法 */
  function multShapeGroup(pList: any) {
  
    const indexGroup = pList.map((_: any, k: any) => (k >= 2) ? [0, k - 1, k] : false).filter((i: any) => i).reduce((i: any, j: any) => [...i, ...j], [])
  
    const faceGroup = pList.reduce((j: any, i: any) => [...j, i.x, i.y, i.z], [])
  
    const uvMaxMin = pList.reduce((p: any, i: any) => ({ x: [...p['x'], i['x']], y: [...p['y'], i['y']], z: [...p['z'], i['z']] }), { x: [], y: [], z: [] })
  
    // vu 点计算 二维面
    const Maxp = new THREE.Vector3(Math.max(...uvMaxMin.x), Math.max(...uvMaxMin.y), Math.max(...uvMaxMin.z))  // 最大点
  
    const Minp = new THREE.Vector3(Math.min(...uvMaxMin.x), Math.min(...uvMaxMin.y), Math.min(...uvMaxMin.z))  // 最小点
  
    const W = Maxp.x - Minp.x
  
    const H = Maxp.y - Minp.y
  
    const L = W > H ? W : H  // 以最大为基准
  
    // 顶点uv计算
    const uvGroup = pList.map((i: any) => new THREE.Vector2((i.x - Minp.x) / L, (i.y - Minp.y) / L)).reduce((i: any, j: any) => [...i, ...j], [])
  
    return { indexGroup, faceGroup, uvGroup }
  
  }
  
  /* 根据顶点组生成物体 */
  function multShapePlaneGeometry(faceGroup: any, indexGroup: any, uvGroup: any) {
  
    const geometry = new THREE.BufferGeometry()
  
    // 因为在两个三角面片里，这两个顶点都需要被用到。
    const vertices = new Float32Array(faceGroup)
  
    // itemSize = 3 因为每个顶点都是一个三元组。
    geometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3))
  
    // 索引组 面
    if (indexGroup) {
  
      // 格式化索引面组
      let indexs = new Uint16Array(indexGroup)
  
      // 添加索引组
      geometry.index = new THREE.BufferAttribute(indexs, 1)
  
    }
  
    // uv 是二维坐标相当于三维物体展开图
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
