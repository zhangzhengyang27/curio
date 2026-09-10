<template>
  <ExampleScene
    camera="perspective"
    :camera-position="[0, 10, 50]"
    alpha
    antialias
    custom-render
    @ready="onReady"
  />
</template>

<script setup>
import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { BloomPass } from 'three/examples/jsm/postprocessing/BloomPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';
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

  class Base {
      initThree(el) {
          this.container = el;
          
          
          // renderer.domElement already managed by ExampleScene
          
          
          
          this.animate();
          window.addEventListener('resize', this.onResize.bind(this));
      }
      animate() {
          
          requestAnimationFrame(this.animate.bind(this));
      }
      onResize() {
          if (this.container) {
              camera.aspect = this.container.offsetWidth / this.container.offsetHeight;
              camera.updateProjectionMatrix();
              
          }
      }
  }
  
  class Road extends Base {
      constructor() {
          super();
          this.speed = 0.005;
      }
      animate() {
          if (this.materials) {
              this.materials.forEach((m) => {
                  m.uniforms.uTime.value += this.speed;
                  if (m.uniforms.uTime.value > 1) {
                      m.uniforms.uTime.value = 0;
                  }
              })
          }
          if (this.composer) {
              renderer.autoClear = false;
              renderer.clear();
              this.normalObj.visible = false;
              this.composer.render();
              renderer.clearDepth();
              this.normalObj.visible = true;
          }
          
          this.threeAnim = requestAnimationFrame(this.animate.bind(this));
      }
      initBloom() {
          const params = {
              threshold: 0,
              strength: 0.5,
              radius: 0.5,
              exposure: 0.5
          };
          const renderScene = new RenderPass(scene, camera);
          const bloomPass = new BloomPass(5, 20, 100);
          bloomPass.threshold = params.threshold;
          bloomPass.strength = params.strength;
          bloomPass.radius = params.radius;
          const composer = new EffectComposer(renderer);
          composer.addPass(renderScene);
          composer.addPass(bloomPass);
          composer.addPass(new OutputPass());
          this.composer = composer;
      }
      createChart(that) {
          this.initBloom();
          const commonUniforms = {
              uFade: { value: new THREE.Vector2(0, 0.6) },
              uOffset: { value: new THREE.Vector2(40, 20) }
          };
          const vertexMoveHeight = `
            float getMove(float u, float offset) {
              float a = u * PI * 2.0;
              return sin(a + PI * 0.25) * u * offset;
            }
            float getHeight(float u, float offset) {
              float a = u * PI * 3.0;
              return cos(a) * u * offset;
            }
          `;
          const spline = new THREE.LineCurve3(
              new THREE.Vector3(0, 0, that.height * 0.25),
              new THREE.Vector3(0, 0, -that.height * 0.75)
          );
          const geometry = new THREE.TubeGeometry(spline, that.height, that.lineWidth, 8, false);
  
          const vertexShader = `
        float PI = acos(-1.0);
        uniform vec2 uOffset;
        varying vec2 vUv;
        ${vertexMoveHeight}
        void main(void) {
          vUv = uv;
          float m = getMove(uv.x, uOffset.x);
          float h = getHeight(uv.x, uOffset.y);
          vec3 newPosition = position;
          newPosition.x += m;
          newPosition.y += h;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(newPosition, 1.0);
        }
      `;
  
          const fragmentShader = `
        varying vec2 vUv;
        uniform float uSpeed;
        uniform float uTime;
        uniform vec2 uFade;
        uniform vec3 uColor;
        uniform float uDirection;
        void main() {
          vec3 color = uColor;
          float s = -uTime * uSpeed;
          float v = (uDirection == 1.0) ? vUv.x : -vUv.x;
          float d = mod(v + s, 1.0);
          if (d > uFade.y) discard;
          else {
            float alpha = smoothstep(uFade.x, uFade.y, d);
            if (alpha < 0.0001) discard;
            gl_FragColor = vec4(color, alpha);
          }
        }
      `;
  
          const materials = [];
          const amount = that.amount;
          const step = (that.width - that.gap) / amount;
  
          for (let i = 0; i < amount; i++) {
              const color = new THREE.Color();
              const v = i / amount;
              color.setHSL(
                  THREE.MathUtils.lerp(that.hueStart, that.hueEnd, v),
                  1,
                  THREE.MathUtils.lerp(that.lightStart, that.lightEnd, v)
              );
  
              const material = new THREE.ShaderMaterial({
                  side: THREE.DoubleSide,
                  transparent: true,
                  uniforms: {
                      uColor: { value: color },
                      uTime: { value: THREE.MathUtils.lerp(-1, 1, Math.random()) },
                      uDirection: { value: i < amount * 0.5 ? 1 : 0 },
                      uSpeed: { value: THREE.MathUtils.lerp(1, 1.5, Math.random()) },
                      ...commonUniforms
                  },
                  vertexShader,
                  fragmentShader
              });
  
              materials.push(material);
  
              const mesh = new THREE.Mesh(geometry, material);
              mesh.position.x = i * step + (i > amount * 0.5 - 1 ? that.gap : 0);
              mesh.position.y = Math.random() * 5;
              scene.add(mesh);
          }
  
          this.materials = materials;
  
          const planeGeometry = new THREE.PlaneGeometry(
              that.width,
              that.height,
              that.width * 0.25,
              that.height * 0.25
          );
  
          const planeMaterial = new THREE.ShaderMaterial({
              side: THREE.DoubleSide,
              transparent: true,
              uniforms: {
                  uColor: { value: new THREE.Color('blue') },
                  ...commonUniforms
              },
              vertexShader: `
          float PI = acos(-1.0);
          uniform vec2 uOffset;
          ${vertexMoveHeight}
          void main(void) {
            float m = getMove(uv.y, uOffset.x);
            float h = getHeight(uv.y, uOffset.y);
            vec3 newPosition = position;
            newPosition.x += m;
            newPosition.z += h;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(newPosition, 1.0);
          }
        `,
              fragmentShader: `
          uniform vec3 uColor;
          void main() {
            gl_FragColor = vec4(uColor, 0.6);
          }
        `
          });
  
          this.planeMat = planeMaterial;
  
          const plane = new THREE.Mesh(planeGeometry, planeMaterial);
          plane.rotateX(-Math.PI * 0.5);
          plane.position.set(that.width * 0.5, -1, -that.height * 0.25);
          this.normalObj = plane;
          scene.add(plane);
      }
  }
  
  var road = new Road();
  road.initThree(ctx.container);
  road.createChart({
      lineWidth: 0.5,
      width: 48,
      height: 400,
      gap: 8,
      amount: 20,
      hueStart: 0.9,
      hueEnd: 0.1,
      lightStart: 0.5,
      lightEnd: 1.0
  });
}
</script>
