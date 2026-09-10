<template>
  <ExampleScene
    camera="perspective"
    :camera-options="{ fov: 75, near: 5, far: 15000 }"
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
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GPUComputationRenderer } from 'three/examples/jsm/misc/GPUComputationRenderer.js';

const props = defineProps({
  example: {
    type: Object,
    default: () => ({})
  }
})

const infoHtml = "<a href=\"https://threejs.org\" target=\"_blank\" rel=\"noopener\">three.js</a> - <span id=\"protoplanets\"></span> webgl gpgpu debris"
function onReady(__stage) {
  let scene = __stage.scene
  let camera = __stage.camera
  let renderer = __stage.renderer
  const controls = __stage.controls

  // Inlined shaders (originally from script tags in the HTML)
  const computeShaderVelocity = `
    uniform float gravityConstant;
    uniform float density;
    const float width = 64.0;
    const float height = 64.0;
    float rand(vec2 co){
      return fract(sin(dot(co.xy ,vec2(12.9898,78.233))) * 43758.5453);
    }
    void main() {
      vec2 uv = gl_FragCoord.xy / resolution.xy;
      float idParticle = uv.y * resolution.x + uv.x;
      vec3 tmpPos = texture2D( texturePosition, uv ).xyz;
      vec3 pos = tmpPos;
      vec3 tmpVel = texture2D( textureVelocity, uv ).xyz;
      vec3 vel = tmpVel;
      float mass = texture2D( textureVelocity, uv ).w;
      if ( mass == 0.0 ) {
        vel = vec3( 0.0 );
      }
      // Dynamics
      pos += vel * delta;
      gl_FragColor = vec4( vel, mass );
    }
  `;

  const computeShaderPosition = `
    const float width = 64.0;
    const float height = 64.0;
    void main() {
      vec2 uv = gl_FragCoord.xy / resolution.xy;
      float idParticle = uv.y * resolution.x + uv.x;
      vec3 tmpPos = texture2D( texturePosition, uv ).xyz;
      vec3 pos = tmpPos;
      vec3 tmpVel = texture2D( textureVelocity, uv ).xyz;
      vec3 vel = tmpVel;
      if ( pos.y < 0.0 ) {
        pos.y = 0.0;
        vel.y = 0.0;
      }
      gl_FragColor = vec4( pos, 1.0 );
    }
  `;

  const particleVertexShader = `
    uniform sampler2D texturePosition;
    uniform sampler2D textureVelocity;
    uniform float cameraConstant;
    uniform float density;
    varying vec4 vColor;
    void main() {
      vec4 posTemp = texture2D( texturePosition, uv );
      vec3 pos = posTemp.xyz;
      vec4 velTemp = texture2D( textureVelocity, uv );
      vec3 vel = velTemp.xyz;
      float mass = velTemp.w;
      vec4 mvPosition = modelViewMatrix * vec4( pos, 1.0 );
      gl_PointSize = cameraConstant / ( - mvPosition.z ) * 100.0 * density;
      gl_Position = projectionMatrix * mvPosition;
      vColor = vec4( 1.0, mass / 250.0, 0.0, 1.0 );
    }
  `;

  const particleFragmentShader = `
    varying vec4 vColor;
    void main() {
      vec4 outColor = vColor;
      gl_FragColor = outColor;
    }
  `;

  
  
  
  
  
  			// Texture width for simulation (each texel is a debris particle)
  			const WIDTH = 64;
  
  			let container, stats;
  
  
  			const PARTICLES = WIDTH * WIDTH;
  
  
  			let velocityVariable;
  			let positionVariable;
  			let velocityUniforms;
  
  
  
  			
  
  
  				
  				camera.position.y = 120;
  				camera.position.z = 400;
  
  				
  
  				
  
  
  				controls.minDistance = 100;
  				controls.maxDistance = 1000;
  
  				effectController = {
  					// Can be changed dynamically
  					gravityConstant: 100.0,
  					density: 0.45,
  
  					// Must restart simulation
  					radius: 300,
  					height: 8,
  					exponent: 0.4,
  					maxMass: 15.0,
  					velocity: 70,
  					velocityExponent: 0.2,
  					randVelocity: 0.001
  				};
  
  				initComputeRenderer();
  
  				stats = new Stats();
  				__stage.overlay?.appendChild(stats.dom)
  
  				
  
  				initGUI();
  
  				initProtoplanets();
  
  				dynamicValuesChanger();
  
  			
  
  
  			function initComputeRenderer() {
  
  				gpuCompute = new GPUComputationRenderer( WIDTH, WIDTH, renderer );
  
  				const dtPosition = gpuCompute.createTexture();
  				const dtVelocity = gpuCompute.createTexture();
  
  				fillTextures( dtPosition, dtVelocity );
  
  				velocityVariable = gpuCompute.addVariable( 'textureVelocity', computeShaderVelocity, dtVelocity );
  				positionVariable = gpuCompute.addVariable( 'texturePosition', computeShaderPosition, dtPosition );
  
  				gpuCompute.setVariableDependencies( velocityVariable, [ positionVariable, velocityVariable ] );
  				gpuCompute.setVariableDependencies( positionVariable, [ positionVariable, velocityVariable ] );
  
  				velocityUniforms = velocityVariable.material.uniforms;
  
  				velocityUniforms[ 'gravityConstant' ] = { value: 0.0 };
  				velocityUniforms[ 'density' ] = { value: 0.0 };
  
  				const error = gpuCompute.init();
  
  				if ( error !== null ) {
  
  					console.error( error );
  
  				}
  
  			}
  
  			function restartSimulation() {
  
  				const dtPosition = gpuCompute.createTexture();
  				const dtVelocity = gpuCompute.createTexture();
  
  				fillTextures( dtPosition, dtVelocity );
  
  				gpuCompute.renderTexture( dtPosition, positionVariable.renderTargets[ 0 ] );
  				gpuCompute.renderTexture( dtPosition, positionVariable.renderTargets[ 1 ] );
  				gpuCompute.renderTexture( dtVelocity, velocityVariable.renderTargets[ 0 ] );
  				gpuCompute.renderTexture( dtVelocity, velocityVariable.renderTargets[ 1 ] );
  
  			}
  
  			function initProtoplanets() {
  
  				geometry = new THREE.BufferGeometry();
  
  				const positions = new Float32Array( PARTICLES * 3 );
  				let p = 0;
  
  				for ( let i = 0; i < PARTICLES; i ++ ) {
  
  					positions[ p ++ ] = ( Math.random() * 2 - 1 ) * effectController.radius;
  					positions[ p ++ ] = 0; //( Math.random() * 2 - 1 ) * effectController.radius;
  					positions[ p ++ ] = ( Math.random() * 2 - 1 ) * effectController.radius;
  
  				}
  
  				const uvs = new Float32Array( PARTICLES * 2 );
  				p = 0;
  
  				for ( let j = 0; j < WIDTH; j ++ ) {
  
  					for ( let i = 0; i < WIDTH; i ++ ) {
  
  						uvs[ p ++ ] = i / ( WIDTH - 1 );
  						uvs[ p ++ ] = j / ( WIDTH - 1 );
  
  					}
  
  				}
  
  				geometry.setAttribute( 'position', new THREE.BufferAttribute( positions, 3 ) );
  				geometry.setAttribute( 'uv', new THREE.BufferAttribute( uvs, 2 ) );
  
  				particleUniforms = {
  					'texturePosition': { value: null },
  					'textureVelocity': { value: null },
  					'cameraConstant': { value: getCameraConstant( camera ) },
  					'density': { value: 0.0 }
  				};
  
  				// THREE.ShaderMaterial
  				const material = new THREE.ShaderMaterial( {
  					uniforms: particleUniforms,
  					vertexShader: particleVertexShader,
  					fragmentShader: particleFragmentShader
  				} );
  
  				const particles = new THREE.Points( geometry, material );
  				particles.matrixAutoUpdate = false;
  				particles.updateMatrix();
  
  				scene.add( particles );
  
  			}
  
  			function fillTextures( texturePosition, textureVelocity ) {
  
  				const posArray = texturePosition.image.data;
  				const velArray = textureVelocity.image.data;
  
  				const radius = effectController.radius;
  				const height = effectController.height;
  				const exponent = effectController.exponent;
  				const maxMass = effectController.maxMass * 1024 / PARTICLES;
  				const maxVel = effectController.velocity;
  				const velExponent = effectController.velocityExponent;
  				const randVel = effectController.randVelocity;
  
  				for ( let k = 0, kl = posArray.length; k < kl; k += 4 ) {
  
  					// Position
  					let x, z, rr;
  
  					do {
  
  						x = ( Math.random() * 2 - 1 );
  						z = ( Math.random() * 2 - 1 );
  						rr = x * x + z * z;
  
  					} while ( rr > 1 );
  
  					rr = Math.sqrt( rr );
  
  					const rExp = radius * Math.pow( rr, exponent );
  
  					// Velocity
  					const vel = maxVel * Math.pow( rr, velExponent );
  
  					const vx = vel * z + ( Math.random() * 2 - 1 ) * randVel;
  					const vy = ( Math.random() * 2 - 1 ) * randVel * 0.05;
  					const vz = - vel * x + ( Math.random() * 2 - 1 ) * randVel;
  
  					x *= rExp;
  					z *= rExp;
  					const y = ( Math.random() * 2 - 1 ) * height;
  
  					const mass = Math.random() * maxMass + 1;
  
  					// Fill in texture values
  					posArray[ k + 0 ] = x;
  					posArray[ k + 1 ] = y;
  					posArray[ k + 2 ] = z;
  					posArray[ k + 3 ] = 1;
  
  					velArray[ k + 0 ] = vx;
  					velArray[ k + 1 ] = vy;
  					velArray[ k + 2 ] = vz;
  					velArray[ k + 3 ] = mass;
  
  				}
  
  			}
  
  			
  
  			function dynamicValuesChanger() {
  
  				velocityUniforms[ 'gravityConstant' ].value = effectController.gravityConstant;
  				velocityUniforms[ 'density' ].value = effectController.density;
  				particleUniforms[ 'density' ].value = effectController.density;
  
  			}
  
  			function initGUI() {
  
  				gui = new GUI( { width: 280 } );
  
  				const folder1 = gui.addFolder( 'Dynamic parameters' );
  
  				folder1.add( effectController, 'gravityConstant', 0.0, 1000.0, 0.05 ).onChange( dynamicValuesChanger );
  				folder1.add( effectController, 'density', 0.0, 10.0, 0.001 ).onChange( dynamicValuesChanger );
  
  				const folder2 = gui.addFolder( 'Static parameters' );
  
  				folder2.add( effectController, 'radius', 10.0, 1000.0, 1.0 );
  				folder2.add( effectController, 'height', 0.0, 50.0, 0.01 );
  				folder2.add( effectController, 'exponent', 0.0, 2.0, 0.001 );
  				folder2.add( effectController, 'maxMass', 1.0, 50.0, 0.1 );
  				folder2.add( effectController, 'velocity', 0.0, 150.0, 0.1 );
  				folder2.add( effectController, 'velocityExponent', 0.0, 1.0, 0.01 );
  				folder2.add( effectController, 'randVelocity', 0.0, 50.0, 0.1 );
  
  				const buttonRestart = {
  					restartSimulation: function () {
  
  						restartSimulation();
  
  					}
  				};
  
  				folder2.add( buttonRestart, 'restartSimulation' );
  
  				folder1.open();
  				folder2.open();
  
  			}
  
  			function getCameraConstant( camera ) {
  
  				return (__stage.container?.clientHeight || window.innerHeight) / ( Math.tan( THREE.MathUtils.DEG2RAD * 0.5 * camera.fov ) / camera.zoom );
  
  			}
  
  
  			__stage.addUpdateCallback((_delta, _elapsed) => {
    {
    gpuCompute.compute();
    				particleUniforms[ 'texturePosition' ].value = gpuCompute.getCurrentRenderTarget( positionVariable ).texture;
    				particleUniforms[ 'textureVelocity' ].value = gpuCompute.getCurrentRenderTarget( velocityVariable ).texture;
    }
    				stats.update();
  })
  
  			function render() {
  
  				gpuCompute.compute();
  
  				particleUniforms[ 'texturePosition' ].value = gpuCompute.getCurrentRenderTarget( positionVariable ).texture;
  				particleUniforms[ 'textureVelocity' ].value = gpuCompute.getCurrentRenderTarget( velocityVariable ).texture;
  
  
  
  			}
  
  		
}

onUnmounted(() => {
  gui?.destroy()
})
</script>
