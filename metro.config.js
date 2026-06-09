const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);

// Exclude directories that should not be bundled or watched
const BLOCKED = [
  '.cache',
  '.local',
  'server',
  'dist',
  'node_modules/.cache',
].map(dir =>
  new RegExp(
    `^${path.join(__dirname, dir).replace(/[\\^$.*+?()[\]{}|]/g, '\\$&')}(/.*)?$`
  )
);

const existing = config.resolver.blockList;
if (Array.isArray(existing)) {
  config.resolver.blockList = [...existing, ...BLOCKED];
} else if (existing) {
  config.resolver.blockList = [existing, ...BLOCKED];
} else {
  config.resolver.blockList = BLOCKED;
}

// Also exclude from watchman
config.watchFolders = [__dirname];
config.resolver.watchFolders = undefined;

module.exports = config;
