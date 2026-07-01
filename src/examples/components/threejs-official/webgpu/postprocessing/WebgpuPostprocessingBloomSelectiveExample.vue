<template>
  <WebGPUExampleScene
    camera="perspective"
    :camera-position="[0, 0, 20]"
    :camera-look-at="[0, 0, 0]"
    :camera-options="{ fov: 40, near: 1, far: 200 }"
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
import { pass, mrt, output, float, uniform } from 'three/tsl';
import { bloom } from 'three/examples/jsm/tsl/display/BloomNode.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { Inspector } from 'three/examples/jsm/inspector/Inspector.js';

const props = defineProps({
  example: {
    type: Object,
    default: () => ({})
  }
})

const infoHtml = "<a href=\"https://threejs.org/\" target=\"_blank\" rel=\"noopener\" class=\"logo-link\"></a>\n\n\t\t\t<div class=\"title-wrapper\">\n\t\t\t\t<a href=\"https://threejs.org/\" target=\"_blank\" rel=\"noopener\">three.js</a><span>Selective Bloom</span>"
function onReady(__stage) {
  const scene = __stage.scene
  const camera = __stage.camera
  const renderer = __stage.renderer
  const controls = __stage.controls

  
  
  
  
  
  			// scene
  
  
  
  
  
  
  
  			const geometry = new THREE.IcosahedronGeometry( 1, 15 );
  
  			for ( let i = 0; i < 50; i ++ ) {
  
  				const color = new THREE.Color();
  				color.setHSL( Math.random(), 0.7, Math.random() * 0.2 + 0.05 );
  
  				const bloomIntensity = Math.random() > 0.5 ? 1 : 0;
  
  				const material = new THREE.MeshBasicNodeMaterial( { color: color } );
  				material.mrtNode = mrt( {
  					bloomIntensity: uniform( bloomIntensity )
  				} );
  
  				const sphere = new THREE.Mesh( geometry, material );
  				sphere.position.x = Math.random() * 10 - 5;
  				sphere.position.y = Math.random() * 10 - 5;
  				sphere.position.z = Math.random() * 10 - 5;
  				sphere.position.normalize().multiplyScalar( Math.random() * 4.0 + 2.0 );
  				sphere.scale.setScalar( Math.random() * Math.random() + 0.5 );
  				scene.add( sphere );
  
  			}
  
  			// renderer
  
  
  
  
  			renderer.inspector = new Inspector();
  			renderer.toneMapping = THREE.NeutralToneMapping;
  
  
  			// post processing
  
  			const scenePass = pass( scene, camera );
  			scenePass.setMRT( mrt( {
  				output,
  				bloomIntensity: float( 0 ) // default bloom intensity
  			} ) );
  
  			const outputPass = scenePass.getTextureNode().toInspector( 'Color' );
  			const bloomIntensityPass = scenePass.getTextureNode( 'bloomIntensity' ).toInspector( 'Bloom Intensity' );
  
  			const bloomPass = bloom( outputPass.mul( bloomIntensityPass ) );
  
  			const renderPipeline = new THREE.RenderPipeline( renderer );
  			renderPipeline.outputColorTransform = false;
  			renderPipeline.outputNode = outputPass.add( bloomPass ).renderOutput();
  
  			// controls
  
  
  			controls.maxPolarAngle = Math.PI * 0.5;
  			controls.minDistance = 1;
  			controls.maxDistance = 100;
  
  			// raycaster
  
  			const raycaster = new THREE.Raycaster();
  			const mouse = new THREE.Vector2();
  
  			window.addEventListener( 'pointerdown', ( event ) => {
  
  				mouse.x = ( event.clientX / (__stage.container?.clientWidth || window.innerWidth) ) * 2 - 1;
  				mouse.y = - ( event.clientY / (__stage.container?.clientHeight || window.innerHeight) ) * 2 + 1;
  
  				raycaster.setFromCamera( mouse, camera );
  
  				const intersects = raycaster.intersectObjects( scene.children, false );
  
  				if ( intersects.length > 0 ) {
  
  					const material = intersects[ 0 ].object.material;
  
  					const bloomIntensity = material.mrtNode.get( 'bloomIntensity' );
  					bloomIntensity.value = bloomIntensity.value === 0 ? 1 : 0;
  
  				}
  
  			} );
  
  			// gui
  
  			const gui = renderer.inspector.createParameters( 'Settings' );
  
  			const bloomFolder = gui.addFolder( 'Bloom' );
  			bloomFolder.add( bloomPass.threshold, 'value', 0.0, 1.0 ).name( 'threshold' );
  			bloomFolder.add( bloomPass.strength, 'value', 0.0, 3 ).name( 'strength' );
  			bloomFolder.add( bloomPass.radius, 'value', 0.0, 1.0 ).name( 'radius' );
  
  			const toneMappingFolder = gui.addFolder( 'Tone Mapping' );
  			toneMappingFolder.add( renderer, 'toneMappingExposure', 0.1, 3 ).name( 'exposure' );
  
  			// events
  
  			
  
  			// animate
  
  			__stage.addUpdateCallback((_delta, _elapsed) => {
    renderPipeline.render();
  })
  
  		
}
</script>
