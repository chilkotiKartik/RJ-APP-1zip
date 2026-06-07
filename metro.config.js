const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);

const cachePattern = new RegExp(
  `^${path.join(__dirname, '.cache').replace(/[\\^$.*+?()[\]{}|]/g, '\\$&')}.*`
);

const existing = config.resolver.blockList;
if (Array.isArray(existing)) {
  config.resolver.blockList = [...existing, cachePattern];
} else if (existing) {
  config.resolver.blockList = [existing, cachePattern];
} else {
  config.resolver.blockList = [cachePattern];
}

module.exports = config;
