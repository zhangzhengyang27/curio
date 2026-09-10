<template>
  <WebGPUExampleScene
    camera="perspective"
    antialias
    :camera-position="[0, 200, -200]"
    :camera-options="{ fov: 45, near: 0.1, far: 1000 }"
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
import { bumpMap, float, getParallaxCorrectNormal, pmremTexture, reflectVector, texture, uniform, vec3 } from 'three/tsl';
import { Inspector } from 'three/examples/jsm/inspector/Inspector.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { RectAreaLightHelper } from 'three/examples/jsm/helpers/RectAreaLightHelper.js';
import { RectAreaLightTexturesLib } from 'three/examples/jsm/lights/RectAreaLightTexturesLib.js';

const props = defineProps({
  example: {
    type: Object,
    default: () => ({})
  }
})

const infoHtml = "<a href=\"https://threejs.org/\" target=\"_blank\" rel=\"noopener\" class=\"logo-link\"></a>\n\n\t\t\t<div class=\"title-wrapper\">\n\t\t\t\t<a href=\"https://threejs.org/\" target=\"_blank\" rel=\"noopener\">three.js</a><span>BPCEM</span>"
async function onReady(__stage) {
  const ASSET_HOST = props.example?.globals?.ASSET_HOST || '/threejs-official/'
  let scene = __stage.scene
  let camera = __stage.camera
  let renderer = __stage.renderer
  const controls = __stage.controls
  

  
  
  			let cubeCamera;
  
  			let groundPlane, wallMat;
  
  			
  
  
  				THREE.RectAreaLightNode.setLTC( RectAreaLightTexturesLib.init() );
  
  				// scene
  			
  				
  
  				// camera
  
  				
  
  
  				// cube camera for environment map
  
  				const renderTarget = new THREE.CubeRenderTarget( 512 );
  				renderTarget.texture.type = THREE.HalfFloatType;
  				renderTarget.texture.minFilter = THREE.LinearMipmapLinearFilter;
  				renderTarget.texture.magFilter = THREE.LinearFilter;
  				renderTarget.texture.generateMipmaps = true;
  				renderTarget.texture.mapping = THREE.CubeReflectionMapping;
  
  				cubeCamera = new THREE.CubeCamera( 1, 1000, renderTarget );
  				cubeCamera.position.set( 0, - 100, 0 );
  
  				// ground floor ( with box projected environment mapping )
  			
  				const loader = new THREE.TextureLoader();
  				const rMap = loader.load( ASSET_HOST + 'textures/lava/lavatile.jpg' );
  				rMap.wrapS = THREE.RepeatWrapping;
  				rMap.wrapT = THREE.RepeatWrapping;
  				rMap.repeat.set( 2, 1 );
  
  				const roughnessUniform = uniform( 0.25 );
  
  				const defaultMat = new THREE.MeshStandardNodeMaterial();
  				defaultMat.envNode = pmremTexture( renderTarget.texture );
  				defaultMat.roughnessNode = texture( rMap ).mul( roughnessUniform );
  				defaultMat.metalnessNode = float( 1 );
  
  				const boxProjectedMat = new THREE.MeshStandardNodeMaterial();
  				boxProjectedMat.envNode = pmremTexture( renderTarget.texture, getParallaxCorrectNormal( reflectVector, vec3( 200, 100, 100 ), vec3( 0, - 50, 0 ) ) );
  				boxProjectedMat.roughnessNode = texture( rMap ).mul( roughnessUniform );
  				boxProjectedMat.metalnessNode = float( 1 );
  
  				groundPlane = new THREE.Mesh( new THREE.PlaneGeometry( 200, 100, 100 ), boxProjectedMat );
  				groundPlane.rotateX( - Math.PI / 2 );
  				groundPlane.position.set( 0, - 49, 0 );
  				scene.add( groundPlane );
  
  				// walls
  			
  				const [ diffuseTex, bumpTex ] = await Promise.all( [
  					loader.loadAsync( ASSET_HOST + 'textures/brick_diffuse.jpg' ),
  					loader.loadAsync( ASSET_HOST + 'textures/brick_bump.jpg' )
  				] );
  				diffuseTex.colorSpace = THREE.SRGBColorSpace;
  
  				wallMat = new THREE.MeshStandardNodeMaterial();
  
  				wallMat.colorNode = texture( diffuseTex );
  				wallMat.normalNode = bumpMap( texture( bumpTex ), float( 5 ) );
  
  				const planeGeo = new THREE.PlaneGeometry( 100, 100 );
  
  				const planeBack1 = new THREE.Mesh( planeGeo, wallMat );
  				planeBack1.position.z = - 50;
  				planeBack1.position.x = - 50;
  				scene.add( planeBack1 );
  
  				const planeBack2 = new THREE.Mesh( planeGeo, wallMat );
  				planeBack2.position.z = - 50;
  				planeBack2.position.x = 50;
  				scene.add( planeBack2 );
  
  				const planeFront1 = new THREE.Mesh( planeGeo, wallMat );
  				planeFront1.position.z = 50;
  				planeFront1.position.x = - 50;
  				planeFront1.rotateY( Math.PI );
  				scene.add( planeFront1 );
  
  				const planeFront2 = new THREE.Mesh( planeGeo, wallMat );
  				planeFront2.position.z = 50;
  				planeFront2.position.x = 50;
  				planeFront2.rotateY( Math.PI );
  				scene.add( planeFront2 );
  
  				const planeRight = new THREE.Mesh( planeGeo, wallMat );
  				planeRight.position.x = 100;
  				planeRight.rotateY( - Math.PI / 2 );
  				scene.add( planeRight );
  
  				const planeLeft = new THREE.Mesh( planeGeo, wallMat );
  				planeLeft.position.x = - 100;
  				planeLeft.rotateY( Math.PI / 2 );
  				scene.add( planeLeft );
  
  				// area lights
  
  				const width = 50;
  				const height = 50;
  				const intensity = 5;
  			
  				const blueRectLight = new THREE.RectAreaLight( 0x9aaeff, intensity, width, height );
  				blueRectLight.position.set( - 99, 5, 0 );
  				blueRectLight.lookAt( 0, 5, 0 );
  				scene.add( blueRectLight );
  
  				const blueRectLightHelper = new RectAreaLightHelper( blueRectLight, 0xffffff );
  				blueRectLight.add( blueRectLightHelper );
  
  				const redRectLight = new THREE.RectAreaLight( 0xf3aaaa, intensity, width, height );
  				redRectLight.position.set( 99, 5, 0 );
  				redRectLight.lookAt( 0, 5, 0 );
  				scene.add( redRectLight );
  
  				const redRectLightHelper = new RectAreaLightHelper( redRectLight, 0xffffff );
  				redRectLight.add( redRectLightHelper );
  
  				// renderer
  
  				
  
  
  				renderer.inspector = new Inspector();
  
  
  				updateCubeMap();
  
  				
  
  				// controls
  
  				
  				controls.target.set( 0, - 10, 0 );
  				controls.maxDistance = 400;
  				controls.minDistance = 10;
  				controls.update();
  
  				// gui
  
  				const gui = renderer.inspector.createParameters( 'Parameters' );
  				const params = {
  					'box projected': true
  				};
  				gui.add( params, 'box projected' ).onChange( ( value ) => {
  
  					groundPlane.material = ( value ) ? boxProjectedMat : defaultMat;
  
  				} );
  				gui.add( roughnessUniform, 'value', 0, 1 ).name( 'roughness' );
  
  			
  
  
  			
  
  			function updateCubeMap() {
  
  				groundPlane.visible = false;
  
  				cubeCamera.position.copy( groundPlane.position );
  
  				cubeCamera.update( renderer, scene );
  
  				groundPlane.visible = true;
  
  			}
  
  			function animate() {
  
  
  
  			}
  
  		
  __stage.setCamera(camera)
}
</script>
