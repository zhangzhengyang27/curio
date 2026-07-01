<template>
  <ExampleScene
    camera="perspective"
    :camera-options="{ fov: 45, near: 1, far: 10000 }"
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

const infoHtml = "<a href=\"https://threejs.org\" target=\"_blank\" rel=\"noopener\">three.js</a> - custom attributes example - particles - billboards"
function onReady(__stage) {
  const ASSET_HOST = props.example?.globals?.ASSET_HOST || '/threejs-official/'
  let scene = __stage.scene
  let camera = __stage.camera
  let renderer = __stage.renderer
  const controls = __stage.controls

  
  
  
  
  
  			let stats;
  			let sphere, length1;
  
  			const WIDTH = (__stage.container?.clientWidth || window.innerWidth);
  			const HEIGHT = (__stage.container?.clientHeight || window.innerHeight);
  
  			
  
  
  				
  				camera.position.z = 300;
  
  				
  
  				const radius = 100, segments = 68, rings = 38;
  
  				let sphereGeometry = new THREE.SphereGeometry( radius, segments, rings );
  				let boxGeometry = new THREE.BoxGeometry( 0.8 * radius, 0.8 * radius, 0.8 * radius, 10, 10, 10 );
  
  				// if normal and uv attributes are not removed, mergeVertices() can't consolidate identical vertices with different normal/uv data
  
  				sphereGeometry.deleteAttribute( 'normal' );
  				sphereGeometry.deleteAttribute( 'uv' );
  
  				boxGeometry.deleteAttribute( 'normal' );
  				boxGeometry.deleteAttribute( 'uv' );
  
  				sphereGeometry = BufferGeometryUtils.mergeVertices( sphereGeometry );
  				boxGeometry = BufferGeometryUtils.mergeVertices( boxGeometry );
  
  				const combinedGeometry = BufferGeometryUtils.mergeGeometries( [ sphereGeometry, boxGeometry ] );
  				const positionAttribute = combinedGeometry.getAttribute( 'position' );
  
  				const colors = [];
  				const sizes = [];
  
  				const color = new THREE.Color();
  				const vertex = new THREE.Vector3();
  
  				length1 = sphereGeometry.getAttribute( 'position' ).count;
  
  				for ( let i = 0, l = positionAttribute.count; i < l; i ++ ) {
  
  					vertex.fromBufferAttribute( positionAttribute, i );
  
  					if ( i < length1 ) {
  
  						color.setHSL( 0.01 + 0.1 * ( i / length1 ), 0.99, ( vertex.y + radius ) / ( 4 * radius ) );
  
  					} else {
  
  						color.setHSL( 0.6, 0.75, 0.25 + vertex.y / ( 2 * radius ) );
  
  					}
  
  					color.toArray( colors, i * 3 );
  
  					sizes[ i ] = i < length1 ? 10 : 40;
  
  				}
  
  				const geometry = new THREE.BufferGeometry();
  				geometry.setAttribute( 'position', positionAttribute );
  				geometry.setAttribute( 'size', new THREE.Float32BufferAttribute( sizes, 1 ) );
  				geometry.setAttribute( 'ca', new THREE.Float32BufferAttribute( colors, 3 ) );
  
  				//
  
  				const texture = new THREE.TextureLoader().load( ASSET_HOST + 'textures/sprites/disc.png' );
  				texture.wrapS = THREE.RepeatWrapping;
  				texture.wrapT = THREE.RepeatWrapping;
  
  				const material = new THREE.ShaderMaterial( {
  
  					uniforms: {
  						color: { value: new THREE.Color( 0xffffff ) },
  						pointTexture: { value: texture }
  					},
  					vertexShader: document.getElementById( 'vertexshader' ).textContent,
  					fragmentShader: document.getElementById( 'fragmentshader' ).textContent,
  					transparent: true
  
  				} );
  
  				//
  
  				sphere = new THREE.Points( geometry, material );
  				scene.add( sphere );
  
  				//
  
  				
  
  
  				const container = document.getElementById( 'container' );
  
  
  				stats = new Stats();
  				__stage.overlay?.appendChild(stats.dom)
  
  				//
  
  				
  
  			
  
  
  			
  
  			function sortPoints() {
  
  				const vector = new THREE.Vector3();
  
  				// Model View Projection matrix
  
  				const matrix = new THREE.Matrix4();
  				matrix.multiplyMatrices( camera.projectionMatrix, camera.matrixWorldInverse );
  				matrix.multiply( sphere.matrixWorld );
  
  				//
  
  				const geometry = sphere.geometry;
  
  				let index = geometry.getIndex();
  				const positions = geometry.getAttribute( 'position' ).array;
  				const length = positions.length / 3;
  
  				if ( index === null ) {
  
  					const array = new Uint16Array( length );
  
  					for ( let i = 0; i < length; i ++ ) {
  
  						array[ i ] = i;
  
  					}
  
  					index = new THREE.BufferAttribute( array, 1 );
  
  					geometry.setIndex( index );
  
  				}
  
  				const sortArray = [];
  
  				for ( let i = 0; i < length; i ++ ) {
  
  					vector.fromArray( positions, i * 3 );
  					vector.applyMatrix4( matrix );
  
  					sortArray.push( [ vector.z, i ] );
  
  				}
  
  				function numericalSort( a, b ) {
  
  					return b[ 0 ] - a[ 0 ];
  
  				}
  
  				sortArray.sort( numericalSort );
  
  				const indices = index.array;
  
  				for ( let i = 0; i < length; i ++ ) {
  
  					indices[ i ] = sortArray[ i ][ 1 ];
  
  				}
  
  				geometry.index.needsUpdate = true;
  
  			}
  
  			__stage.addUpdateCallback((_delta, _elapsed) => {
    {
    const time = Date.now() * 0.005;
    				sphere.rotation.y = 0.02 * time;
    				sphere.rotation.z = 0.02 * time;
    				const geometry = sphere.geometry;
    				const attributes = geometry.attributes;
    				for ( let i = 0; i < attributes.size.array.length; i ++ ) {
    					if ( i < length1 ) {
    						attributes.size.array[ i ] = 16 + 12 * Math.sin( 0.1 * i + time );
    					}
    				}
    				attributes.size.needsUpdate = true;
    {
    const vector = new THREE.Vector3();
    				// Model View Projection matrix
    				const matrix = new THREE.Matrix4();
    				matrix.multiplyMatrices( camera.projectionMatrix, camera.matrixWorldInverse );
    				matrix.multiply( sphere.matrixWorld );
    				//
    				const geometry = sphere.geometry;
    				let index = geometry.getIndex();
    				const positions = geometry.getAttribute( 'position' ).array;
    				const length = positions.length / 3;
    				if ( index === null ) {
    					const array = new Uint16Array( length );
    					for ( let i = 0; i < length; i ++ ) {
    						array[ i ] = i;
    					}
    					index = new THREE.BufferAttribute( array, 1 );
    					geometry.setIndex( index );
    				}
    				const sortArray = [];
    				for ( let i = 0; i < length; i ++ ) {
    					vector.fromArray( positions, i * 3 );
    					vector.applyMatrix4( matrix );
    					sortArray.push( [ vector.z, i ] );
    				}
    				function numericalSort( a, b ) {
    					return b[ 0 ] - a[ 0 ];
    				}
    				sortArray.sort( numericalSort );
    				const indices = index.array;
    				for ( let i = 0; i < length; i ++ ) {
    					indices[ i ] = sortArray[ i ][ 1 ];
    				}
    				geometry.index.needsUpdate = true;
    }
    }
    				stats.update();
  })
  
  			function render() {
  
  				const time = Date.now() * 0.005;
  
  				sphere.rotation.y = 0.02 * time;
  				sphere.rotation.z = 0.02 * time;
  
  				const geometry = sphere.geometry;
  				const attributes = geometry.attributes;
  
  				for ( let i = 0; i < attributes.size.array.length; i ++ ) {
  
  					if ( i < length1 ) {
  
  						attributes.size.array[ i ] = 16 + 12 * Math.sin( 0.1 * i + time );
  
  					}
  
  				}
  
  				attributes.size.needsUpdate = true;
  
  				sortPoints();
  
  
  
  			}
  
  		
}
</script>
