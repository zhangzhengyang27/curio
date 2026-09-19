<template>
  <WebGPUExampleScene
    camera="perspective"
    antialias
    :camera-position="[-0.5, 0.35, 0.2]"
    :camera-options="{ fov: 25, near: 0.025, far: 5 }"
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
import { uniform, refract, div, positionViewDirection, positionLocal, normalView, texture, Fn, vec2, vec3, vec4 } from 'three/tsl';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';
import { Inspector } from 'three/examples/jsm/inspector/Inspector.js';
let gltf: any;

const props = defineProps({
  example: {
    type: Object,
    default: () => ({})
  }
})

const infoHtml = "<a href=\"https://threejs.org/\" target=\"_blank\" rel=\"noopener\" class=\"logo-link\"></a>\n\n\t\t\t<div class=\"title-wrapper\">\n\t\t\t\t<a href=\"https://threejs.org/\" target=\"_blank\" rel=\"noopener\">three.js</a><span>Caustics</span>"
async function onReady(__stage: any) {
  const ASSET_HOST = props.example?.globals?.ASSET_HOST || '/threejs-official/'
  let scene = __stage.scene
  let camera = __stage.camera
  let renderer = __stage.renderer
  const controls = __stage.controls
  

  
  
  
  			
  
  
  				
  
  
  				
  
  				// light
  
  				const spotLight = new THREE.SpotLight( 0xffffff, 1 );
  				spotLight.position.set( .2, .3, .2 );
  				spotLight.castShadow = true;
  				spotLight.angle = Math.PI / 6;
  				spotLight.penumbra = 1;
  				spotLight.decay = 2;
  				spotLight.distance = 0;
  				spotLight.shadow.mapType = THREE.HalfFloatType; // For HDR Caustics
  				spotLight.shadow.mapSize.width = 1024;
  				spotLight.shadow.mapSize.height = 1024;
  				spotLight.shadow.camera.near = .1;
  				spotLight.shadow.camera.far = 1;
  				spotLight.shadow.intensity = .95;
  				scene.add( spotLight );
  
  				// model / textures
  
  				const dracoLoader = new DRACOLoader();
  
  				gltf = ( await new GLTFLoader().setDRACOLoader( dracoLoader ).loadAsync( ASSET_HOST + 'models/gltf/duck.glb' ) ).scene;
  				gltf.scale.setScalar( .5 );
  				scene.add( gltf );
  
  				const causticMap = new THREE.TextureLoader().load( ASSET_HOST + 'textures/opengameart/Caustic_Free.jpg' );
  				causticMap.wrapS = causticMap.wrapT = THREE.RepeatWrapping;
  				causticMap.colorSpace = THREE.SRGBColorSpace;
  
  				// objects / material
  
  				const duck = gltf.children[ 0 ];
  				duck.material = new THREE.MeshPhysicalNodeMaterial();
  				duck.material.side = THREE.DoubleSide;
  				duck.material.transparent = true;
  				duck.material.color = new THREE.Color( 0xFFD700 );
  				duck.material.transmission = 1;
  				duck.material.thickness = .25;
  				duck.material.ior = 1.5;
  				duck.material.metalness = 0;
  				duck.material.roughness = .1;
  				duck.castShadow = true;
  
  				// tsl shader
  
  				const causticOcclusion = uniform( 20 );
  
  				duck.material.castShadowPositionNode = Fn( () => {
  
  					// optional: add some distortion to the geometry shadow position if needed
  
  					return positionLocal;
  
  				} )();
  
  				duck.material.castShadowNode = Fn( () => {
  
  					const refractionVector = refract( positionViewDirection.negate(), normalView, div( 1.0, duck.material.ior ) ).normalize();
  					const viewZ = normalView.z.pow( causticOcclusion );
  
  					const textureUV = refractionVector.xy.mul( .6 );
  
  					const causticColor = uniform( duck.material.color );
  					const chromaticAberrationOffset = normalView.z.pow( - .9 ).mul( .004 );
  
  					const causticProjection = vec3(
  						texture( causticMap, textureUV.add( vec2( chromaticAberrationOffset.negate(), 0 ) ) ).r,
  						texture( causticMap, textureUV.add( vec2( 0, chromaticAberrationOffset.negate() ) ) ).g,
  						texture( causticMap, textureUV.add( vec2( chromaticAberrationOffset, chromaticAberrationOffset ) ) ).b
  					);
  
  					return causticProjection.mul( viewZ.mul( 25 ) ).add( viewZ ).mul( causticColor as any );
  
  				} )();
  
  				//
  
  				const textureLoader = new THREE.TextureLoader();
  
  				// glass
  
  				const colorMap = textureLoader.load( ASSET_HOST + 'textures/colors.png' );
  				colorMap.wrapS = colorMap.wrapT = THREE.RepeatWrapping;
  				colorMap.colorSpace = THREE.SRGBColorSpace;
  
  				const glassMaterial = new THREE.MeshPhysicalNodeMaterial();
  				glassMaterial.map = colorMap;
  				glassMaterial.side = THREE.DoubleSide;
  				glassMaterial.transparent = true;
  				glassMaterial.color = new THREE.Color( 0xffffff );
  				glassMaterial.transmission = 1;
  				glassMaterial.ior = 1.5;
  				glassMaterial.metalness = 0;
  				glassMaterial.roughness = .1;
  				glassMaterial.castShadowNode = vec4( texture( colorMap ).rgb, .8 );
  
  				const glass = new THREE.Mesh( new THREE.PlaneGeometry( .2, .2 ), glassMaterial );
  				glass.position.y = .1;
  				glass.castShadow = true;
  				glass.visible = false;
  				scene.add( glass );
  
  				// ground
  
  				const map = textureLoader.load( ASSET_HOST + 'textures/hardwood2_diffuse.jpg' );
  				map.wrapS = map.wrapT = THREE.RepeatWrapping;
  				map.repeat.set( 10, 10 );
  
  				const geometry = new THREE.PlaneGeometry( 2, 2 );
  				const material = new THREE.MeshStandardMaterial( { color: 0x999999, map } );
  
  				const ground = new THREE.Mesh( geometry, material );
  				ground.rotation.x = - Math.PI / 2;
  				ground.receiveShadow = true;
  				scene.add( ground );
  
  				// renderer
  
  				
  
  
  				renderer.shadowMap.enabled = true;
  				renderer.shadowMap.transmitted = true;
  				renderer.inspector = new Inspector();
  
  
  				// gui
  
  				const gui = renderer.inspector.createParameters( 'Settings' );
  				gui.add( causticOcclusion, 'value', 0, 20 ).name( 'caustic occlusion' );
  				const duckColorDebug = { color: duck.material.color.getHex() };
  				gui.addColor( duckColorDebug, 'color' ).name( 'material color' ).onChange( ( val: any ) => {
  					duck.material.color.set( val );
  				} );
  				gui.add( { model: 'duck' }, 'model', [
  					'duck',
  					'glass'
  				] ).onChange( (model: any) => {
  
  					duck.visible = glass.visible = false;
  
  					if ( model === 'duck' ) {
  
  						duck.visible = true;
  
  					} else if ( model === 'glass' ) {
  
  						glass.visible = true;
  
  					}
  
  				} );
  
  
  				// controls
  
  				
  				controls.maxDistance = 3;
  				controls.maxPolarAngle = Math.PI / 2;
  
  				
  
  			
  
  
  			
  
  			__stage.addUpdateCallback((_delta: any, _elapsed: any) => {
    for ( const mesh of gltf.children ) {
    					mesh.rotation.y -= .01;
    				}
  })
  
  		
}
</script>
