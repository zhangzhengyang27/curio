<template>
  <WebGPUExampleScene
    camera="perspective"
    antialias
    :camera-position="[16, 4, 1]"
    :camera-options="{ fov: 35, near: 0.1, far: 100 }"
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
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { IESLoader } from 'three/examples/jsm/loaders/IESLoader.js';
import { Inspector } from 'three/examples/jsm/inspector/Inspector.js';

let lights: any;


const props = defineProps({
  example: {
    type: Object,
    default: () => ({})
  }
})

const ASSET_HOST = props.example?.globals?.ASSET_HOST || '/threejs-official/'

const infoHtml = "<a href=\"https://threejs.org/\" target=\"_blank\" rel=\"noopener\" class=\"logo-link\"></a>\n\n\t\t\t<div class=\"title-wrapper\">\n\t\t\t\t<a href=\"https://threejs.org/\" target=\"_blank\" rel=\"noopener\">three.js</a><span>IES Spot Light</span>"
async function onReady(__stage: any) {
  let scene = __stage.scene
  let camera = __stage.camera
  let renderer = __stage.renderer
  const controls = __stage.controls

  
  
  
  			async function init() {
  
  				const iesLoader = new IESLoader().setPath( ASSET_HOST + 'ies/' );
  				//iesLoader.type = THREE.UnsignedByteType; // LDR
  
  				const [ iesTexture1, iesTexture2, iesTexture3, iesTexture4 ] = await Promise.all( [
  					iesLoader.loadAsync( '007cfb11e343e2f42e3b476be4ab684e.ies' ),
  					iesLoader.loadAsync( '06b4cfdc8805709e767b5e2e904be8ad.ies' ),
  					iesLoader.loadAsync( '02a7562c650498ebb301153dbbf59207.ies' ),
  					iesLoader.loadAsync( '1a936937a49c63374e6d4fbed9252b29.ies' )
  				] );
  
  				//
  
  				
  
  				//
  
  				const spotLight = new THREE.IESSpotLight( 0xff0000, 500 );
  				spotLight.position.set( 6.5, 3, 6.5 );
  				spotLight.angle = Math.PI / 8;
  				spotLight.penumbra = 0.7;
  				spotLight.distance = 20;
  				spotLight.castShadow = true;
  				spotLight.iesMap = iesTexture1;
  				spotLight.userData.helper = new THREE.SpotLightHelper( spotLight );
  				scene.add( spotLight );
  				scene.add( spotLight.target );
  				scene.add( spotLight.userData.helper );
  
  				//
  
  				const spotLight2 = new THREE.IESSpotLight( 0x00ff00, 500 );
  				spotLight2.position.set( - 6.5, 3, 6.5 );
  				spotLight2.angle = Math.PI / 8;
  				spotLight2.penumbra = 0.7;
  				spotLight2.distance = 20;
  				spotLight2.castShadow = true;
  				spotLight2.iesMap = iesTexture2;
  				spotLight2.userData.helper = new THREE.SpotLightHelper( spotLight2 );
  				scene.add( spotLight2 );
  				scene.add( spotLight2.target );
  				scene.add( spotLight2.userData.helper );
  
  				//
  
  				const spotLight3 = new THREE.IESSpotLight( 0x0000ff, 500 );
  				spotLight3.position.set( - 6.5, 3, - 6.5 );
  				spotLight3.angle = Math.PI / 8;
  				spotLight3.penumbra = 0.7;
  				spotLight3.distance = 20;
  				spotLight3.castShadow = true;
  				spotLight3.iesMap = iesTexture3;
  				spotLight3.userData.helper = new THREE.SpotLightHelper( spotLight3 );
  				scene.add( spotLight3 );
  				scene.add( spotLight3.target );
  				scene.add( spotLight3.userData.helper );
  
  				//
  
  				const spotLight4 = new THREE.IESSpotLight( 0xffffff, 500 );
  				spotLight4.position.set( 6.5, 3, - 6.5 );
  				spotLight4.angle = Math.PI / 8;
  				spotLight4.penumbra = 0.7;
  				spotLight4.distance = 20;
  				spotLight4.castShadow = true;
  				spotLight4.iesMap = iesTexture4;
  				spotLight4.userData.helper = new THREE.SpotLightHelper( spotLight4 );
  				scene.add( spotLight4 );
  				scene.add( spotLight4.target );
  				scene.add( spotLight4.userData.helper );
  
  				//
  
  				lights = [ spotLight, spotLight2, spotLight3, spotLight4 ];
  
  				//
  
  				const material = new THREE.MeshPhongMaterial( { color: 0x999999/*, dithering: true*/ } );
  
  				const geometry = new THREE.PlaneGeometry( 200, 200 );
  
  				const mesh = new THREE.Mesh( geometry, material );
  				mesh.rotation.x = - Math.PI * 0.5;
  				mesh.receiveShadow = true;
  				scene.add( mesh );
  
  				const geometry2 = new THREE.BoxGeometry( 2, 2, 2 );
  				//const geometry2 = new THREE.IcosahedronGeometry( 1, 5 );
  
  				const mesh2 = new THREE.Mesh( geometry2, material );
  				mesh2.position.y = 1;
  				mesh2.castShadow = true;
  				scene.add( mesh2 );
  
  				//
  
  				
  
  
  				renderer.shadowMap.enabled = true;
  				renderer.inspector = new Inspector();
  
  
  				
  
  
  
  				controls.minDistance = 2;
  				controls.maxDistance = 50;
  				controls.enablePan = false;
  
  				//
  
  				function setHelperVisible( value: any ) {
  
  					for ( let i = 0; i < lights.length; i ++ ) {
  
  						lights[ i ].userData.helper.visible = value;
  
  					}
  
  				}
  
  				setHelperVisible( false );
  
  				//
  
  				const gui = renderer.inspector.createParameters( 'Settings' );
  				gui.add( { helper: false }, 'helper' ).onChange( ( v: any ) => setHelperVisible( v ) );
  
  				//
  
  				
  
  			}
  
  			
  
  			function render( time: any ) {
  
  				time = time / 1000;
  
  				for ( let i = 0; i < lights.length; i ++ ) {
  
  					const t = ( Math.sin( ( time + i ) * ( Math.PI / 2 ) ) + 1 ) / 2;
  
  					const x = THREE.MathUtils.lerp( lights[ i ].position.x, 0, t );
  					const z = THREE.MathUtils.lerp( lights[ i ].position.z, 0, t );
  
  					lights[ i ].target.position.x = x;
  					lights[ i ].target.position.z = z;
  					if ( lights[ i ].userData.helper ) lights[ i ].userData.helper.update();
  
  				}
  
  
  
  			}
  
  			init();
  
  		
}
</script>
