<template>
  <ExampleScene
    camera="perspective"
    antialias
    :camera-options="{ fov: 60, near: 1, far: 1000 }"
    :enable-controls="false"
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

<script setup lang="ts">
import { onUnmounted } from 'vue'

let gui: any = null
import ExampleScene from '@/examples/components/ExampleScene.vue'
import * as THREE from 'three';
import Stats from 'three/examples/jsm/libs/stats.module.js';
import { GUI } from 'three/examples/jsm/libs/lil-gui.module.min.js';
import { TrackballControls } from 'three/examples/jsm/controls/TrackballControls.js';

const props = defineProps({
  example: {
    type: Object,
    default: () => ({})
  }
})

const infoHtml = "<a href=\"https://threejs.org\" target=\"_blank\" rel=\"noopener\">three.js</a> - trackball controls<br />\n\t\t\tMOVE mouse &amp; press LEFT/A: rotate, MIDDLE/S: zoom, RIGHT/D: pan"
function onReady(__stage: any) {
  let scene = __stage.scene
  const camera = __stage.camera
  let renderer = __stage.renderer
  const controls = __stage.controls
  

  
  
  
  
  
  			let perspectiveCamera: any, orthographicCamera: any, stats;
  
  			const params = {
  				orthographicCamera: false
  			};
  
  			const frustumSize = 400;
  
  			
  
  
  				const aspect = (__stage.container?.clientWidth || window.innerWidth) / (__stage.container?.clientHeight || window.innerHeight);
  
  				perspectiveCamera = new THREE.PerspectiveCamera( 60, aspect, 1, 1000 );
  				perspectiveCamera.position.z = 500;
  
  				orthographicCamera = new THREE.OrthographicCamera( frustumSize * aspect / - 2, frustumSize * aspect / 2, frustumSize / 2, frustumSize / - 2, 1, 1000 );
  				orthographicCamera.position.z = 500;
  
  				// world
  
  				
  				scene.background = new THREE.Color( 0xcccccc );
  				scene.fog = new THREE.FogExp2( 0xcccccc, 0.002 );
  
  				const geometry = new THREE.ConeGeometry( 10, 30, 4, 1 );
  				const material = new THREE.MeshPhongMaterial( { color: 0xffffff, flatShading: true } );
  
  				const mesh = new THREE.InstancedMesh( geometry, material, 500 );
  				const dummy = new THREE.Object3D();
  
  				for ( let i = 0; i < 500; i ++ ) {
  
  					dummy.position.x = ( Math.random() - 0.5 ) * 1000;
  					dummy.position.y = ( Math.random() - 0.5 ) * 1000;
  					dummy.position.z = ( Math.random() - 0.5 ) * 1000;
  
  					dummy.updateMatrix();
  					mesh.setMatrixAt( i, dummy.matrix );
  
  				}
  
  				scene.add( mesh );
  
  				// lights
  
  				const dirLight1 = new THREE.DirectionalLight( 0xffffff, 3 );
  				dirLight1.position.set( 1, 1, 1 );
  				scene.add( dirLight1 );
  
  				const dirLight2 = new THREE.DirectionalLight( 0x002288, 3 );
  				dirLight2.position.set( - 1, - 1, - 1 );
  				scene.add( dirLight2 );
  
  				const ambientLight = new THREE.AmbientLight( 0x555555 );
  				scene.add( ambientLight );
  
  				// renderer
  
  				
  
  
  				stats = new Stats();
  				__stage.overlay?.appendChild(stats.dom)
  
  				//
  
  				gui = new GUI();
  				gui.add( params, 'orthographicCamera' ).name( 'use orthographic' ).onChange( function ( value: any ) {
  
  					controls.dispose();
  
  					createControls( value ? orthographicCamera : perspectiveCamera );
  
  				} );
  
  				//
  
  				
  
  				createControls( perspectiveCamera );
  
  			
  
  
  			function createControls( camera: any ) {
  
  				
  
  				controls.rotateSpeed = 1.0;
  				controls.zoomSpeed = 1.2;
  				controls.panSpeed = 0.8;
  
  				controls.keys = [ 'KeyA', 'KeyS', 'KeyD' ];
  
  			}
  
  			
  
  			__stage.addUpdateCallback((_delta: any, _elapsed: any) => {
    {
    let camera = ( params.orthographicCamera ) ? orthographicCamera : perspectiveCamera;
    }
    				stats.update();
  })
  
  			function render() {
  
  				let camera = ( params.orthographicCamera ) ? orthographicCamera : perspectiveCamera;
  
  
  
  			}
  
  
  		
}

onUnmounted(() => {
  gui?.destroy()
})
</script>
