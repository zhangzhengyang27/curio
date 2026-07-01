import * as THREE from 'three'

/**
 * 自定义大气辉光网格（参考 three-globe GlowMesh）
 * 复制球体几何体并沿法线方向外扩，BackSide 渲染 + 视角相关强度
 * @param {number} R - 地球半径
 * @param {object} options
 * @param {string|THREE.Color} [options.color='#4488ff'] - 辉光颜色
 * @param {number} [options.coefficient=0.1] - 正面发光系数
 * @param {number} [options.power=3.5] - 边缘发光幂指数
 * @param {number} [options.hollowRadius=R] - 内部镂空半径
 * @param {number} [options.opacity=0.35] - 不透明度
 * @param {number} [options.size=0.15] - 外扩厚度占 R 的比例
 * @param {number} [options.curvatureResolution=64] - 球体几何细分段数
 * @returns {THREE.Mesh}
 */
export function createGlowMesh(R, options = {}) {
  const {
    color = '#4488ff',
    coefficient = 0.1,
    power = 3.5,
    hollowRadius = R,
    opacity = 0.35,
    size = 0.15,
    curvatureResolution = 64
  } = options

  // 复制球体几何体并沿法线方向外扩
  const geometry = new THREE.SphereGeometry(R, curvatureResolution, curvatureResolution)
  const position = geometry.attributes.position
  const normal = geometry.attributes.normal
  const expand = R * size

  for (let i = 0; i < position.count; i++) {
    const nx = normal.getX(i)
    const ny = normal.getY(i)
    const nz = normal.getZ(i)
    position.setXYZ(
      i,
      position.getX(i) + nx * expand,
      position.getY(i) + ny * expand,
      position.getZ(i) + nz * expand
    )
  }
  geometry.computeVertexNormals()

  const vertexShader = /* glsl */ `
    varying vec3 vNormal;
    varying vec3 vPosition;
    varying vec3 vWorldPos;
    void main() {
      vec4 worldPos = modelMatrix * vec4(position, 1.0);
      vWorldPos = worldPos.xyz;
      vNormal = normalize(mat3(modelMatrix) * normal);
      vPosition = position;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `

  const fragmentShader = /* glsl */ `
    varying vec3 vNormal;
    varying vec3 vPosition;
    varying vec3 vWorldPos;
    uniform vec3 uColor;
    uniform float uCoefficient;
    uniform float uPower;
    uniform float uOpacity;
    uniform float uHollowRadius;
    uniform vec3 uCameraPos;
    void main() {
      vec3 viewDir = normalize(uCameraPos - vWorldPos);
      float intensity = pow(uCoefficient + abs(dot(vNormal, viewDir)), uPower);

      // 在 hollowRadius 内部做淡入，避免遮挡地球本体
      float dist = length(vPosition);
      float edge = smoothstep(uHollowRadius, uHollowRadius * (1.0 + 0.05), dist);

      gl_FragColor = vec4(uColor, intensity * uOpacity * edge);
    }
  `

  const material = new THREE.ShaderMaterial({
    vertexShader,
    fragmentShader,
    uniforms: {
      uColor: { value: new THREE.Color(color) },
      uCoefficient: { value: coefficient },
      uPower: { value: power },
      uOpacity: { value: opacity },
      uHollowRadius: { value: hollowRadius },
      uCameraPos: { value: new THREE.Vector3() }
    },
    transparent: true,
    depthWrite: false,
    depthTest: false,
    side: THREE.BackSide,
    blending: THREE.AdditiveBlending
  })

  const mesh = new THREE.Mesh(geometry, material)
  mesh.renderOrder = 1

  mesh.userData = {
    updateCamera: (camera) => {
      material.uniforms.uCameraPos.value.copy(camera.position)
    }
  }

  return mesh
}
