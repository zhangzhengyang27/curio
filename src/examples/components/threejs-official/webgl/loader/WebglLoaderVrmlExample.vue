<template>
  <ExampleScene
    camera="perspective"
    :camera-position="[-10, 5, 10]"
    :camera-options="{ fov: 60, near: 0.1, far: 10000000000 }"
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
import { onUnmounted } from 'vue'

let gui: any = null
import ExampleScene from '@/examples/components/ExampleScene.vue'
import * as THREE from 'three';
import Stats from 'three/examples/jsm/libs/stats.module.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { VRMLLoader } from 'three/examples/jsm/loaders/VRMLLoader.js';
import { GUI } from 'three/examples/jsm/libs/lil-gui.module.min.js';

const props = defineProps({
  example: {
    type: Object,
    default: () => ({})
  }
})

const infoHtml = "<a href=\"https://threejs.org\" target=\"_blank\" rel=\"noopener\">three.js</a> - VRML loader"
function onReady(__stage: any) {
  const ASSET_HOST = props.example?.globals?.ASSET_HOST || '/threejs-official/'
  let scene = __stage.scene
  let camera = __stage.camera
  let renderer = __stage.renderer
  const controls = __stage.controls
  

  
  
  
  
  
  			let stats, loader: any;
  
  			const params = {
  				asset: 'house'
  			};
  
  			const assets = [
  				'creaseAngle',
  				'crystal',
  				'house',
  				'elevationGrid1',
  				'elevationGrid2',
  				'extrusion1',
  				'extrusion2',
  				'extrusion3',
  				'lines',
  				'linesTransparent',
  				'meshWithLines',
  				'meshWithTexture',
  				'pixelTexture',
  				'points',
  				'camera',
  				'multilineString'
  			];
  
  			let vrmlScene: any;
  
  			
  
  
  				
  
  
  				
  				scene.add( camera );
  
  				// light
  
  				const ambientLight = new THREE.AmbientLight( 0xffffff, 1.2 );
  				scene.add( ambientLight );
  
  				const dirLight = new THREE.DirectionalLight( 0xffffff, 2.0 );
  				dirLight.position.set( 200, 200, 200 );
  				scene.add( dirLight );
  
  				loader = new VRMLLoader();
  				loadAsset( params.asset );
  
  				// renderer
  
  				
  
  
  				// controls
  
  				
  				controls.minDistance = 1;
  				controls.maxDistance = 200;
  				controls.enableDamping = true;
  
  				//
  
  				stats = new Stats();
  				__stage.overlay?.appendChild(stats.dom)
  
  				//
  
  				
  
  				//
  
  				gui = new GUI();
  				gui.add( params, 'asset', assets ).onChange( function ( value: any ) {
  
  					if ( vrmlScene ) {
  
  						vrmlScene.traverse( function ( object: any ) {
  
  							if ( object.material ) object.material.dispose();
  							if ( object.material && object.material.map ) object.material.map.dispose();
  							if ( object.geometry ) object.geometry.dispose();
  
  						} );
  
  						scene.remove( vrmlScene );
  
  					}
  
  					loadAsset( value );
  
  				} );
  
  			
  
  
  			function loadAsset( asset: any ) {
  
  				loader.load( ASSET_HOST + 'models/vrml/' + asset + '.wrl', function ( object: any ) {
  
  					vrmlScene = object;
  					scene.add( object );
  					controls.reset();
  
  				} );
  
  			}
  
  			
  
  			__stage.addUpdateCallback((_delta: any, _elapsed: any) => {
    stats.update();
  })
  
  		
}

onUnmounted(() => {
  gui?.destroy()
})
</script>
