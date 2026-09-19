<template>
  <WebGPUExampleScene
    camera="perspective"
    antialias
    custom-render
    :camera-options="{ fov: 70, near: 0.1, far: 50 }"
    @ready="onReady"
  >
    <template #default>
      <div
        class="example-info"
        v-html="infoHtml"
      />
    </template>
  </WebGPUExampleScene>
</template>

<script setup lang="ts">
import WebGPUExampleScene from '@/examples/components/WebGPUExampleScene.vue'
import * as THREE from 'three/webgpu';
import { texture } from 'three/tsl';
import { Inspector } from 'three/examples/jsm/inspector/Inspector.js';

const props = defineProps({
  example: {
    type: Object,
    default: () => ({})
  }
})

const infoHtml = "<a href=\"https://threejs.org/\" target=\"_blank\" rel=\"noopener\" class=\"logo-link\"></a>\n\n\t\t\t<div class=\"title-wrapper\">\n\t\t\t\t<a href=\"https://threejs.org/\" target=\"_blank\" rel=\"noopener\">three.js</a><span>Multisampled Renderbuffers</span>"
function onReady(__stage: any) {
  let scene = __stage.scene
  let camera = __stage.camera
  let renderer = __stage.renderer
  const controls = __stage.controls

  
  			const mouse = new THREE.Vector2();
  
  			let quadMesh, renderTarget;
  
  			let box, box2;
  
  			const dpr = 1;
  
  			const params = {
  				animated: true,
  				multisampling: true
  			};
  
  			const mat4 = new THREE.Matrix4();
  
  			const count = 50;
  			const fullRadius = 20; // Radius of the sphere
  			const halfRadius = 10; // Radius of the sphere
  			const positions = new Array( count ).fill( undefined ).map( ( _, i ) => {
  
  				const radius = ( i % 2 === 0 ) ? fullRadius : halfRadius;
  
  				const phi = Math.acos( 2 * Math.random() - 1 ) - Math.PI / 2; // phi: latitude, range -π/2 to π/2
  				const theta = 2 * Math.PI * Math.random(); // theta: longitude, range 0 to 2π
  
  				return new THREE.Vector3(
  					radius * Math.cos( phi ) * Math.cos( theta ), // x
  					radius * Math.sin( phi ), // y
  					radius * Math.cos( phi ) * Math.sin( theta ) // z
  				);
  
  			} );
  
  			
  			initGUI();
  
  			function initGUI() {
  
  				const gui = renderer.inspector.createParameters( 'Settings' );
  				gui.add( params, 'multisampling' );
  				gui.add( params, 'animated' );
  
  			}
  
  			
  
  
  				
  				camera.position.z = 3;
  
  				
  				scene.background = new THREE.Color( 0x111111 );
  
  				// textured mesh
  
  				const geometryBox = new THREE.BoxGeometry( 7, 7, 7, 12, 12, 12 );
  				const materialBox = new THREE.MeshBasicNodeMaterial();
  				const materialBoxInner = new THREE.MeshBasicNodeMaterial( { color: 0xff0000 } );
  
  				materialBox.wireframe = true;
  
  				//
  
  				box = new THREE.InstancedMesh( geometryBox, materialBox, count );
  				box2 = new THREE.InstancedMesh( geometryBox, materialBoxInner, count );
  
  				for ( let i = 0; i < count; i ++ ) {
  
  					box.setMatrixAt( i, mat4.identity().setPosition( positions[ i ] ) );
  					box2.setMatrixAt( i, mat4.multiplyScalar( 0.996 ).setPosition( positions[ i ] ) );
  
  				}
  
  				scene.add( box, box2 );
  
  				//
  
  				
  				renderer.inspector = new Inspector();
  
  
  				renderTarget = new THREE.RenderTarget( (__stage.container?.clientWidth || window.innerWidth) * dpr, (__stage.container?.clientHeight || window.innerHeight) * dpr, {
  					samples: params.multisampling ? 4 : 1,
  					depthBuffer: true,
  				} );
  
  				window.addEventListener( 'mousemove', onWindowMouseMove );
  				
  
  				// FX
  
  				// modulate the final color based on the mouse position
  
  				const materialFX = new THREE.MeshBasicNodeMaterial();
  				materialFX.colorNode = texture( renderTarget.texture ).rgb;
  
  				quadMesh = new THREE.QuadMesh( materialFX );
  
  			
  
  
  			function onWindowMouseMove( e: any ) {
  
  				mouse.x = e.offsetX / (__stage.container?.clientWidth || window.innerWidth);
  				mouse.y = e.offsetY / (__stage.container?.clientHeight || window.innerHeight);
  
  			}
  
  			
  
  			__stage.addUpdateCallback((_delta: any, _elapsed: any) => {
    if ( params.animated ) {
    					box.rotation.x += 0.001;
    					box.rotation.y += 0.002;
    					box2.rotation.x += 0.001;
    					box2.rotation.y += 0.002;
    				}
    				renderTarget.samples = params.multisampling ? 4 : 1;
    				renderer.setRenderTarget( renderTarget );
    				renderer.setRenderTarget( null );
    				quadMesh.render( renderer );
  })
  
  		
}
</script>
