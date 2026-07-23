import * as THREE from 'three'
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader.js'

const fbxLoader = new FBXLoader()

export function loadFBX(url: string): Promise<THREE.Group> {
  return new Promise((resolve, reject) => {
    fbxLoader.load(
      url,
      (object) => {
        resolve(object)
      },
      undefined,
      (error) => {
        reject(error)
      }
    )
  })
}
