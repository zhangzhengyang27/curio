<template>
  <ExampleScene
    camera="perspective"
    :camera-look-at="[0, 150, 0]"
    :camera-options="{ fov: 50, near: 1, far: 10000 }"
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
import Stats from 'three/examples/jsm/libs/stats.module.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

const props = defineProps({
  example: {
    type: Object,
    default: () => ({})
  }
})

const infoHtml = "<a href=\"https://threejs.org\" target=\"_blank\" rel=\"noopener\">three.js</a> webgl - morph targets - horse<br/>\n\t\t\tmodel by <a href=\"https://mirada.com/\" target=\"_blank\" rel=\"noopener\">mirada</a> from <a href=\"http://www.ro.me\" target=\"_blank\" rel=\"noopener\">rome</a>"
function onReady(__stage: any) {
  const ASSET_HOST = props.example?.globals?.ASSET_HOST || '/threejs-official/'
  let scene = __stage.scene
  let camera = __stage.camera
  let renderer = __stage.renderer
  const controls = __stage.controls

  
  
  
  
  
  			let container, stats;
  
  			let mesh, mixer: any;
  
  			const radius = 600;
  			let theta = 0;
  			let prevTime = Date.now();
  
  			
  
  
  				//
  
  				
  				camera.position.y = 300;
  
  				
  				scene.background = new THREE.Color( 0xf0f0f0 );
  
  				//
  
  				const light1 = new THREE.DirectionalLight( 0xefefff, 5 );
  				light1.position.set( 1, 1, 1 ).normalize();
  				scene.add( light1 );
  
  				const light2 = new THREE.DirectionalLight( 0xffefef, 5 );
  				light2.position.set( - 1, - 1, - 1 ).normalize();
  				scene.add( light2 );
  
  				const loader = new GLTFLoader();
  				loader.load( ASSET_HOST + 'models/gltf/Horse.glb', function ( gltf ) {
  
  					mesh = gltf.scene.children[ 0 ];
  					mesh.scale.set( 1.5, 1.5, 1.5 );
  					scene.add( mesh );
  
  					mixer = new THREE.AnimationMixer( mesh );
  
  					mixer.clipAction( gltf.animations[ 0 ] ).setDuration( 1 ).play();
  
  				} );
  
  				//
  
  				
  
  
  				//
  
  				stats = new Stats();
  				__stage.overlay?.appendChild(stats.dom)
  
  				//
  
  				
  
  			
  
  
  			
  
  			//
  
  			__stage.addUpdateCallback((_delta: any, _elapsed: any) => {
    {
    theta += 0.1;
    				camera.position.x = radius * Math.sin( THREE.MathUtils.degToRad( theta ) );
    				camera.position.z = radius * Math.cos( THREE.MathUtils.degToRad( theta ) );
    				if ( mixer ) {
    					const time = Date.now();
    					mixer.update( ( time - prevTime ) * 0.001 );
    					prevTime = time;
    				}
    }
    				stats.update();
  })
  
  			function render() {
  
  				theta += 0.1;
  
  				camera.position.x = radius * Math.sin( THREE.MathUtils.degToRad( theta ) );
  				camera.position.z = radius * Math.cos( THREE.MathUtils.degToRad( theta ) );
  
  
  
  				if ( mixer ) {
  
  					const time = Date.now();
  
  					mixer.update( ( time - prevTime ) * 0.001 );
  
  					prevTime = time;
  
  				}
  
  
  
  			}
  
  		
}
</script>
