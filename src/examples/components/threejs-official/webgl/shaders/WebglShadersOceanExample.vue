<template>
  <ExampleScene
    camera="perspective"
    :camera-position="[30, 30, 100]"
    :camera-options="{ fov: 55, near: 1, far: 20000 }"
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
import Stats from 'three/examples/jsm/libs/stats.module.js';
import { GUI } from 'three/examples/jsm/libs/lil-gui.module.min.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { Water } from 'three/examples/jsm/objects/Water.js';
import { Sky } from 'three/examples/jsm/objects/Sky.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';

const props = defineProps({
  example: {
    type: Object,
    default: () => ({})
  }
})

const infoHtml = "<a href=\"https://threejs.org\" target=\"_blank\" rel=\"noopener\">three.js</a> - webgl ocean"
function onReady(__stage) {
  const ASSET_HOST = props.example?.globals?.ASSET_HOST || '/threejs-official/'
  let scene = __stage.scene
  let camera = __stage.camera
  let renderer = __stage.renderer
  const controls = __stage.controls
  

  
  
  
  
  
  			let container, stats, timer;
  
  			let water, sun, sky, mesh, bloomPass;
  
  			
  
  
  				container = document.getElementById( 'container' );
  
  				//
  
  				
  
  
  				renderer.toneMapping = THREE.ACESFilmicToneMapping;
  				renderer.toneMappingExposure = 0.1;
  
  
  				bloomPass = new UnrealBloomPass( new THREE.Vector2( (__stage.container?.clientWidth || window.innerWidth), (__stage.container?.clientHeight || window.innerHeight) ), 1.5, 0.4, 0.85 );
  				bloomPass.threshold = 0;
  				bloomPass.strength = 0.1;
  				bloomPass.radius = 0;
  				renderer.setEffects( [ bloomPass ] );
  
  				//
  
  				
  
  				
  
  
  				timer = new THREE.Timer();
  
  				//
  
  				sun = new THREE.Vector3();
  
  				// Water
  
  				const waterGeometry = new THREE.PlaneGeometry( 10000, 10000 );
  
  				water = new Water(
  					waterGeometry,
  					{
  						textureWidth: 512,
  						textureHeight: 512,
  						waterNormals: new THREE.TextureLoader().load( ASSET_HOST + 'textures/waternormals.jpg', function ( texture ) {
  
  							texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  
  						} ),
  						sunDirection: new THREE.Vector3(),
  						sunColor: 0xffffff,
  						waterColor: 0x001e0f,
  						distortionScale: 3.7,
  						fog: scene.fog !== undefined
  					}
  				);
  
  				water.rotation.x = - Math.PI / 2;
  
  				scene.add( water );
  
  				// Skybox
  
  				sky = new Sky();
  				sky.scale.setScalar( 10000 );
  				scene.add( sky );
  
  				const skyUniforms = sky.material.uniforms;
  
  				skyUniforms[ 'turbidity' ].value = 10;
  				skyUniforms[ 'rayleigh' ].value = 2;
  				skyUniforms[ 'mieCoefficient' ].value = 0.005;
  				skyUniforms[ 'mieDirectionalG' ].value = 0.8;
  				skyUniforms[ 'cloudCoverage' ].value = 0.4;
  				skyUniforms[ 'cloudDensity' ].value = 0.5;
  				skyUniforms[ 'cloudElevation' ].value = 0.5;
  
  				const parameters = {
  					elevation: 2,
  					azimuth: 180,
  					exposure: 0.1
  				};
  
  				const pmremGenerator = new THREE.PMREMGenerator( renderer );
  				const sceneEnv = new THREE.Scene();
  
  				let renderTarget;
  
  				function updateSun() {
  
  					const phi = THREE.MathUtils.degToRad( 90 - parameters.elevation );
  					const theta = THREE.MathUtils.degToRad( parameters.azimuth );
  
  					sun.setFromSphericalCoords( 1, phi, theta );
  
  					sky.material.uniforms[ 'sunPosition' ].value.copy( sun );
  					water.material.uniforms[ 'sunDirection' ].value.copy( sun ).normalize();
  
  					if ( renderTarget !== undefined ) renderTarget.dispose();
  
  					sceneEnv.add( sky );
  					renderTarget = pmremGenerator.fromScene( sceneEnv );
  					scene.add( sky );
  
  					scene.environment = renderTarget.texture;
  
  				}
  
  				updateSun();
  
  				//
  
  				const geometry = new THREE.BoxGeometry( 30, 30, 30 );
  				const material = new THREE.MeshStandardMaterial( { roughness: 0 } );
  
  				mesh = new THREE.Mesh( geometry, material );
  				scene.add( mesh );
  
  				//
  
  				
  				controls.maxPolarAngle = Math.PI * 0.495;
  				controls.target.set( 0, 10, 0 );
  				controls.minDistance = 40.0;
  				controls.maxDistance = 200.0;
  				controls.update();
  
  				//
  
  				stats = new Stats();
  				__stage.overlay?.appendChild(stats.dom)
  
  				// GUI
  
  				const gui = new GUI();
  
  				const folderSky = gui.addFolder( 'Sky' );
  				folderSky.add( parameters, 'elevation', 0, 90, 0.1 ).onChange( updateSun );
  				folderSky.add( parameters, 'azimuth', - 180, 180, 0.1 ).onChange( updateSun );
  				folderSky.add( parameters, 'exposure', 0, 1, 0.0001 ).onChange( function ( value ) {
  
  					renderer.toneMappingExposure = value;
  
  				} );
  				folderSky.open();
  
  				const waterUniforms = water.material.uniforms;
  
  				const folderWater = gui.addFolder( 'Water' );
  				folderWater.add( waterUniforms.distortionScale, 'value', 0, 8, 0.1 ).name( 'distortionScale' );
  				folderWater.add( waterUniforms.size, 'value', 0.1, 10, 0.1 ).name( 'size' );
  				folderWater.open();
  
  				const folderBloom = gui.addFolder( 'Bloom' );
  				folderBloom.add( bloomPass, 'strength', 0, 3, 0.01 );
  				folderBloom.add( bloomPass, 'radius', 0, 1, 0.01 );
  				folderBloom.open();
  
  				const folderClouds = gui.addFolder( 'Clouds' );
  				folderClouds.add( skyUniforms.cloudCoverage, 'value', 0, 1, 0.01 ).name( 'coverage' );
  				folderClouds.add( skyUniforms.cloudDensity, 'value', 0, 1, 0.01 ).name( 'density' );
  				folderClouds.add( skyUniforms.cloudElevation, 'value', 0, 1, 0.01 ).name( 'elevation' );
  				folderClouds.open();
  
  				//
  
  				
  
  			
  
  
  			
  
  			__stage.addUpdateCallback((_delta, _elapsed) => {
    timer.update();
    {
    const time = performance.now() * 0.001;
    				mesh.position.y = Math.sin( time ) * 20 + 5;
    				mesh.rotation.x = time * 0.5;
    				mesh.rotation.z = time * 0.51;
    				const delta = timer.getDelta();
    				water.material.uniforms[ 'time' ].value += delta;
    				sky.material.uniforms[ 'time' ].value = time;
    }
    				stats.update();
  })
  
  			function render() {
  
  				const time = performance.now() * 0.001;
  
  				mesh.position.y = Math.sin( time ) * 20 + 5;
  				mesh.rotation.x = time * 0.5;
  				mesh.rotation.z = time * 0.51;
  
  				const delta = timer.getDelta();
  
  				water.material.uniforms[ 'time' ].value += delta;
  				sky.material.uniforms[ 'time' ].value = time;
  
  
  
  			}
  
  		
}
</script>
