<template>
  <WebGPUExampleScene
    camera="perspective"
    antialias
    :camera-position="[0, 1.3, 3]"
    :camera-options="{ fov: 36, near: 0.25, far: 16 }"
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
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

const props = defineProps({
  example: {
    type: Object,
    default: () => ({})
  }
})

const infoHtml = "<a href=\"https://threejs.org/\" target=\"_blank\" rel=\"noopener\" class=\"logo-link\"></a>\n\n\t\t\t<div class=\"title-wrapper\">\n\t\t\t\t<a href=\"https://threejs.org/\" target=\"_blank\" rel=\"noopener\">three.js</a><span>Clipping Planes</span>"
function onReady(__stage: any) {
  let scene = __stage.scene
  let camera = __stage.camera
  let renderer = __stage.renderer
  const controls = __stage.controls

  
  
  
  
  
  			let startTime: any, object: any;
  
  			
  
  
  				
  
  
  
  				
  
  				// Lights
  
  				scene.add( new THREE.AmbientLight( 0xcccccc ) );
  
  				const spotLight = new THREE.SpotLight( 0xffffff, 60 );
  				spotLight.angle = Math.PI / 5;
  				spotLight.penumbra = 0.2;
  				spotLight.position.set( 2, 3, 3 );
  				spotLight.castShadow = true;
  				spotLight.shadow.camera.near = 3;
  				spotLight.shadow.camera.far = 10;
  				spotLight.shadow.mapSize.width = 2048;
  				spotLight.shadow.mapSize.height = 2048;
  				spotLight.shadow.radius = 4;
  				scene.add( spotLight );
  
  				const dirLight = new THREE.DirectionalLight( 0x55505a, 3 );
  				dirLight.position.set( 0, 3, 0 );
  				dirLight.castShadow = true;
  				dirLight.shadow.camera.near = 1;
  				dirLight.shadow.camera.far = 10;
  
  				dirLight.shadow.camera.right = 1;
  				dirLight.shadow.camera.left = - 1;
  				dirLight.shadow.camera.top	= 1;
  				dirLight.shadow.camera.bottom = - 1;
  
  				dirLight.shadow.mapSize.width = 1024;
  				dirLight.shadow.mapSize.height = 1024;
  				scene.add( dirLight );
  
  				// Clipping planes
  
  				const globalPlane = new THREE.Plane( new THREE.Vector3( - 1, 0, 0 ), 0.1 );
  				const localPlane1 = new THREE.Plane( new THREE.Vector3( 0, - 1, 0 ), 0.8 );
  				const localPlane2 = new THREE.Plane( new THREE.Vector3( 0, 0, - 1 ), 0.1 );
  
  				// Clipping Groups
  
  				const globalClippingGroup = new THREE.ClippingGroup();
  				globalClippingGroup.clippingPlanes = [ globalPlane ];
  
  				const knotClippingGroup = new THREE.ClippingGroup();
  				knotClippingGroup.clippingPlanes = [ localPlane1, localPlane2 ];
  				knotClippingGroup.clipIntersection = true;
  
  				scene.add( globalClippingGroup );
  				globalClippingGroup.add( knotClippingGroup );
  
  				// Geometry
  
  				const material = new THREE.MeshPhongNodeMaterial( {
  					color: 0x80ee10,
  					shininess: 0,
  					side: THREE.DoubleSide,
  					alphaToCoverage: true
  				} );
  
  				const geometry = new THREE.TorusKnotGeometry( 0.4, 0.08, 95, 20 );
  
  				object = new THREE.Mesh( geometry, material );
  				object.castShadow = true;
  				knotClippingGroup.add( object );
  
  				const ground = new THREE.Mesh(
  					new THREE.PlaneGeometry( 9, 9, 1, 1 ),
  					new THREE.MeshPhongNodeMaterial( { color: 0xa0adaf, shininess: 150, alphaToCoverage: true } )
  				);
  
  				ground.rotation.x = - Math.PI / 2; // rotates X/Y to X/Z
  				ground.receiveShadow = true;
  				globalClippingGroup.add( ground );
  
  				// Renderer
  
  				
  				renderer.shadowMap.enabled = true;
  
  
  				renderer.inspector = new Inspector();
  				
  
  
  				// Controls
  
  
  				controls.target.set( 0, 1, 0 );
  				controls.update();
  
  				// GUI
  
  				const gui = renderer.inspector.createParameters( 'Clipping settings' );
  				const props = {
  					alphaToCoverage: true,
  				};
  			
  				const folderKnot = gui.addFolder( 'Knot Clipping Group' );
  				const propsKnot = {
  
  					get 'Enabled'() {
  
  						return knotClippingGroup.enabled;
  
  					},
  					set 'Enabled'( v ) {
  
  						knotClippingGroup.enabled = v;
  
  					},
  
  					get 'Shadows'() {
  
  						return knotClippingGroup.clipShadows;
  
  					},
  					set 'Shadows'( v ) {
  
  						knotClippingGroup.clipShadows = v;
  
  					},
  
  					get 'Intersection'() {
  
  						return knotClippingGroup.clipIntersection;
  
  					},
  
  					set 'Intersection'( v ) {
  
  						knotClippingGroup.clipIntersection = v;
  
  					},
  
  					get 'Plane'() {
  
  						return localPlane1.constant;
  
  					},
  					set 'Plane'( v ) {
  
  						localPlane1.constant = v;
  
  					}
  
  				};
  
  				const folderGlobal = gui.addFolder( 'Global Clipping Group' );
  				const propsGlobal = {
  
  					get 'Enabled'() {
  
  						return globalClippingGroup.enabled;
  
  					},
  					set 'Enabled'( v ) {
  
  						globalClippingGroup.enabled = v;
  
  					},
  
  					get 'Plane'() {
  
  						return globalPlane.constant;
  
  					},
  					set 'Plane'( v ) {
  
  						globalPlane.constant = v;
  
  					}
  
  				};
  
  				gui.add( props, 'alphaToCoverage' ).onChange( function ( value: any ) {
  
  					ground.material.alphaToCoverage = value;
  					ground.material.needsUpdate = true;
  
  					material.alphaToCoverage = value;
  					material.needsUpdate = true;
  
  				} );
  
  				folderKnot.add( propsKnot, 'Enabled' );
  				folderKnot.add( propsKnot, 'Shadows' );
  				folderKnot.add( propsKnot, 'Intersection' );
  				folderKnot.add( propsKnot, 'Plane', 0.3, 1.25 );
  
  				folderGlobal.add( propsGlobal, 'Enabled' );
  				folderGlobal.add( propsGlobal, 'Plane', - 0.4, 3 );
  
  				// Start
  
  				startTime = Date.now();
  
  			
  
  
  			
  
  			function animate( currentTime: any ) {
  
  				const time = ( currentTime - startTime ) / 1000;
  
  				object.position.y = 0.8;
  				object.rotation.x = time * 0.5;
  				object.rotation.y = time * 0.2;
  				object.scale.setScalar( Math.cos( time ) * 0.125 + 0.875 );
  
  
  
  			}
  
  		
}
</script>
