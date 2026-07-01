function splitTopLevelCommas(text) {
  const parts = []
  let depth = 0
  let current = ''
  let inString = false
  let stringChar = ''

  for (let i = 0; i < text.length; i++) {
    const ch = text[i]
    const prev = text[i - 1]

    if (inString) {
      current += ch
      if (ch === stringChar && prev !== '\\') inString = false
      continue
    }

    if (ch === '(' || ch === '[' || ch === '{') {
      depth++
    } else if (ch === ')' || ch === ']' || ch === '}') {
      depth--
    } else if (ch === "'" || ch === '"' || ch === '`') {
      inString = true
      stringChar = ch
    }

    if (ch === ',' && depth === 0) {
      parts.push(current)
      current = ''
      continue
    }

    current += ch
  }

  if (current) parts.push(current)
  return parts
}

function extractIdentifier(entry) {
  const match = entry.trim().match(/^[a-zA-Z_$][a-zA-Z0-9_$]*/)
  return match ? match[0] : ''
}

function addImplicitGlobalDeclarations(code) {
  const reservedGlobals = new Set([
    'window', 'document', 'console', 'navigator', 'screen', 'location',
    'THREE', 'Math', 'Date', 'setTimeout', 'setInterval', 'requestAnimationFrame',
    '__stage', 'ctx', 'scene', 'camera', 'renderer', 'controls', 'props',
  ])

  const assignmentRegex = /(?:^|;|\{)\s*([a-zA-Z_$][a-zA-Z0-9_$]*)\s*(?:\+|-)?\s*=(?!=)\s*/gm
  const assigned = new Set()

  let match
  while ((match = assignmentRegex.exec(code)) !== null) {
    const name = match[1]
    if (reservedGlobals.has(name)) continue
    assigned.add(name)
  }

  const declaredNames = new Set()
  const declLineRegex = /\b(?:const|let|var)\s+([^;]+);?/g
  let declMatch
  while ((declMatch = declLineRegex.exec(code)) !== null) {
    const declPart = declMatch[1]
    console.log('DECL MATCH:', JSON.stringify(declPart.slice(0, 200)))
    const parts = splitTopLevelCommas(declPart)
    console.log('PARTS:', parts.map(p => extractIdentifier(p)))
    parts.forEach((part) => {
      const name = extractIdentifier(part)
      if (name) declaredNames.add(name)
    })
  }

  const funcParamRegex = /function\s+\w+\s*\(\s*([^)]*)\s*\)/g
  let paramMatch
  while ((paramMatch = funcParamRegex.exec(code)) !== null) {
    paramMatch[1].split(',').forEach((p) => {
      const name = p.trim().match(/^[a-zA-Z_$][a-zA-Z0-9_$]*/)?.[0]
      if (name) declaredNames.add(name)
    })
  }

  for (const name of declaredNames) {
    assigned.delete(name)
  }

  if (assigned.size === 0) return code

  const declarations = Array.from(assigned)
    .sort()
    .map((name) => `let ${name};`)
    .join('\n')

  return declarations + '\n' + code
}

const testCode = `let scene = __stage.scene
const gui = new GUI(),
    props = {
        alphaToCoverage: true,
    },
    folderLocal = gui.addFolder( 'Local Clipping' ),
    propsLocal = {
        get 'Enabled'() { return renderer.localClippingEnabled; },
        set 'Enabled'( v ) { renderer.localClippingEnabled = v; }
    },
    folderGlobal = gui.addFolder( 'Global Clipping' ),
    propsGlobal = {
        get 'Enabled'() { return renderer.clippingPlanes !== Empty; },
        set 'Enabled'( v ) { renderer.clippingPlanes = v ? globalPlanes : Empty; }
    };

folderGlobal.add( propsGlobal, 'Enabled' );
`

console.log('=== INPUT ===')
console.log(testCode)
console.log('=== OUTPUT ===')
console.log(addImplicitGlobalDeclarations(testCode))
