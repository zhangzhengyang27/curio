<template>
  <ExampleScene
    camera="perspective"
    :camera-position="[0, 0, 50]"
    alpha
    antialias
    @ready="onReady"
  />
</template>

<script setup>
import * as THREE from 'three'
import { GUI } from "three/examples/jsm/libs/lil-gui.module.min.js";
import ExampleScene from '@/examples/components/ExampleScene.vue'

const props = defineProps({
  example: {
    type: Object,
    default: () => ({})
  }
})

function onReady(ctx) {
  const scene = ctx.scene
  const camera = ctx.camera
  const renderer = ctx.renderer
  const controls = ctx.controls

  controls.enableDamping = true
  
  const uniforms = {
      color: { value: new THREE.Color(0xffffff * Math.random()) },
      uvScale: { value: 0.1 },
      intensity: { value: 3 }
  }
  
  const material = new THREE.ShaderMaterial({
      vertexShader: `
      varying vec2 vUv;
      void main() {
        vUv = uv; 
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
      fragmentShader: `
      varying vec2 vUv;
      uniform vec3 color;
      uniform float uvScale;
      uniform float intensity;
      void main() {
        vec2 uv = vUv * uvScale;
        float distance = length(uv);
        float alpha = smoothstep(0.0, 1., distance);
        gl_FragColor = vec4(color * intensity, alpha);
      }
    `,
      transparent: true,
      side: THREE.DoubleSide,
      uniforms: uniforms
  
  });
  
  const gui = new GUI()
  gui.addColor(material.uniforms.color, 'value').name('color')
  gui.add(material.uniforms.intensity, 'value').min(0).max(10).name('intensity')
  gui.add(material.uniforms.uvScale, 'value').min(0).max(1).name('uvScale')
  
  // 通过点绘制成一个五角星
  function createStarShape(radiusOuter, radiusInner, points) {
      const shape = new THREE.Shape();
      const angleStep = (Math.PI * 2) / points;
  
      for (let i = 0; i < points; i++) {
          const angleOuter = i * angleStep; // 外点的角度
          const angleInner = angleOuter + angleStep / 2; // 内点的角度
  
          const xOuter = Math.cos(angleOuter) * radiusOuter;
          const yOuter = Math.sin(angleOuter) * radiusOuter;
          const xInner = Math.cos(angleInner) * radiusInner;
          const yInner = Math.sin(angleInner) * radiusInner;
  
          if (i === 0) {
              shape.moveTo(xOuter, yOuter); // 第一个点
          } else {
              shape.lineTo(xOuter, yOuter); // 连接到外点
          }
          shape.lineTo(xInner, yInner); // 连接到内点
      }
  
      shape.closePath(); // 闭合形状
  
      return shape;
  }
  
  const starShape = createStarShape(5, 2, 5);
  
  const starGeometry = new THREE.ShapeGeometry(starShape);
  
  const star = new THREE.Mesh(starGeometry, material);
  
  star.position.y += 10;
  
  scene.add(star)
  
  // 随机绘制成 4，5，6，7，8 边形
  function createPolygonShape(radius, points) {
  
      const shape = new THREE.Shape();
  
      const angleStep = (Math.PI * 2) / points;
  
      for (let i = 0; i < points; i++) {
  
          const angle = i * angleStep;
  
          const x = Math.cos(angle) * radius;
  
          const y = Math.sin(angle) * radius;
  
          if (i === 0) {
  
              shape.moveTo(x, y);
  
          } else {
  
              shape.lineTo(x, y);
  
          }
  
      }
  
      shape.closePath();
  
      return shape;
  
  }
  
  const polygonGeometries = [4, 5, 6, 7, 8].map(points => {
  
      const shape = createPolygonShape(5, points);
  
      return new THREE.ShapeGeometry(shape);
  
  });
  
  const polygons = polygonGeometries.map(geometry => {
  
      const m = new THREE.ShaderMaterial({
          vertexShader: material.vertexShader,
          fragmentShader: material.fragmentShader,
          transparent: true,
          side: THREE.DoubleSide,
          uniforms: {
              ...uniforms,
              color: {
                  value: new THREE.Color(0xffffff * Math.random())
              }
          }
      })
  
      return new THREE.Mesh(geometry, m)
  
  })
  
  polygons.forEach((polygon, index) => {
  
      polygon.position.x = (index - 2) * 10;
  
      scene.add(polygon);
  
  });
  
  scene.background = new THREE.CubeTextureLoader().load([0, 1, 2, 3, 4, 5].map(k => ('https://z2586300277.github.io/three-editor/dist/files/scene/skyBox0/' + (k + 1) + '.png')));
}
</script>
