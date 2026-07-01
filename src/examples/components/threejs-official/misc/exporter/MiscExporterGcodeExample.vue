<template>
  <ExampleScene
    camera="perspective"
    antialias
    :camera-position="[42, 42, 42]"
    :camera-options="{ fov: 70, near: 1, far: 1000 }"
    @ready="onReady">
    <template #default>
      <div class="example-info" v-html="infoHtml" />
    </template>
  </ExampleScene>
</template>

<script setup>
import ExampleScene from '@/examples/components/ExampleScene.vue'
import * as THREE from 'three';
import Polyslice from 'https://cdn.jsdelivr.net/npm/@jgphilpott/polyslice@26.4.0/dist/index.browser.esm.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GUI } from 'three/examples/jsm/libs/lil-gui.module.min.js';

const props = defineProps({
  example: {
    type: Object,
    default: () => ({})
  }
})

const infoHtml = "<a href=\"https://threejs.org\" target=\"_blank\" rel=\"noopener\">three.js</a> webgl - exporter - <a href=\"https://github.com/jgphilpott/polyslice\" target=\"_blank\" rel=\"noopener\">GCode</a>\n\t\t\t<br>Slice 3D models to G-code for 3D printing\n\t\t\t<br><a href=\"https://www.youtube.com/watch?v=V2h3SiafXRc\" target=\"_blank\" rel=\"noopener\">Watch the Demo Video</a>"
function onReady(__stage) {
  let scene = __stage.scene
  let camera = __stage.camera
  let renderer = __stage.renderer
  const controls = __stage.controls

  
  
  
  
  			// Make THREE available globally for Polyslice
  			window.THREE = THREE;
  
  
  
  			const params = {
  				addCube: addCube,
  				addCylinder: addCylinder,
  				addCone: addCone,
  				addSphere: addSphere,
  				addTorus: addTorus,
  				exportToGCode: exportToGCode,
  				geometryName: 'cube',
  				printer: 'Ender3',
  				filament: 'GenericPLA',
  				layerHeight: 0.2,
  				infillDensity: 20,
  				infillPattern: 'grid'
  			};
  
  			// Dropdown options (extend as supported by Polyslice profiles)
  			const PRINTER_OPTIONS = [ 'Ender3', 'UltimakerS5', 'PrusaI3MK3S', 'AnycubicI3Mega', 'BambuLabP1P' ];
  			const FILAMENT_OPTIONS = [ 'GenericPLA', 'GenericPETG', 'GenericABS' ];
  
  			
  
  
  				
  
  
  				// Use Z-up coordinate system
  				THREE.Object3D.DEFAULT_UP.set( 0, 0, 1 );
  				camera.up.set( 0, 0, 1 );
  
  
  				
  				scene.background = new THREE.Color( 0xa0a0a0 );
  
  				const ambientLight = new THREE.AmbientLight( 0xffffff, 0.5 );
  				scene.add( ambientLight );
  
  				const directionalLight = new THREE.DirectionalLight( 0xffffff, 2.5 );
  				directionalLight.position.set( 0, 200, 100 );
  				scene.add( directionalLight );
  
  				// Add ground plane for reference (XY plane when Z is up)
  				const gridHelper = new THREE.GridHelper( 220, 10 );
  				gridHelper.rotation.x = - Math.PI / 2; // rotate from XZ to XY
  				scene.add( gridHelper );
  
  				const gui = new GUI();
  
  				let h = gui.addFolder( 'Printer & Filament' );
  				h.add( params, 'printer', PRINTER_OPTIONS ).name( 'Printer' );
  				h.add( params, 'filament', FILAMENT_OPTIONS ).name( 'Filament' );
  
  				h = gui.addFolder( 'Slicer Settings' );
  				h.add( params, 'layerHeight', 0.1, 0.4, 0.05 ).name( 'Layer Height (mm)' );
  				h.add( params, 'infillDensity', 0, 100, 5 ).name( 'Infill Density (%)' );
  				h.add( params, 'infillPattern', [ 'grid', 'triangles', 'hexagons' ] ).name( 'Infill Pattern' );
  
  				h = gui.addFolder( 'Geometry Selection' );
  				h.add( params, 'addCube' ).name( 'Cube' );
  				h.add( params, 'addCylinder' ).name( 'Cylinder' );
  				h.add( params, 'addCone' ).name( 'Cone' );
  				h.add( params, 'addSphere' ).name( 'Sphere' );
  				h.add( params, 'addTorus' ).name( 'Torus' );
  
  				h = gui.addFolder( 'Export' );
  				h.add( params, 'exportToGCode' ).name( 'Export G-code' );
  
  				gui.open();
  
  				addCube();
  
  				
  
  
  				controls.target.set( 0, 0, 0 );
  				controls.update();
  
  			
  
  
  			function exportToGCode() {
  
  				try {
  
  					// Check if Polyslice is loaded
  					if ( typeof Polyslice === 'undefined' ) {
  
  						alert( 'Polyslice library failed to load from CDN.\n\nPossible solutions:\n1. Disable ad blockers or browser extensions\n2. Check your network connection\n3. Ensure cdn.jsdelivr.net is not blocked by your firewall' );
  						return;
  
  					}
  
  					// Create printer and filament configurations using Polyslice
  					const printer = new Polyslice.Printer( params.printer || 'Ender3' );
  					const filament = new Polyslice.Filament( params.filament || 'GenericPLA' );
  
  					// Create the slicer instance with user-defined settings
  					const slicer = new Polyslice.Polyslice( {
  						printer: printer,
  						filament: filament,
  						layerHeight: params.layerHeight,
  						infillPattern: params.infillPattern,
  						infillDensity: params.infillDensity,
  						verbose: true
  					} );
  
  					// Slice the current mesh directly
  					const gcode = slicer.slice( mesh );
  
  					// Download the G-code file (include geometry name)
  					const name = params.geometryName || 'model';
  					saveString( gcode, `${ name }-geometry.gcode` );
  
  				} catch ( error ) {
  
  					console.error( 'Error exporting to G-code:', error );
  					alert( 'Error exporting to G-code. Check console for details.' );
  					alert( 'Note: Polyslice is an external library. Please ensure it is loaded correctly.' );
  
  				}
  
  			}
  
  			function clearScene() {
  
  				if ( mesh ) {
  
  					mesh.geometry.dispose();
  					mesh.material.dispose();
  					scene.remove( mesh );
  
  				}
  
  			}
  
  			// Ensure the mesh sits on the XY plane with min Z = 0
  			function placeOnXYPlane( object ) {
  
  				// Update world matrix so bounding box reflects transforms
  				object.updateMatrixWorld( true );
  
  				const box = new THREE.Box3().setFromObject( object );
  				const minZ = box.min.z;
  
  				if ( isFinite( minZ ) ) {
  
  					// Shift object upward by -minZ so it rests on z=0
  					object.position.z -= minZ;
  					object.updateMatrixWorld( true );
  
  				}
  
  			}
  
  			function addCube() {
  
  				clearScene();
  
  				const material = new THREE.MeshLambertMaterial( { color: 0x00cc00 } );
  				const geometry = new THREE.BoxGeometry( 10, 10, 10 );
  				mesh = new THREE.Mesh( geometry, material );
  				params.geometryName = 'cube';
  				placeOnXYPlane( mesh );
  				scene.add( mesh );
  
  			}
  
  			function addCylinder() {
  
  				clearScene();
  
  				const material = new THREE.MeshLambertMaterial( { color: 0x00cc00 } );
  				const geometry = new THREE.CylinderGeometry( 5, 5, 10, 42 );
  				mesh = new THREE.Mesh( geometry, material );
  				mesh.rotation.x = Math.PI / 2;
  				params.geometryName = 'cylinder';
  				placeOnXYPlane( mesh );
  				scene.add( mesh );
  
  			}
  
  			function addCone() {
  
  				clearScene();
  
  				const material = new THREE.MeshLambertMaterial( { color: 0x00cc00 } );
  				const geometry = new THREE.ConeGeometry( 5, 10, 42 );
  				mesh = new THREE.Mesh( geometry, material );
  				mesh.rotation.x = Math.PI / 2;
  				params.geometryName = 'cone';
  				placeOnXYPlane( mesh );
  				scene.add( mesh );
  
  			}
  
  			function addSphere() {
  
  				clearScene();
  
  				const material = new THREE.MeshLambertMaterial( { color: 0x00cc00 } );
  				const geometry = new THREE.SphereGeometry( 5, 42, 42 );
  				mesh = new THREE.Mesh( geometry, material );
  				params.geometryName = 'sphere';
  				placeOnXYPlane( mesh );
  				scene.add( mesh );
  
  			}
  
  			function addTorus() {
  
  				clearScene();
  
  				const material = new THREE.MeshLambertMaterial( { color: 0x00cc00 } );
  				const geometry = new THREE.TorusGeometry( 5, 2, 24, 100 );
  				mesh = new THREE.Mesh( geometry, material );
  				params.geometryName = 'torus';
  				placeOnXYPlane( mesh );
  				scene.add( mesh );
  
  			}
  
  			const link = document.createElement( 'a' );
  			link.style.display = 'none';
  			document.body.appendChild( link );
  
  			function save( blob, filename ) {
  
  				link.href = URL.createObjectURL( blob );
  				link.download = filename;
  				link.click();
  
  			}
  
  			function saveString( text, filename ) {
  
  				save( new Blob( [ text ], { type: 'text/plain' } ), filename );
  
  			}
  
  			
  
  			function animate() {
  
  
  
  			}
  
  		
}
</script>
