<template>
  <ExampleScene
    camera="perspective"
    antialias
    :camera-options="{ fov: 70, near: 1, far: 1000 }"
    @ready="onReady"
  >
    <template #default>
      <div
        class="example-info"
        v-html="infoHtml"
      />
    </template>
  </ExampleScene>
</template>

<script setup>
import ExampleScene from '@/examples/components/ExampleScene.vue'
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import * as GeometryUtils from 'three/examples/jsm/utils/GeometryUtils.js';

const props = defineProps({
  example: {
    type: Object,
    default: () => ({})
  }
})

const infoHtml = "<a href=\"https://threejs.org\" target=\"_blank\" rel=\"noopener noreferrer\">three.js</a> framebuffer to texture"
function onReady(__stage) {
  let scene = __stage.scene
  let camera = __stage.camera
  let renderer = __stage.renderer
  const controls = __stage.controls

  
  			let line, sprite, texture;
  
  			let cameraOrtho, sceneOrtho;
  
  			let offset = 0;
  
  			const dpr = window.devicePixelRatio;
  
  			const textureSize = 128 * dpr;
  			const vector = new THREE.Vector2();
  			const color = new THREE.Color();
  
  			
  
  
  				//
  
  				const width = (__stage.container?.clientWidth || window.innerWidth);
  				const height = (__stage.container?.clientHeight || window.innerHeight);
  
  				
  				camera.position.z = 20;
  
  				cameraOrtho = new THREE.OrthographicCamera( - width / 2, width / 2, height / 2, - height / 2, 1, 10 );
  				cameraOrtho.position.z = 10;
  
  				
  				sceneOrtho = new THREE.Scene();
  
  				//
  
  				const points = GeometryUtils.gosper( 8 );
  
  				const geometry = new THREE.BufferGeometry();
  				const positionAttribute = new THREE.Float32BufferAttribute( points, 3 );
  				geometry.setAttribute( 'position', positionAttribute );
  				geometry.center();
  
  				const colorAttribute = new THREE.BufferAttribute( new Float32Array( positionAttribute.array.length ), 3 );
  				colorAttribute.setUsage( THREE.DynamicDrawUsage );
  				geometry.setAttribute( 'color', colorAttribute );
  
  				const material = new THREE.LineBasicMaterial( { vertexColors: true } );
  
  				line = new THREE.Line( geometry, material );
  				line.scale.setScalar( 0.05 );
  				scene.add( line );
  
  				//
  
  				texture = new THREE.FramebufferTexture( textureSize, textureSize );
  
  				//
  
  				const spriteMaterial = new THREE.SpriteMaterial( { map: texture } );
  				sprite = new THREE.Sprite( spriteMaterial );
  				sprite.scale.set( textureSize, textureSize, 1 );
  				sceneOrtho.add( sprite );
  
  				updateSpritePosition();
  
  				//
  
  				
  
  
  				renderer.autoClear = false;
  
  
  				//
  
  				const selection = null; // UI element not available in Vue component
  
  				controls.enablePan = false;
  
  				//
  
  				
  
  			
  
  
  			
  
  			function updateSpritePosition() {
  
  				const halfWidth = (__stage.container?.clientWidth || window.innerWidth) / 2;
  				const halfHeight = (__stage.container?.clientHeight || window.innerHeight) / 2;
  
  				const halfImageWidth = textureSize / 2;
  				const halfImageHeight = textureSize / 2;
  
  				sprite.position.set( - halfWidth + halfImageWidth, halfHeight - halfImageHeight, 1 );
  
  			}
  
  			__stage.addUpdateCallback((_delta, _elapsed) => {
    const colorAttribute = line.geometry.getAttribute( 'color' );
    				updateColors( colorAttribute );
    				// scene rendering
    				renderer.clear();
    				// calculate start position for copying data
    				vector.x = ( (__stage.container?.clientWidth || window.innerWidth) * dpr / 2 ) - ( textureSize / 2 );
    				vector.y = ( (__stage.container?.clientHeight || window.innerHeight) * dpr / 2 ) - ( textureSize / 2 );
    				renderer.copyFramebufferToTexture( texture, vector );
    				renderer.clearDepth();
  })
  
  			function updateColors( colorAttribute ) {
  
  				const l = colorAttribute.count;
  
  				for ( let i = 0; i < l; i ++ ) {
  
  					const h = ( ( offset + i ) % l ) / l;
  
  					color.setHSL( h, 1, 0.5 );
  					colorAttribute.setX( i, color.r );
  					colorAttribute.setY( i, color.g );
  					colorAttribute.setZ( i, color.b );
  
  				}
  
  				colorAttribute.needsUpdate = true;
  
  				offset -= 25;
  
  			}
  
  		
}
</script>
