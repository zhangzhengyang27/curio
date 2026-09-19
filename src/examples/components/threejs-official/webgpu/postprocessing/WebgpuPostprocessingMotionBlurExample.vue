<template>
  <WebGPUExampleScene
    camera="perspective"
    :camera-position="[0, 1.5, 4.5]"
    :camera-options="{ fov: 50, near: 0.25, far: 30 }"
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
import { pass, texture, uniform, output, mrt, velocity, uv, screenUV, vec4 } from 'three/tsl';
import { motionBlur } from 'three/examples/jsm/tsl/display/MotionBlur.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { Inspector } from 'three/examples/jsm/inspector/Inspector.js';

const props = defineProps({
  example: {
    type: Object,
    default: () => ({})
  }
})

const infoHtml = "<a href=\"https://threejs.org/\" target=\"_blank\" rel=\"noopener\" class=\"logo-link\"></a>\n\n\t\t\t<div class=\"title-wrapper\">\n\t\t\t\t<a href=\"https://threejs.org/\" target=\"_blank\" rel=\"noopener\">three.js</a><span>Motion Blur</span>"
function onReady(__stage: any) {
  const ASSET_HOST = props.example?.globals?.ASSET_HOST || '/threejs-official/'
  let scene = __stage.scene
  let camera = __stage.camera
  let renderer = __stage.renderer
  const controls = __stage.controls
  

  
  			let boxLeft, boxRight, model: any, mixer: any, timer;
  			let renderPipeline;
  
  
  			const params = {
  				speed: 1.0
  			};
  
  			
  
  
  				
  
  
  				
  				scene.fog = new THREE.Fog( 0x0487e2, 7, 25 );
  
  				const sunLight = new THREE.DirectionalLight( 0xFFE499, 5 );
  				sunLight.castShadow = true;
  				sunLight.shadow.camera.near = .1;
  				sunLight.shadow.camera.far = 10;
  				sunLight.shadow.camera.right = 2;
  				sunLight.shadow.camera.left = - 2;
  				sunLight.shadow.camera.top = 2;
  				sunLight.shadow.camera.bottom = - 2;
  				sunLight.shadow.mapSize.width = 1024;
  				sunLight.shadow.mapSize.height = 1024;
  				sunLight.position.set( 4, 4, 2 );
  
  				const waterAmbientLight = new THREE.HemisphereLight( 0x333366, 0x74ccf4, 5 );
  				const skyAmbientLight = new THREE.HemisphereLight( 0x74ccf4, 0, 1 );
  
  				scene.add( sunLight );
  				scene.add( skyAmbientLight );
  				scene.add( waterAmbientLight );
  
  				timer = new THREE.Timer();
  				timer.connect( document );
  
  				// animated model
  
  				const loader = new GLTFLoader();
  				loader.load( ASSET_HOST + 'models/gltf/Xbot.glb', function ( gltf ) {
  
  					model = gltf.scene;
  
  					model.rotation.y = Math.PI / 2;
  
  					model.traverse( function ( child: any ) {
  
  						if ( child.isMesh ) {
  
  							child.castShadow = true;
  							child.receiveShadow = true;
  
  						}
  
  					} );
  
  					mixer = new THREE.AnimationMixer( model );
  
  					const action = mixer.clipAction( gltf.animations[ 3 ] );
  					action.play();
  
  					scene.add( model );
  
  				} );
  
  				// textures
  
  				const textureLoader = new THREE.TextureLoader();
  
  				const floorColor = textureLoader.load( ASSET_HOST + 'textures/floors/FloorsCheckerboard_S_Diffuse.jpg' );
  				floorColor.wrapS = THREE.RepeatWrapping;
  				floorColor.wrapT = THREE.RepeatWrapping;
  				floorColor.colorSpace = THREE.SRGBColorSpace;
  
  				const floorNormal = textureLoader.load( ASSET_HOST + 'textures/floors/FloorsCheckerboard_S_Normal.jpg' );
  				floorNormal.wrapS = THREE.RepeatWrapping;
  				floorNormal.wrapT = THREE.RepeatWrapping;
  
  				// floor
  
  				const floorUV = uv().mul( 5 );
  
  				const floorMaterial = new THREE.MeshPhongNodeMaterial();
  				floorMaterial.colorNode = texture( floorColor, floorUV );
  
  				const floor = new THREE.Mesh( new THREE.BoxGeometry( 15, .001, 15 ), floorMaterial );
  				floor.receiveShadow = true;
  
  				floor.position.set( 0, 0, 0 );
  				scene.add( floor );
  
  				const walls = new THREE.Mesh( new THREE.BoxGeometry( 15, 15, 15 ), new THREE.MeshPhongNodeMaterial( { colorNode: floorMaterial.colorNode, side: THREE.BackSide } ) );
  				scene.add( walls );
  
  				const map = new THREE.TextureLoader().load( ASSET_HOST + 'textures/uv_grid_opengl.jpg' );
  				map.colorSpace = THREE.SRGBColorSpace;
  
  				const geometry = new THREE.TorusGeometry( .8 );
  				const material = new THREE.MeshBasicMaterial( { map } );
  
  				boxRight = new THREE.Mesh( geometry, material );
  				boxRight.position.set( 3.5, 1.5, - 4 );
  				scene.add( boxRight );
  
  				boxLeft = new THREE.Mesh( geometry, material );
  				boxLeft.position.set( - 3.5, 1.5, - 4 );
  				scene.add( boxLeft );
  
  				// renderer
  
  				
  
  
  				renderer.shadowMap.enabled = true;
  				renderer.inspector = new Inspector();
  
  
  				
  				controls.minDistance = 1;
  				controls.maxDistance = 10;
  				controls.maxPolarAngle = Math.PI / 2;
  				controls.autoRotate = true;
  				controls.autoRotateSpeed = 1;
  				controls.target.set( 0, 1, 0 );
  				controls.enableDamping = true;
  				controls.dampingFactor = 0.05;
  				controls.update();
  
  				// post-processing
  
  				const blurAmount = uniform( 1 );
  
  				const scenePass = pass( scene, camera );
  
  				scenePass.setMRT( mrt( {
  					output,
  					velocity
  				} ) );
  
  				const beauty = scenePass.getTextureNode().toInspector( 'Color' );
  				const vel = scenePass.getTextureNode( 'velocity' ).toInspector( 'Velocity' ).mul( blurAmount );
  
  				const mBlur = motionBlur( beauty, vel );
  
  				const vignette = screenUV.distance( .5 ).remap( .6, 1 ).mul( 2 ).clamp().oneMinus();
  
  				renderPipeline = new THREE.RenderPipeline( renderer );
  				renderPipeline.outputNode = vec4( mBlur.mul( vignette ).rgb, mBlur.a );
  
  				//
  
  				const gui = renderer.inspector.createParameters( 'Motion Blur Settings' );
  				gui.add( controls, 'autoRotate' );
  				gui.add( blurAmount, 'value', 0, 3 ).name( 'blur amount' );
  				gui.add( params, 'speed', 0, 2 );
  
  				//
  
  				
  
  			
  
  
  			
  
  			__stage.addUpdateCallback((_delta: any, _elapsed: any) => {
    timer.update();
    				const delta = timer.getDelta();
    				const speed = params.speed;
    				boxRight.rotation.y += delta * 4 * speed;
    				boxLeft.scale.setScalar( 1 + Math.sin( timer.getElapsed() * 10 * speed ) * .2 );
    				if ( model ) {
    					mixer.update( delta * speed );
    				}
    				renderPipeline.render();
  })
  
  		
}
</script>
