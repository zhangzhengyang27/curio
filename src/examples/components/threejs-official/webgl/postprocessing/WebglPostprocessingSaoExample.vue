<template>
  <ExampleScene
    camera="perspective"
    :camera-options="{ fov: 65, near: 3, far: 10 }"
    custom-render
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
import { onUnmounted } from 'vue'

let gui = null
import ExampleScene from '@/examples/components/ExampleScene.vue'
import * as THREE from 'three';
import Stats from 'three/examples/jsm/libs/stats.module.js';
import { GUI } from 'three/examples/jsm/libs/lil-gui.module.min.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { SAOPass } from 'three/examples/jsm/postprocessing/SAOPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';

const props = defineProps({
  example: {
    type: Object,
    default: () => ({})
  }
})

const infoHtml = "<a href=\"https://threejs.org\" target=\"_blank\" rel=\"noopener noreferrer\">three.js</a> - Scalable Ambient Occlusion (SAO)<br/>\n\t\t\tshader by <a href=\"http://clara.io\">Ben Houston</a> / Post-processing pass by <a href=\"http://ludobaka.github.io\">Ludobaka</a>"
function onReady(__stage) {
  let scene = __stage.scene
  let camera = __stage.camera
  let renderer = __stage.renderer
  const controls = __stage.controls

  
  
  
  
  
  			let container, stats;
  
  			let composer, renderPass, saoPass;
  			let group;
  
  			
  
  
  				const width = (__stage.container?.clientWidth || window.innerWidth);
  				const height = (__stage.container?.clientHeight || window.innerHeight);
  
  				
  
  
  				camera.position.z = 7;
  
  				
  
  				group = new THREE.Object3D();
  				scene.add( group );
  
  				const light = new THREE.PointLight( 0xefffef, 500 );
  				light.position.z = 10;
  				light.position.y = - 10;
  				light.position.x = - 10;
  				scene.add( light );
  
  				const light2 = new THREE.PointLight( 0xffefef, 500 );
  				light2.position.z = 10;
  				light2.position.x = - 10;
  				light2.position.y = 10;
  				scene.add( light2 );
  
  				const light3 = new THREE.PointLight( 0xefefff, 500 );
  				light3.position.z = 10;
  				light3.position.x = 10;
  				light3.position.y = - 10;
  				scene.add( light3 );
  
  				const light4 = new THREE.AmbientLight( 0xffffff, 0.2 );
  				scene.add( light4 );
  
  				const geometry = new THREE.SphereGeometry( 3, 48, 24 );
  				const material = new THREE.MeshStandardMaterial();
  				material.roughness = 0.5;
  				material.metalness = 0;
  
  				const mesh = new THREE.InstancedMesh( geometry, material, 120 );
  				const dummy = new THREE.Object3D();
  				const color = new THREE.Color();
  
  				for ( let i = 0; i < 120; i ++ ) {
  
  					dummy.position.x = Math.random() * 4 - 2;
  					dummy.position.y = Math.random() * 4 - 2;
  					dummy.position.z = Math.random() * 4 - 2;
  					dummy.rotation.x = Math.random();
  					dummy.rotation.y = Math.random();
  					dummy.rotation.z = Math.random();
  
  					const scale = Math.random() * 0.2 + 0.05;
  					dummy.scale.set( scale, scale, scale );
  
  					dummy.updateMatrix();
  					mesh.setMatrixAt( i, dummy.matrix );
  
  					color.setHSL( Math.random(), 1.0, 0.3 );
  					mesh.setColorAt( i, color );
  
  				}
  
  				group.add( mesh );
  
  				stats = new Stats();
  				__stage.overlay?.appendChild(stats.dom)
  
  				composer = new EffectComposer( renderer );
  				renderPass = new RenderPass( scene, camera );
  				composer.addPass( renderPass );
  				saoPass = new SAOPass( scene, camera );
  				composer.addPass( saoPass );
  				const outputPass = new OutputPass();
  				composer.addPass( outputPass );
  
  				// Init gui
  				gui = new GUI();
  				gui.add( saoPass.params, 'output', {
  					'Default': SAOPass.OUTPUT.Default,
  					'SAO Only': SAOPass.OUTPUT.SAO,
  					'Normal': SAOPass.OUTPUT.Normal
  				} ).onChange( function ( value ) {
  
  					saoPass.params.output = value;
  
  				} );
  				gui.add( saoPass.params, 'saoBias', - 1, 1 );
  				gui.add( saoPass.params, 'saoIntensity', 0, 1 );
  				gui.add( saoPass.params, 'saoScale', 0, 10 );
  				gui.add( saoPass.params, 'saoKernelRadius', 1, 100 );
  				gui.add( saoPass.params, 'saoMinResolution', 0, 1 );
  				gui.add( saoPass.params, 'saoBlur' );
  				gui.add( saoPass.params, 'saoBlurRadius', 0, 200 );
  				gui.add( saoPass.params, 'saoBlurStdDev', 0.5, 150 );
  				gui.add( saoPass.params, 'saoBlurDepthCutoff', 0.0, 0.1 );
  				gui.add( saoPass, 'enabled' );
  
  				
  
  			
  
  
  			
  
  			__stage.addUpdateCallback((_delta, _elapsed) => {
    stats.begin();
    {
    const timer = performance.now();
    				group.rotation.x = timer * 0.0002;
    				group.rotation.y = timer * 0.0001;
    				composer.render();
    }
    				stats.end();
  })
  
  			function render() {
  
  				const timer = performance.now();
  				group.rotation.x = timer * 0.0002;
  				group.rotation.y = timer * 0.0001;
  
  				composer.render();
  
  			}
  
  		
}

onUnmounted(() => {
  gui?.destroy()
})
</script>
