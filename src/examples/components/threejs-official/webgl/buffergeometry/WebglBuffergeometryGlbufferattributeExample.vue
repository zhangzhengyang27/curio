<template>
  <ExampleScene
    camera="perspective"
    :camera-options="{ fov: 27, near: 5, far: 3500 }"
    @ready="onReady"
    @before-dispose="onBeforeDispose"
  >
    <template #default>
      <div
        class="example-info"
        v-html="infoHtml"
      />
    </template>
  </ExampleScene>
</template>

<script setup lang="ts">
import ExampleScene from '@/examples/components/ExampleScene.vue'
import * as THREE from 'three';
import Stats from 'three/examples/jsm/libs/stats.module.js';

const props = defineProps({
  example: {
    type: Object,
    default: () => ({})
  }
})

let _intervalId: any = null

const infoHtml = "<a href=\"https://threejs.org\" target=\"_blank\" rel=\"noopener\">three.js</a> webgl - buffergeometry - custom VBOs"
function onReady(__stage: any) {
  let scene = __stage.scene
  let camera = __stage.camera
  let renderer = __stage.renderer
  const controls = __stage.controls

  
  
  
  
  			let container, stats;
  
  
  			let points;
  
  			const particles = 300000;
  			let drawCount = 10000;
  
  				container = __stage.container;
  
  				//
  
  				
  
  
  				//
  
  				
  				camera.position.z = 2750;
  
  				
  				scene.background = new THREE.Color( 0x050505 );
  				scene.fog = new THREE.Fog( 0x050505, 2000, 3500 );
  
  				//
  
  				const geometry = new THREE.BufferGeometry();
  
  				const positions = [];
  				const positions2 = [];
  				const colors = [];
  
  				const color = new THREE.Color();
  
  				const n = 1000, n2 = n / 2; // particles spread in the cube
  
  				for ( let i = 0; i < particles; i ++ ) {
  
  					// positions
  
  					const x = Math.random() * n - n2;
  					const y = Math.random() * n - n2;
  					const z = Math.random() * n - n2;
  
  					positions.push( x, y, z );
  					positions2.push( z * 0.3, x * 0.3, y * 0.3 );
  
  					// colors
  
  					const vx = ( x / n ) + 0.5;
  					const vy = ( y / n ) + 0.5;
  					const vz = ( z / n ) + 0.5;
  
  					color.setRGB( vx, vy, vz, THREE.SRGBColorSpace );
  
  					const hex = color.getHex( THREE.LinearSRGBColorSpace );
  					colors.push( hex >> 16 & 255, hex >> 8 & 255, hex & 255 );
  
  				}
  
  				const gl = renderer.getContext();
  
  				const pos = gl.createBuffer();
  				gl.bindBuffer( gl.ARRAY_BUFFER, pos );
  				gl.bufferData( gl.ARRAY_BUFFER, new Float32Array( positions ), gl.STATIC_DRAW );
  
  				const pos2 = gl.createBuffer();
  				gl.bindBuffer( gl.ARRAY_BUFFER, pos2 );
  				gl.bufferData( gl.ARRAY_BUFFER, new Float32Array( positions2 ), gl.STATIC_DRAW );
  
  				const rgb = gl.createBuffer();
  				gl.bindBuffer( gl.ARRAY_BUFFER, rgb );
  				gl.bufferData( gl.ARRAY_BUFFER, new Uint8Array( colors ), gl.STATIC_DRAW );
  
				const posAttr1: any = new THREE.GLBufferAttribute( pos, gl.FLOAT, 3, 4, particles );
				const posAttr2: any = new THREE.GLBufferAttribute( pos2, gl.FLOAT, 3, 4, particles );
  				geometry.setAttribute( 'position', posAttr1 );
  
  				_intervalId = setInterval( function () {
  
  					const attr = geometry.getAttribute( 'position' );
  
  					geometry.setAttribute( 'position', ( attr === posAttr1 ) ? posAttr2 : posAttr1 );
  
  				}, 2000 );
  
  				geometry.setAttribute( 'color', new THREE.GLBufferAttribute( rgb, gl.UNSIGNED_BYTE, 3, 1, particles, true ) as any );
  
  				//
  
  				const material = new THREE.PointsMaterial( { size: 15, vertexColors: true } );
  
  				points = new THREE.Points( geometry, material );
  
  				geometry.boundingSphere = new THREE.Sphere().set( new THREE.Vector3(), 500 );
  
  				scene.add( points );
  
  				//
  
  				stats = new Stats();
  				__stage.overlay?.appendChild(stats.dom)
  
  				//
  
  				
  
  			
  
  
  			
  
  			//
  
  			__stage.addUpdateCallback((_delta: any, _elapsed: any) => {
    drawCount = ( Math.max( 5000, drawCount ) + Math.floor( 500 * Math.random() ) ) % particles;
    				points.geometry.setDrawRange( 0, drawCount );
    				const time = Date.now() * 0.001;
    				points.rotation.x = time * 0.1;
    				points.rotation.y = time * 0.2;
    				stats.update();
  })
  
  		
}
function onBeforeDispose() { if (_intervalId) { clearInterval(_intervalId); _intervalId = null } }
</script>
