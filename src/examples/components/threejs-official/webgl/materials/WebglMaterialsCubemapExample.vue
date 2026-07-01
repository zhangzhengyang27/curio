<template>
  <ExampleScene
    camera="perspective"
    antialias
    :camera-options="{ fov: 50, near: 0.1, far: 100 }"
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
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js';

const props = defineProps({
  example: {
    type: Object,
    default: () => ({})
  }
})

const infoHtml = "<a href=\"https://threejs.org\" target=\"_blank\" rel=\"noopener\">three.js</a> - cube mapping demo.<br />\n\t\t\tTexture by <a href=\"http://www.humus.name/index.php?page=Textures\" target=\"_blank\" rel=\"noopener\">Humus</a>, Walt Disney head by <a href=\"http://web.archive.org/web/20120903131400/http://davidoreilly.com/post/18087489343/disneyhead\" target=\"_blank\" rel=\"noopener\">David OReilly</a>"
function onReady(__stage) {
  const ASSET_HOST = props.example?.globals?.ASSET_HOST || '/threejs-official/'
  let scene = __stage.scene
  let camera = __stage.camera
  let renderer = __stage.renderer
  const controls = __stage.controls

  
  
  
  
  
  			let container, stats;
  
  
  			let pointLight;
  
  			
  
  
  				
  				camera.position.z = 13;
  
  				//cubemap
  				const path = ASSET_HOST + 'textures/cube/SwedishRoyalCastle/';
  				const format = '.jpg';
  				const urls = [
  					path + 'px' + format, path + 'nx' + format,
  					path + 'py' + format, path + 'ny' + format,
  					path + 'pz' + format, path + 'nz' + format
  				];
  
  				const reflectionCube = new THREE.CubeTextureLoader().load( urls );
  				const refractionCube = new THREE.CubeTextureLoader().load( urls );
  				refractionCube.mapping = THREE.CubeRefractionMapping;
  
  				
  				scene.background = reflectionCube;
  
  				//lights
  				const ambient = new THREE.AmbientLight( 0xffffff, 3 );
  				scene.add( ambient );
  
  				pointLight = new THREE.PointLight( 0xffffff, 200 );
  				scene.add( pointLight );
  
  				//materials
  				const cubeMaterial3 = new THREE.MeshLambertMaterial( { color: 0xffaa00, envMap: reflectionCube, combine: THREE.MixOperation, reflectivity: 0.3 } );
  				const cubeMaterial2 = new THREE.MeshLambertMaterial( { color: 0xfff700, envMap: refractionCube, refractionRatio: 0.95 } );
  				const cubeMaterial1 = new THREE.MeshLambertMaterial( { color: 0xffffff, envMap: reflectionCube } );
  
  				//models
  				const objLoader = new OBJLoader();
  
  				objLoader.setPath( ASSET_HOST + 'models/obj/walt/' );
  				objLoader.load( 'WaltHead.obj', function ( object ) {
  
  					const head = object.children[ 0 ];
  					head.scale.setScalar( 0.1 );
  					head.position.y = - 3;
  					head.material = cubeMaterial1;
  
  					const head2 = head.clone();
  					head2.position.x = - 6;
  					head2.material = cubeMaterial2;
  
  					const head3 = head.clone();
  					head3.position.x = 6;
  					head3.material = cubeMaterial3;
  
  					scene.add( head, head2, head3 );
  
  				} );
  
  				//renderer
  				
  
  
  				//controls
  
  				controls.enableZoom = false;
  				controls.enablePan = false;
  				controls.minPolarAngle = Math.PI / 4;
  				controls.maxPolarAngle = Math.PI / 1.5;
  
  				//stats
  				stats = new Stats();
  				__stage.overlay?.appendChild(stats.dom)
  
  				
  
  			
  
  
  			
  
  			__stage.addUpdateCallback((_delta, _elapsed) => {
    stats.update();
  })
  
  		
}
</script>
