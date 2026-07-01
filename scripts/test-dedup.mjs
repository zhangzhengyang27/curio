function removeDuplicateDeclarations(code) {
  const lines = code.split('\n')
  const otherDeclRegexCache = new Map()

  function hasOtherDeclaration(name, targetLine) {
    const regex = otherDeclRegexCache.get(name) || new RegExp(`\\b(?:const|let|var)\\s+[^;]*\\b${name}\\b[^;]*;`, 'g')
    otherDeclRegexCache.set(name, regex)
    regex.lastIndex = 0
    const matches = Array.from(code.matchAll(regex))
    console.log(`hasOtherDeclaration(${name}): found ${matches.length} matches`)
    matches.forEach((m, i) => console.log(`  match ${i}:`, JSON.stringify(m[0].slice(0, 120))))
    return matches.some((m) => m[0].trim() !== targetLine.trim())
  }

  return lines
    .map((line) => {
      const isolatedMatch = line.match(/^(\s*)let\s+([a-zA-Z_$][a-zA-Z0-9_$]*)\s*;\s*$/)
      if (!isolatedMatch) return line
      const name = isolatedMatch[2]
      if (hasOtherDeclaration(name, line)) return ''
      return line
    })
    .join('\n')
}

const code = `let folderGlobal;
let propsGlobal;
let scene = __stage.scene
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

console.log('=== OUTPUT ===')
console.log(removeDuplicateDeclarations(code))
