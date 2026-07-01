import fs from 'fs'
import path from 'path'

const targetRoot = process.argv[2]
if (!targetRoot) {
  console.error('Usage: node convert-earth-lesson.js <target-dir>')
  process.exit(1)
}

function processFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf-8')

  content = content.replace(/import \* as THREE from ['"](?:\.\.\/)*libs\/three\.module\.js['"]/g, "import * as THREE from 'three'")
  content = content.replace(/import \{\s*OrbitControls\s*\} from ['"](?:\.\.\/)*libs\/OrbitControls\.js['"]/g, "import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'")
  content = content.replace(/import \{\s*([^}]+?)\s*\} from ['"](?:\.\.\/)*libs\/([^'"]+)\.js['"]/g, "import { $1 } from 'three/examples/jsm/$2.js'")

  content = content.replace(/SphereBufferGeometry/g, 'SphereGeometry')
  content = content.replace(/PlaneBufferGeometry/g, 'PlaneGeometry')
  content = content.replace(/CircleBufferGeometry/g, 'CircleGeometry')
  content = content.replace(/BoxBufferGeometry/g, 'BoxGeometry')
  content = content.replace(/CylinderBufferGeometry/g, 'CylinderGeometry')
  content = content.replace(/RingBufferGeometry/g, 'RingGeometry')
  content = content.replace(/ShapeBufferGeometry/g, 'ShapeGeometry')

  content = content.replace(/geometry\.attributes\.position\s*=\s*([^\n]+)/g, "geometry.setAttribute('position', $1)")

  fs.writeFileSync(filePath, content, 'utf-8')
}

function walk(dir) {
  const entries = fs.readdirSync(dir)
  for (const entry of entries) {
    const fullPath = path.join(dir, entry)
    const stat = fs.statSync(fullPath)
    if (stat.isDirectory()) {
      walk(fullPath)
    } else if (entry.endsWith('.js')) {
      processFile(fullPath)
    } else if (entry.endsWith('.html')) {
      fs.unlinkSync(fullPath)
    }
  }
}

walk(targetRoot)

const indexPath = path.join(targetRoot, 'index.js')
fs.writeFileSync(indexPath, "import './scene.js'\n", 'utf-8')

console.log(`Converted ${targetRoot}`)
