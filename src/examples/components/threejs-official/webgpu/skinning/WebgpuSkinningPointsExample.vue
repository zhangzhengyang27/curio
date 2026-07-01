<template>
  <WebGPUExampleScene
    camera="perspective"
    antialias
    :camera-position="[0, 300, -85]"
    :camera-options="{ fov: 50, near: 1, far: 1000 }"
    @ready="onReady">
    <template #default>
      <div class="example-info" v-html="infoHtml" />
    </template>
  </WebGPUExampleScene>
</template>

<script setup>
import WebGPUExampleScene from '@/examples/components/WebGPUExampleScene.vue'
import * as THREE from 'three/webgpu';
import { color, computeSkinning, objectWorldMatrix, instancedArray, instanceIndex, Fn, shapeCircle } from 'three/tsl';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

const props = defineProps({
  example: {
    type: Object,
    default: () => ({})
  }
})

const infoHtml = "<a href=\"https://threejs.org/\" target=\"_blank\" rel=\"noopener\" class=\"logo-link\"></a>\n\n\t\t\t<div class=\"title-wrapper\">\n\t\t\t\t<a href=\"https://threejs.org/\" target=\"_blank\" rel=\"noopener\">three.js</a><span>Skinning Points</span>"
function onReady(__stage) {
  const ASSET_HOST = props.example?.globals?.ASSET_HOST || '/threejs-official/'
  let scene = __stage.scene
  let camera = __stage.camera
  let renderer = __stage.renderer
  const controls = __stage.controls

  
  			let mixer, timer;
  
  			
  
  
  				
  
  
  				
  				scene.background = new THREE.Color( 0x111111 );
  
  
  				scene.add( new THREE.AmbientLight( 0xffffff, 10 ) );
  
  				timer = new THREE.Timer();
  				timer.connect( document );
  
  				const loader = new GLTFLoader();
  				loader.load( ASSET_HOST + 'models/gltf/Michelle.glb', function ( gltf ) {
  
  					const object = gltf.scene;
  					mixer = new THREE.AnimationMixer( object );
  
  					const action = mixer.clipAction( gltf.animations[ 0 ] );
  					action.play();
  
  					object.traverse( function ( child ) {
  
  						if ( child.isMesh ) {
  
  							child.visible = false;
  
  							const countOfPoints = child.geometry.getAttribute( 'position' ).count;
  
  							const pointPositionArray = instancedArray( countOfPoints, 'vec3' ).setPBO( true );
  							const pointSpeedArray = instancedArray( countOfPoints, 'vec3' ).setPBO( true );
  
  							const pointSpeedAttribute = pointSpeedArray.toAttribute();
  							const skinningPosition = computeSkinning( child );
  
  							const materialPoints = new THREE.PointsNodeMaterial();
  							materialPoints.colorNode = pointSpeedAttribute.mul( .6 ).mix( color( 0x0066ff ), color( 0xff9000 ) );
  							materialPoints.opacityNode = shapeCircle();
  							materialPoints.sizeNode = pointSpeedAttribute.length().exp().min( 5 ).mul( 5 ).add( 1 );
  							materialPoints.sizeAttenuation = false;
  							materialPoints.alphaTest = 0.5;
  
  							const updateSkinningPoints = Fn( () => {
  
  								const pointPosition = pointPositionArray.element( instanceIndex );
  								const pointSpeed = pointSpeedArray.element( instanceIndex );
  
  								const skinningWorldPosition = objectWorldMatrix( child ).mul( skinningPosition );
  
  								const skinningSpeed = skinningWorldPosition.sub( pointPosition );
  
  								pointSpeed.assign( skinningSpeed );
  								pointPosition.assign( skinningWorldPosition );
  
  							}, 'void' );
  
  							materialPoints.positionNode = Fn( () => {
  
  								updateSkinningPoints();
  
  								return pointPositionArray.toAttribute();
  
  							} )().compute( countOfPoints ).onInit( () => {
  
  								// initialize point positions and speeds
  
  								renderer.compute( updateSkinningPoints().compute( countOfPoints ) );
  
  							} );
  
  							const pointCloud = new THREE.Sprite( materialPoints );
  							pointCloud.count = countOfPoints;
  							scene.add( pointCloud );
  
  						}
  
  					} );
  
  					object.scale.set( 100, 100, 100 );
  					object.rotation.x = - Math.PI / 2;
  
  					scene.add( object );
  
  				} );
  
  				//renderer
  
  				
  
  
  				
  
  			
  
  
  			
  
  			__stage.addUpdateCallback((_delta, _elapsed) => {
    timer.update();
    				const delta = timer.getDelta();
    				if ( mixer ) mixer.update( delta );
  })
  
  		
}
</script>
