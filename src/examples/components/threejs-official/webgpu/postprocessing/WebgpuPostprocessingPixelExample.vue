<template>
  <WebGPUExampleScene
    camera="perspective"
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
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { Inspector } from 'three/examples/jsm/inspector/Inspector.js';
import { uniform } from 'three/tsl';
import { pixelationPass } from 'three/examples/jsm/tsl/display/PixelationPassNode.js';

let effectController: any;


const props = defineProps({
  example: {
    type: Object,
    default: () => ({})
  }
})

const infoHtml = "<a href=\"https://threejs.org/\" target=\"_blank\" rel=\"noopener\" class=\"logo-link\"></a>\n\n\t\t<div class=\"title-wrapper\">\n\t\t\t<a href=\"https://threejs.org/\" target=\"_blank\" rel=\"noopener\">three.js</a><span>Pixelation</span>"
function onReady(__stage: any) {
  const ASSET_HOST = props.example?.globals?.ASSET_HOST || '/threejs-official/'
  let scene = __stage.scene
  let camera = __stage.camera
  let renderer = __stage.renderer
  const controls = __stage.controls

  
  
  
  
  
  		let renderPipeline, crystalMesh, timer;
  
  
  		
  
  
  			const aspectRatio = (__stage.container?.clientWidth || window.innerWidth) / (__stage.container?.clientHeight || window.innerHeight);
  
  			
  			camera.position.y = 2 * Math.tan( Math.PI / 6 );
  			camera.position.z = 2;
  
  			
  			scene.background = new THREE.Color( 0x151729 );
  
  			timer = new THREE.Timer();
  			timer.connect( document );
  
  			// textures
  
  			const loader = new THREE.TextureLoader();
  			const texChecker = pixelTexture( loader.load( ASSET_HOST + 'textures/checker.png' ) );
  			const texChecker2 = pixelTexture( loader.load( ASSET_HOST + 'textures/checker.png' ) );
  			texChecker.repeat.set( 3, 3 );
  			texChecker2.repeat.set( 1.5, 1.5 );
  
  			// meshes
  
  			const boxMaterial = new THREE.MeshPhongMaterial( { map: texChecker2 } );
  
  			function addBox( boxSideLength: any, x: any, z: any, rotation: any ) {
  
  				const mesh = new THREE.Mesh( new THREE.BoxGeometry( boxSideLength, boxSideLength, boxSideLength ), boxMaterial );
  				mesh.castShadow = true;
  				mesh.receiveShadow = true;
  				mesh.rotation.y = rotation;
  				mesh.position.y = boxSideLength / 2;
  				mesh.position.set( x, boxSideLength / 2 + .0001, z );
  				scene.add( mesh );
  				return mesh;
  
  			}
  
  			addBox( .4, 0, 0, Math.PI / 4 );
  			addBox( .5, - .5, - .5, Math.PI / 4 );
  
  			const planeSideLength = 2;
  			const planeMesh = new THREE.Mesh(
  				new THREE.PlaneGeometry( planeSideLength, planeSideLength ),
  				new THREE.MeshPhongMaterial( { map: texChecker } )
  			);
  			planeMesh.receiveShadow = true;
  			planeMesh.rotation.x = - Math.PI / 2;
  			scene.add( planeMesh );
  
  			const radius = .2;
  			const geometry = new THREE.IcosahedronGeometry( radius );
  			crystalMesh = new THREE.Mesh(
  				geometry,
  				new THREE.MeshPhongMaterial( {
  					color: 0x68b7e9,
  					emissive: 0x4f7e8b,
  					shininess: 10,
  					specular: 0xffffff
  				} )
  			);
  			crystalMesh.receiveShadow = true;
  			crystalMesh.castShadow = true;
  			scene.add( crystalMesh );
  
  			// lights
  
  			scene.add( new THREE.AmbientLight( 0x757f8e, 3 ) );
  
  			const directionalLight = new THREE.DirectionalLight( 0xfffecd, 1.5 );
  			directionalLight.position.set( 100, 100, 100 );
  			directionalLight.castShadow = true;
  			directionalLight.shadow.mapSize.set( 2048, 2048 );
  			scene.add( directionalLight );
  
  			const spotLight = new THREE.SpotLight( 0xffc100, 10, 10, Math.PI / 16, .02, 2 );
  			spotLight.position.set( 2, 2, 0 );
  			const target = spotLight.target;
  			scene.add( target );
  			target.position.set( 0, 0, 0 );
  			spotLight.castShadow = true;
  			scene.add( spotLight );
  
  			
  
  			renderer.inspector = new Inspector();
  			renderer.shadowMap.enabled = true;
  			renderer.shadowMap.type = THREE.BasicShadowMap;
  
  
  			effectController = {
  				pixelSize: uniform( 6 ),
  				normalEdgeStrength: uniform( 0.3 ),
  				depthEdgeStrength: uniform( 0.4 ),
  				pixelAlignedPanning: true
  			};
  
  			renderPipeline = new THREE.RenderPipeline( renderer );
  			const scenePass = pixelationPass( scene, camera, effectController.pixelSize, effectController.normalEdgeStrength, effectController.depthEdgeStrength );
  			renderPipeline.outputNode = scenePass;
  
  			
  
  
  			controls.maxZoom = 2;
  
  			// gui
  
  			const gui = renderer.inspector.createParameters( 'Settings' );
  			gui.add( effectController.pixelSize, 'value', 1, 16, 1 ).name( 'Pixel Size' );
  			gui.add( effectController.normalEdgeStrength, 'value', 0, 2, 0.05 ).name( 'Normal Edge Strength' );
  			gui.add( effectController.depthEdgeStrength, 'value', 0, 1, 0.05 ).name( 'Depth Edge Strength' );
  			gui.add( effectController, 'pixelAlignedPanning' );
  
  		
  
  
  		
  
  		__stage.addUpdateCallback((_delta: any, _elapsed: any) => {
    timer.update();
    			const t = timer.getElapsed();
    			crystalMesh.material.emissiveIntensity = Math.sin( t * 3 ) * .5 + .5;
    			crystalMesh.position.y = .7 + Math.sin( t * 2 ) * .05;
    			crystalMesh.rotation.y = stopGoEased( t, 2, 4 ) * 2 * Math.PI;
    			const rendererSize = renderer.getSize( new THREE.Vector2() );
    			const aspectRatio = rendererSize.x / rendererSize.y;
    			if ( effectController.pixelAlignedPanning ) {
    				const pixelSize = effectController.pixelSize.value;
    				pixelAlignFrustum( camera, aspectRatio, Math.floor( rendererSize.x / pixelSize ),
    					Math.floor( rendererSize.y / pixelSize ) );
    			} else if ( camera.left != - aspectRatio || camera.top != 1.0 ) {
    				// Reset the Camera Frustum if it has been modified
    				camera.left = - aspectRatio;
    				camera.right = aspectRatio;
    				camera.top = 1.0;
    				camera.bottom = - 1.0;
    				camera.updateProjectionMatrix();
    			}
    			renderPipeline.render();
  })
  
  		// Helper functions
  
  		function pixelTexture( texture: any ) {
  
  			texture.minFilter = THREE.NearestFilter;
  			texture.magFilter = THREE.NearestFilter;
  			texture.generateMipmaps = false;
  			texture.wrapS = THREE.RepeatWrapping;
  			texture.wrapT = THREE.RepeatWrapping;
  			texture.colorSpace = THREE.SRGBColorSpace;
  			return texture;
  
  		}
  
  		function easeInOutCubic( x: any ) {
  
  			return x ** 2 * 3 - x ** 3 * 2;
  
  		}
  
  		function linearStep( x: any, edge0: any, edge1: any ) {
  
  			const w = edge1 - edge0;
  			const m = 1 / w;
  			const y0 = - m * edge0;
  			return THREE.MathUtils.clamp( y0 + m * x, 0, 1 );
  
  		}
  
  		function stopGoEased( x: any, downtime: any, period: any ) {
  
  			const cycle = ( x / period ) | 0;
  			const tween = x - cycle * period;
  			const linStep = easeInOutCubic( linearStep( tween, downtime, period ) );
  			return cycle + linStep;
  
  		}
  
  		function pixelAlignFrustum( camera: any, aspectRatio: any, pixelsPerScreenWidth: any, pixelsPerScreenHeight: any ) {
  
  			// 0. Get Pixel Grid Units
  			const worldScreenWidth = ( ( camera.right - camera.left ) / camera.zoom );
  			const worldScreenHeight = ( ( camera.top - camera.bottom ) / camera.zoom );
  			const pixelWidth = worldScreenWidth / pixelsPerScreenWidth;
  			const pixelHeight = worldScreenHeight / pixelsPerScreenHeight;
  
  			// 1. Project the current camera position along its local rotation bases
  			const camPos = new THREE.Vector3(); camera.getWorldPosition( camPos );
  			const camRot = new THREE.Quaternion(); camera.getWorldQuaternion( camRot );
  			const camRight = new THREE.Vector3( 1.0, 0.0, 0.0 ).applyQuaternion( camRot );
  			const camUp = new THREE.Vector3( 0.0, 1.0, 0.0 ).applyQuaternion( camRot );
  			const camPosRight = camPos.dot( camRight );
  			const camPosUp = camPos.dot( camUp );
  
  			// 2. Find how far along its position is along these bases in pixel units
  			const camPosRightPx = camPosRight / pixelWidth;
  			const camPosUpPx = camPosUp / pixelHeight;
  
  			// 3. Find the fractional pixel units and convert to world units
  			const fractX = camPosRightPx - Math.round( camPosRightPx );
  			const fractY = camPosUpPx - Math.round( camPosUpPx );
  
  			// 4. Add fractional world units to the left/right top/bottom to align with the pixel grid
  			camera.left = - aspectRatio - ( fractX * pixelWidth );
  			camera.right = aspectRatio - ( fractX * pixelWidth );
  			camera.top = 1.0 - ( fractY * pixelHeight );
  			camera.bottom = - 1.0 - ( fractY * pixelHeight );
  			camera.updateProjectionMatrix();
  
  		}
  
  	
}
</script>
