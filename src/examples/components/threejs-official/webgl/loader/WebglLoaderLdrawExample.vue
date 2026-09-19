<template>
  <ExampleScene
    camera="perspective"
    antialias
    :camera-position="[150, 200, 250]"
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

<script setup lang="ts">
import ExampleScene from '@/examples/components/ExampleScene.vue'
import * as THREE from 'three';
import { GUI } from 'three/examples/jsm/libs/lil-gui.module.min.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { LDrawLoader } from 'three/examples/jsm/loaders/LDrawLoader.js';
import { LDrawUtils } from 'three/examples/jsm/utils/LDrawUtils.js';
import { LDrawConditionalLineMaterial } from 'three/examples/jsm/materials/LDrawConditionalLineMaterial.js';
let model: any;

const props = defineProps({
  example: {
    type: Object,
    default: () => ({})
  }
})

const infoHtml = "<a href=\"https://threejs.org\" target=\"_blank\" rel=\"noopener\">three.js</a> - LDrawLoader"
function onReady(__stage: any) {
  const ASSET_HOST = props.example?.globals?.ASSET_HOST || '/threejs-official/'
  let scene = __stage.scene
  let camera = __stage.camera
  let renderer = __stage.renderer
  const controls = __stage.controls
  

  
  
  
  
  
  
  			let container, progressBarDiv: any;
  
  			let gui: any, guiData: any;
  
  
  
  			const ldrawPath = ASSET_HOST + 'models/ldraw/officialLibrary/';
  
  			const modelFileList = {
  				'Car': ASSET_HOST + 'models/car.ldr_Packed.mpd',
  				'Lunar Vehicle': ASSET_HOST + 'models/1621-1-LunarMPVVehicle.mpd_Packed.mpd',
  				'Radar Truck': ASSET_HOST + 'models/889-1-RadarTruck.mpd_Packed.mpd',
  				'Trailer': ASSET_HOST + 'models/4838-1-MiniVehicles.mpd_Packed.mpd',
  				'Bulldozer': ASSET_HOST + 'models/4915-1-MiniConstruction.mpd_Packed.mpd',
  				'Helicopter': ASSET_HOST + 'models/4918-1-MiniFlyers.mpd_Packed.mpd',
  				'Plane': ASSET_HOST + 'models/5935-1-IslandHopper.mpd_Packed.mpd',
  				'Lighthouse': ASSET_HOST + 'models/30023-1-Lighthouse.ldr_Packed.mpd',
  				'X-Wing mini': ASSET_HOST + 'models/30051-1-X-wingFighter-Mini.mpd_Packed.mpd',
  				'AT-ST mini': ASSET_HOST + 'models/30054-1-AT-ST-Mini.mpd_Packed.mpd',
  				'AT-AT mini': ASSET_HOST + 'models/4489-1-AT-AT-Mini.mpd_Packed.mpd',
  				'Shuttle': ASSET_HOST + 'models/4494-1-Imperial Shuttle-Mini.mpd_Packed.mpd',
  				'TIE Interceptor': ASSET_HOST + 'models/6965-1-TIEIntercep_4h4MXk5.mpd_Packed.mpd',
  				'Star fighter': ASSET_HOST + 'models/6966-1-JediStarfighter-Mini.mpd_Packed.mpd',
  				'X-Wing': ASSET_HOST + 'models/7140-1-X-wingFighter.mpd_Packed.mpd',
  				'AT-ST': ASSET_HOST + 'models/10174-1-ImperialAT-ST-UCS.mpd_Packed.mpd',
  				'Window': ASSET_HOST + 'models/6156-1-WindowBrick.mpd_Packed.mpd'
  			};
  
  			
  
  
  				
  
  
  				//
  
  				
  
  
  				renderer.toneMapping = THREE.ACESFilmicToneMapping;
  
  
  				// scene
  
  				const pmremGenerator = new THREE.PMREMGenerator( renderer );
  
  				
  				scene.background = new THREE.Color( 0xdeebed );
  				scene.environment = pmremGenerator.fromScene( new RoomEnvironment(), 0.04 ).texture;
  
  				
  				controls.enableDamping = true;
  
  				//
  
  				guiData = {
  					modelFileName: modelFileList[ 'Car' ],
  					displayLines: true,
  					conditionalLines: true,
  					smoothNormals: true,
  					buildingStep: 0,
  					noBuildingSteps: 'No steps.',
  					flatColors: false,
  					mergeModel: false
  				};
  
  				
  
  				progressBarDiv = document.createElement( 'div' );
  				progressBarDiv.innerText = 'Loading...';
  				progressBarDiv.style.fontSize = '3em';
  				progressBarDiv.style.color = '#888';
  				progressBarDiv.style.display = 'block';
  				progressBarDiv.style.position = 'absolute';
  				progressBarDiv.style.top = '50%';
  				progressBarDiv.style.width = '100%';
  				progressBarDiv.style.textAlign = 'center';
  
  
  				// load materials and then the model
  
  				reloadObject( true );
  
  			
  
  
  			function updateObjectsVisibility() {
  
  				model.traverse( (c: any) => {
  
  					if ( c.isLineSegments ) {
  
  						if ( c.isConditionalLine ) {
  
  							c.visible = guiData.conditionalLines;
  
  						} else {
  
  							c.visible = guiData.displayLines;
  
  						}
  
  					} else if ( c.isGroup ) {
  
  						// Hide objects with building step > gui setting
  						c.visible = c.userData.buildingStep <= guiData.buildingStep;
  
  					}
  
  				} );
  
  			}
  
  			function reloadObject( resetCamera: any ) {
  
  				if ( model ) {
  
  					scene.remove( model );
  
  				}
  
  				model = null;
  
  				updateProgressBar( 0 );
  				showProgressBar();
  
  				// only smooth when not rendering with flat colors to improve processing time
  				const lDrawLoader = new LDrawLoader();
  				lDrawLoader.setConditionalLineMaterial( LDrawConditionalLineMaterial );
  				lDrawLoader.smoothNormals = guiData.smoothNormals && ! guiData.flatColors;
  				lDrawLoader
  					.setPath( ldrawPath )
  					.load( guiData.modelFileName, function ( group2 ) {
  
  						if ( model ) {
  
  							scene.remove( model );
  
  						}
  
  						model = group2;
  
  						// demonstrate how to use convert to flat colors to better mimic the lego instructions look
  						if ( guiData.flatColors ) {
  
  							function convertMaterial( material: any ) {
  
  								const newMaterial = new THREE.MeshBasicMaterial();
  								newMaterial.color!.copy( material.color );
  								newMaterial.polygonOffset = material.polygonOffset;
  								newMaterial.polygonOffsetUnits = material.polygonOffsetUnits;
  								newMaterial.polygonOffsetFactor = material.polygonOffsetFactor;
  								newMaterial.opacity = material.opacity;
  								newMaterial.transparent = material.transparent;
  								newMaterial.depthWrite = material.depthWrite;
  								newMaterial.toneMapped = false;
  
  								return newMaterial;
  
  							}
  
  							model.traverse( (c: any) => {
  
  								if ( c.isMesh ) {
  
  									if ( Array.isArray( c.material ) ) {
  
  										c.material = c.material.map( convertMaterial );
  
  									} else {
  
  										c.material = convertMaterial( c.material );
  
  									}
  
  								}
  
  							} );
  
  						}
  
  						// Merge model geometries by material
  						if ( guiData.mergeModel ) model = LDrawUtils.mergeObject( model );
  
  						// Convert from LDraw coordinates: rotate 180 degrees around OX
  						model.rotation.x = Math.PI;
  
  						scene.add( model );
  
  						guiData.buildingStep = model.userData.numBuildingSteps - 1;
  
  						updateObjectsVisibility();
  
  						// Adjust camera and light
  
  						const bbox = new THREE.Box3().setFromObject( model );
  						const size = bbox.getSize( new THREE.Vector3() );
  						const radius = Math.max( size.x, Math.max( size.y, size.z ) ) * 0.5;
  
  						if ( resetCamera ) {
  
  							controls.target0.copy( bbox.getCenter( new THREE.Vector3() ) );
  							controls.position0.set( - 2.3, 1, 2 ).multiplyScalar( radius ).add( controls.target0 );
  							controls.reset();
  
  						}
  
  						createGUI();
  
  						hideProgressBar();
  
  					}, onProgress, onError );
  
  			}
  
  			
  
  			function createGUI() {
  
  				if ( gui ) {
  
  					gui.destroy();
  
  				}
  
  				gui = new GUI();
  
  				gui.add( guiData, 'modelFileName', modelFileList ).name( 'Model' ).onFinishChange( function () {
  
  					reloadObject( true );
  
  				} );
  
  				gui.add( guiData, 'flatColors' ).name( 'Flat Colors' ).onChange( function () {
  
  					reloadObject( false );
  
  				} );
  
  				gui.add( guiData, 'mergeModel' ).name( 'Merge model' ).onChange( function () {
  
  					reloadObject( false );
  
  				} );
  
  				if ( model.userData.numBuildingSteps > 1 ) {
  
  					gui.add( guiData, 'buildingStep', 0, model.userData.numBuildingSteps - 1 ).step( 1 ).name( 'Building step' ).onChange( updateObjectsVisibility );
  
  				} else {
  
  					gui.add( guiData, 'noBuildingSteps' ).name( 'Building step' ).onChange( updateObjectsVisibility );
  
  				}
  
  				gui.add( guiData, 'smoothNormals' ).name( 'Smooth Normals' ).onChange( function changeNormals() {
  
  					reloadObject( false );
  
  				} );
  
  				gui.add( guiData, 'displayLines' ).name( 'Display Lines' ).onChange( updateObjectsVisibility );
  				gui.add( guiData, 'conditionalLines' ).name( 'Conditional Lines' ).onChange( updateObjectsVisibility );
  
  			}
  
  			//
  
  			__stage.addUpdateCallback((_delta: any, _elapsed: any) => {
    {
    }
  })
  
  			function render() {
  
  
  
  			}
  
  			function onProgress( xhr: any ) {
  
  				if ( xhr.lengthComputable ) {
  
  					updateProgressBar( xhr.loaded / xhr.total );
  
  					console.log( Math.round( xhr.loaded / xhr.total * 100 ) + '% downloaded' );
  
  				}
  
  			}
  
  			function onError( error: any ) {
  
  				const message = 'Error loading model';
  				progressBarDiv.innerText = message;
  				console.log( message );
  				console.error( error );
  
  			}
  
  			function showProgressBar() {
  
  				document.body.appendChild( progressBarDiv );
  
  			}
  
  			function hideProgressBar() {
  
  				document.body.removeChild( progressBarDiv );
  
  			}
  
  			function updateProgressBar( fraction: any ) {
  
  				progressBarDiv.innerText = 'Loading... ' + Math.round( fraction * 100 ) + '%';
  
  			}
  
  		
}
</script>
