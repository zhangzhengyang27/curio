<template>
  <WebGPUExampleScene
    camera="perspective"
    :camera-position="[0, 0, 8]"
    :camera-options="{ fov: 45, near: 0.1, far: 100 }"
    @ready="onReady">
    <template #default>
      <div class="example-info" v-html="infoHtml" />
    </template>
  </WebGPUExampleScene>
</template>

<script setup>
import WebGPUExampleScene from '@/examples/components/WebGPUExampleScene.vue'
import * as THREE from 'three/webgpu';
import { pass, uniform, time, oscSine } from 'three/tsl';
import { outline } from 'three/examples/jsm/tsl/display/OutlineNode.js';
import { Inspector } from 'three/examples/jsm/inspector/Inspector.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js';

const props = defineProps({
  example: {
    type: Object,
    default: () => ({})
  }
})

const infoHtml = "<a href=\"https://threejs.org/\" target=\"_blank\" rel=\"noopener\" class=\"logo-link\"></a>\n\n\t\t\t<div class=\"title-wrapper\">\n\t\t\t\t<a href=\"https://threejs.org/\" target=\"_blank\" rel=\"noopener\">three.js</a><span>Outline</span>"
function onReady(__stage) {
  const ASSET_HOST = props.example?.globals?.ASSET_HOST || '/threejs-official/'
  let scene = __stage.scene
  let camera = __stage.camera
  let renderer = __stage.renderer
  

  
  			let renderPipeline, outlinePass;
  
  			let selectedObjects = [];
  
  			const raycaster = new THREE.Raycaster();
  			const mouse = new THREE.Vector2();
  
  			const obj3d = new THREE.Object3D();
  			const group = new THREE.Group();
  
  			
  
  
  				const width = (__stage.container?.clientWidth || window.innerWidth);
  				const height = (__stage.container?.clientHeight || window.innerHeight);
  
  				
  
  
  				renderer.inspector = new Inspector();
  				renderer.shadowMap.enabled = true;
  
  
  				
  
  				
  
  
  				
  				controls.minDistance = 5;
  				controls.maxDistance = 20;
  				controls.enablePan = false;
  				controls.enableDamping = true;
  				controls.dampingFactor = 0.05;
  
  				//
  
  				scene.add( new THREE.AmbientLight( 0xaaaaaa, 0.6 ) );
  
  				const light = new THREE.DirectionalLight( 0xddffdd, 2 );
  				light.position.set( 5, 5, 5 );
  				light.castShadow = true;
  				light.shadow.mapSize.width = 2048;
  				light.shadow.mapSize.height = 2048;
  
  				const d = 10;
  
  				light.shadow.camera.left = - d;
  				light.shadow.camera.right = d;
  				light.shadow.camera.top = d;
  				light.shadow.camera.bottom = - d;
  				light.shadow.camera.far = 25;
  
  				scene.add( light );
  
  				// model
  
  				const loader = new OBJLoader();
  				loader.load( ASSET_HOST + 'models/obj/tree.obj', function ( object ) {
  
  					let scale = 1.0;
  
  					object.traverse( function ( child ) {
  
  						if ( child instanceof THREE.Mesh ) {
  
  							child.geometry.center();
  							child.geometry.computeBoundingSphere();
  							scale = 0.2 * child.geometry.boundingSphere.radius;
  
  							const phongMaterial = new THREE.MeshPhongMaterial( { color: 0xffffff, specular: 0x111111, shininess: 5 } );
  							child.material = phongMaterial;
  							child.receiveShadow = true;
  							child.castShadow = true;
  
  						}
  
  					} );
  
  					object.position.y = 1;
  					object.scale.divideScalar( scale );
  					obj3d.add( object );
  
  				} );
  
  				scene.add( group );
  
  				group.add( obj3d );
  
  				//
  
  				const geometry = new THREE.SphereGeometry( 3, 48, 24 );
  
  				for ( let i = 0; i < 20; i ++ ) {
  
  					const material = new THREE.MeshLambertMaterial();
  					material.color.setHSL( Math.random(), 1.0, 0.3 );
  
  					const mesh = new THREE.Mesh( geometry, material );
  					mesh.position.x = Math.random() * 4 - 2;
  					mesh.position.y = Math.random() * 4 - 2;
  					mesh.position.z = Math.random() * 4 - 2;
  					mesh.receiveShadow = true;
  					mesh.castShadow = true;
  					mesh.scale.multiplyScalar( Math.random() * 0.3 + 0.1 );
  					group.add( mesh );
  
  				}
  
  				const floorMaterial = new THREE.MeshLambertMaterial( { side: THREE.DoubleSide } );
  
  				const floorGeometry = new THREE.PlaneGeometry( 12, 12 );
  				const floorMesh = new THREE.Mesh( floorGeometry, floorMaterial );
  				floorMesh.rotation.x -= Math.PI * 0.5;
  				floorMesh.position.y -= 1.5;
  				group.add( floorMesh );
  				floorMesh.receiveShadow = true;
  
  				const torusGeometry = new THREE.TorusGeometry( 1, 0.3, 16, 100 );
  				const torusMaterial = new THREE.MeshPhongMaterial( { color: 0xffaaff } );
  				const torus = new THREE.Mesh( torusGeometry, torusMaterial );
  				torus.position.z = - 4;
  				group.add( torus );
  				torus.receiveShadow = true;
  				torus.castShadow = true;
  
  				// outline pass
  
  				const edgeStrength = uniform( 3.0 );
  				const edgeGlow = uniform( 0.0 );
  				const edgeThickness = uniform( 1.0 );
  				const pulsePeriod = uniform( 0 );
  				const visibleEdgeColor = uniform( new THREE.Color( 0xffffff ) );
  				const hiddenEdgeColor = uniform( new THREE.Color( 0x4e3636 ) );
  
  				outlinePass = outline( scene, camera, {
  					selectedObjects,
  					edgeGlow,
  					edgeThickness
  				} );
  
  				const { visibleEdge, hiddenEdge } = outlinePass;
  
  				const period = time.div( pulsePeriod ).mul( 2 );
  				const osc = oscSine( period ).mul( .5 ).add( .5 ); // osc [ 0.5, 1.0 ]
  
  				const outlineColor = visibleEdge.mul( visibleEdgeColor ).add( hiddenEdge.mul( hiddenEdgeColor ) ).mul( edgeStrength );
  				const outlinePulse = pulsePeriod.greaterThan( 0 ).select( outlineColor.mul( osc ), outlineColor );
  
  				// postprocessing
  
  				const scenePass = pass( scene, camera ).toInspector( 'Color' );
  
  				renderPipeline = new THREE.RenderPipeline( renderer );
  				renderPipeline.outputNode = outlinePulse.add( scenePass );
  
  				// gui
  
  				const gui = renderer.inspector.createParameters( 'Settings' );
  				gui.add( edgeStrength, 'value', 0.01, 10 ).name( 'edgeStrength' );
  				gui.add( edgeGlow, 'value', 0.0, 1 ).name( 'edgeGlow' );
  				gui.add( edgeThickness, 'value', 1, 4 ).name( 'edgeThickness' );
  				gui.add( pulsePeriod, 'value', 0.0, 5 ).name( 'pulsePeriod' );
  				gui.addColor( { color: visibleEdgeColor.value.getHex( THREE.SRGBColorSpace ) }, 'color' ).onChange( ( value ) => {
  
  					visibleEdgeColor.value.set( value );
  
  				} ).name( 'visibleEdgeColor' );
  				gui.addColor( { color: hiddenEdgeColor.value.getHex( THREE.SRGBColorSpace ) }, 'color' ).onChange( ( value ) => {
  
  					hiddenEdgeColor.value.set( value );
  
  				} ).name( 'hiddenEdgeColor' );
  
  				//
  
  				
  
  				renderer.domElement.style.touchAction = 'none';
  				renderer.domElement.addEventListener( 'pointermove', onPointerMove );
  
  				function onPointerMove( event ) {
  
  					if ( event.isPrimary === false ) return;
  
  					mouse.x = ( event.clientX / (__stage.container?.clientWidth || window.innerWidth) ) * 2 - 1;
  					mouse.y = - ( event.clientY / (__stage.container?.clientHeight || window.innerHeight) ) * 2 + 1;
  
  					checkIntersection();
  
  				}
  
  				function addSelectedObject( object ) {
  
  					selectedObjects = [];
  					selectedObjects.push( object );
  
  				}
  
  				function checkIntersection() {
  
  					raycaster.setFromCamera( mouse, camera );
  
  					const intersects = raycaster.intersectObject( scene, true );
  
  					if ( intersects.length > 0 ) {
  
  						const selectedObject = intersects[ 0 ].object;
  						addSelectedObject( selectedObject );
  						outlinePass.selectedObjects = selectedObjects;
  
  					} else {
  
  						// outlinePass.selectedObjects = [];
  
  					}
  
  				}
  
  			
  
  
  			
  
  			__stage.addUpdateCallback((_delta, _elapsed) => {
    renderPipeline.render();
  })
  
  		
}
</script>
