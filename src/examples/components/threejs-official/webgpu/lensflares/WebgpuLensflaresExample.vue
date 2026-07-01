<template>
  <WebGPUExampleScene
    camera="perspective"
    :camera-options="{ fov: 40, near: 1, far: 15000 }"
    :enable-controls="false"
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
import { FlyControls } from 'three/examples/jsm/controls/FlyControls.js';
import { LensflareMesh, LensflareElement } from 'three/examples/jsm/objects/LensflareMesh.js';
import { Inspector } from 'three/examples/jsm/inspector/Inspector.js';

const props = defineProps({
  example: {
    type: Object,
    default: () => ({})
  }
})

const infoHtml = "<a href=\"https://threejs.org/\" target=\"_blank\" rel=\"noopener\" class=\"logo-link\"></a>\n\n\t\t\t<div class=\"title-wrapper\">\n\t\t\t\t<a href=\"https://threejs.org/\" target=\"_blank\" rel=\"noopener\">three.js</a><span>Lens Flares</span>"
function onReady(__stage) {
  const ASSET_HOST = props.example?.globals?.ASSET_HOST || '/threejs-official/'
  let scene = __stage.scene
  let camera = __stage.camera
  let renderer = __stage.renderer
  const controls = __stage.controls
  

  
  
  
  
  			let container;
  
  
  
  			const timer = new THREE.Timer();
  			timer.connect( document );
  
  			
  
  
  				// camera
  
  				
  				camera.position.z = 250;
  
  				// scene
  
  				
  				scene.background = new THREE.Color().setHSL( 0.51, 0.4, 0.01, THREE.SRGBColorSpace );
  				scene.fog = new THREE.Fog( scene.background, 3500, 15000 );
  
  				// world
  
  				const s = 250;
  
  				const geometry = new THREE.BoxGeometry( s, s, s );
  				const material = new THREE.MeshPhongNodeMaterial( { color: 0xffffff, specular: 0xffffff, shininess: 50 } );
  
  				for ( let i = 0; i < 3000; i ++ ) {
  
  					const mesh = new THREE.Mesh( geometry, material );
  
  					mesh.position.x = 8000 * ( 2.0 * Math.random() - 1.0 );
  					mesh.position.y = 8000 * ( 2.0 * Math.random() - 1.0 );
  					mesh.position.z = 8000 * ( 2.0 * Math.random() - 1.0 );
  
  					mesh.rotation.x = Math.random() * Math.PI;
  					mesh.rotation.y = Math.random() * Math.PI;
  					mesh.rotation.z = Math.random() * Math.PI;
  
  					mesh.matrixAutoUpdate = false;
  					mesh.updateMatrix();
  
  					scene.add( mesh );
  
  				}
  
  
  				// lights
  
  				const dirLight = new THREE.DirectionalLight( 0xffffff, 0.15 );
  				dirLight.position.set( 0, - 1, 0 ).normalize();
  				dirLight.color.setHSL( 0.1, 0.7, 0.5 );
  				scene.add( dirLight );
  
  				// lensflares
  				const textureLoader = new THREE.TextureLoader();
  
  				const textureFlare0 = textureLoader.load( ASSET_HOST + 'textures/lensflare/lensflare0.png' );
  				const textureFlare3 = textureLoader.load( ASSET_HOST + 'textures/lensflare/lensflare3.png' );
  
  				textureFlare0.colorSpace = THREE.SRGBColorSpace;
  				textureFlare3.colorSpace = THREE.SRGBColorSpace;
  
  				addLight( 0.55, 0.95, 0.6, 5000, 0, - 1000 );
  				addLight( 0.1, 0.85, 0.65, 0, 0, - 1000 );
  				addLight( 0.995, 0.5, 0.95, 5000, 5000, - 1000 );
  
  				function addLight( h, s, l, x, y, z ) {
  
  					const light = new THREE.PointLight( 0xffffff, 1.5, 2000, 0 );
  					light.color.setHSL( h, s, l );
  					light.position.set( x, y, z );
  					scene.add( light );
  
  					const lensflare = new LensflareMesh();
  					lensflare.addElement( new LensflareElement( textureFlare0, 700, 0, light.color ) );
  					lensflare.addElement( new LensflareElement( textureFlare3, 60, 0.6 ) );
  					lensflare.addElement( new LensflareElement( textureFlare3, 70, 0.7 ) );
  					lensflare.addElement( new LensflareElement( textureFlare3, 120, 0.9 ) );
  					lensflare.addElement( new LensflareElement( textureFlare3, 70, 1 ) );
  					light.add( lensflare );
  
  				}
  
  				// renderer
  
  				
  
  
  				renderer.inspector = new Inspector();
  
  
  				//
  
  				
  
  				controls.movementSpeed = 2500;
  				controls.domElement = container;
  				controls.rollSpeed = Math.PI / 6;
  				controls.autoForward = false;
  				controls.dragToLook = false;
  
  				// events
  
  				
  
  			
  
  
  			//
  
  			
  
  			//
  
  			__stage.addUpdateCallback((_delta, _elapsed) => {
    timer.update();
    {
    const delta = timer.getDelta();
    				controls.update( delta );
    }
  })
  
  			function render() {
  
  				const delta = timer.getDelta();
  
  				controls.update( delta );
  
  
  			}
  
  		
}
</script>
