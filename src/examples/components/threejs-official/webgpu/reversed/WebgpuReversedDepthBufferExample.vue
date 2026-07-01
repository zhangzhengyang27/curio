<template>
  <WebGPUExampleScene
    camera="perspective"
    :camera-options="{ fov: 72, near: 5, far: 9999 }"
    @ready="onReady">
    <template #default>
      <div class="example-info" v-html="infoHtml" />
    </template>
  </WebGPUExampleScene>
</template>

<script setup>
import WebGPUExampleScene from '@/examples/components/WebGPUExampleScene.vue'
import * as THREE from 'three/webgpu';
import { pass } from 'three/tsl';

const props = defineProps({
  example: {
    type: Object,
    default: () => ({})
  }
})

const infoHtml = "<a href=\"https://threejs.org/\" target=\"_blank\" rel=\"noopener\" class=\"logo-link\"></a>\n\n\t\t\t<div class=\"title-wrapper\">\n\t\t\t\t<a href=\"https://threejs.org/\" target=\"_blank\" rel=\"noopener\">three.js</a><span>Reverse Depth Buffer</span>"
async function onReady(__stage) {
  let scene = __stage.scene
  let camera = __stage.camera
  const renderer = __stage.renderer
  const controls = __stage.controls

  
  
  
  			let reversedCamera;
  			let normalRenderer, logarithmicRenderer, reverseRenderer;
  			let normalRenderPipeline, logarithmicRenderPipeline, reverseRenderPipeline;
  			const meshes = [];
  
  			init().then( animate );
  
  			async 
  
  
  				
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
  				normalRenderer = new THREE.WebGPURenderer();
  				normalRenderer.setPixelRatio( window.devicePixelRatio );
  				normalRenderer.setSize( 0.33 * (__stage.container?.clientWidth || window.innerWidth), (__stage.container?.clientHeight || window.innerHeight) );
  				normalRenderer.domElement.style.position = 'relative';
  				normalContainer.appendChild( normalRenderer.domElement );
  
  				const logarithmicContainer = document.getElementById( 'container_logarithmic' );
  				logarithmicRenderer = new THREE.WebGPURenderer( { logarithmicDepthBuffer: true } );
  				logarithmicRenderer.setPixelRatio( window.devicePixelRatio );
  				logarithmicRenderer.setSize( 0.33 * (__stage.container?.clientWidth || window.innerWidth), (__stage.container?.clientHeight || window.innerHeight) );
  				logarithmicRenderer.domElement.style.position = 'relative';
  				logarithmicContainer.appendChild( logarithmicRenderer.domElement );
  
  				const reverseContainer = document.getElementById( 'container_reverse' );
  				reverseRenderer = new THREE.WebGPURenderer( { reversedDepthBuffer: true } );
  				reverseRenderer.setPixelRatio( window.devicePixelRatio );
  				reverseRenderer.setSize( 0.33 * (__stage.container?.clientWidth || window.innerWidth), (__stage.container?.clientHeight || window.innerHeight) );
  				reverseRenderer.domElement.style.position = 'relative';
  				reverseContainer.appendChild( reverseRenderer.domElement );
  
  				//
  
  				normalRenderPipeline = new THREE.RenderPipeline( normalRenderer );
  				normalRenderPipeline.outputNode = pass( scene, camera );
  
  				logarithmicRenderPipeline = new THREE.RenderPipeline( logarithmicRenderer );
  				logarithmicRenderPipeline.outputNode = pass( scene, camera );
  
  				reverseRenderPipeline = new THREE.RenderPipeline( reverseRenderer );
  				reverseRenderPipeline.outputNode = pass( scene, reversedCamera );
  
  				await Promise.all( [ normalRenderer.init(), logarithmicRenderer.init(), reverseRenderer.init() ] );
  
  				
  				onWindowResize();
  
  			
  
  
  			__stage.addUpdateCallback((_delta, _elapsed) => {
    const now = performance.now() / 1000;
    				for ( let i = 0; i < meshes.length; i ++ ) {
    					const angle = THREE.MathUtils.degToRad( 30 );
    					const axis = new THREE.Vector3( Math.sin( now ), Math.cos( now ), 0 );
    					meshes[ i ].quaternion.setFromAxisAngle( axis, angle );
    				}
    {
    normalRenderPipeline.render();
    				logarithmicRenderPipeline.render();
    				reverseRenderPipeline.render();
    }
  })
  
  			function render() {
  
  				normalRenderPipeline.render();
  				logarithmicRenderPipeline.render();
  				reverseRenderPipeline.render();
  
  			}
  
  			
  		
}
</script>
