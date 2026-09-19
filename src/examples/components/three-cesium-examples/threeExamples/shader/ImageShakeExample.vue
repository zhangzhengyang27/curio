<template>
  <ExampleScene
    camera="perspective"
    :clear-color="0x000000"
    antialias
    @ready="onReady"
  />
</template>

<script setup lang="ts">
import * as THREE from 'three';
import { TrackballControls } from 'three/examples/jsm/controls/TrackballControls.js';
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

  var shaderUniforms: any, shaderAttributes;
  
  var particles: any[] = [];
  var particleSystem;
  
  var imageWidth = 640;
  var imageHeight = 400;
  var imageData: any = null;
  var animationTime = 0;
  var animationDelta = 0.005;
  
  let trackballControls: any;

  init();
  // tick();

  function init() {
    createScene();
    trackballControls = createControls();
    createPixelData();
  
    
  }
  
  function createScene() {
    camera.position.z = 3000;
  
    scene.add(new THREE.AxesHelper(1000));
    scene.add(new THREE.AmbientLight(0xffffff, 3));
  }
  
  function createControls() {
    const trackballControls = new TrackballControls(camera, renderer.domElement);

    trackballControls.rotateSpeed = 1.0;
    trackballControls.zoomSpeed = 1.2;
    trackballControls.panSpeed = 0.8;

    trackballControls.noZoom = false;
    trackballControls.noPan = true;

    trackballControls.staticMoving = true;
    trackballControls.dynamicDampingFactor = 0.3;

    return trackballControls;
  }
  
  function createPixelData() {
      var image = document.createElement("img");
      var canvas = document.createElement("canvas");
      var context = canvas.getContext("2d")!;
      
      image.crossOrigin = "Anonymous";
      image.onload = function() {
          canvas.width = image.width;
          canvas.height = image.height;
          imageWidth = image.width;
          imageHeight = image.height;
        
        context.fillStyle = context.createPattern(image, 'no-repeat')!;
        context.fillRect(0, 0, imageWidth, imageHeight);
        
        imageData = context.getImageData(0, 0, imageWidth, imageHeight).data;
  
        createPaticles();
  
      };
      
      image.src = props.example?.globals?.HOST + 'files/author/z2586300277.png'
    }
  
    function createPaticles() {
      const weights = [0.2126, 0.7152, 0.0722];
      const zRange = 400;
      let c = 0;
      let x = imageWidth * -0.5;
      let y = imageHeight * 0.5;
      const positions = [];
      const colors = [];

      shaderUniforms = {
        amplitude: {
          type: "f",
          value: 0.5
        },
        vertexColor: {
          type: "c",
          value: []
        }
      };

      const shaderMaterial = new THREE.ShaderMaterial({
          uniforms: shaderUniforms,
          vertexShader: `
            uniform float amplitude;
            attribute vec3 customColor;
            varying vec3 vColor;
            void main() {
              vColor = customColor;
              vec4 pos = vec4(position, 1.0);
              pos.z *= amplitude;
              vec4 mvPosition = modelViewMatrix * pos;
              gl_PointSize = 2.0 * ( 300.0 / -mvPosition.z );
              gl_Position = projectionMatrix * mvPosition;
            }
          `,
          fragmentShader: `
            varying vec3 vColor;
            void main() {
              gl_FragColor = vec4( vColor, 1.0 );
            }
          `,
          vertexColors: true
        });

      for (let i = 0; i < imageHeight; i++) {
        for (let j = 0; j < imageWidth; j++) {
          const color = new THREE.Color();
          color.setRGB(imageData[c] / 255, imageData[c + 1] / 255, imageData[c + 2] / 255);
          const weight = color.r * weights[0] +
            color.g * weights[1] +
            color.b * weights[2];

          const vertex = new THREE.Vector3();
          vertex.x = x;
          vertex.y = y;
          vertex.z = (zRange * -0.5) + (zRange * weight);
          positions.push(vertex.x, vertex.y, vertex.z);
          colors.push(color.r, color.g, color.b);
          c += 4;
          x++;
        }

        x = imageWidth * -0.5;
        y--;
      }

      const geometry = new THREE.BufferGeometry();
      geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
      geometry.setAttribute('customColor', new THREE.Float32BufferAttribute(colors, 3));
      particleSystem = new THREE.Points(geometry, shaderMaterial);
      scene.add(particleSystem);
    }
  
    ctx.addUpdateCallback(() => {
      if (!shaderUniforms) return;
      update();
    })

    function update() {
      shaderUniforms.amplitude.value = Math.sin(animationTime);
      animationTime += animationDelta;
      trackballControls.update();
    }
  
    function onWindowResize() {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
    }
}
</script>
