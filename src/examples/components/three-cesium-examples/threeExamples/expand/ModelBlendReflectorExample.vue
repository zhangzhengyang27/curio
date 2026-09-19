<template>
  <ExampleScene
    camera="perspective"
    :camera-position="[2, 1, 3]"
    alpha
    antialias
    :camera-options="{ fov: 75, near: 0.1, far: 1000 }"
    @ready="onReady"
  />
</template>

<script setup lang="ts">
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js'
import {
  Color,
  Matrix4,
  Mesh,
  PerspectiveCamera,
  Plane,
  ShaderMaterial,
  UniformsUtils,
  Vector3,
  Vector4,
  WebGLRenderTarget,
  HalfFloatType,
} from 'three'
import ExampleScene from '@/examples/components/ExampleScene.vue'

const props = defineProps({
  example: {
    type: Object,
    default: () => ({})
  }
})

function onReady(ctx: any) {
  const scene = ctx.scene
  const camera = ctx.camera
  const renderer = ctx.renderer
  const controls = ctx.controls

  controls.enableDamping = true

  const dracoLoader = new DRACOLoader().setDecoderPath(props.example?.globals?.FILE_HOST + 'js/three/draco/')
  new GLTFLoader().setDRACOLoader(dracoLoader).load(props.example?.globals?.HOST + 'files/model/car.glb', gltf => scene.add(gltf.scene))

  const pointLight = new THREE.PointLight(0xffffff, 0.5, 0, 0)
  pointLight.position.set(0, 10, 0)
  scene.add(pointLight)

  scene.add(new THREE.AmbientLight(0xffffff, 0.5))

  class Reflector extends Mesh {
    [key: string]: any
    static ReflectorShader: any
    constructor(geometry: any, options: any = {}) {
      super(geometry)

      this.isReflector = true
      ;(this as any).type = 'Reflector'
      this.camera = new PerspectiveCamera()

      const scope = this

      const color = options.color !== undefined ? new Color(options.color) : new Color(0x7f7f7f)
      const textureWidth = options.textureWidth || 512
      const textureHeight = options.textureHeight || 512
      const clipBias = options.clipBias || 0
      const shader = options.shader || Reflector.ReflectorShader
      const multisample = options.multisample !== undefined ? options.multisample : 4

      const reflectorPlane = new Plane()
      const normal = new Vector3()
      const reflectorWorldPosition = new Vector3()
      const cameraWorldPosition = new Vector3()
      const rotationMatrix = new Matrix4()
      const lookAtPosition = new Vector3(0, 0, -1)
      const clipPlane = new Vector4()

      const view = new Vector3()
      const target = new Vector3()
      const q = new Vector4()

      const textureMatrix = new Matrix4()
      const virtualCamera = this.camera

      const renderTarget = new WebGLRenderTarget(textureWidth, textureHeight, {
        samples: multisample,
        type: HalfFloatType
      })

      const material = new ShaderMaterial({
        name: shader.name !== undefined ? shader.name : 'unspecified',
        uniforms: UniformsUtils.clone(shader.uniforms),
        fragmentShader: shader.fragmentShader,
        vertexShader: shader.vertexShader,
        transparent: true,
      })

      material.uniforms['tDiffuse'].value = renderTarget.texture
      material.uniforms['_opacity'].value = options.opacity || 1
      material.uniforms['color'].value = color
      material.uniforms['textureMatrix'].value = textureMatrix

      this.material = material
      this.count = 0
      this.onBeforeRender = (renderer: any, scene: any, camera: any) => {
        this.count++

        reflectorWorldPosition.setFromMatrixPosition(scope.matrixWorld)
        cameraWorldPosition.setFromMatrixPosition(camera.matrixWorld)

        rotationMatrix.extractRotation(scope.matrixWorld)

        normal.set(0, 0, 1)
        normal.applyMatrix4(rotationMatrix)

        view.subVectors(reflectorWorldPosition, cameraWorldPosition)

        if (view.dot(normal) > 0) return

        view.reflect(normal).negate()
        view.add(reflectorWorldPosition)

        rotationMatrix.extractRotation(camera.matrixWorld)

        lookAtPosition.set(0, 0, -1)
        lookAtPosition.applyMatrix4(rotationMatrix)
        lookAtPosition.add(cameraWorldPosition)

        target.subVectors(reflectorWorldPosition, lookAtPosition)
        target.reflect(normal).negate()
        target.add(reflectorWorldPosition)

        virtualCamera.position.copy(view)
        virtualCamera.up.set(0, 1, 0)
        virtualCamera.up.applyMatrix4(rotationMatrix)
        virtualCamera.up.reflect(normal)
        virtualCamera.lookAt(target)

        virtualCamera.far = camera.far
        virtualCamera.updateMatrixWorld()
        virtualCamera.projectionMatrix.copy(camera.projectionMatrix)

        textureMatrix.set(
          0.5, 0.0, 0.0, 0.5,
          0.0, 0.5, 0.0, 0.5,
          0.0, 0.0, 0.5, 0.5,
          0.0, 0.0, 0.0, 1.0
        )
        textureMatrix.multiply(virtualCamera.projectionMatrix)
        textureMatrix.multiply(virtualCamera.matrixWorldInverse)
        textureMatrix.multiply(scope.matrixWorld)

        reflectorPlane.setFromNormalAndCoplanarPoint(normal, reflectorWorldPosition)
        reflectorPlane.applyMatrix4(virtualCamera.matrixWorldInverse)

        clipPlane.set(reflectorPlane.normal.x, reflectorPlane.normal.y, reflectorPlane.normal.z, reflectorPlane.constant)

        const projectionMatrix = virtualCamera.projectionMatrix

        q.x = (Math.sign(clipPlane.x) + projectionMatrix.elements[8]) / projectionMatrix.elements[0]
        q.y = (Math.sign(clipPlane.y) + projectionMatrix.elements[9]) / projectionMatrix.elements[5]
        q.z = -1.0
        q.w = (1.0 + projectionMatrix.elements[10]) / projectionMatrix.elements[14]

        clipPlane.multiplyScalar(2.0 / clipPlane.dot(q))

        projectionMatrix.elements[2] = clipPlane.x
        projectionMatrix.elements[6] = clipPlane.y
        projectionMatrix.elements[10] = clipPlane.z + 1.0 - clipBias
        projectionMatrix.elements[14] = clipPlane.w

        scope.visible = false

        const currentRenderTarget = renderer.getRenderTarget()
        const currentXrEnabled = renderer.xr.enabled
        const currentShadowAutoUpdate = renderer.shadowMap.autoUpdate

        renderer.xr.enabled = false
        renderer.shadowMap.autoUpdate = false

        renderer.setRenderTarget(renderTarget)
        renderer.state.buffers.depth.setMask(true)

        if (renderer.autoClear === false) renderer.clear()

        options.filter.forEach((name: any) => {
          const mesh = scene.getObjectByName(name)
          mesh.visible = false
        })

        renderer.render(scene, virtualCamera)

        options.filter.forEach((name: any) => {
          const mesh = scene.getObjectByName(name)
          mesh.visible = true
        })

        renderer.xr.enabled = currentXrEnabled
        renderer.shadowMap.autoUpdate = currentShadowAutoUpdate

        renderer.setRenderTarget(currentRenderTarget)

        const viewport = camera.viewport
        if (viewport !== undefined) {
          renderer.state.viewport(viewport)
        }

        scope.visible = true
      }

      this.getRenderTarget = function () {
        return renderTarget
      }

      this.dispose = function () {
        renderTarget.dispose()
        ;(scope.material as any).dispose()
      }
    }
  }

  Reflector.ReflectorShader = {
    name: 'ReflectorShader',
    uniforms: {
      color: { value: null },
      tDiffuse: { value: null },
      textureMatrix: { value: null },
      _opacity: { value: null },
    },
    vertexShader: /* glsl */ `
      uniform mat4 textureMatrix;
      varying vec4 vUv;
      #include <common>
      #include <logdepthbuf_pars_vertex>
      void main() {
        vUv = textureMatrix * vec4(position, 1.0);
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        #include <logdepthbuf_vertex>
      }`,
    fragmentShader: /* glsl */ `
      uniform vec3 color;
      uniform float _opacity;
      uniform sampler2D tDiffuse;
      varying vec4 vUv;
      #include <logdepthbuf_pars_fragment>
      float blendOverlay(float base, float blend) {
        return (base < 0.5 ? (2.0 * base * blend) : (1.0 - 2.0 * (1.0 - base) * (1.0 - blend)));
      }
      vec3 blendOverlay(vec3 base, vec3 blend) {
        return vec3(blendOverlay(base.r, blend.r), blendOverlay(base.g, blend.g), blendOverlay(base.b, blend.b));
      }
      void main() {
        #include <logdepthbuf_fragment>
        vec4 base = texture2DProj(tDiffuse, vUv);
        gl_FragColor = vec4(base.rgb, 0.1);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }`,
  }

  function addReflectorEffect(mesh: any, options: any = { filter: [] }) {
    const material = mesh.material
    const virtualCamera = new PerspectiveCamera()

    const textureWidth = options.textureWidth || 512
    const textureHeight = options.textureHeight || 512
    const clipBias = options.clipBias || 0
    const shader = options.shader || Reflector.ReflectorShader
    const multisample = options.multisample !== undefined ? options.multisample : 4

    const reflectorPlane = new Plane()
    const normal = new Vector3()
    const reflectorWorldPosition = new Vector3()
    const cameraWorldPosition = new Vector3()
    const rotationMatrix = new Matrix4()
    const lookAtPosition = new Vector3(0, 0, -1)
    const clipPlane = new Vector4()

    const view = new Vector3()
    const target = new Vector3()
    const q = new Vector4()

    const textureMatrix = new Matrix4()

    const renderTarget = new WebGLRenderTarget(textureWidth, textureHeight, {
      samples: multisample,
      type: HalfFloatType,
    })

    const appendUniforms = {
      refDiffuse: { value: renderTarget.texture },
      refTextureMatrix: { value: textureMatrix },
    }

    material.onBeforeCompile = (shader: any) => {
      Object.assign(shader.uniforms, appendUniforms)
      shader.vertexShader = shader.vertexShader.replace(
        '#include <common>',
        `
        #include <common>
        uniform mat4 refTextureMatrix;
        varying vec4 refUv;
        `
      )
      shader.fragmentShader = shader.fragmentShader.replace(
        '#include <common>',
        `
        #include <common>
        uniform sampler2D refDiffuse;
        varying vec4 refUv;
        `
      )
      shader.vertexShader = shader.vertexShader.replace(
        '#include <begin_vertex>',
        `
        #include <begin_vertex>
        refUv = refTextureMatrix * vec4(position, 1.0);
        `
      )
      shader.fragmentShader = shader.fragmentShader.replace(
        '#include <dithering_fragment>',
        `
        #include <dithering_fragment>
        gl_FragColor.rgb += texture2DProj(refDiffuse, refUv).rgb;
        gl_FragColor.a = ${options.opacity || '1.0'};
        `
      )
    }

    mesh.material.onBeforeRender = (renderer: any, scene: any, camera: any) => {
      reflectorWorldPosition.setFromMatrixPosition(mesh.matrixWorld)
      cameraWorldPosition.setFromMatrixPosition(camera.matrixWorld)

      rotationMatrix.extractRotation(mesh.matrixWorld)

      normal.set(0, 0, 1)
      normal.applyMatrix4(rotationMatrix)

      view.subVectors(reflectorWorldPosition, cameraWorldPosition)

      if (view.dot(normal) > 0) return

      view.reflect(normal).negate()
      view.add(reflectorWorldPosition)

      rotationMatrix.extractRotation(camera.matrixWorld)

      lookAtPosition.set(0, 0, -1)
      lookAtPosition.applyMatrix4(rotationMatrix)
      lookAtPosition.add(cameraWorldPosition)

      target.subVectors(reflectorWorldPosition, lookAtPosition)
      target.reflect(normal).negate()
      target.add(reflectorWorldPosition)

      virtualCamera.position.copy(view)
      virtualCamera.up.set(0, 1, 0)
      virtualCamera.up.applyMatrix4(rotationMatrix)
      virtualCamera.up.reflect(normal)
      virtualCamera.lookAt(target)

      virtualCamera.far = camera.far
      virtualCamera.updateMatrixWorld()
      virtualCamera.projectionMatrix.copy(camera.projectionMatrix)

      textureMatrix.set(
        0.5, 0.0, 0.0, 0.5,
        0.0, 0.5, 0.0, 0.5,
        0.0, 0.0, 0.5, 0.5,
        0.0, 0.0, 0.0, 1.0
      )
      textureMatrix.multiply(virtualCamera.projectionMatrix)
      textureMatrix.multiply(virtualCamera.matrixWorldInverse)
      textureMatrix.multiply(mesh.matrixWorld)

      reflectorPlane.setFromNormalAndCoplanarPoint(normal, reflectorWorldPosition)
      reflectorPlane.applyMatrix4(virtualCamera.matrixWorldInverse)

      clipPlane.set(reflectorPlane.normal.x, reflectorPlane.normal.y, reflectorPlane.normal.z, reflectorPlane.constant)

      const projectionMatrix = virtualCamera.projectionMatrix

      q.x = (Math.sign(clipPlane.x) + projectionMatrix.elements[8]) / projectionMatrix.elements[0]
      q.y = (Math.sign(clipPlane.y) + projectionMatrix.elements[9]) / projectionMatrix.elements[5]
      q.z = -1.0
      q.w = (1.0 + projectionMatrix.elements[10]) / projectionMatrix.elements[14]

      clipPlane.multiplyScalar(2.0 / clipPlane.dot(q))

      projectionMatrix.elements[2] = clipPlane.x
      projectionMatrix.elements[6] = clipPlane.y
      projectionMatrix.elements[10] = clipPlane.z + 1.0 - clipBias
      projectionMatrix.elements[14] = clipPlane.w

      mesh.visible = false

      const currentRenderTarget = renderer.getRenderTarget()
      const currentXrEnabled = renderer.xr.enabled
      const currentShadowAutoUpdate = renderer.shadowMap.autoUpdate

      renderer.xr.enabled = false
      renderer.shadowMap.autoUpdate = false

      renderer.setRenderTarget(renderTarget)
      renderer.state.buffers.depth.setMask(true)

      if (renderer.autoClear === false) renderer.clear()

      options.filter.forEach((name: any) => {
        const mesh = scene.getObjectByName(name)
        mesh.visible = false
      })

      renderer.render(scene, virtualCamera)

      options.filter.forEach((name: any) => {
        const mesh = scene.getObjectByName(name)
        mesh.visible = true
      })

      renderer.xr.enabled = currentXrEnabled
      renderer.shadowMap.autoUpdate = currentShadowAutoUpdate

      renderer.setRenderTarget(currentRenderTarget)

      const viewport = camera.viewport
      if (viewport !== undefined) {
        renderer.state.viewport(viewport)
      }

      mesh.visible = true
    }
  }

  new GLTFLoader().load(props.example?.globals?.FILE_HOST + '/files/model/floor.glb', gltf => {
    scene.add(gltf.scene)
    gltf.scene.traverse(child => {
      if (child.isMesh) {
        addReflectorEffect(child, {
          color: 0xffffff,
          clipBias: 0.003,
          filter: []
        })
      }
    })
  })
}
</script>
