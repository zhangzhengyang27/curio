<template>
  <ExampleScene
    camera="perspective"
    @ready="onReady"
  />
</template>

<script setup lang="ts">
import * as THREE from "three";
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

  
  
  let mesh: any, uniforms: any, geometry: any;
  let snowMaterial: any;
  const particles = 1000;
  
  init();
  
  function init() {
  	
  
  	
  
  	snowMaterial = new THREE.PointsMaterial({
  		size: 5,
  		blending: THREE.AdditiveBlending,
  		transparent: true,
  	});
  
  	geometry = new THREE.BufferGeometry();
  
  	let positions = new Float32Array(particles * 3);
  
  	for (let i = 0; i < particles * 3; i += 3) {
  		positions[i] = Math.random() * 200 - 100;
  		positions[i + 1] = Math.random() * 200 - 100;
  		positions[i + 2] = Math.random() * 200 - 100;
  	}
  	geometry.setAttribute(
  		"position",
  		new THREE.Float32BufferAttribute(positions, 3)
  	);
  
  	snowMaterial.onBeforeCompile = (shader: any) => {
  		shader.uniforms.uColor = {
  			value: new THREE.Color(0xffffff),
  		};
  
  		shader.fragmentShader = shader.fragmentShader.replace(
  			`#include <common>`,
  			`
                          #include <common>
                              uniform vec3 uColor;
                          `
  		);
  
  		shader.fragmentShader = shader.fragmentShader.replace(
  			`#include <premultiplied_alpha_fragment>`,
  			`
                              #include <premultiplied_alpha_fragment>
                                  float distanceLen = distance(gl_PointCoord,vec2(0.5));
                                  distanceLen = 1.0 - distanceLen;
                                  distanceLen = pow(distanceLen,10.0);
                                  vec4 color = vec4(uColor,distanceLen);
                                  // if(color.a<0.1)
                                  //     discard;
                                  gl_FragColor = color;
                              `
  		);
  	};
  
  	mesh = new THREE.Points(geometry, snowMaterial);
  	scene.add(mesh);
  
  	
  
  	
  
  	
  }
  
  function onWindowResize() {
  	camera.aspect = window.innerWidth / window.innerHeight;
  	camera.updateProjectionMatrix();
  
  }
  
  ctx.addUpdateCallback(() => {
    render();
  })
  
  function update(time?: any, position?: any) {
  	if (snowMaterial) {
  		const positions = mesh.geometry.getAttribute("position").array;
  		for (let i = 0; i < positions.length; i += 3) {
  			positions[i + 1] -= 0.1;
  			positions[i] -= Math.sin(i) * 0.1;
  			positions[i + 2] -= Math.sin(i) * 0.1;
  			if (positions[i + 1] < -100) {
  				positions[i + 1] = 100;
  			}
  		}
  
  		mesh.geometry.getAttribute("position").needsUpdate = true;
  	}
  }
  
  function render() {
  	const time = Date.now() * 0.005;
  	update();
  	// mesh.rotation.z = 0.01 * time;
  
  }
}
</script>
