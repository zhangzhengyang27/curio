<template>
  <ExampleScene
    camera="perspective"
    :camera-position="[0, 5, 5]"
    :camera-options="{ fov: 45, near: 0.2, far: 100 }"
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
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

const props = defineProps({
  example: {
    type: Object,
    default: () => ({})
  }
})

const infoHtml = "<a href=\"https://threejs.org\" target=\"_blank\" rel=\"noopener\">three.js</a> - WebGL morph target example"
function onReady(__stage) {
  const ASSET_HOST = props.example?.globals?.ASSET_HOST || '/threejs-official/'
  let scene = __stage.scene
  let camera = __stage.camera
  let renderer = __stage.renderer
  const controls = __stage.controls

  
  
  
  
  
  
  
  
  			let sign = 1;
  			const speed = 0.5;
  
  			
  
  
  				const container = __stage.container;
  
  				
  
  
  				
  
  				timer = new THREE.Timer();
  				timer.connect( document );
  
  				const light1 = new THREE.PointLight( 0xff2200, 50000 );
  				light1.position.set( 100, 100, 100 );
  				scene.add( light1 );
  
  				const light2 = new THREE.PointLight( 0x22ff00, 10000 );
  				light2.position.set( - 100, - 100, - 100 );
  				scene.add( light2 );
  
  				scene.add( new THREE.AmbientLight( 0x111111 ) );
  
  				const loader = new GLTFLoader();
  				loader.load( ASSET_HOST + 'models/gltf/AnimatedMorphSphere/glTF/AnimatedMorphSphere.gltf', function ( gltf ) {
  
  					mesh = gltf.scene.getObjectByName( 'AnimatedMorphSphere' );
  					mesh.rotation.z = Math.PI / 2;
  					scene.add( mesh );
  
  					//
  
  					const pointsMaterial = new THREE.PointsMaterial( {
  						size: 10,
  						sizeAttenuation: false,
  						map: new THREE.TextureLoader().load( ASSET_HOST + 'textures/sprites/disc.png' ),
  						alphaTest: 0.5
  					} );
  
  					const points = new THREE.Points( mesh.geometry, pointsMaterial );
  					points.morphTargetInfluences = mesh.morphTargetInfluences;
  					points.morphTargetDictionary = mesh.morphTargetDictionary;
  					mesh.add( points );
  
  				} );
  
  				//
  
  				
  
  
  				//
  
  
  				controls.minDistance = 1;
  				controls.maxDistance = 20;
  
  				//
  
  				
  
  			
  
  
  			
  
  			__stage.addUpdateCallback((_delta, _elapsed) => {
    timer.update();
    {
    const delta = timer.getDelta();
    				if ( mesh !== undefined ) {
    					const step = delta * speed;
    					mesh.rotation.y += step;
    					mesh.morphTargetInfluences[ 1 ] = mesh.morphTargetInfluences[ 1 ] + step * sign;
    					if ( mesh.morphTargetInfluences[ 1 ] <= 0 || mesh.morphTargetInfluences[ 1 ] >= 1 ) {
    						sign *= - 1;
    					}
    				}
    }
  })
  
  			function render() {
  
  				const delta = timer.getDelta();
  
  				if ( mesh !== undefined ) {
  
  					const step = delta * speed;
  
  					mesh.rotation.y += step;
  
  					mesh.morphTargetInfluences[ 1 ] = mesh.morphTargetInfluences[ 1 ] + step * sign;
  
  					if ( mesh.morphTargetInfluences[ 1 ] <= 0 || mesh.morphTargetInfluences[ 1 ] >= 1 ) {
  
  						sign *= - 1;
  
  					}
  
  				}
  
  
  
  			}
  
  		
}
</script>
