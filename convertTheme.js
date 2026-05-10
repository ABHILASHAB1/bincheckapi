import fs from 'fs';
import path from 'path';

const SRC_DIR = './src';

const replacements = [
  // Text colors
  { regex: /\btext-white\b/g, replace: 'text-gray-900' },
  { regex: /\btext-gray-200\b/g, replace: 'text-gray-800' },
  { regex: /\btext-gray-300\b/g, replace: 'text-gray-700' },
  { regex: /\btext-gray-400\b/g, replace: 'text-gray-600' },
  
  // Backgrounds
  { regex: /\bbg-black\/20\b/g, replace: 'bg-white/80' },
  { regex: /\bbg-black\/30\b/g, replace: 'bg-white/70' },
  { regex: /\bbg-black\/40\b/g, replace: 'bg-gray-100/80' },
  { regex: /\bbg-black\/50\b/g, replace: 'bg-gray-200/80' },
  { regex: /\bbg-black\b/g, replace: 'bg-white' },
  
  { regex: /\bbg-white\/5\b/g, replace: 'bg-black/5' },
  { regex: /\bbg-white\/10\b/g, replace: 'bg-black/10' },
  { regex: /\bbg-white\/20\b/g, replace: 'bg-black/20' },
  
  { regex: /\bbg-\[\#0a0a0f\]\b/g, replace: 'bg-gray-50' },
  { regex: /\bbg-\[\#050508\]\b/g, replace: 'bg-gray-100' },
  
  // Borders
  { regex: /\bborder-white\/5\b/g, replace: 'border-black/5' },
  { regex: /\bborder-white\/10\b/g, replace: 'border-black/10' },
  { regex: /\bborder-white\/20\b/g, replace: 'border-black/20' },
  
  // Custom specific elements from dark theme
  { regex: /from-gray-600 to-gray-400/g, replace: 'from-gray-300 to-gray-100' },
  { regex: /rgba\(255,\s*255,\s*255,\s*0\.05\)/g, replace: 'rgba(0,0,0,0.05)' },
  { regex: /rgba\(255,255,255,0\.05\)/g, replace: 'rgba(0,0,0,0.05)' },
  
  // Nav active state gradients
  { regex: /from-fintech-accent\/20/g, replace: 'from-fintech-accent/10' }
];

function processDirectory(dir) {
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      processDirectory(fullPath);
    } else if (fullPath.endsWith('.jsx') || fullPath.endsWith('.js') || fullPath.endsWith('.css')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      let original = content;
      
      replacements.forEach(rule => {
        content = content.replace(rule.regex, rule.replace);
      });
      
      if (content !== original) {
        fs.writeFileSync(fullPath, content);
        console.log(`Updated: ${fullPath}`);
      }
    }
  });
}

processDirectory(SRC_DIR);
console.log("Done replacing classes.");
