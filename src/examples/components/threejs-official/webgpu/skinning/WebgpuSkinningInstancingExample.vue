<template>
  <WebGPUExampleScene
    camera="perspective"
    antialias
    :camera-position="[1, 2, 3]"
    :camera-look-at="[0, 1, 0]"
    :camera-options="{ fov: 50, near: 0.01, far: 40 }"
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
import { pass, mix, range, color, oscSine, time } from 'three/tsl';
import { gaussianBlur } from 'three/examples/jsm/tsl/display/GaussianBlurNode.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

const props = defineProps({
  example: {
    type: Object,
    default: () => ({})
  }
})

const infoHtml = "<a href=\"https://threejs.org/\" target=\"_blank\" rel=\"noopener\" class=\"logo-link\"></a>\n\n\t\t\t<div class=\"title-wrapper\">\n\t\t\t\t<a href=\"https://threejs.org/\" target=\"_blank\" rel=\"noopener\">three.js</a><span>Skinning Instancing</span>"
function onReady(__stage: any) {
  const ASSET_HOST = props.example?.globals?.ASSET_HOST || '/threejs-official/'
  let scene = __stage.scene
  let camera = __stage.camera
  let renderer = __stage.renderer
  const controls = __stage.controls

  
  			let renderPipeline;
  
  			let mixer: any, timer;
  
  			
  
  
  				
  
  
  				
  
  
  				timer = new THREE.Timer();
  				timer.connect( document );
  
  				// lights
  
  				const centerLight = new THREE.PointLight( 0xff9900, 1, 100 );
  				centerLight.position.y = 4.5;
  				centerLight.position.z = - 2;
  				centerLight.power = 400;
  				scene.add( centerLight );
  
  				const cameraLight = new THREE.PointLight( 0x0099ff, 1, 100 );
  				cameraLight.power = 400;
  				camera.add( cameraLight );
  				scene.add( camera );
  
  				const geometry = new THREE.PlaneGeometry( 1000, 1000 );
  				geometry.rotateX( - Math.PI / 2 );
  
  				const plane = new THREE.Mesh( geometry, new THREE.MeshBasicMaterial( { color: 0x000000, visible: true } ) );
  				scene.add( plane );
  
  				const loader = new GLTFLoader();
  				loader.load( ASSET_HOST + 'models/gltf/Michelle.glb', function ( gltf ) {
  
  					const object = gltf.scene;
  
  					mixer = new THREE.AnimationMixer( object );
  
  					const action = mixer.clipAction( gltf.animations[ 0 ] );
  					action.play();
  
  					const instanceCount = 30;
  					const dummy = new THREE.Object3D();
  
  					object.traverse( ( child: any ) => {
  
  						if ( child.isMesh ) {
  
  							const oscNode = oscSine( time.mul( .1 ) );
  
  							// random colors between instances from 0x000000 to 0xFFFFFF
  							const randomColors = range( new THREE.Color( 0x000000 ), new THREE.Color( 0xFFFFFF ) );
  
  							// random [ 0, 1 ] values between instances
  							const randomMetalness = range( 0, 1 );
  
  							child.material = new THREE.MeshStandardNodeMaterial();
  							child.material.roughness = .1;
  							child.material.metalnessNode = mix( 0.0, randomMetalness, oscNode );
  							child.material.colorNode = mix( color( 0xFFFFFF ), randomColors, oscNode );
  
  							child.isInstancedMesh = true;
  							child.instanceMatrix = new THREE.InstancedBufferAttribute( new Float32Array( instanceCount * 16 ), 16 );
  							child.count = instanceCount;
  
  							for ( let i = 0; i < instanceCount; i ++ ) {
  
  								dummy.position.x = - 200 + ( ( i % 5 ) * 70 );
  								dummy.position.y = Math.floor( i / 5 ) * - 200;
  
  								dummy.updateMatrix();
  
  								dummy.matrix.toArray( child.instanceMatrix.array, i * 16 );
  
  							}
  
  						}
  
  					} );
  
  					scene.add( object );
  
  				} );
  
  				// renderer
  
  				
  
  
  				// post processing
  
  				const scenePass = pass( scene, camera );
  				const scenePassColor = scenePass.getTextureNode();
  				const scenePassDepth = scenePass.getLinearDepthNode().remapClamp( .15, .3 );
  
  				const scenePassColorBlurred = gaussianBlur( scenePassColor );
  				scenePassColorBlurred.directionNode = scenePassDepth;
  
  				renderPipeline = new THREE.RenderPipeline( renderer );
  				renderPipeline.outputNode = scenePassColorBlurred;
  
  
  				// events
  
  				
  
  			
  
  
  			
  
  			__stage.addUpdateCallback((_delta: any, _elapsed: any) => {
    timer.update();
    				const delta = timer.getDelta();
    				if ( mixer ) mixer.update( delta );
    				renderPipeline.render();
  })
  
  		
}
</script>
