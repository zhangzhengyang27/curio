<template>
  <CSS3DExampleScene
    camera="perspective"
    :camera-position="[200, 200, 200]"
    :camera-options="{ fov: 45, near: 1, far: 1000 }"
    :enable-controls="false"
    @ready="onReady"
  >
    <template #default>
      <div
        class="example-info"
        v-html="infoHtml"
      />
    </template>
  </CSS3DExampleScene>
</template>

<script setup lang="ts">
import CSS3DExampleScene from '@/examples/components/CSS3DExampleScene.vue'
import * as THREE from 'three';
import { TrackballControls } from 'three/examples/jsm/controls/TrackballControls.js';
import { CSS3DRenderer, CSS3DObject } from 'three/examples/jsm/renderers/CSS3DRenderer.js';
import { GUI } from 'three/examples/jsm/libs/lil-gui.module.min.js';

let x: any;
let y: any;
let width: any;
let height: any;


const props = defineProps({
  example: {
    type: Object,
    default: () => ({})
  }
})

const infoHtml = "<a href=\"https://threejs.org\" target=\"_blank\" rel=\"noopener\">three.js</a> css3d - sandbox"
function onReady(__stage: any) {
  let scene = __stage.scene
  let camera = __stage.camera
  let renderer = __stage.renderer
  

  
  
  			let scene2, renderer2;
  
  				scene.background = new THREE.Color( 0xf0f0f0 );
  
  				scene2 = new THREE.Scene();
  
  				const material = new THREE.MeshBasicMaterial( { color: 0x000000, wireframe: true, wireframeLinewidth: 1, side: THREE.DoubleSide } );
  
  				//
  
  				for ( let i = 0; i < 10; i ++ ) {
  
  					const element = document.createElement( 'div' );
  					element.style.width = '100px';
  					element.style.height = '100px';
  					(element.style.opacity as any) = ( i < 5 ) ? 0.5 : 1;
  					element.style.background = new THREE.Color( Math.random() * 0xffffff ).getStyle();
  
  					const object = new CSS3DObject( element );
  					object.position.x = Math.random() * 200 - 100;
  					object.position.y = Math.random() * 200 - 100;
  					object.position.z = Math.random() * 200 - 100;
  					object.rotation.x = Math.random();
  					object.rotation.y = Math.random();
  					object.rotation.z = Math.random();
  					object.scale.x = Math.random() + 0.5;
  					object.scale.y = Math.random() + 0.5;
  					scene2.add( object );
  
  					const geometry = new THREE.PlaneGeometry( 100, 100 );
  					const mesh = new THREE.Mesh( geometry, material );
  					mesh.position.copy( object.position );
  					mesh.rotation.copy( object.rotation );
  					mesh.scale.copy( object.scale );
  					scene.add( mesh );
  
  				}
  
  				//
  
  				
  
  
  
  
  				renderer2 = new CSS3DRenderer();
  				renderer2.setSize( (__stage.container?.clientWidth || window.innerWidth), (__stage.container?.clientHeight || window.innerHeight) );
  				renderer2.domElement.style.position = 'absolute';
  				(renderer2.domElement.style.top as any) = 0;
  				document.body.appendChild( renderer2.domElement );
  
  				
  
  				
  				createPanel();
  
  			
  
  
  			
  
  			__stage.addUpdateCallback((_delta: any, _elapsed: any) => {
    renderer2.render( scene2, camera );
  })
  
  			function createPanel() {
  
  				const panel = new GUI();
  				const folder1 = panel.addFolder( 'camera setViewOffset' ).close();
  
  				const settings = {
  					'setViewOffset'() {
  
  						(folder1.children[ 1 ] as any).enable().setValue( (__stage.container?.clientWidth || window.innerWidth) );
  						(folder1.children[ 2 ] as any).enable().setValue( (__stage.container?.clientHeight || window.innerHeight) );
  						(folder1.children[ 3 ] as any).enable().setValue( 0 );
  						(folder1.children[ 4 ] as any).enable().setValue( 0 );
  						(folder1.children[ 5 ] as any).enable().setValue( (__stage.container?.clientWidth || window.innerWidth) );
  						(folder1.children[ 6 ] as any).enable().setValue( (__stage.container?.clientHeight || window.innerHeight) );
  
  					},
  					'fullWidth': 0,
  					'fullHeight': 0,
  					'offsetX': 0,
  					'offsetY': 0,
  					'width': 0,
  					'height': 0,
  					'clearViewOffset'() {
  
  						(folder1.children[ 1 ] as any).setValue( 0 ).disable();
  						(folder1.children[ 2 ] as any).setValue( 0 ).disable();
  						(folder1.children[ 3 ] as any).setValue( 0 ).disable();
  						(folder1.children[ 4 ] as any).setValue( 0 ).disable();
  						(folder1.children[ 5 ] as any).setValue( 0 ).disable();
  						(folder1.children[ 6 ] as any).setValue( 0 ).disable();
  						camera.clearViewOffset();
  
  					}
  				};
  
  				folder1.add( settings, 'setViewOffset' );
  				folder1.add( settings, 'fullWidth', window.screen.width / 4, window.screen.width * 2, 1 ).onChange( ( val ) => updateCameraViewOffset( { fullWidth: val } ) ).disable();
  				folder1.add( settings, 'fullHeight', window.screen.height / 4, window.screen.height * 2, 1 ).onChange( ( val ) => updateCameraViewOffset( { fullHeight: val } ) ).disable();
  				folder1.add( settings, 'offsetX', 0, 256, 1 ).onChange( ( val ) => updateCameraViewOffset( { x: val } ) ).disable();
  				folder1.add( settings, 'offsetY', 0, 256, 1 ).onChange( ( val ) => updateCameraViewOffset( { y: val } ) ).disable();
  				folder1.add( settings, 'width', window.screen.width / 4, window.screen.width * 2, 1 ).onChange( ( val ) => updateCameraViewOffset( { width: val } ) ).disable();
  				folder1.add( settings, 'height', window.screen.height / 4, window.screen.height * 2, 1 ).onChange( ( val ) => updateCameraViewOffset( { height: val } ) ).disable();
  				folder1.add( settings, 'clearViewOffset' );
  
  			}
  
  			function updateCameraViewOffset( { fullWidth, fullHeight, x, y, width, height }: any ) {
  
  				if ( ! camera.view ) {
  
  					camera.setViewOffset( fullWidth || (__stage.container?.clientWidth || window.innerWidth), fullHeight || (__stage.container?.clientHeight || window.innerHeight), x || 0, y || 0, width || (__stage.container?.clientWidth || window.innerWidth), height || (__stage.container?.clientHeight || window.innerHeight) );
  					camera.aspect = (__stage.container?.clientWidth || window.innerWidth) / (__stage.container?.clientHeight || window.innerHeight);
  					camera.updateProjectionMatrix();
  
  				} else {
  
  					camera.setViewOffset( fullWidth || camera.view.fullWidth, fullHeight || camera.view.fullHeight, x || camera.view.offsetX, y || camera.view.offsetY, width || camera.view.width, height || camera.view.height );
  					camera.aspect = (__stage.container?.clientWidth || window.innerWidth) / (__stage.container?.clientHeight || window.innerHeight);
  					camera.updateProjectionMatrix();
  
  				}
  
  			}
  
  		
}
</script>
