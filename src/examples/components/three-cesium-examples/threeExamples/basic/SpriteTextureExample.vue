<template>
  <ExampleScene
    camera="perspective"
    :camera-position="[2, 10, 10]"
    alpha
    antialias
    @ready="onReady"
  />
</template>

<script setup>
import * as THREE from 'three'
import ExampleScene from '@/examples/components/ExampleScene.vue'

const props = defineProps({
  example: {
    type: Object,
    default: () => ({})
  }
})

function onReady(stageCtx) {
  const scene = stageCtx.scene
  const camera = stageCtx.camera
  const renderer = stageCtx.renderer
  const controls = stageCtx.controls

  controls.enableDamping = true
  
  scene.add(new THREE.AxesHelper(100))
  
  const canvas = document.createElement('canvas');
const ctx = canvas.getContext("2d");
  
  const devicePixelRatio = window.devicePixelRatio * 4;
  const logicalWidth = 124;
  const logicalHeight = 164;
  
  canvas.width = logicalWidth * devicePixelRatio;
  canvas.height = logicalHeight * devicePixelRatio;
  canvas.style.width = `${logicalWidth}px`;
  canvas.style.height = `${logicalHeight}px`;
  
  ctx.scale(devicePixelRatio, devicePixelRatio);
  
  const img = new Image();
  img.src = props.example?.globals?.HOST + 'files/author/z2586300277.png';
  
  const text = '测试文本';
  
  const setText = () => {
  
      // 画图
      const imglong = 124;
      const left = (logicalWidth - imglong) / 2;
      ctx.drawImage(img, left, 40, imglong, imglong); // 向下移动图片
  
      // 写字
      ctx.fillStyle = '#fff';
      ctx.font = 'Bold 30px Arial';
  
      const textWidth = ctx.measureText(text).width;
      ctx.fillText(text, (logicalWidth - textWidth) / 2, 30); // 放在图片上方
  
      // 纹理图
      const texture = new THREE.CanvasTexture(canvas);
      texture.colorSpace = THREE.SRGBColorSpace;
      texture.needsUpdate = true;
  
      // 纹理生成材质
      const material = new THREE.SpriteMaterial({ map: texture });
  
      // 创建精灵几何体
      const sprite = new THREE.Sprite(material);
      sprite.center = new THREE.Vector2(0.5, 0);
  
      return sprite;
  
  }
  
  img.onload = () => {
  
      for (let i = 0; i < 5; i++) {
  
          const sprite = setText()
  
          sprite.position.set(i, i, i)
  
          scene.add(sprite)
  
      }
  
  }
}
</script>
