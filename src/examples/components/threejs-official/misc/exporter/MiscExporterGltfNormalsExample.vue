<template>
  <ExampleScene
    camera="perspective"
    antialias
    :camera-position="[0, 0, 150]"
    :camera-options="{ fov: 45, near: 1, far: 1000 }"
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
import ExampleScene from '@/examples/components/ExampleScene.vue'
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter.js';

const props = defineProps({
  example: {
    type: Object,
    default: () => ({})
  }
})

const infoHtml = "<a href=\"https://threejs.org\" target=\"_blank\" rel=\"noopener\">three.js</a> webgl - exporter - gltf - normals<br/><br/>\n\t\t\t<button id=\"export_objects\">Export</button><br/>"
function onReady(__stage: any) {
  const ASSET_HOST = props.example?.globals?.ASSET_HOST || '/threejs-official/'
  let scene = __stage.scene
  let camera = __stage.camera
  let renderer = __stage.renderer
  const controls = __stage.controls

  
  
  
  
  			//
  
  			let container;
  
  			let mesh1, mesh2;
  
  			
  			render();
  
  			
  
  
  				// renderer
  				
  
  
  
  
  
  				
  				scene.name = 'Scene';
  
  				// camera
  				
  
  				camera.name = 'PerspectiveCamera';
  				scene.add( camera );
  
  				// controls
  
  				controls.addEventListener( 'change', render ); // use if there is no animation loop
  				controls.minDistance = 100;
  				controls.maxDistance = 200;
  
  				// lights
  				const light = new THREE.DirectionalLight( 0xffffff, 4 );
  				light.position.set( 0, 1, 1 );
  				light.name = 'DirectionalLight';
  				scene.add( light );
  
  				const light2 = new THREE.DirectionalLight( 0xffffff, 4 ); // for back-sided objects
  				light2.position.set( 0, 1, - 1 );
  				light2.name = 'DirectionalLight2';
  				scene.add( light2 );
  
  				// geometry1 - three.js convention: uv (0,0) bottom left
  				const geometry1 = new THREE.PlaneGeometry( 50, 50 );
  
  				// geometry2 - glTF convention: uv (0,0) top left
  				const geometry2 = new THREE.PlaneGeometry( 50, 50 );
  				geometry2.setAttribute( 'uv', new THREE.BufferAttribute( new Float32Array( [ 0, 0, 1, 0, 0, 1, 1, 1 ] ), 2 ) );
  
  				// textures
  				const normalMapOpenGL = new THREE.TextureLoader().load( ASSET_HOST + 'textures/NormalMapOpenGL.png', render );
  				const normalMapDirectX = new THREE.TextureLoader().load( ASSET_HOST + 'textures/NormalMapDirectX.png', render );
  
  				// material
  				const material = new THREE.MeshStandardMaterial( {
  					color: 0x636389,
  					roughness: 0.3,
  					normalMap: null,
  					normalScale: new THREE.Vector2( 0.5, 0.5 ),
  					side: THREE.DoubleSide
  				} );
  
  				// pick one
  				// ---------------------------------------------------
  				const GEOMETRY = geometry1; // geometry1 or geometry2
  				// ---------------------------------------------------
  
  				// mesh1
  				mesh1 = new THREE.Mesh( GEOMETRY, material.clone() );
  				mesh1.position.set( - 30, 0, 0 );
  
  				mesh1.material.normalMap = normalMapOpenGL;
  				//mesh1.material.normalMap.flipY = false; // default true
  				//mesh1.material.normalScale.y *= - 1; // exporter ignores negative normalScale.y
  
  				mesh1.name = 'Mesh1';
  				scene.add( mesh1 );
  
  				// mesh2
  				mesh2 = new THREE.Mesh( GEOMETRY, material.clone() );
  				mesh2.position.set( 30, 0, 0 );
  
  				mesh2.material.normalMap = normalMapDirectX;
  				//mesh2.material.normalMap.flipY = false; // default true
  				mesh2.material.normalScale!.y *= - 1; // exporter ignores negative normalScale.y
  
  				mesh2.name = 'Mesh2';
  				scene.add( mesh2 );
  
  				//
  
  				
  
  			
  
  
  			
  
  			function render() {
  
  
  
  			}
  
  			//
  
  			function exportGLTF( input: any ) {
  
  				const gltfExporter = new GLTFExporter();
  
  				const options = {
  					binary: true
  				};
  			
  				gltfExporter.parse( input, function ( result ) {
  
  					if ( result instanceof ArrayBuffer ) {
  
  						saveArrayBuffer( result, 'scene.glb' );
  
  					} else {
  
  						const output = JSON.stringify( result, null, 2 );
  						console.log( output );
  						saveString( output, 'scene.gltf' );
  
  					}
  
  				}, null, options );
  
  			}
  
  			const exportButton = document.createElement( 'button' );
  			exportButton.textContent = 'Export GLTF';
  			exportButton.style.cssText = 'position:absolute;top:10px;left:10px;padding:4px 8px;cursor:pointer;';
  			__stage.overlay?.appendChild( exportButton );
  			exportButton.addEventListener( 'click', function () {
  
  				exportGLTF( [ mesh1, mesh2 ] );
  
  			} );
  
  			const link = document.createElement( 'a' );
  			link.style.display = 'none';
  			document.body.appendChild( link ); // Firefox workaround, see #6594
  
  			function save( blob: any, filename: any ) {
  
  				link.href = URL.createObjectURL( blob );
  				link.download = filename;
  				link.click();
  
  				// URL.revokeObjectURL( url ); breaks Firefox...
  
  			}
  
  			function saveString( text: any, filename: any ) {
  
  				save( new Blob( [ text ], { type: 'text/plain' } ), filename );
  
  			}
  
  
  			function saveArrayBuffer( buffer: any, filename: any ) {
  
  				save( new Blob( [ buffer ], { type: 'application/octet-stream' } ), filename );
  
  			}
  
  		
}
</script>
