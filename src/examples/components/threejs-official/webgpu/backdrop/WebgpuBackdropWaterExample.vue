<template>
  <WebGPUExampleScene
    camera="perspective"
    :camera-position="[3, 2, 4]"
    :camera-look-at="[0, 1, 0]"
    :camera-options="{ fov: 50, near: 0.25, far: 30 }"
    @ready="onReady">
    <template #default>
      <div class="example-info" v-html="infoHtml" />
    </template>
  </WebGPUExampleScene>
</template>

<script setup>
import WebGPUExampleScene from '@/examples/components/WebGPUExampleScene.vue'
import * as THREE from 'three/webgpu';
import { color, vec2, pass, linearDepth, normalWorld, triplanarTexture, texture, objectPosition, screenUV, viewportLinearDepth, viewportDepthTexture, viewportSharedTexture, mx_worley_noise_float, positionWorld, time } from 'three/tsl';
import { gaussianBlur } from 'three/examples/jsm/tsl/display/GaussianBlurNode.js';
import { Inspector } from 'three/examples/jsm/inspector/Inspector.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

const props = defineProps({
  example: {
    type: Object,
    default: () => ({})
  }
})

const infoHtml = "<a href=\"https://threejs.org/\" target=\"_blank\" rel=\"noopener\" class=\"logo-link\"></a>\n\n\t\t\t<div class=\"title-wrapper\">\n\t\t\t\t<a href=\"https://threejs.org/\" target=\"_blank\" rel=\"noopener\">three.js</a><span>Backdrop Water</span>"
function onReady(__stage) {
  const ASSET_HOST = props.example?.globals?.ASSET_HOST || '/threejs-official/'
  let scene = __stage.scene
  let camera = __stage.camera
  let renderer = __stage.renderer
  

  
  			let mixer, objects, timer;
  			let model, floor, floorPosition;
  			let renderPipeline;
  
  
  			
  
  
  				
  
  
  				
  				scene.fog = new THREE.Fog( 0x0487e2, 7, 25 );
  				scene.backgroundNode = normalWorld.y.mix( color( 0x0487e2 ), color( 0x0066ff ) );
  
  
  				const sunLight = new THREE.DirectionalLight( 0xFFE499, 5 );
  				sunLight.position.set( .5, 3, .5 );
  
  				const waterAmbientLight = new THREE.HemisphereLight( 0x333366, 0x74ccf4, 5 );
  				const skyAmbientLight = new THREE.HemisphereLight( 0x74ccf4, 0, 1 );
  
  				scene.add( sunLight );
  				scene.add( skyAmbientLight );
  				scene.add( waterAmbientLight );
  
  				timer = new THREE.Timer();
  				timer.connect( document );
  
  				// animated model
  
  				const loader = new GLTFLoader();
  				loader.load( ASSET_HOST + 'models/gltf/Michelle.glb', function ( gltf ) {
  
  					model = gltf.scene;
  
  					mixer = new THREE.AnimationMixer( model );
  
  					const action = mixer.clipAction( gltf.animations[ 0 ] );
  					action.play();
  
  					scene.add( model );
  
  				} );
  
  				// objects
  
  				const textureLoader = new THREE.TextureLoader();
  				const iceDiffuse = textureLoader.load( './textures/water.jpg' );
  				iceDiffuse.wrapS = THREE.RepeatWrapping;
  				iceDiffuse.wrapT = THREE.RepeatWrapping;
  				iceDiffuse.colorSpace = THREE.NoColorSpace;
  
  				const iceColorNode = triplanarTexture( texture( iceDiffuse ) ).add( color( 0x0066ff ) ).mul( .8 );
  
  				const geometry = new THREE.IcosahedronGeometry( 1, 3 );
  				const material = new THREE.MeshStandardNodeMaterial( { colorNode: iceColorNode } );
  
  				const count = 100;
  				const scale = 3.5;
  				const column = 10;
  
  				objects = new THREE.Group();
  
  				for ( let i = 0; i < count; i ++ ) {
  
  					const x = i % column;
  					const y = i / column;
  
  					const mesh = new THREE.Mesh( geometry, material );
  					mesh.position.set( x * scale, 0, y * scale );
  					mesh.rotation.set( Math.random(), Math.random(), Math.random() );
  					objects.add( mesh );
  
  				}
  
  				objects.position.set(
  					( ( column - 1 ) * scale ) * - .5,
  					- 1,
  					( ( count / column ) * scale ) * - .5
  				);
  
  				scene.add( objects );
  
  				// water
  
  				const t = time.mul( .8 );
  				const floorUV = positionWorld.xzy;
  
  				const waterLayer0 = mx_worley_noise_float( floorUV.mul( 4 ).add( t ) );
  				const waterLayer1 = mx_worley_noise_float( floorUV.mul( 2 ).add( t ) );
  
  				const waterIntensity = waterLayer0.mul( waterLayer1 );
  				const waterColor = waterIntensity.mul( 1.4 ).mix( color( 0x0487e2 ), color( 0x74ccf4 ) );
  
  				// linearDepth() returns the linear depth of the mesh
  				const depth = linearDepth();
  				const depthWater = viewportLinearDepth.sub( depth ).toInspector( 'Water / Depth', ( node ) => node.oneMinus() );
  				const depthEffect = depthWater.remapClamp( - .002, .04 );
  
  				const refractionUV = screenUV.add( vec2( 0, waterIntensity.mul( .1 ) ) ).toInspector( 'Water / Refraction UV' );
  
  				// linearDepth( viewportDepthTexture( uv ) ) return the linear depth of the scene
  				const depthTestForRefraction = linearDepth( viewportDepthTexture( refractionUV ) ).sub( depth );
  
  				const depthRefraction = depthTestForRefraction.remapClamp( 0, .1 );
  
  				const finalUV = depthTestForRefraction.lessThan( 0 ).select( screenUV, refractionUV );
  
  				const viewportTexture = viewportSharedTexture( finalUV ).toInspector( 'Water / Viewport Texture + Refraction UV' );
  
  				const waterMaterial = new THREE.MeshBasicNodeMaterial();
  				waterMaterial.colorNode = waterColor.toInspector( 'Water / Color' );
  				waterMaterial.backdropNode = depthEffect.mix( viewportSharedTexture(), viewportTexture.mul( depthRefraction.mix( 1, waterColor ) ) );
  				waterMaterial.backdropAlphaNode = depthRefraction.oneMinus();
  				waterMaterial.transparent = true;
  
  				const water = new THREE.Mesh( new THREE.BoxGeometry( 50, .001, 50 ), waterMaterial );
  				water.position.set( 0, 0, 0 );
  				scene.add( water );
  
  				// floor
  
  				floor = new THREE.Mesh( new THREE.CylinderGeometry( 1.1, 1.1, 10 ), new THREE.MeshStandardNodeMaterial( { colorNode: iceColorNode } ) );
  				floor.position.set( 0, - 5, 0 );
  				scene.add( floor );
  
  				// caustics
  
  				const waterPosY = positionWorld.y.sub( water.position.y );
  
  				let transition = waterPosY.add( .1 ).saturate().oneMinus();
  				transition = waterPosY.lessThan( 0 ).select( transition, normalWorld.y.mix( transition, 0 ) ).toVar();
  
  				const colorNode = transition.mix( material.colorNode, material.colorNode.add( waterLayer0 ) );
  
  				//material.colorNode = colorNode;
  				floor.material.colorNode = colorNode;
  
  				// renderer
  
  				
  
  
  				renderer.inspector = new Inspector();
  
  
  				
  				controls.minDistance = 1;
  				controls.maxDistance = 10;
  				controls.maxPolarAngle = Math.PI * 0.9;
  				controls.autoRotate = true;
  				controls.autoRotateSpeed = 1;
  				controls.target.set( 0, .2, 0 );
  				controls.update();
  
  				// gui
  
  				const gui = renderer.inspector.createParameters( 'Settings' );
  
  				floorPosition = new THREE.Vector3( 0, .2, 0 );
  
  				gui.add( floorPosition, 'y', - 1, 1, .001 ).name( 'floor position' );
  
  				// post processing
  
  				const scenePass = pass( scene, camera );
  				const scenePassColor = scenePass.getTextureNode();
  				const scenePassDepth = scenePass.getLinearDepthNode().remapClamp( .3, .5 );
  
  				const waterMask = objectPosition( camera ).y.greaterThan( screenUV.y.sub( .5 ).mul( camera.near ) ).toInspector( 'Post-Processing / Water Mask' );
  
  				const scenePassColorBlurred = gaussianBlur( scenePassColor );
  				scenePassColorBlurred.directionNode = waterMask.select( scenePassDepth, scenePass.getLinearDepthNode().mul( 5 ) ).toInspector( 'Post-Processing / Blur Strength [ Depth ]', ( node ) => node.toFloat() );
  
  				const vignette = screenUV.distance( .5 ).mul( 1.35 ).clamp().oneMinus().toInspector( 'Post-Processing / Vignette' );
  
  				renderPipeline = new THREE.RenderPipeline( renderer );
  				renderPipeline.outputNode = waterMask.select( scenePassColorBlurred, scenePassColorBlurred.mul( color( 0x74ccf4 ) ).mul( vignette ) );
  
  				//
  
  				
  
  			
  
  
  			
  
  			__stage.addUpdateCallback((_delta, _elapsed) => {
    timer.update();
    				const delta = timer.getDelta();
    				floor.position.y = floorPosition.y - 5;
    				if ( model ) {
    					mixer.update( delta );
    					model.position.y = floorPosition.y;
    				}
    				for ( const object of objects.children ) {
    					object.position.y = Math.sin( timer.getElapsed() + object.id ) * .3;
    					object.rotation.y += delta * .3;
    				}
    				renderPipeline.render();
  })
  
  		
}
</script>
