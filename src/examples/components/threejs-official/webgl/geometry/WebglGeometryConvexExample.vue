<template>
  <ExampleScene
    camera="perspective"
    antialias
    :camera-position="[15, 20, 30]"
    :camera-options="{ fov: 40, near: 1, far: 1000 }"
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
import ExampleScene from '@/examples/components/ExampleScene.vue'
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { ConvexGeometry } from 'three/examples/jsm/geometries/ConvexGeometry.js';
import * as BufferGeometryUtils from 'three/examples/jsm/utils/BufferGeometryUtils.js';

const props = defineProps({
  example: {
    type: Object,
    default: () => ({})
  }
})

const infoHtml = "<a href=\"https://threejs.org\" target=\"_blank\" rel=\"noopener\">three.js</a> - convex geometry"
function onReady(__stage: any) {
  const ASSET_HOST = props.example?.globals?.ASSET_HOST || '/threejs-official/'
  let scene = __stage.scene
  let camera = __stage.camera
  let renderer = __stage.renderer
  const controls = __stage.controls

  
  
  
  
  			let group;
  
  			
  
  
  				
  
  				
  
  
  				// camera
  
  				
  
  				scene.add( camera );
  
  				// controls
  
  
  				controls.minDistance = 20;
  				controls.maxDistance = 50;
  				controls.maxPolarAngle = Math.PI / 2;
  
  				// ambient light
  
  				scene.add( new THREE.AmbientLight( 0x666666 ) );
  
  				// point light
  
  				const light = new THREE.PointLight( 0xffffff, 3, 0, 0 );
  				camera.add( light );
  
  				// helper
  
  				scene.add( new THREE.AxesHelper( 20 ) );
  
  				// textures
  
  				const loader = new THREE.TextureLoader();
  				const texture = loader.load( ASSET_HOST + 'textures/sprites/disc.png' );
  				texture.colorSpace = THREE.SRGBColorSpace;
  
  				group = new THREE.Group();
  				scene.add( group );
  
  				// points
  
  				let dodecahedronGeometry: any = new THREE.DodecahedronGeometry( 10 );
  
  				// if normal and uv attributes are not removed, mergeVertices() can't consolidate identical vertices with different normal/uv data
  
  				dodecahedronGeometry.deleteAttribute( 'normal' );
  				dodecahedronGeometry.deleteAttribute( 'uv' );
  
  				dodecahedronGeometry = BufferGeometryUtils.mergeVertices( dodecahedronGeometry );
  
  				const vertices = [];
  				const positionAttribute = dodecahedronGeometry.getAttribute( 'position' );
  
  				for ( let i = 0; i < positionAttribute.count; i ++ ) {
  
  					const vertex = new THREE.Vector3();
  					vertex.fromBufferAttribute( positionAttribute, i );
  					vertices.push( vertex );
  
  				}
  
  				const pointsMaterial = new THREE.PointsMaterial( {
  					color: 0x0080ff,
  					map: texture,
  					size: 1,
  					alphaTest: 0.5
  				} );
  
  				const pointsGeometry = new THREE.BufferGeometry().setFromPoints( vertices );
  
  				const points = new THREE.Points( pointsGeometry, pointsMaterial );
  				group.add( points );
  
  				// convex hull
  
  				const meshMaterial = new THREE.MeshLambertMaterial( {
  					color: 0xffffff,
  					opacity: 0.5,
  					side: THREE.DoubleSide,
  					transparent: true
  				} );
  
  				const meshGeometry = new ConvexGeometry( vertices );
  
  				const mesh = new THREE.Mesh( meshGeometry, meshMaterial );
  				group.add( mesh );
  
  				//
  
  				
  
  			
  
  
  			
  
  			__stage.addUpdateCallback((_delta: any, _elapsed: any) => {
    group.rotation.y += 0.005;
  })
  
  		
}
</script>
