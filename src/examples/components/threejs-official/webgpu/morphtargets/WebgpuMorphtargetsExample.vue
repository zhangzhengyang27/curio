<template>
  <WebGPUExampleScene
    camera="perspective"
    antialias
    :camera-options="{ fov: 45, near: 1, far: 20 }"
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

<script setup>
import WebGPUExampleScene from '@/examples/components/WebGPUExampleScene.vue'
import * as THREE from 'three/webgpu';
import { Inspector } from 'three/examples/jsm/inspector/Inspector.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

const props = defineProps({
  example: {
    type: Object,
    default: () => ({})
  }
})

const infoHtml = "<a href=\"https://threejs.org/\" target=\"_blank\" rel=\"noopener\" class=\"logo-link\"></a>\n\n\t\t\t<div class=\"title-wrapper\">\n\t\t\t\t<a href=\"https://threejs.org/\" target=\"_blank\" rel=\"noopener\">three.js</a><span>Morph Targets</span>"
function onReady(__stage) {
  let scene = __stage.scene
  let camera = __stage.camera
  let renderer = __stage.renderer
  const controls = __stage.controls

  
  
  
  
  
  			let container, mesh;
  
  			
  
  
  				container = __stage.container;
  
  				
  				scene.background = new THREE.Color( 0x8FBCD4 );
  
  				
  				camera.position.z = 10;
  				scene.add( camera );
  
  				scene.add( new THREE.AmbientLight( 0x8FBCD4, 1.5 ) );
  
  				const pointLight = new THREE.PointLight( 0xffffff, 200 );
  				camera.add( pointLight );
  
  				const geometry = createGeometry();
  
  				const material = new THREE.MeshPhongMaterial( {
  					color: 0xff0000,
  					flatShading: true
  				} );
  
  				mesh = new THREE.Mesh( geometry, material );
  				scene.add( mesh );
  
  				
  				renderer.inspector = new Inspector();
  
  
  				controls.enableZoom = false;
  
  				
  
  				initGUI();
  
  			
  
  
  			function createGeometry() {
  
  				const geometry = new THREE.BoxGeometry( 2, 2, 2, 32, 32, 32 );
  
  				// create an empty array to hold targets for the attribute we want to morph
  				// morphing positions and normals is supported
  				geometry.morphAttributes.position = [];
  
  				// the original positions of the cube's vertices
  				const positionAttribute = geometry.attributes.position;
  
  				// for the first morph target we'll move the cube's vertices onto the surface of a sphere
  				const spherePositions = [];
  
  				// for the second morph target, we'll twist the cubes vertices
  				const twistPositions = [];
  				const direction = new THREE.Vector3( 1, 0, 0 );
  				const vertex = new THREE.Vector3();
  
  				for ( let i = 0; i < positionAttribute.count; i ++ ) {
  
  					const x = positionAttribute.getX( i );
  					const y = positionAttribute.getY( i );
  					const z = positionAttribute.getZ( i );
  
  					spherePositions.push(
  
  						x * Math.sqrt( 1 - ( y * y / 2 ) - ( z * z / 2 ) + ( y * y * z * z / 3 ) ),
  						y * Math.sqrt( 1 - ( z * z / 2 ) - ( x * x / 2 ) + ( z * z * x * x / 3 ) ),
  						z * Math.sqrt( 1 - ( x * x / 2 ) - ( y * y / 2 ) + ( x * x * y * y / 3 ) )
  
  					);
  
  					// stretch along the x-axis so we can see the twist better
  					vertex.set( x * 2, y, z );
  
  					vertex.applyAxisAngle( direction, Math.PI * x / 2 ).toArray( twistPositions, twistPositions.length );
  
  				}
  
  				// add the spherical positions as the first morph target
  				geometry.morphAttributes.position[ 0 ] = new THREE.Float32BufferAttribute( spherePositions, 3 );
  
  				// add the twisted positions as the second morph target
  				geometry.morphAttributes.position[ 1 ] = new THREE.Float32BufferAttribute( twistPositions, 3 );
  
  				return geometry;
  
  			}
  
  			function initGUI() {
  
  				// Set up GUI to control targets
  				const params = {
  					Spherify: 0,
  					Twist: 0,
  				};
  
  				const gui = renderer.inspector.createParameters( 'Morph Targets' );
  
  				gui.add( params, 'Spherify', 0, 1, 0.01 ).onChange( function ( value ) {
  
  					mesh.morphTargetInfluences[ 0 ] = value;
  
  				} );
  				gui.add( params, 'Twist', 0, 1, 0.01 ).onChange( function ( value ) {
  
  					mesh.morphTargetInfluences[ 1 ] = value;
  
  				} );
  
  			}
  
  			
  
  		
}
</script>
