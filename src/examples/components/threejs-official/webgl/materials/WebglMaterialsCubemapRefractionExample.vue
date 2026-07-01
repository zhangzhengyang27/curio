<template>
  <ExampleScene
    camera="perspective"
    antialias
    :camera-options="{ fov: 50, near: 1, far: 100000 }"
    @ready="onReady">
    <template #default>
      <div class="example-info" v-html="infoHtml" />
    </template>
  </ExampleScene>
</template>

<script setup>
import ExampleScene from '@/examples/components/ExampleScene.vue'
import * as THREE from 'three';
import Stats from 'three/examples/jsm/libs/stats.module.js';
import { PLYLoader } from 'three/examples/jsm/loaders/PLYLoader.js';

const props = defineProps({
  example: {
    type: Object,
    default: () => ({})
  }
})

const infoHtml = "<a href=\"https://threejs.org\">Three.js</a> cube map refraction demo<br/>\n\t\t\tLucy model from <a href=\"http://graphics.stanford.edu/data/3Dscanrep/\">Stanford 3d scanning repository<br/>\n\t\t\tTexture by <a href=\"http://www.humus.name/index.php?page=Textures\" target=\"_blank\" rel=\"noopener\">Humus</a>"
function onReady(__stage) {
  const ASSET_HOST = props.example?.globals?.ASSET_HOST || '/threejs-official/'
  let scene = __stage.scene
  let camera = __stage.camera
  let renderer = __stage.renderer
  const controls = __stage.controls

  
  
  
  
  
  			let container, stats;
  
  
  			let mouseX = 0, mouseY = 0;
  
  			let windowHalfX = (__stage.container?.clientWidth || window.innerWidth) / 2;
  			let windowHalfY = (__stage.container?.clientHeight || window.innerHeight) / 2;
  
  			
  
  
  				
  				camera.position.z = - 4000;
  
  				//
  
  				const r = ASSET_HOST + 'textures/cube/Park3Med/';
  
  				const urls = [
  					r + 'px.jpg', r + 'nx.jpg',
  					r + 'py.jpg', r + 'ny.jpg',
  					r + 'pz.jpg', r + 'nz.jpg'
  				];
  
  				const textureCube = new THREE.CubeTextureLoader().load( urls );
  				textureCube.mapping = THREE.CubeRefractionMapping;
  
  				
  				scene.background = textureCube;
  
  				// LIGHTS
  
  				const ambient = new THREE.AmbientLight( 0xffffff, 3.5 );
  				scene.add( ambient );
  
  				// material samples
  
  				const cubeMaterial3 = new THREE.MeshPhongMaterial( { color: 0xccddff, envMap: textureCube, refractionRatio: 0.98, reflectivity: 0.9 } );
  				const cubeMaterial2 = new THREE.MeshPhongMaterial( { color: 0xccfffd, envMap: textureCube, refractionRatio: 0.985 } );
  				const cubeMaterial1 = new THREE.MeshPhongMaterial( { color: 0xffffff, envMap: textureCube, refractionRatio: 0.98 } );
  
  				//
  
  				
  
  
  				stats = new Stats();
  				__stage.overlay?.appendChild(stats.dom)
  
  				const loader = new PLYLoader();
  				loader.load( ASSET_HOST + 'models/ply/binary/Lucy100k.ply', function ( geometry ) {
  
  					createScene( geometry, cubeMaterial1, cubeMaterial2, cubeMaterial3 );
  
  				} );
  
  				document.addEventListener( 'mousemove', onDocumentMouseMove );
  
  				//
  
  				
  
  			
  
  
  			
  
  			function createScene( geometry, m1, m2, m3 ) {
  
  				geometry.computeVertexNormals();
  
  				const s = 1.5;
  
  				let mesh = new THREE.Mesh( geometry, m1 );
  				mesh.scale.x = mesh.scale.y = mesh.scale.z = s;
  				scene.add( mesh );
  
  				mesh = new THREE.Mesh( geometry, m2 );
  				mesh.position.x = - 1500;
  				mesh.scale.x = mesh.scale.y = mesh.scale.z = s;
  				scene.add( mesh );
  
  				mesh = new THREE.Mesh( geometry, m3 );
  				mesh.position.x = 1500;
  				mesh.scale.x = mesh.scale.y = mesh.scale.z = s;
  				scene.add( mesh );
  
  			}
  
  			function onDocumentMouseMove( event ) {
  
  				mouseX = ( event.clientX - windowHalfX ) * 4;
  				mouseY = ( event.clientY - windowHalfY ) * 4;
  
  			}
  
  			//
  
  			__stage.addUpdateCallback((_delta, _elapsed) => {
    {
    camera.position.x += ( mouseX - camera.position.x ) * .05;
    				camera.position.y += ( - mouseY - camera.position.y ) * .05;
    }
    				stats.update();
  })
  
  			function render() {
  
  				camera.position.x += ( mouseX - camera.position.x ) * .05;
  				camera.position.y += ( - mouseY - camera.position.y ) * .05;
  
  
  
  
  
  			}
  
  		
}
</script>
