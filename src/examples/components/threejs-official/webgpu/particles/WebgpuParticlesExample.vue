<template>
  <WebGPUExampleScene
    camera="perspective"
    antialias
    :camera-position="[1300, 500, 0]"
    :camera-options="{ fov: 60, near: 1, far: 5000 }"
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
import { range, texture, mix, uv, color, rotateUV, positionLocal, time, uniform } from 'three/tsl';
import { Inspector } from 'three/examples/jsm/inspector/Inspector.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import WebGPU from 'three/examples/jsm/capabilities/WebGPU.js';

const props = defineProps({
  example: {
    type: Object,
    default: () => ({})
  }
})

const infoHtml = "<a href=\"https://threejs.org/\" target=\"_blank\" rel=\"noopener\" class=\"logo-link\"></a>\n\n\t\t\t<div class=\"title-wrapper\">\n\t\t\t\t<a href=\"https://threejs.org/\" target=\"_blank\" rel=\"noopener\">three.js</a><span>Particles</span>"
function onReady(__stage) {
  const ASSET_HOST = props.example?.globals?.ASSET_HOST || '/threejs-official/'
  let scene = __stage.scene
  let camera = __stage.camera
  let renderer = __stage.renderer
  const controls = __stage.controls
  

  
  
  
  			
  
  
  				if ( WebGPU.isAvailable() === false ) {
  
  					document.body.appendChild( WebGPU.getErrorMessage() );
  
  					throw new Error( 'No WebGPU support' );
  
  				}
  
  				const { innerWidth, innerHeight } = window;
  
  				
  
  
  				
  				scene.background = new THREE.Color( 0x333333 );
  
  				// textures
  
  				const textureLoader = new THREE.TextureLoader();
  				const map = textureLoader.load( ASSET_HOST + 'textures/opengameart/smoke1.png' );
  
  				// create nodes
  
  				const lifeRange = range( .1, 1 );
  				const offsetRange = range( new THREE.Vector3( - 2, 3, - 2 ), new THREE.Vector3( 2, 5, 2 ) );
  
  				const speed = uniform( .2 );
  				const scaledTime = time.add( 5 ).mul( speed );
  
  				const lifeTime = scaledTime.mul( lifeRange ).mod( 1 );
  				const scaleRange = range( .3, 2 );
  				const rotateRange = range( .1, 4 );
  
  				const life = lifeTime.div( lifeRange );
  
  				const fakeLightEffect = positionLocal.y.oneMinus().max( 0.2 );
  
  				const textureNode = texture( map, rotateUV( uv(), scaledTime.mul( rotateRange ) ) );
  
  				const opacityNode = textureNode.a.mul( life.oneMinus() );
  
  				const smokeColor = mix( color( 0x2c1501 ), color( 0x222222 ), positionLocal.y.mul( 3 ).clamp() );
  
  				// create particles
  
  				const smokeNodeMaterial = new THREE.SpriteNodeMaterial();
  				smokeNodeMaterial.colorNode = mix( color( 0xf27d0c ), smokeColor, life.mul( 2.5 ).min( 1 ) ).mul( fakeLightEffect );
  				smokeNodeMaterial.opacityNode = opacityNode;
  				smokeNodeMaterial.positionNode = offsetRange.mul( lifeTime );
  				smokeNodeMaterial.scaleNode = scaleRange.mul( lifeTime.max( 0.3 ) );
  				smokeNodeMaterial.depthWrite = false;
  
  				const smokeInstancedSprite = new THREE.Mesh( new THREE.PlaneGeometry( 1, 1 ), smokeNodeMaterial );
  				smokeInstancedSprite.scale.setScalar( 400 );
  				smokeInstancedSprite.count = 2000;
  				scene.add( smokeInstancedSprite );
  
  				//
  
  				const fireGeometry = new THREE.PlaneGeometry( 1, 1 );
  				const fireCount = 1000;
  
  				const fireNodeMaterial = new THREE.SpriteNodeMaterial();
  				fireNodeMaterial.colorNode = mix( color( 0xb72f17 ), color( 0xb72f17 ), life );
  				fireNodeMaterial.positionNode = range( new THREE.Vector3( - 1, 1, - 1 ), new THREE.Vector3( 1, 2, 1 ) ).mul( lifeTime );
  				fireNodeMaterial.scaleNode = smokeNodeMaterial.scaleNode;
  				fireNodeMaterial.opacityNode = opacityNode.mul( .5 );
  				fireNodeMaterial.blending = THREE.AdditiveBlending;
  				fireNodeMaterial.transparent = true;
  				fireNodeMaterial.depthWrite = false;
  
  				const fireInstancedSprite = new THREE.Mesh( fireGeometry, fireNodeMaterial );
  				fireInstancedSprite.scale.setScalar( 400 );
  				fireInstancedSprite.count = fireCount;
  				fireInstancedSprite.position.y = - 100;
  				fireInstancedSprite.renderOrder = 1;
  				scene.add( fireInstancedSprite );
  
  				// indirect draw ( optional )
  				// each indirect draw call is 5 uint32 values for indexes ( different structure for non-indexed draw calls using 4 uint32 values )
  
  				const indexCount = fireGeometry.index.array.length;
  
  				const uint32 = new Uint32Array( 5 );
  				uint32[ 0 ] = indexCount;	// indexCount
  				uint32[ 1 ] = fireCount; 	// instanceCount
  				uint32[ 2 ] = 0;			// firstIndex
  				uint32[ 3 ] = 0;			// baseVertex
  				uint32[ 4 ] = 0;			// firstInstance
  
  				const indirectAttribute = new THREE.IndirectStorageBufferAttribute( uint32, 5 );
  				fireGeometry.setIndirect( indirectAttribute );
  
  				//
  
  				const helper = new THREE.GridHelper( 3000, 40, 0x444444, 0x444444 );
  				helper.position.y = - 75;
  				scene.add( helper );
  
  				//
  
  				
  
  
  				renderer.inspector = new Inspector();
  
  
  				//
  
  				
  				controls.maxDistance = 2700;
  				controls.target.set( 0, 500, 0 );
  				controls.update();
  
  				//
  
  				
  
  				// gui
  
  				const gui = renderer.inspector.createParameters( 'Settings' );
  
  				gui.add( speed, 'value', 0, 1, 0.01 ).name( 'speed' );
  
  			
  
  
  			
  
  			function render() {
  
  
  
  			}
  
  		
}
</script>
