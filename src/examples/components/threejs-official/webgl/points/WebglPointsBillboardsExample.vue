<template>
  <ExampleScene
    camera="perspective"
    :camera-options="{ fov: 55, near: 2, far: 2000 }"
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
import { GUI } from 'three/examples/jsm/libs/lil-gui.module.min.js';

const props = defineProps({
  example: {
    type: Object,
    default: () => ({})
  }
})

const infoHtml = "<a href=\"https://threejs.org\" target=\"_blank\" rel=\"noopener\">three.js</a> - webgl particle billboards example"
function onReady(__stage) {
  const ASSET_HOST = props.example?.globals?.ASSET_HOST || '/threejs-official/'
  let scene = __stage.scene
  let camera = __stage.camera
  let renderer = __stage.renderer
  const controls = __stage.controls

  
  
  
  
  
  			let stats, material;
  			let mouseX = 0, mouseY = 0;
  
  			let windowHalfX = (__stage.container?.clientWidth || window.innerWidth) / 2;
  			let windowHalfY = (__stage.container?.clientHeight || window.innerHeight) / 2;
  
  			
  
  
  				
  				camera.position.z = 1000;
  
  				
  				scene.fog = new THREE.FogExp2( 0x000000, 0.001 );
  
  				const geometry = new THREE.BufferGeometry();
  				const vertices = [];
  
  				const sprite = new THREE.TextureLoader().load( ASSET_HOST + 'textures/sprites/disc.png' );
  				sprite.colorSpace = THREE.SRGBColorSpace;
  
  				for ( let i = 0; i < 10000; i ++ ) {
  
  					const x = 2000 * Math.random() - 1000;
  					const y = 2000 * Math.random() - 1000;
  					const z = 2000 * Math.random() - 1000;
  
  					vertices.push( x, y, z );
  
  				}
  
  				geometry.setAttribute( 'position', new THREE.Float32BufferAttribute( vertices, 3 ) );
  
  				material = new THREE.PointsMaterial( { size: 35, sizeAttenuation: true, map: sprite, alphaTest: 0.5, transparent: true } );
  				material.color.setHSL( 1.0, 0.3, 0.7, THREE.SRGBColorSpace );
  
  				const particles = new THREE.Points( geometry, material );
  				scene.add( particles );
  
  				//
  
  				
  
  
  				//
  
  				stats = new Stats();
  				__stage.overlay?.appendChild(stats.dom)
  
  				//
  
  				const gui = new GUI();
  
  				gui.add( material, 'sizeAttenuation' ).onChange( function () {
  
  					material.needsUpdate = true;
  
  				} );
  
  				gui.open();
  
  				//
  
  				document.body.style.touchAction = 'none';
  				document.body.addEventListener( 'pointermove', onPointerMove );
  
  				//
  
  				
  
  			
  
  
  			
  
  			function onPointerMove( event ) {
  
  				if ( event.isPrimary === false ) return;
  
  				mouseX = event.clientX - windowHalfX;
  				mouseY = event.clientY - windowHalfY;
  
  			}
  
  			//
  
  			__stage.addUpdateCallback((_delta, _elapsed) => {
    {
    const time = Date.now() * 0.00005;
    				camera.position.x += ( mouseX - camera.position.x ) * 0.05;
    				camera.position.y += ( - mouseY - camera.position.y ) * 0.05;
    				const h = ( 360 * ( 1.0 + time ) % 360 ) / 360;
    				material.color.setHSL( h, 0.5, 0.5 );
    }
    				stats.update();
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
