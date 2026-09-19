<template>
  <ExampleScene
    camera="perspective"
    :camera-options="{ fov: 75, near: 1, far: 2000 }"
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

<script setup lang="ts">
import { onUnmounted } from 'vue'

let gui: any = null
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

const infoHtml = "<a href=\"https://threejs.org\" target=\"_blank\" rel=\"noopener\">three.js</a> - webgl particle sprites example<br/>\n\t\t\tsnowflakes by <a href=\"http://en.wikipedia.org/wiki/File:Sketch_of_snow_crystal_by_Ren%C3%A9_Descartes.jpg\">Ren&eacute;  Descartes</a>"
function onReady(__stage: any) {
  const ASSET_HOST = props.example?.globals?.ASSET_HOST || '/threejs-official/'
  let scene = __stage.scene
  let camera = __stage.camera
  let renderer = __stage.renderer
  const controls = __stage.controls

  
  
  
  
  
  			let stats, parameters: any;
  			let mouseX = 0, mouseY = 0;
  
  			let windowHalfX = (__stage.container?.clientWidth || window.innerWidth) / 2;
  			let windowHalfY = (__stage.container?.clientHeight || window.innerHeight) / 2;
  
  			const materials: any = [];
  
  			
  
  
  				
  				camera.position.z = 1000;
  
  				
  				scene.fog = new THREE.FogExp2( 0x000000, 0.0008 );
  
  				const geometry = new THREE.BufferGeometry();
  				const vertices = [];
  
  				const textureLoader = new THREE.TextureLoader();
  
  				const assignSRGB = ( texture: any ) => {
  
  					texture.colorSpace = THREE.SRGBColorSpace;
  
  				};
  
  				const sprite1 = textureLoader.load( ASSET_HOST + 'textures/sprites/snowflake1.png', assignSRGB );
  				const sprite2 = textureLoader.load( ASSET_HOST + 'textures/sprites/snowflake2.png', assignSRGB );
  				const sprite3 = textureLoader.load( ASSET_HOST + 'textures/sprites/snowflake3.png', assignSRGB );
  				const sprite4 = textureLoader.load( ASSET_HOST + 'textures/sprites/snowflake4.png', assignSRGB );
  				const sprite5 = textureLoader.load( ASSET_HOST + 'textures/sprites/snowflake5.png', assignSRGB );
  
  				for ( let i = 0; i < 10000; i ++ ) {
  
  					const x = Math.random() * 2000 - 1000;
  					const y = Math.random() * 2000 - 1000;
  					const z = Math.random() * 2000 - 1000;
  
  					vertices.push( x, y, z );
  
  				}
  
  				geometry.setAttribute( 'position', new THREE.Float32BufferAttribute( vertices, 3 ) );
  
  				parameters = [
  					[[ 1.0, 0.2, 0.5 ], sprite2, 20 ],
  					[[ 0.95, 0.1, 0.5 ], sprite3, 15 ],
  					[[ 0.90, 0.05, 0.5 ], sprite1, 10 ],
  					[[ 0.85, 0, 0.5 ], sprite5, 8 ],
  					[[ 0.80, 0, 0.5 ], sprite4, 5 ]
  				];
  
  				for ( let i = 0; i < parameters.length; i ++ ) {
  
  					const color = parameters[ i ][ 0 ];
  					const sprite = parameters[ i ][ 1 ];
  					const size = parameters[ i ][ 2 ];
  
  					materials[ i ] = new THREE.PointsMaterial( { size: size, map: sprite, blending: THREE.AdditiveBlending, depthTest: false, transparent: true } );
  					materials[ i ].color.setHSL( color[ 0 ], color[ 1 ], color[ 2 ], THREE.SRGBColorSpace );
  
  					const particles = new THREE.Points( geometry, materials[ i ] );
  
  					particles.rotation.x = Math.random() * 6;
  					particles.rotation.y = Math.random() * 6;
  					particles.rotation.z = Math.random() * 6;
  
  					scene.add( particles );
  
  				}
  
  				//
  
  				
  
  
  				//
  
  				stats = new Stats();
  				__stage.overlay?.appendChild(stats.dom)
  
  				//
  
  				gui = new GUI();
  
  				const params = {
  					texture: true
  				};
  
  				gui.add( params, 'texture' ).onChange( function ( value: any ) {
  
  					for ( let i = 0; i < materials.length; i ++ ) {
  
  						materials[ i ].map = ( value === true ) ? parameters[ i ][ 1 ] : null;
  						materials[ i ].needsUpdate = true;
  
  					}
  
  				} );
  
  				gui.open();
  
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
    				for ( let i = 0; i < scene.children.length; i ++ ) {
    					const object = scene.children[ i ];
    					if ( object instanceof THREE.Points ) {
    						object.rotation.y = time * ( i < 4 ? i + 1 : - ( i + 1 ) );
    					}
    				}
    				for ( let i = 0; i < materials.length; i ++ ) {
    					const color = parameters[ i ][ 0 ];
    					const h = ( 360 * ( color[ 0 ] + time ) % 360 ) / 360;
    					materials[ i ].color.setHSL( h, color[ 1 ], color[ 2 ], THREE.SRGBColorSpace );
    				}
    }
    				stats.update();
  })
  
  			function render() {
  
  				const time = Date.now() * 0.00005;
  
  				camera.position.x += ( mouseX - camera.position.x ) * 0.05;
  				camera.position.y += ( - mouseY - camera.position.y ) * 0.05;
  
  
  
  				for ( let i = 0; i < scene.children.length; i ++ ) {
  
  					const object = scene.children[ i ];
  
  					if ( object instanceof THREE.Points ) {
  
  						object.rotation.y = time * ( i < 4 ? i + 1 : - ( i + 1 ) );
  
  					}
  
  				}
  
  				for ( let i = 0; i < materials.length; i ++ ) {
  
  					const color = parameters[ i ][ 0 ];
  
  					const h = ( 360 * ( color[ 0 ] + time ) % 360 ) / 360;
  					materials[ i ].color.setHSL( h, color[ 1 ], color[ 2 ], THREE.SRGBColorSpace );
  
  				}
  
  
  
  			}
  
  		
}

onUnmounted(() => {
  gui?.destroy()
})
</script>
