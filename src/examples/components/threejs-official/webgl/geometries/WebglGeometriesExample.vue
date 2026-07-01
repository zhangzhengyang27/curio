<template>
  <ExampleScene
    camera="perspective"
    antialias
    :camera-options="{ fov: 45, near: 1, far: 2000 }"
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
import { ParametricGeometry } from 'three/examples/jsm/geometries/ParametricGeometry.js';
import { plane, klein, mobius } from 'three/examples/jsm/geometries/ParametricFunctions.js';

const props = defineProps({
  example: {
    type: Object,
    default: () => ({})
  }
})

const infoHtml = "<a href=\"https://threejs.org\" target=\"_blank\" rel=\"noopener\">three.js</a> webgl - geometries"
function onReady(__stage) {
  const ASSET_HOST = props.example?.globals?.ASSET_HOST || '/threejs-official/'
  let scene = __stage.scene
  let camera = __stage.camera
  let renderer = __stage.renderer
  const controls = __stage.controls

  
  
  
  
  
  			let stats;
  
  			
  
  
  				
  				camera.position.y = 500;
  
  				
  
  				let object, geometry;
  
  				const ambientLight = new THREE.AmbientLight( 0xcccccc, 1.5 );
  				scene.add( ambientLight );
  
  				const pointLight = new THREE.PointLight( 0xffffff, 2.5, 0, 0 );
  				camera.add( pointLight );
  				scene.add( camera );
  
  				const map = new THREE.TextureLoader().load( ASSET_HOST + 'textures/uv_grid_opengl.jpg' );
  				map.wrapS = map.wrapT = THREE.RepeatWrapping;
  				map.anisotropy = 16;
  				map.colorSpace = THREE.SRGBColorSpace;
  
  				const material = new THREE.MeshPhongMaterial( { map: map, side: THREE.DoubleSide } );
  
  				//
  
  				object = new THREE.Mesh( new THREE.SphereGeometry( 75, 20, 10 ), material );
  				object.position.set( - 300, 0, 300 );
  				scene.add( object );
  
  				object = new THREE.Mesh( new THREE.IcosahedronGeometry( 75 ), material );
  				object.position.set( - 100, 0, 300 );
  				scene.add( object );
  
  				object = new THREE.Mesh( new THREE.OctahedronGeometry( 75 ), material );
  				object.position.set( 100, 0, 300 );
  				scene.add( object );
  
  				object = new THREE.Mesh( new THREE.TetrahedronGeometry( 75 ), material );
  				object.position.set( 300, 0, 300 );
  				scene.add( object );
  
  				//
  
  				object = new THREE.Mesh( new THREE.PlaneGeometry( 100, 100, 4, 4 ), material );
  				object.position.set( - 300, 0, 100 );
  				scene.add( object );
  
  				object = new THREE.Mesh( new THREE.BoxGeometry( 100, 100, 100, 4, 4, 4 ), material );
  				object.position.set( - 100, 0, 100 );
  				scene.add( object );
  
  				object = new THREE.Mesh( new THREE.CircleGeometry( 50, 20, 0, Math.PI * 2 ), material );
  				object.position.set( 100, 0, 100 );
  				scene.add( object );
  
  				object = new THREE.Mesh( new THREE.RingGeometry( 10, 50, 20, 5, 0, Math.PI * 2 ), material );
  				object.position.set( 300, 0, 100 );
  				scene.add( object );
  
  				//
  
  				object = new THREE.Mesh( new THREE.CylinderGeometry( 25, 75, 100, 40, 5 ), material );
  				object.position.set( - 300, 0, - 100 );
  				scene.add( object );
  
  				const points = [];
  
  				for ( let i = 0; i < 50; i ++ ) {
  
  					points.push( new THREE.Vector2( Math.sin( i * 0.2 ) * Math.sin( i * 0.1 ) * 15 + 50, ( i - 5 ) * 2 ) );
  
  				}
  
  				object = new THREE.Mesh( new THREE.LatheGeometry( points, 20 ), material );
  				object.position.set( - 100, 0, - 100 );
  				scene.add( object );
  
  				object = new THREE.Mesh( new THREE.TorusGeometry( 50, 20, 20, 20 ), material );
  				object.position.set( 100, 0, - 100 );
  				scene.add( object );
  
  				object = new THREE.Mesh( new THREE.TorusKnotGeometry( 50, 10, 50, 20 ), material );
  				object.position.set( 300, 0, - 100 );
  				scene.add( object );
  
  				//
  
  				object = new THREE.Mesh( new THREE.CapsuleGeometry( 20, 50 ), material );
  				object.position.set( - 300, 0, - 300 );
  				scene.add( object );
  
  				geometry = new ParametricGeometry( plane, 10, 10 );
  				geometry.scale( 100, 100, 100 );
  				geometry.center();
  				object = new THREE.Mesh( geometry, material );
  				object.position.set( - 100, 0, - 300 );
  				scene.add( object );
  
  				geometry = new ParametricGeometry( klein, 20, 20 );
  				object = new THREE.Mesh( geometry, material );
  				object.position.set( 100, 0, - 300 );
  				object.scale.multiplyScalar( 5 );
  				scene.add( object );
  
  				geometry = new ParametricGeometry( mobius, 20, 20 );
  				object = new THREE.Mesh( geometry, material );
  				object.position.set( 300, 0, - 300 );
  				object.scale.multiplyScalar( 30 );
  				scene.add( object );
  
  				//
  
  				
  
  
  				stats = new Stats();
  				__stage.overlay?.appendChild(stats.dom)
  
  				//
  
  				
  
  			
  
  
  			
  
  			//
  
  			__stage.addUpdateCallback((_delta, _elapsed) => {
    {
    const timer = Date.now() * 0.0001;
    				camera.position.x = Math.cos( timer ) * 800;
    				camera.position.z = Math.sin( timer ) * 800;
    				scene.traverse( function ( object ) {
    					if ( object.isMesh === true ) {
    						object.rotation.x = timer * 5;
    						object.rotation.y = timer * 2.5;
    					}
    				} );
    }
    				stats.update();
  })
  
  			function render() {
  
  				const timer = Date.now() * 0.0001;
  
  				camera.position.x = Math.cos( timer ) * 800;
  				camera.position.z = Math.sin( timer ) * 800;
  
  
  
  				scene.traverse( function ( object ) {
  
  					if ( object.isMesh === true ) {
  
  						object.rotation.x = timer * 5;
  						object.rotation.y = timer * 2.5;
  
  					}
  
  				} );
  
  
  
  			}
  
  		
}
</script>
