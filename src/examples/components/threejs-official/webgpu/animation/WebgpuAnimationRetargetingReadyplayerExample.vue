<template>
  <WebGPUExampleScene
    camera="perspective"
    antialias
    :camera-position="[0, 3, 5]"
    :camera-options="{ fov: 40, near: 0.25, far: 50 }"
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
import { screenUV, color, vec2, vec4, reflector, positionWorld } from 'three/tsl';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader.js';
import { Inspector } from 'three/examples/jsm/inspector/Inspector.js';
import * as SkeletonUtils from 'three/examples/jsm/utils/SkeletonUtils.js';

const props = defineProps({
  example: {
    type: Object,
    default: () => ({})
  }
})

const infoHtml = "<a href=\"https://threejs.org/\" target=\"_blank\" rel=\"noopener\" class=\"logo-link\"></a>\n\n\t\t\t<div class=\"title-wrapper\">\n\t\t\t\t<a href=\"https://threejs.org/\" target=\"_blank\" rel=\"noopener\">three.js</a><span>Animation Retargeting</span>"
async function onReady(__stage) {
  const scene = __stage.scene
  const camera = __stage.camera
  const renderer = __stage.renderer
  const controls = __stage.controls

  
  
  
  
  
  			const [ sourceModel, targetModel ] = await Promise.all( [
  
  				new Promise( ( resolve, reject ) => {
  
  					new FBXLoader().load( './models/fbx/mixamo.fbx', resolve, undefined, reject );
  
  				} ),
  
  				new Promise( ( resolve, reject ) => {
  
  					new GLTFLoader().load( './models/gltf/readyplayer.me.glb', resolve, undefined, reject );
  
  				} )
  
  			] );
  
  			//
  
  			const timer = new THREE.Timer();
  			timer.connect( document );
  
  			// scene
  
  
  
  			// background
  
  			const horizontalEffect = screenUV.x.mix( color( 0x13172b ), color( 0x311649 ) );
  			const lightEffect = screenUV.distance( vec2( 0.5, 1.0 ) ).oneMinus().mul( color( 0x0c5d68 ) );
  
  			scene.backgroundNode = horizontalEffect.add( lightEffect );
  
  			//
  
  			const light = new THREE.HemisphereLight( 0x311649, 0x0c5d68, 10 );
  			scene.add( light );
  
  			const backLight = new THREE.DirectionalLight( 0xffffff, 10 );
  			backLight.position.set( 0, 5, - 5 );
  			scene.add( backLight );
  
  			const keyLight = new THREE.DirectionalLight( 0xfff9ea, 4 );
  			keyLight.position.set( 3, 5, 3 );
  			scene.add( keyLight );
  
  
  
  
  			// add models to scene
  			scene.add( sourceModel );
  			scene.add( targetModel.scene );
  
  			// reposition models
  			sourceModel.position.x -= .9;
  			targetModel.scene.position.x += .9;
  
  			// reajust model - mixamo use centimeters, readyplayer.me use meters (three.js scale is meters)
  			sourceModel.scale.setScalar( .01 );
  
  			// retarget
  			const source = getSource( sourceModel );
  			const mixer = retargetModel( source, targetModel );
  
  			// renderer
  
  
  
  			renderer.inspector = new Inspector();
  			renderer.toneMapping = THREE.NeutralToneMapping;
  
  
  
  			controls.minDistance = 3;
  			controls.maxDistance = 12;
  			controls.target.set( 0, 1, 0 );
  			controls.maxPolarAngle = Math.PI / 2;
  
  			// floor
  			const reflection = reflector();
  			reflection.target.rotateX( - Math.PI / 2 );
  			scene.add( reflection.target );
  
  			const reflectionMask = positionWorld.xz.distance( 0 ).mul( .1 ).clamp().oneMinus();
  
  			const floorMaterial = new THREE.NodeMaterial();
  			floorMaterial.colorNode = vec4( reflection.rgb, reflectionMask );
  			floorMaterial.opacity = .2;
  			floorMaterial.transparent = true;
  
  			const floor = new THREE.Mesh( new THREE.BoxGeometry( 50, .001, 50 ), floorMaterial );
  			floor.receiveShadow = true;
  
  			floor.position.set( 0, 0, 0 );
  			scene.add( floor );
  
  			//
  
  			function getSource( sourceModel ) {
  
  				const clip = sourceModel.animations[ 0 ];
  
  				const helper = new THREE.SkeletonHelper( sourceModel );
  				const skeleton = new THREE.Skeleton( helper.bones );
  
  				const mixer = new THREE.AnimationMixer( sourceModel );
  				mixer.clipAction( sourceModel.animations[ 0 ] ).play();
  
  				return { clip, skeleton, mixer };
  
  			}
  
  			function retargetModel( sourceModel, targetModel ) {
  
  				const targetSkin = targetModel.scene.children[ 0 ].children[ 1 ];
  
  				const retargetOptions = {
  
  					// specify the name of the source's hip bone.
  					hip: 'mixamorigHips',
  
  					// preserve the scale of the target model
  					scale: .01,
  
  					// use ( 0, 1, 0 ) to ignore xz hip movement.
  					//hipInfluence: new THREE.Vector3( 0, 1, 0 ),
  
  					// Map of target's bone names to source's bone names -> { targetBoneName: sourceBoneName }
  					getBoneName: function ( bone ) {
  
  						return 'mixamorig' + bone.name;
  
  					}
  
  				};
  
  				const retargetedClip = SkeletonUtils.retargetClip( targetSkin, sourceModel.skeleton, sourceModel.clip, retargetOptions );
  
  				const mixer = new THREE.AnimationMixer( targetSkin );
  				mixer.clipAction( retargetedClip ).play();
  
  				return mixer;
  
  			}
  
  			
  
  			__stage.addUpdateCallback((_delta, _elapsed) => {
    timer.update();
    				const delta = timer.getDelta();
    				source.mixer.update( delta );
    				mixer.update( delta );
  })
  
  		
}
</script>
