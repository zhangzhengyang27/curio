function extractFunctionMap(code) {
  const funcRegex = /(async\s+)?function\s+(\w+)\s*\(\s*\)\s*\{/g
  const map = new Map()

  let match
  while ((match = funcRegex.exec(code)) !== null) {
    const isAsync = Boolean(match[1])
    const name = match[2]
    const start = match.index
    const bodyStart = match.index + match[0].length
    let depth = 1
    let end = bodyStart
    let inString = false
    let stringChar = ''
    while (end < code.length && depth > 0) {
      const ch = code[end]
      const prev = code[end - 1]
      if (inString) {
        if (ch === stringChar && prev !== '\\') inString = false
      } else if (ch === "'" || ch === '"' || ch === '`') {
        inString = true
        stringChar = ch
      } else if (ch === '{') {
        depth++
      } else if (ch === '}') {
        depth--
      }
      end++
    }
    const body = code.slice(bodyStart, end - 1)
    map.set(name, { start, end, body, isAsync })
    console.log(`function ${name}: start=${start}, end=${end}, isAsync=${isAsync}`)
    console.log('body last 50 chars:', body.slice(-50))
    console.log('char at end-1:', JSON.stringify(code[end-1]))
    console.log('char at end:', JSON.stringify(code[end]))
  }

  return map
}

const code = `
async function render() {
  timer.update();
  while ( cond ) {
    updateSphere();
    renderer.compute();
  }
  renderer.render( scene, camera );
}
`
extractFunctionMap(code)
