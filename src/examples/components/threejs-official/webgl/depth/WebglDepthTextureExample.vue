<template>
  <ExampleScene
    camera="perspective"
    custom-render
    :camera-options="{ fov: 70, near: 0.01, far: 50 }"
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
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

const props = defineProps({
  example: {
    type: Object,
    default: () => ({})
  }
})

const infoHtml = "<a href=\"https://threejs.org\" target=\"_blank\" rel=\"noopener\">threejs</a> webgl - depth texture<br/>\n\t\t\tStores render target depth in a texture attachment.<br/>\n\t\t\tCreated by <a href=\"http://twitter.com/mattdesl\" target=\"_blank\" rel=\"noopener\">@mattdesl</a>.\n\n\t\t\t<div id=\"error\" style=\"display: none;\">\n\t\t\tYour browser does not support <strong>WEBGL_depth_texture</strong>.<br/><br/>\n\t\t\tThis demo will not work."

const postVertShader = /* glsl */`
varying vec2 vUv;
void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`

const postFragShader = /* glsl */`
#include <packing>
varying vec2 vUv;
uniform sampler2D tDiffuse;
uniform sampler2D tDepth;
uniform float cameraNear;
uniform float cameraFar;
void main() {
    float fragCoordZ = texture2D(tDepth, vUv).x;
    float viewZ = perspectiveDepthToViewZ(fragCoordZ, cameraNear, cameraFar);
    gl_FragColor = vec4(vec3(1.0 - viewZ / cameraFar), 1.0);
}
`

function onReady(__stage: any) {
  let scene = __stage.scene
  let camera = __stage.camera
  let renderer = __stage.renderer
  const controls = __stage.controls
  

  
  
  
  
  
  			let stats;
  			let target: any;
  			let postScene: any, postCamera: any, postMaterial: any;
  
  			const params = {
  				format: THREE.DepthFormat,
  				type: THREE.UnsignedShortType,
  				samples: 0,
  			};
  
  			const formats = { DepthFormat: THREE.DepthFormat, DepthStencilFormat: THREE.DepthStencilFormat };
  			const types = { UnsignedShortType: THREE.UnsignedShortType, UnsignedIntType: THREE.UnsignedIntType, FloatType: THREE.FloatType };
  
  			
  
  
  				
  
  
  				//
  
  				stats = new Stats();
  				__stage.overlay?.appendChild(stats.dom)
  
  				
  				camera.position.z = 4;
  
  				
  				controls.enableDamping = true;
  
  				// Create a render target with depth texture
  				setupRenderTarget();
  
  				// Our scene
  				setupScene();
  
  				// Setup post-processing step
  				setupPost();
  
  				onWindowResize();

				function onWindowResize() {
					const w = __stage.container?.clientWidth || window.innerWidth
					const h = __stage.container?.clientHeight || window.innerHeight
					camera.aspect = w / h
					camera.updateProjectionMatrix()
					renderer.setSize(w, h)
				}
  				
  
  				//
  				gui = new GUI( { width: 300 } );
  
  				gui.add( params, 'format', formats ).onChange( setupRenderTarget );
  				gui.add( params, 'type', types ).onChange( setupRenderTarget );
  				gui.add( params, 'samples', 0, 16, 1 ).onChange( setupRenderTarget );
  				gui.open();
  
  			
  
  
  			function setupRenderTarget() {
  
  				if ( target ) target.dispose();
  
  				const format = parseInt( params.format as any );
  				const type = parseInt( params.type as any );
  				const samples = parseInt( params.samples as any );
  
  				const dpr = renderer.getPixelRatio();
  				target = new THREE.WebGLRenderTarget( (__stage.container?.clientWidth || window.innerWidth) * dpr, (__stage.container?.clientHeight || window.innerHeight) * dpr );
  				target.texture.minFilter = THREE.NearestFilter;
  				target.texture.magFilter = THREE.NearestFilter;
  				target.texture.generateMipmaps = false;
  				target.stencilBuffer = ( format === THREE.DepthStencilFormat ) ? true : false;
  				target.samples = samples;
  
  				target.depthTexture = new THREE.DepthTexture();
  				target.depthTexture.format = format;
  				target.depthTexture.type = type;
  
  			}
  
  			function setupPost() {
  
  				// Setup post processing stage
  				postCamera = new THREE.OrthographicCamera( - 1, 1, 1, - 1, 0, 1 );
  				postMaterial = new THREE.ShaderMaterial( {
  					vertexShader: postVertShader,
  					fragmentShader: postFragShader,
  					uniforms: {
  						cameraNear: { value: camera.near },
  						cameraFar: { value: camera.far },
  						tDiffuse: { value: null },
  						tDepth: { value: null }
  					}
  				} );
  				const postPlane = new THREE.PlaneGeometry( 2, 2 );
  				const postQuad = new THREE.Mesh( postPlane, postMaterial );
  				postScene = new THREE.Scene();
  				postScene.add( postQuad );
  
  			}
  
  			function setupScene() {
  
  				
  
  				const geometry = new THREE.TorusKnotGeometry( 1, 0.3, 128, 64 );
  				const material = new THREE.MeshBasicMaterial( { color: 'blue' } );
  
  				const count = 50;
  				const scale = 5;
  
  				const mesh = new THREE.InstancedMesh( geometry, material, count );
  				const dummy = new THREE.Object3D();
  
  				for ( let i = 0; i < count; i ++ ) {
  
  					const r = Math.random() * 2.0 * Math.PI;
  					const z = ( Math.random() * 2.0 ) - 1.0;
  					const zScale = Math.sqrt( 1.0 - z * z ) * scale;
  
  					dummy.position.set(
  						Math.cos( r ) * zScale,
  						Math.sin( r ) * zScale,
  						z * scale
  					);
  					dummy.rotation.set( Math.random(), Math.random(), Math.random() );
  
  					dummy.updateMatrix();
  					mesh.setMatrixAt( i, dummy.matrix );
  
  				}
  
  				scene.add( mesh );
  
  			}
  
  			
  
  			__stage.addUpdateCallback((_delta: any, _elapsed: any) => {
    // render scene into target
    				renderer.setRenderTarget( target );
    				// render post FX
    				postMaterial.uniforms.tDiffuse.value = target.texture;
    				postMaterial.uniforms.tDepth.value = target.depthTexture;
    				renderer.setRenderTarget( null );
    				stats.update();
  })
  
  		
}

onUnmounted(() => {
  gui?.destroy()
})
</script>
