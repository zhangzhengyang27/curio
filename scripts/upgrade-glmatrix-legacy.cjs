 
const fs = require('fs')
const path = require('path')

const TARGET_DIR = '/Users/zhangzhengyang/Desktop/Code/数据可视化/earth-app/src/examples/components/webgl/study-webgl'

function findClosingParen(text, startIndex) {
  let depth = 0
  for (let i = startIndex; i < text.length; i++) {
    if (text[i] === '(') depth++
    else if (text[i] === ')') {
      depth--
      if (depth === 0) return i
    }
  }
  return -1
}

function extractCallArgs(text, callStartIndex) {
  const openIndex = text.indexOf('(', callStartIndex)
  if (openIndex === -1) return null
  const closeIndex = findClosingParen(text, openIndex)
  if (closeIndex === -1) return null
  return {
    fullEnd: closeIndex,
    args: text.slice(openIndex + 1, closeIndex),
  }
}

function replaceMethodCalls(text, methodName, transform) {
  // 仅匹配全局 mat4.methodName(，排除 glMatrix.mat4.methodName(
  const pattern = new RegExp(`(?<!glMatrix\\.)\\bmat4\\.${methodName}\\(`, 'g')
  let result = ''
  let lastIndex = 0
  let match

  while ((match = pattern.exec(text)) !== null) {
    const callStart = match.index
    const extracted = extractCallArgs(text, callStart)
    if (!extracted) continue

    const { fullEnd, args } = extracted
    const replacement = transform(args.trim())

    result += text.slice(lastIndex, callStart) + replacement
    lastIndex = fullEnd + 1
  }

  result += text.slice(lastIndex)
  return result
}

function upgradeFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf-8')

  // 1. 替换导入和加载调用
  content = content.replace(
    /import\s+\{\s*loadGlMatrixLegacy\s*\}\s+from\s+['"]@\/examples\/utils\/loadGlMatrix\.js['"]/g,
    "import { loadGlMatrixModern } from '@/examples/utils/loadGlMatrix.js'"
  )
  content = content.replace(/loadGlMatrixLegacy\s*\(/g, 'loadGlMatrixModern(')
  content = content.replace(
    /['"]\/webgl\/study-webgl\/libs\/glMatrix-0\.9\.6\.min\.js['"]/g,
    "'/webgl/study-webgl/libs/gl-matrix.js'"
  )

  // 2. 替换 mat4 方法调用（仅限全局 mat4.xxx，排除 glMatrix.mat4.xxx）
  content = content.replace(/(?<!glMatrix\.)\bmat4\.create\(\)/g, 'glMatrix.mat4.create()')

  content = replaceMethodCalls(content, 'identity', args => `glMatrix.mat4.identity(${args})`)

  // 0.9.6 API: mat4.ortho(left, right, bottom, top, near, far, dest)
  // 3.x API:   glMatrix.mat4.ortho(out, left, right, bottom, top, near, far)
  content = replaceMethodCalls(content, 'ortho', args => {
    const parts = args.split(',').map(s => s.trim())
    if (parts.length === 7) {
      const [left, right, bottom, top, near, far, dest] = parts
      return `glMatrix.mat4.ortho(${dest}, ${left}, ${right}, ${bottom}, ${top}, ${near}, ${far})`
    }
    return `glMatrix.mat4.ortho(${args})`
  })

  // 0.9.6 API: mat4.perspective(fovy, aspect, near, far, dest)
  // 3.x API:   glMatrix.mat4.perspective(out, fovy, aspect, near, far)
  content = replaceMethodCalls(content, 'perspective', args => {
    const parts = args.split(',').map(s => s.trim())
    if (parts.length === 5) {
      const [fovy, aspect, near, far, dest] = parts
      return `glMatrix.mat4.perspective(${dest}, ${fovy}, ${aspect}, ${near}, ${far})`
    }
    return `glMatrix.mat4.perspective(${args})`
  })

  // 0.9.6 API: mat4.lookAt(eye, center, up, dest)
  // 3.x API:   glMatrix.mat4.lookAt(out, eye, center, up)
  content = replaceMethodCalls(content, 'lookAt', args => {
    const parts = args.split(',').map(s => s.trim())
    if (parts.length === 4) {
      const [eye, center, up, dest] = parts
      return `glMatrix.mat4.lookAt(${dest}, ${eye}, ${center}, ${up})`
    }
    return `glMatrix.mat4.lookAt(${args})`
  })

  // 0.9.6 API: mat4.multiply(a, b, dest)
  // 3.x API:   glMatrix.mat4.multiply(out, a, b)
  content = replaceMethodCalls(content, 'multiply', args => {
    const parts = args.split(',').map(s => s.trim())
    if (parts.length === 3) {
      const [a, b, dest] = parts
      return `glMatrix.mat4.multiply(${dest}, ${a}, ${b})`
    }
    return `glMatrix.mat4.multiply(${args})`
  })

  // 0.9.6 API: mat4.translate(m, v) 就地修改 m
  // 3.x API:   glMatrix.mat4.translate(out, m, v)
  content = replaceMethodCalls(content, 'translate', args => {
    const parts = args.split(',').map(s => s.trim())
    if (parts.length === 2) {
      const [m, v] = parts
      return `glMatrix.mat4.translate(${m}, ${m}, ${v})`
    }
    return `glMatrix.mat4.translate(${args})`
  })

  // 0.9.6 API: mat4.rotate(m, angle, axis)
  // 3.x API:   glMatrix.mat4.rotate(out, m, angle, axis)
  content = replaceMethodCalls(content, 'rotate', args => {
    const parts = args.split(',').map(s => s.trim())
    if (parts.length === 3) {
      const [m, angle, axis] = parts
      return `glMatrix.mat4.rotate(${m}, ${m}, ${angle}, ${axis})`
    }
    return `glMatrix.mat4.rotate(${args})`
  })

  // 0.9.6 API: mat4.scale(m, v)
  // 3.x API:   glMatrix.mat4.scale(out, m, v)
  content = replaceMethodCalls(content, 'scale', args => {
    const parts = args.split(',').map(s => s.trim())
    if (parts.length === 2) {
      const [m, v] = parts
      return `glMatrix.mat4.scale(${m}, ${m}, ${v})`
    }
    return `glMatrix.mat4.scale(${args})`
  })

  // vec3.create() / vec4.create()
  content = content.replace(/(?<!glMatrix\.)\bvec3\.create\(\)/g, 'glMatrix.vec3.create()')
  content = content.replace(/(?<!glMatrix\.)\bvec4\.create\(\)/g, 'glMatrix.vec4.create()')

  fs.writeFileSync(filePath, content, 'utf-8')
}

function walk(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true })
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      walk(fullPath)
    } else if (entry.isFile() && entry.name.endsWith('.vue')) {
      const content = fs.readFileSync(fullPath, 'utf-8')
      // 仅升级明确使用旧版加载器的文件
      if (/loadGlMatrixLegacy/.test(content)) {
        console.log(`Upgrading: ${fullPath}`)
        upgradeFile(fullPath)
      }
    }
  }
}

walk(TARGET_DIR)
console.log('glMatrix legacy upgrade done.')
