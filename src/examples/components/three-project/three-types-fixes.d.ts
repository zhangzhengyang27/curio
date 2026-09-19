import * as THREE from "three"

declare module "three" {
  interface Object3D {
    geometry?: THREE.BufferGeometry
    material?: THREE.Material | THREE.Material[]
    isMesh?: boolean
    isGroup?: boolean
    isPoints?: boolean
    isLine?: boolean
    isLineLoop?: boolean
    isSprite?: boolean
  }

  interface Material {
    color?: THREE.Color
    wireframe?: boolean
    emissive?: THREE.Color
    emissiveIntensity?: number
    map?: THREE.Texture | null
    needsUpdate?: boolean
    toneMapped?: boolean
    metalness?: number
    roughness?: number
    transmission?: number
    ior?: number
    thickness?: number
    envMapIntensity?: number
    normalMap?: THREE.Texture | null
    bumpMap?: THREE.Texture | null
    roughnessMap?: THREE.Texture | null
    metalnessMap?: THREE.Texture | null
    aoMap?: THREE.Texture | null
    bumpScale?: number
    normalScale?: THREE.Vector2
    gradientMap?: THREE.Texture | null
    isMeshPhysicalMaterial?: boolean
  }

  interface BufferGeometry {
    parameters?: any
  }

  interface WebGLInfo {
    render: {
      calls: number
      frame: number
      lines: number
      points: number
      triangles: number
      objects?: number
    }
    memory: {
      geometries: number
      textures: number
    }
  }
}

declare module "three/examples/jsm/postprocessing/Pass.js" {
  interface Pass {
    uniforms?: Record<string, any>
  }
}

declare module "three/examples/jsm/libs/lil-gui.module.min.js" {
  interface GUI {
    userData?: Record<string, any>
    __infoFolder?: any
    __info?: any
  }
}

declare module "cannon-es" {
  interface Solver {
    iterations?: number
  }

  interface Spring {
    addEventListener(type: string, listener: (...args: any[]) => void): void
    removeEventListener(type: string, listener: (...args: any[]) => void): void
    getForce(): any
  }

  interface World {
    addSpring(spring: any): void
    removeSpring(spring: any): void
  }
}

declare global {
  interface Performance {
    memory?: {
      usedJSHeapSize: number
      totalJSHeapSize: number
      jsHeapSizeLimit: number
    }
  }
}

export {}
