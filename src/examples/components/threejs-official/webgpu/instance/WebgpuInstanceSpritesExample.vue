<template>
  <WebGPUExampleScene
    camera="perspective"
    :camera-options="{ fov: 55, near: 2, far: 2000 }"
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
import { Inspector } from 'three/examples/jsm/inspector/Inspector.js';
import { uniform, time, instanceIndex, instancedBufferAttribute } from 'three/tsl';

let material: any;


const props = defineProps({
  example: {
    type: Object,
    default: () => ({})
  }
})

const infoHtml = "<a href=\"https://threejs.org/\" target=\"_blank\" rel=\"noopener\" class=\"logo-link\"></a>\n\n\t\t\t<div class=\"title-wrapper\">\n\t\t\t\t<a href=\"https://threejs.org/\" target=\"_blank\" rel=\"noopener\">three.js</a><span>Instanced Sprites</span>"
function onReady(__stage: any) {
  const ASSET_HOST = props.example?.globals?.ASSET_HOST || '/threejs-official/'
  let scene = __stage.scene
  let camera = __stage.camera
  let renderer = __stage.renderer
  const controls = __stage.controls

  
  
  
  
  
  
  
  			let mouseX = 0, mouseY = 0;
  
  			let windowHalfX = (__stage.container?.clientWidth || window.innerWidth) / 2;
  			let windowHalfY = (__stage.container?.clientHeight || window.innerHeight) / 2;
  
  			
  
  
  				
  				camera.position.z = 1000;
  
  				
  				scene.fog = new THREE.FogExp2( 0x000000, 0.001 );
  
  				// positions
  
  				const count = 10000;
  
  				const positions = [];
  
  				for ( let i = 0; i < count; i ++ ) {
  
  					positions.push( 2000 * Math.random() - 1000, 2000 * Math.random() - 1000, 2000 * Math.random() - 1000 );
  
  				}
  
  				const positionAttribute = new THREE.InstancedBufferAttribute( new Float32Array( positions ), 3 );
  
  				// texture
  
  				const map = new THREE.TextureLoader().load( ASSET_HOST + 'textures/sprites/snowflake1.png' );
  				map.colorSpace = THREE.SRGBColorSpace;
  
  				// material
  
  				material = new THREE.SpriteNodeMaterial( { sizeAttenuation: true, map, alphaMap: map, alphaTest: 0.1 } );
  				material.color.setHSL( 1.0, 0.3, 0.7, THREE.SRGBColorSpace );
  				material.positionNode = instancedBufferAttribute( positionAttribute );
  				material.rotationNode = time.add( instanceIndex ).sin();
  				material.scaleNode = uniform( 15 );
  
  				// sprites
  
  				const particles = new THREE.Sprite( material );
  				particles.count = count;
  
  				scene.add( particles );
  
  				//
  
  				
  
  
  				renderer.inspector = new Inspector();
  
  
  				//
  
  				const gui = renderer.inspector.createParameters( 'Settings' );
  
  				gui.add( material, 'sizeAttenuation' ).onChange( function () {
  
  					material.needsUpdate = true;
  					material.scaleNode.value = material.sizeAttenuation ? 15 : 0.03;
  			
  				} );
  
  				//
  
  				document.body.style.touchAction = 'none';
  				document.body.addEventListener( 'pointermove', onPointerMove );
  
  				//
  
  				
  
  			
  
  
  			
  
  			function onPointerMove( event: any ) {
  
  				if ( event.isPrimary === false ) return;
  
  				mouseX = event.clientX - windowHalfX;
  				mouseY = event.clientY - windowHalfY;
  
  			}
  
  			//
  
  			__stage.addUpdateCallback((_delta: any, _elapsed: any) => {
    {
    const time = Date.now() * 0.00005;
    				camera.position.x += ( mouseX - camera.position.x ) * 0.05;
    				camera.position.y += ( - mouseY - camera.position.y ) * 0.05;
    				const h = ( 360 * ( 1.0 + time ) % 360 ) / 360;
    				material.color.setHSL( h, 0.5, 0.5 );
    }
  })
  
  			function render() {
  
  				const time = Date.now() * 0.00005;
  
  				camera.position.x += ( mouseX - camera.position.x ) * 0.05;
  				camera.position.y += ( - mouseY - camera.position.y ) * 0.05;
  
  
  
  				const h = ( 360 * ( 1.0 + time ) % 360 ) / 360;
  				material.color.setHSL( h, 0.5, 0.5 );
  
  
  
  			}
  
  		
}
</script>
