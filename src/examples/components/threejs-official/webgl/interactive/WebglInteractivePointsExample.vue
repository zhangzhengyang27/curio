<template>
  <ExampleScene
    camera="perspective"
    :camera-options="{ fov: 45, near: 1, far: 10000 }"
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
import * as BufferGeometryUtils from 'three/examples/jsm/utils/BufferGeometryUtils.js';

const props = defineProps({
  example: {
    type: Object,
    default: () => ({})
  }
})

const infoHtml = "<a href=\"https://threejs.org\" target=\"_blank\" rel=\"noopener\">three.js</a> webgl - interactive - particles"
function onReady(__stage) {
  const ASSET_HOST = props.example?.globals?.ASSET_HOST || '/threejs-official/'
  let scene = __stage.scene
  let camera = __stage.camera
  let renderer = __stage.renderer
  const controls = __stage.controls

  
  
  
  
  
  			let stats;
  
  
  
  			const PARTICLE_SIZE = 20;
  
  			let raycaster, intersects;
  			let pointer, INTERSECTED;
  
  			
  
  
  				const container = document.getElementById( 'container' );
  
  				
  
  				
  				camera.position.z = 250;
  
  				//
  
  				let boxGeometry = new THREE.BoxGeometry( 200, 200, 200, 16, 16, 16 );
  
  				// if normal and uv attributes are not removed, mergeVertices() can't consolidate identical vertices with different normal/uv data
  
  				boxGeometry.deleteAttribute( 'normal' );
  				boxGeometry.deleteAttribute( 'uv' );
  
  				boxGeometry = BufferGeometryUtils.mergeVertices( boxGeometry );
  
  				//
  
  				const positionAttribute = boxGeometry.getAttribute( 'position' );
  
  				const colors = [];
  				const sizes = [];
  
  				const color = new THREE.Color();
  
  				for ( let i = 0, l = positionAttribute.count; i < l; i ++ ) {
  
  					color.setHSL( 0.01 + 0.1 * ( i / l ), 1.0, 0.5 );
  					color.toArray( colors, i * 3 );
  
  					sizes[ i ] = PARTICLE_SIZE * 0.5;
  
  				}
  
  				const geometry = new THREE.BufferGeometry();
  				geometry.setAttribute( 'position', positionAttribute );
  				geometry.setAttribute( 'customColor', new THREE.Float32BufferAttribute( colors, 3 ) );
  				geometry.setAttribute( 'size', new THREE.Float32BufferAttribute( sizes, 1 ) );
  
  				//
  
  				const material = new THREE.ShaderMaterial( {
  
  					uniforms: {
  						color: { value: new THREE.Color( 0xffffff ) },
  						pointTexture: { value: new THREE.TextureLoader().load( ASSET_HOST + 'textures/sprites/disc.png' ) },
  						alphaTest: { value: 0.9 }
  					},
  					vertexShader: document.getElementById( 'vertexshader' ).textContent,
  					fragmentShader: document.getElementById( 'fragmentshader' ).textContent
  
  				} );
  
  				//
  
  				particles = new THREE.Points( geometry, material );
  				scene.add( particles );
  
  				//
  
  				
  
  
  				//
  
  				raycaster = new THREE.Raycaster();
  				pointer = new THREE.Vector2();
  
  				//
  
  				stats = new Stats();
  				__stage.overlay?.appendChild(stats.dom)
  
  				//
  
  				
  				document.addEventListener( 'pointermove', onPointerMove );
  
  			
  
  
  			function onPointerMove( event ) {
  
  				pointer.x = ( event.clientX / (__stage.container?.clientWidth || window.innerWidth) ) * 2 - 1;
  				pointer.y = - ( event.clientY / (__stage.container?.clientHeight || window.innerHeight) ) * 2 + 1;
  
  			}
  
  			
  
  			__stage.addUpdateCallback((_delta, _elapsed) => {
    {
    particles.rotation.x += 0.0005;
    				particles.rotation.y += 0.001;
    				const geometry = particles.geometry;
    				const attributes = geometry.attributes;
    				raycaster.setFromCamera( pointer, camera );
    				intersects = raycaster.intersectObject( particles );
    				if ( intersects.length > 0 ) {
    					if ( INTERSECTED != intersects[ 0 ].index ) {
    						attributes.size.array[ INTERSECTED ] = PARTICLE_SIZE;
    						INTERSECTED = intersects[ 0 ].index;
    						attributes.size.array[ INTERSECTED ] = PARTICLE_SIZE * 1.25;
    						attributes.size.needsUpdate = true;
    					}
    				} else if ( INTERSECTED !== null ) {
    					attributes.size.array[ INTERSECTED ] = PARTICLE_SIZE;
    					attributes.size.needsUpdate = true;
    					INTERSECTED = null;
    				}
    }
    				stats.update();
  })
  
  			function render() {
  
  				particles.rotation.x += 0.0005;
  				particles.rotation.y += 0.001;
  
  				const geometry = particles.geometry;
  				const attributes = geometry.attributes;
  
  				raycaster.setFromCamera( pointer, camera );
  
  				intersects = raycaster.intersectObject( particles );
  
  				if ( intersects.length > 0 ) {
  
  					if ( INTERSECTED != intersects[ 0 ].index ) {
  
  						attributes.size.array[ INTERSECTED ] = PARTICLE_SIZE;
  
  						INTERSECTED = intersects[ 0 ].index;
  
  						attributes.size.array[ INTERSECTED ] = PARTICLE_SIZE * 1.25;
  						attributes.size.needsUpdate = true;
  
  					}
  
  				} else if ( INTERSECTED !== null ) {
  
  					attributes.size.array[ INTERSECTED ] = PARTICLE_SIZE;
  					attributes.size.needsUpdate = true;
  					INTERSECTED = null;
  
  				}
  
  
  
  			}
  
  		
}
</script>
