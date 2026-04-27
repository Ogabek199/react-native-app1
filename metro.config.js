const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');
const path = require('path');

process.env.EXPO_PROJECT_ROOT = __dirname;
process.chdir(__dirname);

const config = getDefaultConfig(__dirname);

module.exports = withNativeWind(config, {
  input: './global.css',
  configPath: path.join(__dirname, 'tailwind.config.js'),
});
