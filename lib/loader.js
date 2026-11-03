const fs = require('fs');
const path = require('path');

// Baca semua .js di folder fitur, hapus cache, require ulang.
function loadFeatures(dir, map) {
  const next = new Map();
  for (const file of fs.readdirSync(dir)) {
    if (!file.endsWith('.js')) continue;
    const full = path.join(dir, file);
    try {
      delete require.cache[require.resolve(full)];
      const mod = require(full);
      if (!mod || typeof mod.run !== 'function') continue;
      next.set(String(mod.name || path.basename(file, '.js')).toLowerCase(), mod);
    } catch (e) {
      console.log('[LOADER] gagal memuat', file, '-', e.message);
    }
  }
  map.clear();
  for (const [k, v] of next) map.set(k, v);
  return map;
}

module.exports = { loadFeatures };
