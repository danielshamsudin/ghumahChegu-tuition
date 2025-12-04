/**
 * Icon Generation Script
 *
 * This script creates placeholder SVG icons for the PWA.
 * For production, replace these with properly designed icons.
 *
 * Recommended tools for icon generation:
 * - https://realfavicongenerator.net/
 * - https://www.pwabuilder.com/imageGenerator
 * - Figma or Adobe Illustrator for custom designs
 */

const fs = require('fs');
const path = require('path');

const publicDir = path.join(__dirname, '..', 'public');

// Create SVG icon with TMS logo
const createSVGIcon = (size) => `
<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#2563eb;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#9333ea;stop-opacity:1" />
    </linearGradient>
  </defs>

  <!-- Background rounded rectangle -->
  <rect width="${size}" height="${size}" rx="${size * 0.2}" fill="url(#grad1)"/>

  <!-- TMS Text -->
  <text x="50%" y="50%"
        font-family="system-ui, -apple-system, sans-serif"
        font-size="${size * 0.35}"
        font-weight="bold"
        fill="white"
        text-anchor="middle"
        dominant-baseline="central">
    TMS
  </text>

  <!-- Small book icon -->
  <g transform="translate(${size * 0.65}, ${size * 0.15}) scale(${size * 0.001})">
    <path d="M12 2L4 5v6.09c0 5.05 3.41 9.76 8 10.91 4.59-1.15 8-5.86 8-10.91V5l-8-3z"
          fill="white"
          opacity="0.3"/>
  </g>
</svg>
`.trim();

// Generate icons
const icons = [
  { name: 'icon-192.png', size: 192, svg: true },
  { name: 'icon-512.png', size: 512, svg: true },
  { name: 'apple-touch-icon.png', size: 180, svg: true },
  { name: 'favicon.ico', size: 32, svg: true }
];

console.log('📱 Generating PWA icons...\n');

icons.forEach(({ name, size }) => {
  const svgContent = createSVGIcon(size);
  const svgPath = path.join(publicDir, name.replace('.png', '.svg').replace('.ico', '.svg'));

  fs.writeFileSync(svgPath, svgContent);
  console.log(`✅ Created ${name.replace('.png', '.svg').replace('.ico', '.svg')} (${size}x${size})`);
});

console.log('\n📝 Note: SVG files created as placeholders.');
console.log('For production, convert these to PNG using:');
console.log('  - Online tool: https://cloudconvert.com/svg-to-png');
console.log('  - CLI tool: npm install -g sharp-cli && sharp input.svg -o output.png');
console.log('\nOr use a professional icon generator:');
console.log('  - https://realfavicongenerator.net/');
console.log('  - https://www.pwabuilder.com/imageGenerator\n');
