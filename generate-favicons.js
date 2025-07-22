// Script para generar favicons desde SVG
// Nota: Este script requiere ImageMagick instalado (brew install imagemagick)

const fs = require('fs');
const { execSync } = require('child_process');
const path = require('path');

const publicDir = './public';
const svgFile = path.join(publicDir, 'maslexico-icon.svg');

console.log('🎨 Generando favicons para MasLexico...');

try {
  // Verificar que el SVG existe
  if (!fs.existsSync(svgFile)) {
    throw new Error('SVG file not found: ' + svgFile);
  }

  // Generar PNG de 512x512 para manifest
  console.log('📱 Generando PNG 512x512 para PWA...');
  execSync(`magick "${svgFile}" -resize 512x512 "${publicDir}/maslexico-icon-512.png"`);
  
  // Generar PNG de 192x192 para manifest
  console.log('📱 Generando PNG 192x192 para PWA...');
  execSync(`magick "${svgFile}" -resize 192x192 "${publicDir}/maslexico-icon-192.png"`);
  
  // Generar favicon.ico (múltiples tamaños: 16x16, 32x32, 48x48)
  console.log('🖼️ Generando favicon.ico...');
  execSync(`magick "${svgFile}" -resize 48x48 -define icon:auto-resize=48,32,16 "${publicDir}/favicon.ico"`);
  
  // Generar apple-touch-icon
  console.log('🍎 Generando apple-touch-icon...');
  execSync(`magick "${svgFile}" -resize 180x180 "${publicDir}/apple-touch-icon.png"`);
  
  console.log('✅ Favicons generados exitosamente:');
  console.log('  - favicon.ico (16x16, 32x32, 48x48)');
  console.log('  - maslexico-icon-512.png');
  console.log('  - maslexico-icon-192.png');
  console.log('  - apple-touch-icon.png');
  
} catch (error) {
  console.error('❌ Error generando favicons:', error.message);
  
  if (error.message.includes('magick')) {
    console.log('\n💡 Solución: Instalar ImageMagick:');
    console.log('   brew install imagemagick');
    console.log('\n   O usar herramientas online como:');
    console.log('   - https://favicon.io/favicon-converter/');
    console.log('   - https://www.favicon-generator.org/');
  }
}