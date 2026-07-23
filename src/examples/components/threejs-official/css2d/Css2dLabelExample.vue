<template>
  <ExampleScene
    camera="perspective"
    :camera-position="[10, 5, 20]"
    :camera-options="{ fov: 45, near: 0.1, far: 200 }"
    css-renderer="css2d"
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
import { onUnmounted } from 'vue'

import ExampleScene from '@/examples/components/ExampleScene.vue'
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { CSS2DRenderer, CSS2DObject } from 'three/examples/jsm/renderers/CSS2DRenderer.js';
import { GUI } from 'three/examples/jsm/libs/lil-gui.module.min.js';

const props = defineProps({
  example: {
    type: Object,
    default: () => ({})
  }
})

const infoHtml = "<a href=\"https://threejs.org\" target=\"_blank\" rel=\"noopener\">three.js</a> css2d - label"
function onReady(__stage) {
  const ASSET_HOST = props.example?.globals?.ASSET_HOST || '/threejs-official/'
  let scene = __stage.scene
  let camera = __stage.camera
  let renderer = __stage.renderer
  const controls = __stage.controls

  
  
  
  
  
  			let gui;
  
  			let labelRenderer;
  
  			const layers = {
  
  				'Toggle Name': function () {
  
  					camera.layers.toggle( 0 );
  
  				},
  				'Toggle Mass': function () {
  
  					camera.layers.toggle( 1 );
  
  				},
  				'Enable All': function () {
  
  					camera.layers.enableAll();
  
  				},
  
  				'Disable All': function () {
  
  					camera.layers.disableAll();
  
  				}
  
  			};
  
  			const timer = new THREE.Timer();
  			timer.connect( document );
  			const textureLoader = new THREE.TextureLoader();
  
  			let moon;
  
  				const EARTH_RADIUS = 1;
  				const MOON_RADIUS = 0.27;
  
  				
  
  				camera.layers.enableAll();
  
  				
  
  				const dirLight = new THREE.DirectionalLight( 0xffffff, 3 );
  				dirLight.position.set( 0, 0, 1 );
  				dirLight.layers.enableAll();
  				scene.add( dirLight );
  
  				const axesHelper = new THREE.AxesHelper( 5 );
  				axesHelper.layers.enableAll();
  				scene.add( axesHelper );
  
  				//
  
  				const earthGeometry = new THREE.SphereGeometry( EARTH_RADIUS, 16, 16 );
  				const earthMaterial = new THREE.MeshPhongMaterial( {
  					specular: 0x333333,
  					shininess: 5,
  					map: textureLoader.load( ASSET_HOST + 'textures/planets/earth_atmos_2048.jpg' ),
  					specularMap: textureLoader.load( ASSET_HOST + 'textures/planets/earth_specular_2048.jpg' ),
  					normalMap: textureLoader.load( ASSET_HOST + 'textures/planets/earth_normal_2048.jpg' ),
  					normalScale: new THREE.Vector2( 0.85, 0.85 )
  				} );
  				earthMaterial.map.colorSpace = THREE.SRGBColorSpace;
  				const earth = new THREE.Mesh( earthGeometry, earthMaterial );
  				scene.add( earth );
  
  				const moonGeometry = new THREE.SphereGeometry( MOON_RADIUS, 16, 16 );
  				const moonMaterial = new THREE.MeshPhongMaterial( {
  					shininess: 5,
  					map: textureLoader.load( ASSET_HOST + 'textures/planets/moon_1024.jpg' )
  				} );
  				moonMaterial.map.colorSpace = THREE.SRGBColorSpace;
  				moon = new THREE.Mesh( moonGeometry, moonMaterial );
  				scene.add( moon );
  
  				//
  
  				earth.layers.enableAll();
  				moon.layers.enableAll();
  
  				const earthDiv = document.createElement( 'div' );
  				earthDiv.className = 'label';
  				earthDiv.textContent = 'Earth';
  				earthDiv.style.backgroundColor = 'transparent';
  
  				const earthLabel = new CSS2DObject( earthDiv );
  				earthLabel.position.set( 1.5 * EARTH_RADIUS, 0, 0 );
  				earthLabel.center.set( 0, 1 );
  				earth.add( earthLabel );
  				earthLabel.layers.set( 0 );
  
  				const earthMassDiv = document.createElement( 'div' );
  				earthMassDiv.className = 'label';
  				earthMassDiv.textContent = '5.97237e24 kg';
  				earthMassDiv.style.backgroundColor = 'transparent';
  
  				const earthMassLabel = new CSS2DObject( earthMassDiv );
  				earthMassLabel.position.set( 1.5 * EARTH_RADIUS, 0, 0 );
  				earthMassLabel.center.set( 0, 0 );
  				earth.add( earthMassLabel );
  				earthMassLabel.layers.set( 1 );
  
  				const moonDiv = document.createElement( 'div' );
  				moonDiv.className = 'label';
  				moonDiv.textContent = 'Moon';
  				moonDiv.style.backgroundColor = 'transparent';
  
  				const moonLabel = new CSS2DObject( moonDiv );
  				moonLabel.position.set( 1.5 * MOON_RADIUS, 0, 0 );
  				moonLabel.center.set( 0, 1 );
  				moon.add( moonLabel );
  				moonLabel.layers.set( 0 );
  
  				const moonMassDiv = document.createElement( 'div' );
  				moonMassDiv.className = 'label';
  				moonMassDiv.textContent = '7.342e22 kg';
  				moonMassDiv.style.backgroundColor = 'transparent';
  
  				const moonMassLabel = new CSS2DObject( moonMassDiv );
  				moonMassLabel.position.set( 1.5 * MOON_RADIUS, 0, 0 );
  				moonMassLabel.center.set( 0, 0 );
  				moon.add( moonMassLabel );
  				moonMassLabel.layers.set( 1 );
  
  				//
  
  				
  
  
  
  
  				labelRenderer = new CSS2DRenderer();
  				labelRenderer.setSize( (__stage.container?.clientWidth || window.innerWidth), (__stage.container?.clientHeight || window.innerHeight) );
  				labelRenderer.domElement.style.position = 'absolute';
  				labelRenderer.domElement.style.top = '0px';
  				document.body.appendChild( labelRenderer.domElement );
  
  
  				controls.minDistance = 5;
  				controls.maxDistance = 100;
  
  				//
  
  				
  
  				initGui();
  
  			
  
  
  			
  
  
  			__stage.addUpdateCallback((_delta, _elapsed) => {
    timer.update();
    				const elapsed = timer.getElapsed();
    				moon.position.set( Math.sin( elapsed ) * 5, 0, Math.cos( elapsed ) * 5 );
    				labelRenderer.render( scene, camera );
  })
  
  			//
  
  			function initGui() {
  
  				gui = new GUI();
  
  				gui.title( 'Camera Layers' );
  
  				gui.add( layers, 'Toggle Name' );
  				gui.add( layers, 'Toggle Mass' );
  				gui.add( layers, 'Enable All' );
  				gui.add( layers, 'Disable All' );
  
  				gui.open();
  
  			}
  
  		
}

onUnmounted(() => {
  gui?.destroy()
})
</script>
