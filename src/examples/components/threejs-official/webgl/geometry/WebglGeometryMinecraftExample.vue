<template>
  <ExampleScene
    camera="perspective"
    antialias
    :camera-options="{ fov: 60, near: 1, far: 20000 }"
    :enable-controls="false"
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
import { FirstPersonControls } from 'three/examples/jsm/controls/FirstPersonControls.js';
import { ImprovedNoise } from 'three/examples/jsm/math/ImprovedNoise.js';
import * as BufferGeometryUtils from 'three/examples/jsm/utils/BufferGeometryUtils.js';

const props = defineProps({
  example: {
    type: Object,
    default: () => ({})
  }
})

const infoHtml = "<a href=\"https://threejs.org\" target=\"_blank\" rel=\"noopener\">three.js</a> - <a href=\"http://www.minecraft.net/\" target=\"_blank\" rel=\"noopener\">minecraft</a> demo. featuring <a href=\"http://painterlypack.net/\" target=\"_blank\" rel=\"noopener\">painterly pack</a><br />(left click: forward, right click: backward)"
function onReady(__stage) {
  const ASSET_HOST = props.example?.globals?.ASSET_HOST || '/threejs-official/'
  let scene = __stage.scene
  let camera = __stage.camera
  let renderer = __stage.renderer
  

  
  
  
  
  
  			let container, stats;
  
  
  			const worldWidth = 128, worldDepth = 128;
  			const worldHalfWidth = worldWidth / 2;
  			const worldHalfDepth = worldDepth / 2;
  			const data = generateHeight( worldWidth, worldDepth );
  
  			const timer = new THREE.Timer();
  			timer.connect( document );
  
  			
  
  
  				container = document.getElementById( 'container' );
  
  				
  				camera.position.y = getY( worldHalfWidth, worldHalfDepth ) * 100 + 100;
  
  				
  				scene.background = new THREE.Color( 0xbfd1e5 );
  
  				// sides
  
  				const matrix = new THREE.Matrix4();
  
  				const pxGeometry = new THREE.PlaneGeometry( 100, 100 );
  				pxGeometry.attributes.uv.array[ 1 ] = 0.5;
  				pxGeometry.attributes.uv.array[ 3 ] = 0.5;
  				pxGeometry.rotateY( Math.PI / 2 );
  				pxGeometry.translate( 50, 0, 0 );
  
  				const nxGeometry = new THREE.PlaneGeometry( 100, 100 );
  				nxGeometry.attributes.uv.array[ 1 ] = 0.5;
  				nxGeometry.attributes.uv.array[ 3 ] = 0.5;
  				nxGeometry.rotateY( - Math.PI / 2 );
  				nxGeometry.translate( - 50, 0, 0 );
  
  				const pyGeometry = new THREE.PlaneGeometry( 100, 100 );
  				pyGeometry.attributes.uv.array[ 5 ] = 0.5;
  				pyGeometry.attributes.uv.array[ 7 ] = 0.5;
  				pyGeometry.rotateX( - Math.PI / 2 );
  				pyGeometry.translate( 0, 50, 0 );
  
  				const pzGeometry = new THREE.PlaneGeometry( 100, 100 );
  				pzGeometry.attributes.uv.array[ 1 ] = 0.5;
  				pzGeometry.attributes.uv.array[ 3 ] = 0.5;
  				pzGeometry.translate( 0, 0, 50 );
  
  				const nzGeometry = new THREE.PlaneGeometry( 100, 100 );
  				nzGeometry.attributes.uv.array[ 1 ] = 0.5;
  				nzGeometry.attributes.uv.array[ 3 ] = 0.5;
  				nzGeometry.rotateY( Math.PI );
  				nzGeometry.translate( 0, 0, - 50 );
  
  				//
  
  				const geometries = [];
  
  				for ( let z = 0; z < worldDepth; z ++ ) {
  
  					for ( let x = 0; x < worldWidth; x ++ ) {
  
  						const h = getY( x, z );
  
  						matrix.makeTranslation(
  							x * 100 - worldHalfWidth * 100,
  							h * 100,
  							z * 100 - worldHalfDepth * 100
  						);
  
  						const px = getY( x + 1, z );
  						const nx = getY( x - 1, z );
  						const pz = getY( x, z + 1 );
  						const nz = getY( x, z - 1 );
  
  						geometries.push( pyGeometry.clone().applyMatrix4( matrix ) );
  
  						if ( ( px !== h && px !== h + 1 ) || x === 0 ) {
  
  							geometries.push( pxGeometry.clone().applyMatrix4( matrix ) );
  
  						}
  
  						if ( ( nx !== h && nx !== h + 1 ) || x === worldWidth - 1 ) {
  
  							geometries.push( nxGeometry.clone().applyMatrix4( matrix ) );
  
  						}
  
  						if ( ( pz !== h && pz !== h + 1 ) || z === worldDepth - 1 ) {
  
  							geometries.push( pzGeometry.clone().applyMatrix4( matrix ) );
  
  						}
  
  						if ( ( nz !== h && nz !== h + 1 ) || z === 0 ) {
  
  							geometries.push( nzGeometry.clone().applyMatrix4( matrix ) );
  
  						}
  
  					}
  
  				}
  
  				const geometry = BufferGeometryUtils.mergeGeometries( geometries );
  				geometry.computeBoundingSphere();
  
  				const texture = new THREE.TextureLoader().load( ASSET_HOST + 'textures/minecraft/atlas.png' );
  				texture.colorSpace = THREE.SRGBColorSpace;
  				texture.magFilter = THREE.NearestFilter;
  
  				const mesh = new THREE.Mesh( geometry, new THREE.MeshLambertMaterial( { map: texture, side: THREE.DoubleSide } ) );
  				scene.add( mesh );
  
  				const ambientLight = new THREE.AmbientLight( 0xeeeeee, 3 );
  				scene.add( ambientLight );
  
  				const directionalLight = new THREE.DirectionalLight( 0xffffff, 12 );
  				directionalLight.position.set( 1, 1, 0.5 ).normalize();
  				scene.add( directionalLight );
  
  				
  
  
  				controls.movementSpeed = 1000;
  				controls.lookSpeed = 0.125;
  				controls.lookVertical = true;
  
  				stats = new Stats();
  				__stage.overlay?.appendChild(stats.dom)
  
  				//
  
  				
  
  			
  
  
  			
  
  			function generateHeight( width, height ) {
  
  				const data = [], perlin = new ImprovedNoise(),
  					size = width * height, z = Math.random() * 100;
  
  				let quality = 2;
  
  				for ( let j = 0; j < 4; j ++ ) {
  
  					if ( j === 0 ) for ( let i = 0; i < size; i ++ ) data[ i ] = 0;
  
  					for ( let i = 0; i < size; i ++ ) {
  
  						const x = i % width, y = ( i / width ) | 0;
  						data[ i ] += perlin.noise( x / quality, y / quality, z ) * quality;
  
  
  					}
  
  					quality *= 4;
  
  				}
  
  				return data;
  
  			}
  
  			function getY( x, z ) {
  
  				return ( data[ x + z * worldWidth ] * 0.15 ) | 0;
  
  			}
  
  			//
  
  			__stage.addUpdateCallback((_delta, _elapsed) => {
    timer.update();
    {
    controls.update( timer.getDelta() );
    }
    				stats.update();
  })
  
  			function render() {
  
  				controls.update( timer.getDelta() );
  
  
  			}
  
  		
}
</script>
