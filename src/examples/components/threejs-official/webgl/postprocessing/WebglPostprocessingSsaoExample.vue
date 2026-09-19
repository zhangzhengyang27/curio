<template>
  <ExampleScene
    camera="perspective"
    :camera-options="{ fov: 65, near: 100, far: 700 }"
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

<script setup lang="ts">
import { onUnmounted } from 'vue'

let gui: any = null
import ExampleScene from '@/examples/components/ExampleScene.vue'
import * as THREE from 'three';
import Stats from 'three/examples/jsm/libs/stats.module.js';
import { GUI } from 'three/examples/jsm/libs/lil-gui.module.min.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { SSAOPass } from 'three/examples/jsm/postprocessing/SSAOPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';

const props = defineProps({
  example: {
    type: Object,
    default: () => ({})
  }
})

const infoHtml = "<a href=\"https://threejs.org\" target=\"_blank\" rel=\"noopener\">three.js</a> - screen space ambient occlusion<br/>"
function onReady(__stage: any) {
  let scene = __stage.scene
  let camera = __stage.camera
  let renderer = __stage.renderer
  const controls = __stage.controls

  
  
  
  
  
  			let container, stats;
  
  			let composer: any;
  			let group: any;
  
  			
  
  
  				
  
  				camera.position.z = 500;
  
  				
  				scene.background = new THREE.Color( 0xaaaaaa );
  
  				scene.add( new THREE.DirectionalLight( 0xffffff, 4 ) );
  				scene.add( new THREE.AmbientLight( 0xffffff ) );
  
  				group = new THREE.Group();
  				scene.add( group );
  
  				const geometry = new THREE.BoxGeometry( 10, 10, 10 );
  				const material = new THREE.MeshLambertMaterial();
  
  				const mesh = new THREE.InstancedMesh( geometry, material, 100 );
  				const dummy = new THREE.Object3D();
  				const color = new THREE.Color();
  
  				for ( let i = 0; i < 100; i ++ ) {
  
  					dummy.position.x = Math.random() * 400 - 200;
  					dummy.position.y = Math.random() * 400 - 200;
  					dummy.position.z = Math.random() * 400 - 200;
  					dummy.rotation.x = Math.random();
  					dummy.rotation.y = Math.random();
  					dummy.rotation.z = Math.random();
  
  					dummy.scale.setScalar( Math.random() * 10 + 2 );
  
  					dummy.updateMatrix();
  					mesh.setMatrixAt( i, dummy.matrix );
  
  					color.setHex( Math.random() * 0xffffff );
  					mesh.setColorAt( i, color );
  
  				}
  
  				group.add( mesh );
  
  				stats = new Stats();
  				__stage.overlay?.appendChild(stats.dom)
  
  				const width = (__stage.container?.clientWidth || window.innerWidth);
  				const height = (__stage.container?.clientHeight || window.innerHeight);
  
  				composer = new EffectComposer( renderer );
  
  				const renderPass = new RenderPass( scene, camera );
  				composer.addPass( renderPass );
  
  				const ssaoPass = new SSAOPass( scene, camera, width, height );
  				composer.addPass( ssaoPass );
  
  				const outputPass = new OutputPass();
  				composer.addPass( outputPass );
  
  				// Init gui
  				gui = new GUI();
  
  				gui.add( ssaoPass, 'output', {
  					'Default': SSAOPass.OUTPUT.Default,
  					'SSAO Only': SSAOPass.OUTPUT.SSAO,
  					'SSAO Only + Blur': SSAOPass.OUTPUT.Blur,
  					'Depth': SSAOPass.OUTPUT.Depth,
  					'Normal': SSAOPass.OUTPUT.Normal
  				} ).onChange( function ( value: any ) {
  
  					ssaoPass.output = value;
  
  				} );
  				gui.add( ssaoPass, 'kernelRadius' ).min( 0 ).max( 32 );
  				gui.add( ssaoPass, 'minDistance' ).min( 0.001 ).max( 0.02 );
  				gui.add( ssaoPass, 'maxDistance' ).min( 0.01 ).max( 0.3 );
  				gui.add( ssaoPass, 'enabled' );
  
  				
  
  			
  
  
  			
  
  			__stage.addUpdateCallback((_delta: any, _elapsed: any) => {
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
