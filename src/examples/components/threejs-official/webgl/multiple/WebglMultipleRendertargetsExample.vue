<template>
  <ExampleScene
    camera="perspective"
    custom-render
    :camera-options="{ fov: 70, near: 0.1, far: 50 }"
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
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GUI } from 'three/examples/jsm/libs/lil-gui.module.min.js';

const props = defineProps({
  example: {
    type: Object,
    default: () => ({})
  }
})

const infoHtml = "<a href=\"https://threejs.org\" target=\"_blank\">threejs</a> webgl - Multiple RenderTargets"

// G-Buffer shaders (GLSL3)
const gbufferVertShader = /* glsl */`
precision highp float;
precision highp int;
in vec3 position;
in vec3 normal;
in vec2 uv;
uniform mat4 modelViewMatrix;
uniform mat4 projectionMatrix;
uniform mat3 normalMatrix;
out vec3 vNormal;
out vec2 vUv;
void main() {
    vNormal = normalize(normalMatrix * normal);
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`

const gbufferFragShader = /* glsl */`
precision highp float;
precision highp int;
uniform sampler2D tDiffuse;
uniform vec2 repeat;
in vec3 vNormal;
in vec2 vUv;
layout(location = 0) out vec4 gColor;
layout(location = 1) out vec4 gNormal;
void main() {
    gColor = texture(tDiffuse, vUv * repeat);
    gNormal = vec4(normalize(vNormal), 1.0);
}
`

// Post-processing shaders (GLSL3)
const renderVertShader = /* glsl */`
precision highp float;
precision highp int;
in vec3 position;
in vec2 uv;
uniform mat4 modelViewMatrix;
uniform mat4 projectionMatrix;
out vec2 vUv;
void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`

const renderFragShader = /* glsl */`
precision highp float;
precision highp int;
uniform sampler2D tDiffuse;
uniform sampler2D tNormal;
in vec2 vUv;
out vec4 fragColor;
void main() {
    vec4 diffuse = texture(tDiffuse, vUv);
    vec4 normal = texture(tNormal, vUv);
    fragColor = diffuse + normal * 0.5;
}
`

function onReady(__stage: any) {
  const ASSET_HOST = props.example?.globals?.ASSET_HOST || '/threejs-official/'
  let scene = __stage.scene
  let camera = __stage.camera
  let renderer = __stage.renderer
  const controls = __stage.controls
  

  
  			let renderTarget: any;
  			let postScene: any, postCamera: any;
  
  			const parameters = {
  				samples: 4,
  				wireframe: false
  			};
  
  			gui = new GUI();
  			gui.add( parameters, 'samples', 0, 4 ).step( 1 );
  			gui.add( parameters, 'wireframe' );
  			gui.onChange( render );
  
  			
  
  
  				
  
  
  
  
  				// Create a multi render target with Float buffers
  
  				renderTarget = new THREE.WebGLRenderTarget(
  					(__stage.container?.clientWidth || window.innerWidth) * window.devicePixelRatio,
  					(__stage.container?.clientHeight || window.innerHeight) * window.devicePixelRatio,
  					{
  						count: 2,
  						minFilter: THREE.NearestFilter,
  						magFilter: THREE.NearestFilter
  					}
  				);
  
  				// Name our G-Buffer attachments for debugging
  
  				renderTarget.textures[ 0 ].name = 'diffuse';
  				renderTarget.textures[ 1 ].name = 'normal';
  
  				// Scene setup
  
  				
  				scene.background = new THREE.Color( 0x222222 );
  
  				
  				camera.position.z = 4;
  
  				const loader = new THREE.TextureLoader();
  
  				const diffuse = loader.load( ASSET_HOST + 'textures/hardwood2_diffuse.jpg', render );
  				diffuse.wrapS = THREE.RepeatWrapping;
  				diffuse.wrapT = THREE.RepeatWrapping;
  				diffuse.colorSpace = THREE.SRGBColorSpace;
  
  				scene.add( new THREE.Mesh(
  					new THREE.TorusKnotGeometry( 1, 0.3, 128, 32 ),
  					new THREE.RawShaderMaterial( {
  						name: 'G-Buffer Shader',
  						vertexShader: gbufferVertShader,
  						fragmentShader: gbufferFragShader,
  						uniforms: {
  							tDiffuse: { value: diffuse },
  							repeat: { value: new THREE.Vector2( 5, 0.5 ) }
  						},
  						glslVersion: THREE.GLSL3
  					} )
  				) );
  
  				// PostProcessing setup
  
  				postScene = new THREE.Scene();
  				postCamera = new THREE.OrthographicCamera( - 1, 1, 1, - 1, 0, 1 );
  
  				postScene.add( new THREE.Mesh(
  					new THREE.PlaneGeometry( 2, 2 ),
  					new THREE.RawShaderMaterial( {
  						name: 'Post-FX Shader',
  						vertexShader: renderVertShader,
  						fragmentShader: renderFragShader,
  						uniforms: {
  							tDiffuse: { value: renderTarget.textures[ 0 ] },
  							tNormal: { value: renderTarget.textures[ 1 ] },
  						},
  						glslVersion: THREE.GLSL3
  					} )
  				) );
  
  				// Controls
  
  				
  				controls.addEventListener( 'change', render );
  
  				
  
  			
  
  
  			
  
  			function render() {
  
  				renderTarget.samples = parameters.samples;
  
  				scene.traverse( function ( child: any ) {
  
  					if ( child.material !== undefined ) {
  
  						child.material.wireframe = parameters.wireframe;
  
  					}
  
  				} );
  
  				// render scene into target
  				renderer.setRenderTarget( renderTarget );
  
  
  				// render post FX
  				renderer.setRenderTarget( null );
  				renderer.render( postScene, postCamera );
  
  			}
  
  		
}

onUnmounted(() => {
  gui?.destroy()
})
</script>
