<template>
  <ExampleScene
    camera="perspective"
    antialias
    :camera-options="{ fov: 25, near: 50, far: 10000000 }"
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
import ExampleScene from '@/examples/components/ExampleScene.vue'
import * as THREE from 'three/webgpu';
import { pass } from 'three/tsl';
import { film } from 'three/examples/jsm/tsl/display/FilmNode.js';
import Stats from 'three/examples/jsm/libs/stats.module.js';
import { FlyControls } from 'three/examples/jsm/controls/FlyControls.js';

const props = defineProps({
  example: {
    type: Object,
    default: () => ({})
  }
})

const infoHtml = "<a href=\"https://threejs.org\" target=\"_blank\" rel=\"noopener\">three.js</a> - earth [fly controls]<br/>\n\t\t<b>WASD</b> move, <b>R|F</b> up | down, <b>Q|E</b> roll, <b>up|down</b> pitch, <b>left|right</b> yaw"
function onReady(__stage: any) {
  const ASSET_HOST = props.example?.globals?.ASSET_HOST || '/threejs-official/'
  let scene = __stage.scene
  let camera = __stage.camera
  let renderer = __stage.renderer
  const controls = __stage.controls
  

  
  
  
  
  			const radius = 6371;
  			const tilt = 0.41;
  			const rotationSpeed = 0.02;
  
  			const cloudsScale = 1.005;
  			const moonScale = 0.23;
  
  			const MARGIN = 0;
  			let SCREEN_HEIGHT = (__stage.container?.clientHeight || window.innerHeight) - MARGIN * 2;
  			let SCREEN_WIDTH = (__stage.container?.clientWidth || window.innerWidth);
  
  			let stats;
  			let geometry, meshPlanet: any, meshClouds: any, meshMoon: any;
  			let dirLight;
  
  			let renderPipeline: any;
  
  			const textureLoader = new THREE.TextureLoader();
  
  			let d, dPlanet, dMoon;
  			const dMoonVec = new THREE.Vector3();
  
  			const timer = new THREE.Timer();
  			timer.connect( document );
  
  			
  
  
  				
  				camera.position.z = radius * 5;
  
  				
  				scene.background = new THREE.Color( 0x000000 );
  				scene.fog = new THREE.FogExp2( 0x000000, 0.00000025 );
  
  				dirLight = new THREE.DirectionalLight( 0xffffff, 3 );
  				dirLight.position.set( - 1, 0, 1 ).normalize();
  				scene.add( dirLight );
  
  				const materialNormalMap = new THREE.MeshPhongMaterial( {
  
  					specular: 0x7c7c7c,
  					shininess: 15,
  					map: textureLoader.load( ASSET_HOST + 'textures/planets/earth_atmos_2048.jpg' ),
  					specularMap: textureLoader.load( ASSET_HOST + 'textures/planets/earth_specular_2048.jpg' ),
  					normalMap: textureLoader.load( ASSET_HOST + 'textures/planets/earth_normal_2048.jpg' ),
  
  					// y scale is negated to compensate for normal map handedness.
  					normalScale: new THREE.Vector2( 0.85, - 0.85 )
  
  				} );
  			materialNormalMap!.map!.colorSpace = THREE.SRGBColorSpace;
  
  				// planet
  
  				geometry = new THREE.SphereGeometry( radius, 100, 50 );
  
  				meshPlanet = new THREE.Mesh( geometry, materialNormalMap );
  				meshPlanet.rotation.y = 0;
  				meshPlanet.rotation.z = tilt;
  				scene.add( meshPlanet );
  
  				// clouds
  
  				const materialClouds = new THREE.MeshLambertMaterial( {
  
  					map: textureLoader.load( ASSET_HOST + 'textures/planets/earth_clouds_1024.png' ),
  					transparent: true
  
  				} );
  			materialClouds!.map!.colorSpace = THREE.SRGBColorSpace;
  
  				meshClouds = new THREE.Mesh( geometry, materialClouds );
  				meshClouds.scale.set( cloudsScale, cloudsScale, cloudsScale );
  				meshClouds.rotation.z = tilt;
  				scene.add( meshClouds );
  
  				// moon
  
  				const materialMoon = new THREE.MeshPhongMaterial( {
  
  					map: textureLoader.load( ASSET_HOST + 'textures/planets/moon_1024.jpg' )
  
  				} );
  			materialMoon!.map!.colorSpace = THREE.SRGBColorSpace;
  
  				meshMoon = new THREE.Mesh( geometry, materialMoon );
  				meshMoon.position.set( radius * 5, 0, 0 );
  				meshMoon.scale.set( moonScale, moonScale, moonScale );
  				scene.add( meshMoon );
  
  				// stars
  
  				const r = radius, starsGeometry = [ new THREE.BufferGeometry(), new THREE.BufferGeometry() ];
  
  				const vertices1 = [];
  				const vertices2 = [];
  
  				const vertex = new THREE.Vector3();
  
  				for ( let i = 0; i < 250; i ++ ) {
  
  					vertex.x = Math.random() * 2 - 1;
  					vertex.y = Math.random() * 2 - 1;
  					vertex.z = Math.random() * 2 - 1;
  					vertex.multiplyScalar( r );
  
  					vertices1.push( vertex.x, vertex.y, vertex.z );
  
  				}
  
  				for ( let i = 0; i < 1500; i ++ ) {
  
  					vertex.x = Math.random() * 2 - 1;
  					vertex.y = Math.random() * 2 - 1;
  					vertex.z = Math.random() * 2 - 1;
  					vertex.multiplyScalar( r );
  
  					vertices2.push( vertex.x, vertex.y, vertex.z );
  
  				}
  
  				starsGeometry[ 0 ].setAttribute( 'position', new THREE.Float32BufferAttribute( vertices1, 3 ) );
  				starsGeometry[ 1 ].setAttribute( 'position', new THREE.Float32BufferAttribute( vertices2, 3 ) );
  
  				const starsMaterials = [
  					new THREE.PointsMaterial( { color: 0x9c9c9c } ),
  					new THREE.PointsMaterial( { color: 0x838383 } ),
  					new THREE.PointsMaterial( { color: 0x5a5a5a } )
  				];
  
  				for ( let i = 10; i < 30; i ++ ) {
  
  					const stars = new THREE.Points( starsGeometry[ i % 2 ], starsMaterials[ i % 3 ] );
  
  					stars.rotation.x = Math.random() * 6;
  					stars.rotation.y = Math.random() * 6;
  					stars.rotation.z = Math.random() * 6;
  					stars.scale.setScalar( i * 10 );
  
  					stars.matrixAutoUpdate = false;
  					stars.updateMatrix();
  
  					scene.add( stars );
  
  				}
  
  				
  
  
  				//
  
  				
  
  				controls.movementSpeed = 1000;
  				controls.domElement = renderer.domElement;
  				controls.rollSpeed = Math.PI / 24;
  				controls.autoForward = false;
  				controls.dragToLook = false;
  
  				//
  
  				stats = new Stats();
  				__stage.overlay?.appendChild(stats.dom)
  
  				
  
  				// postprocessing
  
  				renderPipeline = new THREE.RenderPipeline( renderer );
  
  				const scenePass = pass( scene, camera );
  				const scenePassColor = scenePass.getTextureNode();
  
  				renderPipeline.outputNode = film( scenePassColor );
  
  			
  
  
  			
  
  			__stage.addUpdateCallback((_delta: any, _elapsed: any) => {
    timer.update();
    {
    // rotate the planet and clouds
    				const delta = timer.getDelta();
    				meshPlanet.rotation.y += rotationSpeed * delta;
    				meshClouds.rotation.y += 1.25 * rotationSpeed * delta;
    				// slow down as we approach the surface
    				dPlanet = camera.position.length();
    				dMoonVec.subVectors( camera.position, meshMoon.position );
    				dMoon = dMoonVec.length();
    				if ( dMoon < dPlanet ) {
    					d = ( dMoon - radius * moonScale * 1.01 );
    				} else {
    					d = ( dPlanet - radius * 1.01 );
    				}
    				controls.movementSpeed = 0.33 * d;
    				controls.update( delta );
    				renderPipeline.render();
    }
    				stats.update();
  })
  
  			function render() {
  
  				// rotate the planet and clouds
  
  				const delta = timer.getDelta();
  
  				meshPlanet.rotation.y += rotationSpeed * delta;
  				meshClouds.rotation.y += 1.25 * rotationSpeed * delta;
  
  				// slow down as we approach the surface
  
  				dPlanet = camera.position.length();
  
  				dMoonVec.subVectors( camera.position, meshMoon.position );
  				dMoon = dMoonVec.length();
  
  				if ( dMoon < dPlanet ) {
  
  					d = ( dMoon - radius * moonScale * 1.01 );
  
  				} else {
  
  					d = ( dPlanet - radius * 1.01 );
  
  				}
  
  				controls.movementSpeed = 0.33 * d;
  				controls.update( delta );
  
  				renderPipeline.render();
  
  			}
  
  		
}
</script>
