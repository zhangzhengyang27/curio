<template>
  <WebGPUExampleScene
    camera="perspective"
    antialias
    :camera-options="{ fov: 50, near: 0.01, far: 100 }"
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

<script setup lang="ts">
import WebGPUExampleScene from '@/examples/components/WebGPUExampleScene.vue'
import * as THREE from 'three/webgpu';
import { uniform } from 'three/tsl';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

const props = defineProps({
  example: {
    type: Object,
    default: () => ({})
  }
})

const infoHtml = "<a href=\"https://threejs.org/\" target=\"_blank\" rel=\"noopener\" class=\"logo-link\"></a>\n\n\t\t\t<div class=\"title-wrapper\">\n\t\t\t\t<a href=\"https://threejs.org/\" target=\"_blank\" rel=\"noopener\">three.js</a><span>Occlusion</span>"
function onReady(__stage: any) {
  let scene = __stage.scene
  let camera = __stage.camera
  let renderer = __stage.renderer
  const controls = __stage.controls
  

  
  
  			class OcclusionNode extends THREE.Node {
	updateType: any;
	uniformNode: any;
	testObject: any;
	normalColor: any;
	occludedColor: any;

  
  				constructor( testObject: any, normalColor: any, occludedColor: any ) {
  
  					super( 'vec3' );
  
  					this.updateType = THREE.NodeUpdateType.OBJECT;
  
  					this.uniformNode = uniform( new THREE.Color() );
  
  					this.testObject = testObject;
  					this.normalColor = normalColor;
  					this.occludedColor = occludedColor;
  
  				}
  
  			update( frame: any ): any {
  
  					const isOccluded = frame.renderer.isOccluded( this.testObject );
  
  					this.uniformNode.value.copy( isOccluded ? this.occludedColor : this.normalColor );
  
  				}
  
  				setup( /* builder */ ) {
  
  					return this.uniformNode;
  
  				}
  
  			}
  
  			
  
  
  				
  				camera.position.z = 7;
  
  				
  
  				// lights
  
  				const ambientLight = new THREE.AmbientLight( 0xb0b0b0 );
  
  				const light = new THREE.DirectionalLight( 0xFFFFFF, 1.0 );
  				light.position.set( 0.32, 0.39, 0.7 );
  
  				scene.add( ambientLight );
  				scene.add( light );
  
  				// models
  
  				const planeGeometry = new THREE.PlaneGeometry( 2, 2 );
  				const sphereGeometry = new THREE.SphereGeometry( 0.5 );
  
  				const plane = new THREE.Mesh( planeGeometry, new THREE.MeshPhongNodeMaterial( { color: 0x00ff00, side: THREE.DoubleSide } ) );
  				const sphere = new THREE.Mesh( sphereGeometry, new THREE.MeshPhongNodeMaterial( { color: 0xffff00 } ) );
  
  				const instanceUniform = new OcclusionNode( sphere, new THREE.Color( 0x0000ff ), new THREE.Color( 0x00ff00 ) );
  
  				(plane.material.colorNode as any) = instanceUniform;
  
  				sphere.position.z = - 1;
  				sphere.occlusionTest = true;
  
  				scene.add( plane );
  				scene.add( sphere );
  
  				// renderer
  
  				
  
  
  				// controls
  
  				
  				controls.minDistance = 3;
  				controls.maxDistance = 25;
  
  				
  
  			
  
  
  			
  
  			function render() {
  
  
  
  			}
  
  		
}
</script>
