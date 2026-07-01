<template>
  <div class="transpiler-root">
    <div id="source-dropdown">
      <label for="decoder-select">Encoder</label>
      <select
        id="decoder-select"
        v-model="options.decoder"
      >
        <option value="GLSL">
          GLSL
        </option>
      </select>
    </div>
    <div id="result-dropdown">
      <label for="encoder-select">Decoder</label>
      <select
        id="encoder-select"
        v-model="options.encoder"
      >
        <option value="TSL">
          TSL
        </option>
        <option value="WGSL">
          WGSL
        </option>
      </select>
    </div>
    <div
      id="source"
      ref="sourceRef"
    />
    <div
      id="result"
      ref="resultRef"
    />
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch } from 'vue'
import Transpiler from 'three/examples/jsm/transpiler/Transpiler.js'
import GLSLDecoder from 'three/examples/jsm/transpiler/GLSLDecoder.js'
import WGSLEncoder from 'three/examples/jsm/transpiler/WGSLEncoder.js'
import TSLEncoder from 'three/examples/jsm/transpiler/TSLEncoder.js'

const sourceRef = ref(null)
const resultRef = ref(null)

const options = ref({ decoder: 'GLSL', encoder: 'TSL' })
const encoderLanguages = { TSL: 'javascript', WGSL: 'wgsl' }

let editor = null
let resultEditor = null
let timeout = null
let monacoLoaded = false

const glslCode = `/*
 * Perlin noise
 * https://gist.github.com/patriciogonzalezvivo/670c22f3966e662d2f83
 */

const float PI = 3.141592653589793;

float rand(vec2 c){
	return fract(sin(dot(c.xy ,vec2(12.9898,78.233))) * 43758.5453);
}

float noise(vec2 p, float freq ){
	float unit = 1./freq;
	vec2 ij = floor(p/unit);
	vec2 xy = mod(p,unit)/unit;
	//xy = 3.*xy*xy-2.*xy*xy*xy;
	xy = .5*(1.-cos(PI*xy));
	float a = rand((ij+vec2(0.,0.)));
	float b = rand((ij+vec2(1.,0.)));
	float c = rand((ij+vec2(0.,1.)));
	float d = rand((ij+vec2(1.,1.)));
	float x1 = mix(a, b, xy.x);
	float x2 = mix(c, d, xy.x);
	return mix(x1, x2, xy.y);
}

float pNoise(vec2 p, int res){
	float persistence = .5;
	float n = 0.;
	float normK = 0.;
	float f = 4.;
	float amp = 1.;
	int iCount = 0;
	for (int i = 0; i<50; i++){
		n+=amp*noise(p, f);
		f*=2.;
		normK+=amp;
		amp*=persistence;
		if (iCount == res) break;
		iCount++;
	}
	float nf = n/normK;
	return nf*nf*nf*nf;
}
`

function loadMonacoScript() {
  return new Promise((resolve, reject) => {
    if (window.require) {
      resolve()
      return
    }
    const script = document.createElement('script')
    script.src = 'https://cdn.jsdelivr.net/npm/monaco-editor@0.55.1/min/vs/loader.js'
    script.onload = resolve
    script.onerror = reject
    document.head.appendChild(script)
  })
}

function initEditors() {
  window.require.config({ paths: { vs: 'https://cdn.jsdelivr.net/npm/monaco-editor@0.55.1/min/vs' } })

  window.require(['vs/editor/editor.main'], () => {
    monacoLoaded = true

    editor = window.monaco.editor.create(sourceRef.value, {
      value: glslCode,
      language: 'c',
      theme: 'vs-dark',
      automaticLayout: true,
      wordWrap: 'on',
      minimap: { enabled: false }
    })

    resultEditor = window.monaco.editor.create(resultRef.value, {
      value: '',
      language: 'javascript',
      theme: 'vs-dark',
      automaticLayout: true,
      wordWrap: 'on',
      readOnly: true,
      minimap: { enabled: false }
    })

    editor.getModel().onDidChangeContent(() => {
      if (timeout) clearTimeout(timeout)
      timeout = setTimeout(build, 1000)
    })

    build()
  })
}

function showCode(code) {
  if (!resultEditor) return
  resultEditor.setValue(code)
  resultEditor.revealLine(1)
}

function build() {
  if (!editor || !resultEditor) return

  try {
    let encoder
    if (options.value.encoder === 'TSL') {
      encoder = new TSLEncoder()
    } else if (options.value.encoder === 'WGSL') {
      encoder = new WGSLEncoder()
    } else {
      throw new Error('Unknown encoder: ' + options.value.encoder)
    }

    const glsl = editor.getValue()
    const decoder = new GLSLDecoder()
    const transpiler = new Transpiler(decoder, encoder)
    const tsl = transpiler.parse(glsl)
    showCode(tsl)
  } catch (e) {
    showCode('Error: ' + e.message)
  }
}

watch(() => options.value.encoder, (value) => {
  if (monacoLoaded && resultEditor) {
    window.monaco.editor.setModelLanguage(resultEditor.getModel(), encoderLanguages[value])
  }
  build()
})

watch(() => options.value.decoder, build)

onMounted(() => {
  loadMonacoScript().then(initEditors).catch((err) => {
    console.error('Failed to load Monaco editor:', err)
  })
})

onUnmounted(() => {
  if (timeout) clearTimeout(timeout)
  if (editor) editor.dispose()
  if (resultEditor) resultEditor.dispose()
})
</script>

<style scoped>
.transpiler-root {
  width: 100%;
  height: 100%;
  position: relative;
  background: #1e1e1e;
}

#source-dropdown,
#result-dropdown {
  position: absolute;
  top: 0;
  padding: 10px;
  background: #222;
  text-align: center;
  z-index: 100;
}

#source-dropdown {
  left: 0;
  width: calc(50% - 1px);
}

#result-dropdown {
  left: 50%;
  width: 50%;
}

#source,
#result {
  position: absolute;
  top: 40px;
  height: calc(100% - 40px);
}

#source {
  left: 0;
  width: calc(50% - 1px);
}

#result {
  right: 0;
  width: 50%;
}

select {
  background: #333;
  color: white;
  border: 1px solid #555;
  padding: 5px 10px;
}

label {
  color: white;
  font-family: Arial, sans-serif;
  font-size: 14px;
  margin-right: 6px;
}
</style>
