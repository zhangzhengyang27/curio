<template>
  <ExampleScene
    camera="perspective"
    :camera-position="[30, 10, 10]"
    alpha
    antialias
    @ready="onReady"
  />
</template>

<script setup>
import * as THREE from "three";
import ExampleScene from '@/examples/components/ExampleScene.vue'

const props = defineProps({
  example: {
    type: Object,
    default: () => ({})
  }
})

function onReady(ctx) {
  const scene = ctx.scene
  const camera = ctx.camera
  const renderer = ctx.renderer
  const controls = ctx.controls

  scene.add(new THREE.AmbientLight(0xffffff, 1));
  scene.add(new THREE.DirectionalLight(0xffffff, 0.25));
  
  ctx.addUpdateCallback(() => {
    const cps = Array.from({ length: 6 }).fill(0).map((_, idx, arr) => {
            let init = -(arr.length - 1)
            return new THREE.Vector3(
                init + idx * 2, Math.random() < 0.5 ? -1 : 1,
                -init - idx * 2
            )
        })
        const curve = new THREE.CatmullRomCurve3(cps)
        let g = new THREE.TubeGeometry(curve, 100, 0.5, 32)
        const m = new THREE.MeshLambertMaterial({
            color: 0xface8d,
            side: THREE.DoubleSide,
        })
        let length = curve.getLength()
        let uniforms = {
            totalLength: { value: length },
            pipeFittingAt: { value: 2 },
            pipeFittingWidth: { value: 2 },
            pipeFittingColor: { value: new THREE.Color(0xff2200) }
        };
        m.onBeforeCompile = shader => {
            shader.uniforms.totalLength = uniforms.totalLength;
            shader.uniforms.pipeFittingAt = uniforms.pipeFittingAt;
            shader.uniforms.pipeFittingWidth = uniforms.pipeFittingWidth;
            shader.uniforms.pipeFittingColor = uniforms.pipeFittingColor;
            shader.fragmentShader = `
            #define S(a, b, c) smoothstep(a, b, c)
            uniform float totalLength;
            uniform float pipeFittingAt;
            uniform float pipeFittingWidth;
            uniform vec3 pipeFittingColor;
            ${shader.fragmentShader}
            `.replace(
                `#include <color_fragment>`,
                `#include <color_fragment>
            float normAt = pipeFittingAt / totalLength;
            float normWidth = pipeFittingWidth / totalLength;
            float hWidth = normWidth * 0.5;
            float fw = fwidth(vUv.x);
            float f = S(hWidth + fw, hWidth, abs(vUv.x - normAt));
            diffuseColor.rgb = mix(diffuseColor.rgb, pipeFittingColor, f);
            // diffuseColor.rgb = mix(diffuseColor.rgb, vec3(1, 1, 0), S(fw,  0., abs(vUv.x - normAt)));
          `
            )
        }
        m.defines = { 'USE_UV': "" }
        let o = new THREE.Mesh(g, m);
        scene.add(o);
        let clock = new THREE.Clock()
        function animation() {
            uniforms.pipeFittingAt.value += clock.getDelta() * 5
            if (uniforms.pipeFittingAt.value - 1 > uniforms.totalLength.value) {
                uniforms.pipeFittingAt.value = 0
            }
        }
  
  })
}
</script>
