<template>
  <ExampleScene
    camera="perspective"
    :camera-position="[5, 5, 12]"
    alpha
    antialias
    @ready="onReady"
  />
</template>

<script setup lang="ts">
import * as THREE from 'three'
import * as TWEEN from "@tweenjs/tween.js";
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
  controls.dampingFactor = 0.01
  
  scene.add(new THREE.AxesHelper(1000))
  
  let particles: any = null
  let particleSystem: any = null;
  
  createParticleAnimation1()
  createParticleAnimation2()
  
  ctx.addUpdateCallback(() => {
    TWEEN.update();
        particleSystem && (particleSystem.rotation.y += 0.2)
  })
  
  function createParticleAnimation1() {
      // 创建粒子
      const particlesGeometry = new THREE.BufferGeometry();
      const count = 3000;
      const positions = new Float32Array(count * 3);
      const colors = new Float32Array(count * 3);
      for (let i = 0; i < count; i += 3) {
          positions[i] = THREE.MathUtils.randFloat(-4, 4);
          positions[i + 1] = THREE.MathUtils.randFloat(-4, 4);
          positions[i + 2] = THREE.MathUtils.randFloat(5, 10);
  
          colors[i] = 253;
          colors[i + 1] = 253;
          colors[i + 2] = 0.2;
      }
  
      particlesGeometry.setAttribute(
          "position",
          new THREE.BufferAttribute(positions, 3)
      );
      particlesGeometry.setAttribute(
          "color",
          new THREE.BufferAttribute(colors, 3)
      );
  
      const particleTexture = new THREE.TextureLoader().load(props.example?.globals?.HOST + '/files/images/particle.jpg');
      const pointMaterial = new THREE.PointsMaterial({
          size: 0.1,
          sizeAttenuation: true,
          transparent: true,
          opacity: 1,
          map: particleTexture,
          alphaMap: particleTexture,
          alphaTest: 0.001,
          blending: THREE.AdditiveBlending,
          vertexColors: true,
      });
  
      particles = new THREE.Points(particlesGeometry, pointMaterial);
      scene.add(particles);
  
      const particleStartPositions = particlesGeometry.getAttribute("position");
      for (let i = 0; i < particleStartPositions.count; i++) {
          const tween = new TWEEN.Tween(positions);
          tween.to(
              {
                  [i * 3]: 0,
                  [i * 3 + 1]: 0,
                  [i * 3 + 2]: 0,
              },
              5000 * Math.random()
          );
  
          tween.easing(TWEEN.Easing.Exponential.In);
          tween.delay(2000);
          tween.onUpdate(() => {
              particleStartPositions.needsUpdate = true;
          })
  
          tween.start();
      }
  }
  
  function createParticleAnimation2() {
      // 创建粒子系统
      const particleCount = 2000; // 粒子数量
      const particles = new THREE.BufferGeometry();
      const particleTexture = new THREE.TextureLoader().load(props.example?.globals?.HOST + '/files/images/particle.jpg');
      const pointMaterial = new THREE.PointsMaterial({
          size: 0.1,
          sizeAttenuation: true,
          transparent: true,
          opacity: 0,
          map: particleTexture,
          alphaMap: particleTexture,
          alphaTest: 0.001,
          blending: THREE.AdditiveBlending,
          vertexColors: true,
      });
  
      const cubeWidth = 0.5;
      const cubeHeight = 2;
      const positions = new Float32Array(particleCount * 3);
      const colors = new Float32Array(particleCount * 3);
      for (let i = 0; i < particleCount; i += 3) {
          const angle = Math.random() * Math.PI * 2;
          const radius = Math.random() * cubeWidth;
  
          // 根据圆柱体的位置、半径和高度计算粒子的位置
          const x = Math.cos(angle) * radius;
          const y = THREE.MathUtils.randFloat(-cubeHeight / 2, cubeHeight / 2);
          const z = Math.sin(angle) * radius;
  
          positions[i] = x;
          positions[i + 1] = y;
          positions[i + 2] = z;
  
          colors[i] = 253;
          colors[i + 1] = 253;
          colors[i + 2] = 0.2;
      }
  
      particles.setAttribute("position", new THREE.BufferAttribute(positions, 3));
      particles.setAttribute("color", new THREE.BufferAttribute(colors, 3));
  
      // 创建粒子系统对象
      const initVec = new THREE.Vector3(0, 0, 0);
      particleSystem = new THREE.Points(particles, pointMaterial);
      particleSystem.position.copy(initVec);
      scene.add(particleSystem);
      const tween = new TWEEN.Tween(pointMaterial);
      tween
          .to({ opacity: 1 }, 4 * 1000)
          .delay(2000)
          .onUpdate(() => {
              pointMaterial.needsUpdate = true;
          })
          .onComplete(() => {
              const tweenOut = new TWEEN.Tween(pointMaterial)
                  .to({ opacity: 0 }, 2 * 1000)
                  .onUpdate(() => {
                      pointMaterial.needsUpdate = true;
                  })
                  .onComplete(() => {
                      scene.remove(particleSystem);
                      if (particles) scene.remove(particles);
                  });
  
              tweenOut.start();
          });
      tween.start();
  }
}
</script>
