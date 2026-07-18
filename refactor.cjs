const fs = require('fs');

function getFiles(dir, files = []) {
  fs.readdirSync(dir).forEach(file => {
    const name = dir + '/' + file;
    if (fs.statSync(name).isDirectory()) {
      getFiles(name, files);
    } else if (name.endsWith('.js') && name !== 'src/store.js') {
      files.push(name);
    }
  });
  return files;
}

const files = getFiles('src');

for (const file of files) {
  let content = fs.readFileSync(file, 'utf8');

  // 1. function render -> async function render
  content = content.replace(/export function render(\w*)/g, 'export async function render$1');

  // 2. add await to store. calls, avoiding double await
  content = content.replace(/([^a-zA-Z0-9_]await\s+)?(store\.[a-zA-Z0-9_]+\()/g, (match, p1, p2) => {
    if (p1) return match; // already awaited
    return 'await ' + p2;
  });

  // 3. Make event listeners async if they contain await
  // e.g., addEventListener('click', (e) => {
  content = content.replace(/addEventListener\('([^']+)',\s*\(([^)]*)\)\s*=>\s*{/g, "addEventListener('$1', async ($2) => {");
  // e.g., addEventListener('click', e => {
  content = content.replace(/addEventListener\('([^']+)',\s*e\s*=>\s*{/g, "addEventListener('$1', async e => {");
  // e.g., addEventListener('click', function(e) {
  content = content.replace(/addEventListener\('([^']+)',\s*function\s*\(([^)]*)\)\s*{/g, "addEventListener('$1', async function($2) {");

  // 4. Update router to support async handlers
  if (file === 'src/router.js') {
    content = content.replace(/handler\(parts\.slice\(1\)\);/g, 'await handler(parts.slice(1));');
    content = content.replace(/function handleRoute/g, 'async function handleRoute');
    // For router init wait
    content = content.replace(/handleRoute\(\);/g, 'handleRoute();');
  }

  // 5. Update main.js router init
  if (file === 'src/main.js') {
    content = content.replace(/await store\.isInitialized\(\)/g, 'await store.isInitialized()');
    content = content.replace(/await store\.seedDemoData\(\)/g, 'await store.seedDemoData()');
  }

  fs.writeFileSync(file, content);
}
console.log('Refactored ' + files.length + ' files.');
