const fs = require('fs');
const path = require('path');

const baseDir = './src/examples/components/threejs-official';
const files = fs.readdirSync(baseDir, { recursive: true })
  .filter(f => f.endsWith('.vue'))
  .map(f => path.join(baseDir, f));

const baseVars = ['camera', 'scene', 'renderer', 'controls'];
let fixed = 0;

files.forEach(f => {
  let content = fs.readFileSync(f, 'utf8');
  const before = content;

  // Split content into lines and process each line
  const lines = content.split('\n');
  const newLines = lines.map(line => {
    const match = line.match(/^([ \t]*)(?:let|const|var)\s+(.+?)\s*;\s*$/);
    if (!match) return line;

    const indent = match[1];
    const decl = match[2];
    const ids = decl.split(',').map(s => s.trim());
    const hasBaseVar = ids.some(id => baseVars.includes(id));
    if (!hasBaseVar) return line;

    const kept = ids.filter(id => !baseVars.includes(id));
    if (kept.length === 0) return '';
    return indent + 'let ' + kept.join(', ') + ';';
  });

  content = newLines.join('\n');

  if (content !== before) {
    fs.writeFileSync(f, content);
    console.log('fixed', f);
    fixed++;
  }
});

console.log('fixed files:', fixed);
