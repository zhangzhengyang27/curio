/**
 * 自定义 GLSL 着色器集合
 * 移植自 three-globe (MIT License)
 *
 * 提供：
 *   - dashedLineShaders   虚线/流光 shader
 *   - invisibleUndergroundShaderExtend  球面以下片段裁剪
 *   - setRadiusShaderExtend  逐顶点半径变形
 *   - applyShaderExtensionToMaterial  安全的 onBeforeCompile 注入
 *   - setExtendedMaterialUniforms  安全更新扩展材质 uniform
 */

import { BufferAttribute, Mesh } from 'three'
import type { Material, Object3D } from 'three'

/** onBeforeCompile 回调中 shader 对象的最小公共结构 */
export interface ShaderProgram {
  uniforms: Record<string, { value: unknown }>
  vertexShader: string
  fragmentShader: string
}

// ────────────────────────────────────────────────────────────
// 1. 虚线/流光着色器
// ────────────────────────────────────────────────────────────

/**
 * 返回虚线渲染所需的 uniforms + vertex/fragment shader
 * 通过 dashTranslate uniform 实现流动动画
 */
export const dashedLineShaders = () => ({
  uniforms: {
    dashOffset: { value: 0 },
    dashSize: { value: 1 },
    gapSize: { value: 0 },
    dashTranslate: { value: 0 }
  },
  vertexShader: `
    attribute vec4 color;
    attribute float relDistance;

    varying vec4 vColor;
    varying float vRelDistance;

    uniform float dashTranslate;

    void main() {
      vColor = color;
      vRelDistance = relDistance + dashTranslate;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: `
    uniform float dashOffset;
    uniform float dashSize;
    uniform float gapSize;
    uniform float opacity;

    varying vec4 vColor;
    varying float vRelDistance;

    void main() {
      if (vRelDistance < dashOffset) discard;
      if (mod(vRelDistance - dashOffset, dashSize + gapSize) > dashSize) discard;

      gl_FragColor = vColor;
    }
  `
})

// ────────────────────────────────────────────────────────────
// 2. 球面以下片段裁剪（通过 onBeforeCompile 注入现有材质）
// ────────────────────────────────────────────────────────────

/**
 * 扩展现有着色器，在 fragment shader 中丢弃球面以下的片段
 *
 * 用法：
 *   material.onBeforeCompile = shader => invisibleUndergroundShaderExtend(shader)
 *   然后每帧更新 material.userData.shader.uniforms.uSurfaceRadius.value = R
 */
export const invisibleUndergroundShaderExtend = (shader: ShaderProgram): ShaderProgram => {
  shader.uniforms.uSurfaceRadius = { value: 0 }

  shader.vertexShader =
    'attribute float surfaceRadius;\n' +
    'varying float vSurfaceRadius;\n' +
    'varying vec3 vPos;\n' +
    shader.vertexShader

  shader.vertexShader = shader.vertexShader.replace('void main() {', [
    'void main() {',
    'vSurfaceRadius = surfaceRadius;',
    'vPos = position;'
  ].join('\n'))

  shader.fragmentShader =
    'uniform float uSurfaceRadius;\n' +
    'varying float vSurfaceRadius;\n' +
    'varying vec3 vPos;\n' +
    shader.fragmentShader

  shader.fragmentShader = shader.fragmentShader.replace('void main() {', [
    'void main() {',
    'if (length(vPos) < max(uSurfaceRadius, vSurfaceRadius)) discard;'
  ].join('\n'))

  return shader
}

// ────────────────────────────────────────────────────────────
// 3. 逐顶点半径变形着色器（热力图高度映射）
// ────────────────────────────────────────────────────────────

/**
 * 扩展现有着色器，允许通过 vertex attribute 'r' 逐顶点修改球面半径
 * 核心：Cartesian → Polar（读取 r）→ Cartesian（写回）
 *
 * 用法：
 *   material.onBeforeCompile = shader => setRadiusShaderExtend(shader)
 *   geometry.setAttribute('r', new BufferAttribute(rArray, 1))
 */
export const setRadiusShaderExtend = (shader: ShaderProgram): ShaderProgram => {
  shader.vertexShader = `
    attribute float r;

    const float PI = 3.1415926535897932384626433832795;

    float toRad(float a) {
      return a * PI / 180.0;
    }

    vec3 Polar2Cartesian(vec3 c) {
      float phi = toRad(90.0 - c.x);
      float theta = toRad(90.0 - c.y);
      float radius = c.z;
      return vec3(
        radius * sin(phi) * cos(theta),
        radius * cos(phi),
        radius * sin(phi) * sin(theta)
      );
    }

    vec2 Cartesian2Polar(vec3 p) {
      float radius = sqrt(p.x * p.x + p.y * p.y + p.z * p.z);
      float phi = acos(p.y / radius);
      float theta = atan(p.z, p.x);
      return vec2(
        90.0 - phi * 180.0 / PI,
        90.0 - theta * 180.0 / PI - (theta < -PI / 2.0 ? 360.0 : 0.0)
      );
    }

    ${shader.vertexShader.replace('}', `
        vec3 pos = Polar2Cartesian(vec3(Cartesian2Polar(position), r));
        gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
      }
    `)}
  `

  return shader
}

// ────────────────────────────────────────────────────────────
// 4. 安全的材质扩展工具
// ────────────────────────────────────────────────────────────

/**
 * 安全地将着色器扩展应用到材质（使用 onBeforeCompile）
 * 自动防重复注入
 *
 * @param extensionFn - (shader) => shader
 * @returns 同一材质引用
 */
export const applyShaderExtensionToMaterial = (
  material: Material | Material[] | null | undefined,
  extensionFn: (shader: ShaderProgram) => ShaderProgram
): Material | Material[] | null | undefined => {
  if (!material) return material

  // 数组材质：逐个子材质处理
  if (Array.isArray(material)) {
    material.forEach(m => applyShaderExtensionToMaterial(m, extensionFn))
    return material
  }

  // 防重复注入
  if (material.userData._shaderExtended) return material

  material.userData._shaderExtended = true

  material.onBeforeCompile = shader => {
    material.userData.shader = extensionFn(shader)
  }

  return material
}

/**
 * 安全地更新扩展材质的 uniform 值
 * 处理编译前（挂起到 onBeforeCompile）和编译后（直接修改）两种情况
 *
 * @param uniformsFn - (uniforms) => void
 */
export const setExtendedMaterialUniforms = (
  material: Material | Material[] | null | undefined,
  uniformsFn: (uniforms: Record<string, { value: unknown }>) => void
): void => {
  if (!material) return

  if (Array.isArray(material)) {
    material.forEach(m => setExtendedMaterialUniforms(m, uniformsFn))
    return
  }

  if (material.userData.shader) {
    // 已编译：直接修改
    uniformsFn(material.userData.shader.uniforms)
  } else {
    // 未编译：挂起等待 onBeforeCompile
    const curFn = material.onBeforeCompile as unknown as ((shader: ShaderProgram) => void) | undefined
    material.onBeforeCompile = shader => {
      if (curFn) curFn(shader)
      uniformsFn(shader.uniforms)
    }
  }
}

// ────────────────────────────────────────────────────────────
// 5. 地下裁剪批量应用工具
// ────────────────────────────────────────────────────────────

/**
 * 递归遍历 Object3D，为所有 Mesh 材质注入地下裁剪着色器扩展
 * 自动添加 surfaceRadius vertex attribute，并设置 uSurfaceRadius uniform
 *
 * @param object3D - 根对象（可以是 Group、Mesh 等）
 * @param R - 地球半径
 */
export const applyUndergroundClipping = (object3D: Object3D | null | undefined, R: number): void => {
  if (!object3D) return

  object3D.traverse(child => {
    // traverse 回调的类型是 Object3D，isMesh 守卫后收窄为 Mesh 才有 geometry/material
    if (!(child instanceof Mesh) || !child.material) return
    const meshChild = child as Mesh

    // 为几何体添加 surfaceRadius 顶点属性
    const geom = meshChild.geometry
    if (geom && geom.attributes.position && !geom.attributes.surfaceRadius) {
      const count = geom.attributes.position.count
      const surfaceRadii = new Float32Array(count)
      surfaceRadii.fill(R)
      geom.setAttribute('surfaceRadius', new BufferAttribute(surfaceRadii, 1))
    }

    // 注入着色器扩展
    applyShaderExtensionToMaterial(meshChild.material, invisibleUndergroundShaderExtend)
    setExtendedMaterialUniforms(meshChild.material, u => {
      u.uSurfaceRadius.value = R
    })
  })
}
