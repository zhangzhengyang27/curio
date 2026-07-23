<template>
  <ExampleScene
    camera="perspective"
    antialias
    :camera-position="[0, 50, 50]"
    :camera-options="{ fov: 45, near: 0.1, far: 100 }"
    @ready="onReady"
  >
    <template #default>
      <div
        class="example-info"
        v-html="infoHtml"
      />
    </template>
  </ExampleScene>
</template>

<script setup>
import { onUnmounted } from 'vue'

let gui = null
import ExampleScene from '@/examples/components/ExampleScene.vue'
import * as THREE from 'three';
import Stats from 'three/examples/jsm/libs/stats.module.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GUI } from 'three/examples/jsm/libs/lil-gui.module.min.js';

const props = defineProps({
  example: {
    type: Object,
    default: () => ({})
  }
})

const infoHtml = "<a href=\"https://threejs.org\" target=\"_blank\" rel=\"noopener\">three.js</a> - Uniform Buffer Objects Arrays"
function onReady(__stage) {
  let scene = __stage.scene
  let camera = __stage.camera
  let renderer = __stage.renderer
  const controls = __stage.controls

  
  
  
  
  			let timer, stats;
  
  			let lightingUniformsGroup, lightCenters;
  
  			const container = document.getElementById( 'container' );
  
  			const pointLightsMax = 300;
  
  			const api = {
  				count: 200,
  			};
  
  			
  
  
  				
  
  
  				
  
  
  				timer = new THREE.Timer();
  				timer.connect( document );
  
  				// geometry
  
  				const geometry = new THREE.SphereGeometry();
  
  				// uniforms groups
  
  				lightingUniformsGroup = new THREE.UniformsGroup();
  				lightingUniformsGroup.setName( 'LightingData' );
  
  				const data = [];
  				const dataColors = [];
  				lightCenters = [];
  
  				for ( let i = 0; i < pointLightsMax; i ++ ) {
  
  					const col = new THREE.Color( 0xffffff * Math.random() ).toArray();
  					const x = Math.random() * 50 - 25;
  					const z = Math.random() * 50 - 25;
  
  					data.push( new THREE.Uniform( new THREE.Vector4( x, 1, z, 0 ) ) ); // light position
  					dataColors.push( new THREE.Uniform( new THREE.Vector4( col[ 0 ], col[ 1 ], col[ 2 ], 0 ) ) ); // light color
  
  					// Store the center positions
  					lightCenters.push( { x, z } );
  
  				}
  
  				lightingUniformsGroup.add( data ); // light position
  				lightingUniformsGroup.add( dataColors ); // light position
  				lightingUniformsGroup.add( new THREE.Uniform( pointLightsMax ) ); // light position
  
  				const cameraUniformsGroup = new THREE.UniformsGroup();
  				cameraUniformsGroup.setName( 'ViewData' );
  				cameraUniformsGroup.add( new THREE.Uniform( camera.projectionMatrix ) ); // projection matrix
  				cameraUniformsGroup.add( new THREE.Uniform( camera.matrixWorldInverse ) ); // view matrix
  
  				const material = new THREE.RawShaderMaterial( {
  					uniforms: {
  						modelMatrix: { value: null },
  						normalMatrix: { value: null }
  					},
  					// uniformsGroups: [ cameraUniformsGroup, lightingUniformsGroup ],
  					name: 'Box',
  					defines: {
  						POINTLIGHTS_MAX: pointLightsMax
  					},
  					vertexShader: document.getElementById( 'vertexShader' ).textContent,
  					fragmentShader: document.getElementById( 'fragmentShader' ).textContent,
  					glslVersion: THREE.GLSL3
  				} );
  
  				const plane = new THREE.Mesh( new THREE.PlaneGeometry( 100, 100 ), material.clone() );
  				plane.material.uniformsGroups = [ cameraUniformsGroup, lightingUniformsGroup ];
  				plane.material.uniforms.modelMatrix.value = plane.matrixWorld;
  				plane.material.uniforms.normalMatrix.value = plane.normalMatrix;
  				plane.rotation.x = - Math.PI / 2;
  				plane.position.y = - 1;
  				scene.add( plane );
  
  				// meshes
  				const gridSize = { x: 10, y: 1, z: 10 };
  				const spacing = 6;
  
  				for ( let i = 0; i < gridSize.x; i ++ ) {
  
  					for ( let j = 0; j < gridSize.y; j ++ ) {
  
  						for ( let k = 0; k < gridSize.z; k ++ ) {
  
  							const mesh = new THREE.Mesh( geometry, material.clone() );
  							mesh.name = 'Sphere';
  							mesh.material.uniformsGroups = [ cameraUniformsGroup, lightingUniformsGroup ];
  							mesh.material.uniforms.modelMatrix.value = mesh.matrixWorld;
  							mesh.material.uniforms.normalMatrix.value = mesh.normalMatrix;
  							scene.add( mesh );
  
  							mesh.position.x = i * spacing - ( gridSize.x * spacing ) / 2;
  							mesh.position.y = 0;
  							mesh.position.z = k * spacing - ( gridSize.z * spacing ) / 2;
  
  						}
  
  					}
  
  				}
  
  				//
  
  				
  
  				window.addEventListener( 'resize', onWindowResize, false );
  
  				// controls
  
  
  				controls.enablePan = false;
  
  				// stats
  
  				stats = new Stats();
  				__stage.overlay?.appendChild(stats.dom)
  
  				// gui
  				gui = new GUI();
  				gui.add( api, 'count', 1, pointLightsMax ).step( 1 ).onChange( function () {
  
  					lightingUniformsGroup.uniforms[ 2 ].value = api.count;
  
  				} );
  
  			
  
  
  			function onWindowResize() {
  
  				camera.aspect = (__stage.container?.clientWidth || window.innerWidth) / (__stage.container?.clientHeight || window.innerHeight);
  				camera.updateProjectionMatrix();
  
  
  
  			}
  
  			//
  
  			__stage.addUpdateCallback((_delta, _elapsed) => {
    timer.update();
    				const elapsedTime = timer.getElapsed();
    				const lights = lightingUniformsGroup.uniforms[ 0 ];
    				// Parameters for circular movement
    				const radius = 5; // Smaller radius for individual circular movements
    				const speed = 0.5; // Speed of rotation
    				// Update each light's position
    				for ( let i = 0; i < lights.length; i ++ ) {
    					const light = lights[ i ];
    					const center = lightCenters[ i ];
    					// Calculate circular movement around the light's center
    					const angle = speed * elapsedTime + i * 0.5; // Phase difference for each light
    					const x = center.x + Math.sin( angle ) * radius;
    					const z = center.z + Math.cos( angle ) * radius;
    					// Update the light's position
    					light.value.set( x, 1, z, 0 );
    				}
    				stats.update();
  })
  
  		
}

onUnmounted(() => {
  gui?.destroy()
})
</script>
