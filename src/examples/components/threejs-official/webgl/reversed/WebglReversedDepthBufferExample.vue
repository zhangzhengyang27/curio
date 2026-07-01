<template>
  <ExampleScene
    camera="perspective"
    :camera-options="{ fov: 72, near: 5, far: 9999 }"
    custom-render
    @ready="onReady">
    <template #default>
      <div class="example-info" v-html="infoHtml" />
    </template>
  </ExampleScene>
</template>

<script setup>
import ExampleScene from '@/examples/components/ExampleScene.vue'
import * as THREE from 'three';
import Stats from 'three/examples/jsm/libs/stats.module.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';

const props = defineProps({
  example: {
    type: Object,
    default: () => ({})
  }
})

const infoHtml = "<a href=\"https://threejs.org\" target=\"_blank\" rel=\"noopener\">three.js</a> - reverse depth buffer<br/>"
function onReady(__stage) {
  let scene = __stage.scene
  let camera = __stage.camera
  const renderer = __stage.renderer
  const controls = __stage.controls

  
  			// https://webgpu.github.io/webgpu-samples/?sample=reversedZ
  
  
  			let stats, reversedCamera;
  			let normalRenderer, logarithmicRenderer, reverseRenderer;
  			let normalComposer, logarithmicComposer, reverseComposer;
  			const meshes = [];
  
  			const renderTarget = new THREE.WebGLRenderTarget();
  			renderTarget.depthTexture = new THREE.DepthTexture();
  			renderTarget.depthTexture.type = THREE.FloatType;
  
  				const container = document.getElementById( 'container' );
  
  				stats = new Stats();
  				__stage.overlay?.appendChild(stats.dom)
  
  				
  				camera.position.z = 12;
  
  				reversedCamera = camera.clone();
  
  				
  
  				const xCount = 1;
  				const yCount = 5;
  				const numInstances = xCount * yCount;
  
  				const d = 0.0001; // half distance between two planes
  				const o = 0.5; // half x offset to shift planes so they are only partially overlapping
  
  				const positions = new Float32Array( [
  					- 1 - o, - 1, d,
  					1 - o, - 1, d,
  					- 1 - o, 1, d,
  					1 - o, - 1, d,
  					1 - o, 1, d,
  					- 1 - o, 1, d,
  
  					- 1 + o, - 1, - d,
  					1 + o, - 1, - d,
  					- 1 + o, 1, - d,
  					1 + o, - 1, - d,
  					1 + o, 1, - d,
  					- 1 + o, 1, - d,
  				] );
  
  				const colors = new Float32Array( [
  					1, 0, 0,
  					1, 0, 0,
  					1, 0, 0,
  					1, 0, 0,
  					1, 0, 0,
  					1, 0, 0,
  
  					0, 1, 0,
  					0, 1, 0,
  					0, 1, 0,
  					0, 1, 0,
  					0, 1, 0,
  					0, 1, 0,
  				] );
  
  				const geometry = new THREE.BufferGeometry();
  				geometry.setAttribute( 'position', new THREE.BufferAttribute( positions, 3 ) );
  				geometry.setAttribute( 'color', new THREE.BufferAttribute( colors, 3 ) );
  
  				const material = new THREE.MeshBasicMaterial( { vertexColors: true } );
  
  				for ( let i = 0; i < numInstances; i ++ ) {
  
  					const mesh = new THREE.Mesh( geometry, material );
  					meshes.push( mesh );
  					scene.add( mesh );
  
  				}
  
  				let i = 0;
  				for ( let x = 0; x < xCount; x ++ ) {
  
  					for ( let y = 0; y < yCount; y ++ ) {
  
  						const z = - 800 * i;
  						const s = 1 + 50 * i;
  
  						const mesh = meshes[ i ];
  						mesh.position.set(
  							x - xCount / 2 + 0.5,
  							( 4.0 - 0.2 * z ) * ( y - yCount / 2 + 1.0 ),
  							z
  						);
  						mesh.scale.setScalar( s );
  
  						i ++;
  
  					}
  
  				}
  
  				const normalContainer = document.getElementById( 'container_normal' );
  				normalRenderer = new THREE.WebGLRenderer();
  				normalRenderer.setPixelRatio( window.devicePixelRatio );
  				normalRenderer.setSize( 0.33 * (__stage.container?.clientWidth || window.innerWidth), (__stage.container?.clientHeight || window.innerHeight) );
  				normalRenderer.domElement.style.position = 'relative';
  				normalContainer.appendChild( normalRenderer.domElement );
  
  				normalComposer = new EffectComposer( normalRenderer, renderTarget );
  				normalComposer.addPass( new RenderPass( scene, camera ) );
  				normalComposer.addPass( new OutputPass() );
  
  				const logarithmicContainer = document.getElementById( 'container_logarithmic' );
  				logarithmicRenderer = new THREE.WebGLRenderer( { logarithmicDepthBuffer: true } );
  				logarithmicRenderer.setPixelRatio( window.devicePixelRatio );
  				logarithmicRenderer.setSize( 0.33 * (__stage.container?.clientWidth || window.innerWidth), (__stage.container?.clientHeight || window.innerHeight) );
  				logarithmicRenderer.domElement.style.position = 'relative';
  				logarithmicContainer.appendChild( logarithmicRenderer.domElement );
  
  				logarithmicComposer = new EffectComposer( logarithmicRenderer, renderTarget );
  				logarithmicComposer.addPass( new RenderPass( scene, camera ) );
  				logarithmicComposer.addPass( new OutputPass() );
  
  				const reverseContainer = document.getElementById( 'container_reverse' );
  				reverseRenderer = new THREE.WebGLRenderer( { reversedDepthBuffer: true } );
  				reverseRenderer.setPixelRatio( window.devicePixelRatio );
  				reverseRenderer.setSize( 0.33 * (__stage.container?.clientWidth || window.innerWidth), (__stage.container?.clientHeight || window.innerHeight) );
  				reverseRenderer.domElement.style.position = 'relative';
  				reverseContainer.appendChild( reverseRenderer.domElement );
  
  				reverseComposer = new EffectComposer( reverseRenderer, renderTarget );
  				reverseComposer.addPass( new RenderPass( scene, reversedCamera ) );
  				reverseComposer.addPass( new OutputPass() );
  
  				
  				onWindowResize();
  
  			
  
  
  			__stage.addUpdateCallback((_delta, _elapsed) => {
    const now = performance.now() / 1000;
    				for ( let i = 0; i < meshes.length; i ++ ) {
    					const angle = THREE.MathUtils.degToRad( 30 );
    					const axis = new THREE.Vector3( Math.sin( now ), Math.cos( now ), 0 );
    					meshes[ i ].quaternion.setFromAxisAngle( axis, angle );
    				}
    {
    normalComposer.render();
    				logarithmicComposer.render();
    				reverseComposer.render();
    				stats.update();
    }
  })
  
  			function render() {
  
  				normalComposer.render();
  				logarithmicComposer.render();
  				reverseComposer.render();
  
  				stats.update();
  
  			}
  
  			
  		
}
</script>
