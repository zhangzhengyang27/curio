<template>
  <WebGPUExampleScene
    camera="perspective"
    :camera-look-at="[0, 0, 0]"
    :camera-options="{ fov: 40, near: 0.1, far: 10 }"
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

const props = defineProps({
  example: {
    type: Object,
    default: () => ({})
  }
})

const infoHtml = "<a href=\"https://threejs.org/\" target=\"_blank\" rel=\"noopener\" class=\"logo-link\"></a>\n\n\t\t\t<div class=\"title-wrapper\">\n\t\t\t\t<a href=\"https://threejs.org/\" target=\"_blank\" rel=\"noopener\">three.js</a><span>Array Camera</span>"
function onReady(__stage) {
  let scene = __stage.scene
  let camera = __stage.camera
  let renderer = __stage.renderer
  const controls = __stage.controls

  
  			let mesh;
  
  			const AMOUNT = 6;
  
  			
  
  
  				const subCameras = [];
  
  				for ( let i = 0; i < AMOUNT * AMOUNT; i ++ ) {
  
  					const subCamera = new THREE.PerspectiveCamera( 40, 1, 0.1, 10 );
  					subCamera.viewport = new THREE.Vector4();
  
  					subCameras.push( subCamera );
  
  				}
  
  				camera = new THREE.ArrayCamera( subCameras );
  				camera.position.z = 3;
  
  				updateCameras();
  
  				
  
  				scene.add( new THREE.AmbientLight( 0x999999 ) );
  
  				const light = new THREE.DirectionalLight( 0xffffff, 3 );
  				light.position.set( 0.5, 0.5, 1 );
  				light.castShadow = true;
  				light.shadow.camera.zoom = 4; // tighter shadow map
  				scene.add( light );
  
  				const geometryBackground = new THREE.PlaneGeometry( 100, 100 );
  				const materialBackground = new THREE.MeshPhongMaterial( { color: 0x000066 } );
  
  				const background = new THREE.Mesh( geometryBackground, materialBackground );
  				background.receiveShadow = true;
  				background.position.set( 0, 0, - 1 );
  				scene.add( background );
  
  				const geometryCylinder = new THREE.CylinderGeometry( 0.5, 0.5, 1, 32 );
  				const materialCylinder = new THREE.MeshPhongMaterial( { color: 0xff0000 } );
  
  				mesh = new THREE.Mesh( geometryCylinder, materialCylinder );
  				mesh.castShadow = true;
  				mesh.receiveShadow = true;
  				scene.add( mesh );
  
  				
  
  
  				renderer.shadowMap.enabled = true;
  
  
  				//
  
  				
  
  			
  
  
  			function updateCameras() {
  
  				const ASPECT_RATIO = (__stage.container?.clientWidth || window.innerWidth) / (__stage.container?.clientHeight || window.innerHeight);
  				const WIDTH = (__stage.container?.clientWidth || window.innerWidth) / AMOUNT;
  				const HEIGHT = (__stage.container?.clientHeight || window.innerHeight) / AMOUNT;
  
  				camera.aspect = ASPECT_RATIO;
  				camera.updateProjectionMatrix();
  
  				for ( let y = 0; y < AMOUNT; y ++ ) {
  
  					for ( let x = 0; x < AMOUNT; x ++ ) {
  
  						const subcamera = camera.cameras[ AMOUNT * y + x ];
  						subcamera.copy( camera ); // copy fov, aspect ratio, near, far from the root camera
  
  						subcamera.viewport.set( Math.floor( x * WIDTH ), Math.floor( y * HEIGHT ), Math.ceil( WIDTH ), Math.ceil( HEIGHT ) );
  						subcamera.updateProjectionMatrix();
  
  						subcamera.position.x = ( x / AMOUNT ) - 0.5;
  						subcamera.position.y = 0.5 - ( y / AMOUNT );
  						subcamera.position.z = 1.5 + ( ( x + y ) * .5 );
  						subcamera.position.multiplyScalar( 2 );
  
  						subcamera.lookAt( 0, 0, 0 );
  						subcamera.updateMatrixWorld();
  
  					}
  
  				}
  
  			}
  
  			
  
  			__stage.addUpdateCallback((_delta, _elapsed) => {
    mesh.rotation.x += 0.005;
    				mesh.rotation.z += 0.01;
  })
  
  		
  __stage.setCamera(camera)
}
</script>
