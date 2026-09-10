<template>
  <ExampleScene
    camera="perspective"
    antialias
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

const props = defineProps({
  example: {
    type: Object,
    default: () => ({})
  }
})

const infoHtml = "<a href=\"https://threejs.org\" target=\"_blank\" rel=\"noopener noreferrer\">three.js</a> webaudio - visualizer<br/>\n\t\t\tmusic by <a href=\"http://www.newgrounds.com/audio/listen/376737\" target=\"_blank\" rel=\"noopener\">skullbeatz</a>"

const vertexShader = /* glsl */`
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4( position, 1.0 );
  }
`;

const fragmentShader = /* glsl */`
  uniform sampler2D tAudioData;
  varying vec2 vUv;
  void main() {
    vec3 backgroundColor = vec3( 0.125, 0.125, 0.125 );
    vec3 color = vec3( 1.0, 1.0, 0.0 );
    float f = texture2D( tAudioData, vec2( vUv.x, 0.0 ) ).r;
    float i = step( vUv.y, f ) * step( f - 0.0125, vUv.y );
    gl_FragColor = vec4( mix( backgroundColor, color, i ), 1.0 );
  }
`;

function onReady(__stage) {
  let scene = __stage.scene
  let camera = __stage.camera
  let renderer = __stage.renderer
  const controls = __stage.controls

  let analyser, uniforms;

  const fftSize = 128;

  camera = new THREE.Camera();

  const listener = new THREE.AudioListener();

  const audio = new THREE.Audio( listener );
  const file = ASSET_HOST + 'sounds/376737_Skullbeatz___Bad_Cat_Maste.mp3';

  if ( /(iPad|iPhone|iPod)/g.test( navigator.userAgent ) ) {

    const loader = new THREE.AudioLoader();
    loader.load( file, function ( buffer ) {

      audio.setBuffer( buffer );
      audio.play();

    } );

  } else {

    const mediaElement = new Audio( file );
    mediaElement.play();

    audio.setMediaElementSource( mediaElement );

  }

  analyser = new THREE.AudioAnalyser( audio, fftSize );

  uniforms = {

    tAudioData: { value: new THREE.DataTexture( analyser.data, fftSize / 2, 1, THREE.RedFormat ) }

  };

  const material = new THREE.ShaderMaterial( {

    uniforms: uniforms,
    vertexShader: vertexShader,
    fragmentShader: fragmentShader

  } );

  const geometry = new THREE.PlaneGeometry( 1, 1 );

  const mesh = new THREE.Mesh( geometry, material );
  scene.add( mesh );

  __stage.addUpdateCallback((_delta, _elapsed) => {
    analyser.getFrequencyData();
    uniforms.tAudioData.value.needsUpdate = true;
  })
}
</script>
