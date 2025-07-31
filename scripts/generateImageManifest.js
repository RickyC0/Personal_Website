// scripts/generateImageManifest.js
const fs   = require('fs');
const path = require('path');

// 1) Base “assets” folder
const ASSETS_DIR = path.resolve(__dirname, '..', 'assets');

// 2) Subfolders to scan
const FOLDERS = [
  path.join(ASSETS_DIR, 'professional-files'),
  path.join(ASSETS_DIR, 'custom-sprites')
];

// 3) Where to write the manifest
const OUT_FILE = path.join(ASSETS_DIR, 'image-manifest.json');

// 4) Collect all image paths here
const manifest = [];

/**
 * Recursively walk a directory, pushing every matching image file
 * into the `manifest` array (as a path relative to ASSETS_DIR).
 */
function walk(dir) {
  let entries;
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch (err) {
    console.error(`⚠️  Could not read directory: ${dir}`, err);
    return;
  }

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(fullPath);
    } else if (/\.(png|jpe?g|svg|gif)$/i.test(entry.name)) {
      const relPath = path.relative(ASSETS_DIR, fullPath).replace(/\\/g, '/');
      manifest.push(relPath);
    }
  }
}

// 5) Kick off the scans
FOLDERS.forEach(walk);

// 6) Write out the JSON manifest
try {
  fs.writeFileSync(OUT_FILE, JSON.stringify(manifest, null, 2), 'utf8');
  console.log(`✅  image-manifest.json generated with ${manifest.length} entries.`);
} catch (err) {
  console.error(`❌  Failed to write manifest to ${OUT_FILE}`, err);
  process.exit(1);
}
