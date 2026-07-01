<template>
  <WebGPUExampleScene
    camera="perspective"
    antialias
    :camera-position="[0, 0, 1]"
    :camera-options="{ fov: 50, near: 0.1, far: 10 }"
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
import { vec4, storage, Fn, If, uniform, instanceIndex, objectWorldMatrix, color, screenUV, attribute } from 'three/tsl';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { Inspector } from 'three/examples/jsm/inspector/Inspector.js';

const props = defineProps({
  example: {
    type: Object,
    default: () => ({})
  }
})

const infoHtml = "<a href=\"https://threejs.org/\" target=\"_blank\" rel=\"noopener\" class=\"logo-link\"></a>\n\n\t\t\t<div class=\"title-wrapper\">\n\t\t\t\t<a href=\"https://threejs.org/\" target=\"_blank\" rel=\"noopener\">three.js</a><span>Compute Geometry</span>"
function onReady(__stage) {
  const ASSET_HOST = props.example?.globals?.ASSET_HOST || '/threejs-official/'
  let scene = __stage.scene
  let camera = __stage.camera
  let renderer = __stage.renderer
  const controls = __stage.controls

  
  			let raycaster, pointer;
  
  			let mesh;
  
  			const pointerPosition = uniform( vec4( 0 ) );
  			const elasticity = uniform( .4 ); // elasticity ( how "strong" the spring is )
  			const damping = uniform( .94 ); // damping factor ( energy loss )
  			const brushSize = uniform( .25 );
  			const brushStrength = uniform( .22 );
  
  			
  			const jelly = Fn( ( { renderer, geometry, object } ) => {
  
  				const count = geometry.attributes.position.count;
  
  				// Create storage buffer attribute for modified position.
  
  				const positionBaseAttribute = geometry.attributes.position;
  				const positionStorageBufferAttribute = new THREE.StorageBufferAttribute( count, 3 );
  				const speedBufferAttribute = new THREE.StorageBufferAttribute( count, 3 );
  
  				geometry.setAttribute( 'storagePosition', positionStorageBufferAttribute );
  
  				// Attributes
  
  				const positionAttribute = storage( positionBaseAttribute, 'vec3', count );
  				const positionStorageAttribute = storage( positionStorageBufferAttribute, 'vec3', count );
  
  				const speedAttribute = storage( speedBufferAttribute, 'vec3', count );
  
  				// Vectors
  
  				// Base vec3 position of the mesh vertices.
  				const basePosition = positionAttribute.element( instanceIndex );
  				// Mesh vertices after compute modification.
  				const currentPosition = positionStorageAttribute.element( instanceIndex );
  				// Speed of each mesh vertex.
  				const currentSpeed = speedAttribute.element( instanceIndex );
  
  				//
  
  				const computeInit = Fn( () => {
  
  					// Modified storage position starts out the same as the base position.
  
  					currentPosition.assign( basePosition );
  
  				} )().compute( count );
  
  				//
  
  				const computeUpdate = Fn( () => {
  
  					// pinch
  
  					If( pointerPosition.w.equal( 1 ), () => {
  
  						const worldPosition = objectWorldMatrix( object ).mul( currentPosition );
  
  						const dist = worldPosition.distance( pointerPosition.xyz );
  						const direction = pointerPosition.xyz.sub( worldPosition ).normalize();
  
  						const power = brushSize.sub( dist ).max( 0 ).mul( brushStrength );
  
  						currentPosition.addAssign( direction.mul( power ) );
  
  					} );
  
  					// compute ( jelly )
  
  					const distance = basePosition.distance( currentPosition );
  					const force = elasticity.mul( distance ).mul( basePosition.sub( currentPosition ) );
  
  					currentSpeed.addAssign( force );
  					currentSpeed.mulAssign( damping );
  
  					currentPosition.addAssign( currentSpeed );
  
  				} )().compute( count ).setName( 'Update Jelly' );
  
  				// initialize the storage buffer with the base position
  
  				computeUpdate.onInit( () => renderer.compute( computeInit ) );
  
  				//
  
  				return computeUpdate;
  
  			} );
  
  			
  
  
  				
  
  
  				
  
  				raycaster = new THREE.Raycaster();
  				pointer = new THREE.Vector2();
  
  				// background
  
  				const bgColor = screenUV.y.mix( color( 0x9f87f7 ), color( 0xf2cdcd ) );
  				const bgVignette = screenUV.distance( .5 ).remapClamp( 0.3, .8 ).oneMinus();
  				const bgIntensity = 4;
  
  				scene.backgroundNode = bgColor.mul( bgVignette.mul( color( 0xa78ff6 ).mul( bgIntensity ) ) );
  
  				// model
  
  				new GLTFLoader().load( ASSET_HOST + 'models/gltf/LeePerrySmith/LeePerrySmith.glb', function ( gltf ) {
  
  					// create jelly effect material
  
  					const material = new THREE.MeshNormalNodeMaterial();
  					material.geometryNode = jelly();
  					material.positionNode = attribute( 'storagePosition' );
  
  					// apply the material to the mesh
  
  					mesh = gltf.scene.children[ 0 ];
  					mesh.scale.setScalar( .1 );
  					mesh.material = material;
  					scene.add( mesh );
  
  				} );
  
  				// renderer
  
  				
  
  
  				renderer.inspector = new Inspector();
  
  
  
  				controls.minDistance = .7;
  				controls.maxDistance = 2;
  
  				const gui = renderer.inspector.createParameters( 'Settings' );
  				gui.add( elasticity, 'value', 0, .5 ).name( 'elasticity' );
  				gui.add( damping, 'value', .9, .98 ).name( 'damping' );
  				gui.add( brushSize, 'value', .1, .5 ).name( 'brush size' );
  				gui.add( brushStrength, 'value', .1, .3 ).name( 'brush strength' );
  
  				
  				window.addEventListener( 'pointermove', onPointerMove );
  
  			
  
  
  			function onPointerMove( event ) {
  
  				pointer.set( ( event.clientX / (__stage.container?.clientWidth || window.innerWidth) ) * 2 - 1, - ( event.clientY / (__stage.container?.clientHeight || window.innerHeight) ) * 2 + 1 );
  
  				raycaster.setFromCamera( pointer, camera );
  
  				const intersects = raycaster.intersectObject( scene );
  
  				if ( intersects.length > 0 ) {
  
  					const intersect = intersects[ 0 ];
  
  					pointerPosition.value.copy( intersect.point );
  					pointerPosition.value.w = 1; // enable
  
  				} else {
  
  					pointerPosition.value.w = 0; // disable
  
  				}
  
  			}
  
  			
  
  			async function animate() {
  
  
  
  			}
  
  		
}
</script>
