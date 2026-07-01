const fs = require('fs');
const path = require('path');

const baseDir = './src/examples/components/threejs-official';
const files = fs.readdirSync(baseDir, { recursive: true })
  .filter(f => f.endsWith('.vue'))
  .map(f => path.join(baseDir, f));

let fixed = 0;
files.forEach(f => {
  let content = fs.readFileSync(f, 'utf8');
  const before = content;

  // Remove base variables from comma-separated declarations
  content = content.replace(/^[ \t]*(?:let|const|var)\s+([^;]*?\b(?:camera|scene|renderer|controls)\b[^;]*?)\s*;\s*\n?/gm, (match, decl) => {
    const kept = decl.split(',').map(s => s.trim()).filter(id => !['camera', 'scene', 'renderer', 'controls'].includes(id));
    if (kept.length === 0) return '';
    const indent = match.match(/^[ \t]*/)[0];
    return indent + 'let ' + kept.join(', ') + ';\n';
  });

  if (content !== before) {
    fs.writeFileSync(f, content);
    console.log('fixed', f);
    fixed++;
  }
});

console.log('fixed files:', fixed);
