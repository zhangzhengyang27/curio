<template>
  <ExampleScene
    camera="perspective"
    antialias
    :camera-position="[4.25, 1.4, -4.5]"
    :camera-options="{ fov: 40, near: 0.1, far: 100 }"
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
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader, DRACO_GLTF_CONFIG } from 'three/examples/jsm/loaders/DRACOLoader.js';
import { HDRLoader } from 'three/examples/jsm/loaders/HDRLoader.js';

const props = defineProps({
  example: {
    type: Object,
    default: () => ({})
  }
})

const infoHtml = "<a href=\"https://threejs.org\" target=\"_blank\" rel=\"noopener\">three.js</a> car materials<br/>\n\t\t\tFerrari 458 Italia model by <a href=\"https://sketchfab.com/models/57bf6cc56931426e87494f554df1dab6\" target=\"_blank\" rel=\"noopener\">vicent091036</a>\n\t\t\t<br><br>\n\t\t\t<span class=\"colorPicker\"><input id=\"body-color\" type=\"color\" value=\"#ff0000\"></input><br/>Body</span>\n\t\t\t<span class=\"colorPicker\"><input id=\"details-color\" type=\"color\" value=\"#ffffff\"></input><br/>Details</span>\n\t\t\t<span class=\"colorPicker\"><input id=\"glass-color\" type=\"color\" value=\"#ffffff\"></input><br/>Glass</span>"
function onReady(__stage) {
  const ASSET_HOST = props.example?.globals?.ASSET_HOST || '/threejs-official/'
  let scene = __stage.scene
  let camera = __stage.camera
  let renderer = __stage.renderer
  const controls = __stage.controls
  

  
  			let stats;
  
  			let grid;
  
  
  			const wheels = [];
  
  			
  
  
  				const container = document.getElementById( 'container' );
  
  				
  
  
  				renderer.toneMapping = THREE.ACESFilmicToneMapping;
  				renderer.toneMappingExposure = 0.85;
  
  
  				
  
  				stats = new Stats();
  				__stage.overlay?.appendChild(stats.dom)
  
  				//
  
  				
  
  
  				
  				controls.maxDistance = 9;
  				controls.maxPolarAngle = THREE.MathUtils.degToRad( 90 );
  				controls.target.set( 0, 0.5, 0 );
  				controls.update();
  
  				
  				scene.background = new THREE.Color( 0x333333 );
  				scene.environment = new HDRLoader().load( ASSET_HOST + 'textures/equirectangular/venice_sunset_1k.hdr' );
  				scene.environment.mapping = THREE.EquirectangularReflectionMapping;
  				scene.fog = new THREE.Fog( 0x333333, 10, 15 );
  
  				grid = new THREE.GridHelper( 20, 40, 0xffffff, 0xffffff );
  				grid.material.opacity = 0.2;
  				grid.material.depthWrite = false;
  				grid.material.transparent = true;
  				scene.add( grid );
  
  				// materials
  
  				const bodyMaterial = new THREE.MeshPhysicalMaterial( {
  					color: 0xff0000, metalness: 1.0, roughness: 0.5, clearcoat: 1.0, clearcoatRoughness: 0.03
  				} );
  
  				const detailsMaterial = new THREE.MeshStandardMaterial( {
  					color: 0xffffff, metalness: 1.0, roughness: 0.5
  				} );
  
  				const glassMaterial = new THREE.MeshPhysicalMaterial( {
  					color: 0xffffff, metalness: 0.25, roughness: 0, transmission: 1.0
  				} );
  
  				const bodyColorInput = document.getElementById( 'body-color' );
  				bodyColorInput.addEventListener( 'input', function () {
  
  					bodyMaterial.color.set( this.value );
  
  				} );
  
  				const detailsColorInput = document.getElementById( 'details-color' );
  				detailsColorInput.addEventListener( 'input', function () {
  
  					detailsMaterial.color.set( this.value );
  
  				} );
  
  				const glassColorInput = document.getElementById( 'glass-color' );
  				glassColorInput.addEventListener( 'input', function () {
  
  					glassMaterial.color.set( this.value );
  
  				} );
  
  				// Car
  
  				const shadow = new THREE.TextureLoader().load( ASSET_HOST + 'models/gltf/ferrari_ao.png' );
  
  				const dracoLoader = new DRACOLoader();
  				dracoLoader.setDecoderPath( DRACO_GLTF_CONFIG );
  
  				const loader = new GLTFLoader();
  				loader.setDRACOLoader( dracoLoader );
  
  				loader.load( ASSET_HOST + 'models/gltf/ferrari.glb', function ( gltf ) {
  
  					const carModel = gltf.scene.children[ 0 ];
  
  					carModel.getObjectByName( 'body' ).material = bodyMaterial;
  
  					carModel.getObjectByName( 'rim_fl' ).material = detailsMaterial;
  					carModel.getObjectByName( 'rim_fr' ).material = detailsMaterial;
  					carModel.getObjectByName( 'rim_rr' ).material = detailsMaterial;
  					carModel.getObjectByName( 'rim_rl' ).material = detailsMaterial;
  					carModel.getObjectByName( 'trim' ).material = detailsMaterial;
  
  					carModel.getObjectByName( 'glass' ).material = glassMaterial;
  
  					wheels.push(
  						carModel.getObjectByName( 'wheel_fl' ),
  						carModel.getObjectByName( 'wheel_fr' ),
  						carModel.getObjectByName( 'wheel_rl' ),
  						carModel.getObjectByName( 'wheel_rr' )
  					);
  
  					// shadow
  					const mesh = new THREE.Mesh(
  						new THREE.PlaneGeometry( 0.655 * 4, 1.3 * 4 ),
  						new THREE.MeshBasicMaterial( {
  							map: shadow, blending: THREE.MultiplyBlending, toneMapped: false, transparent: true, premultipliedAlpha: true
  						} )
  					);
  					mesh.rotation.x = - Math.PI / 2;
  					mesh.renderOrder = 2;
  					carModel.add( mesh );
  
  					scene.add( carModel );
  
  				} );
  
  			
  
  
  			
  
  			__stage.addUpdateCallback((_delta, _elapsed) => {
    const time = - performance.now() / 1000;
    				for ( let i = 0; i < wheels.length; i ++ ) {
    					wheels[ i ].rotation.x = time * Math.PI * 2;
    				}
    				grid.position.z = - ( time ) % 1;
    				stats.update();
  })
  
}
</script>
