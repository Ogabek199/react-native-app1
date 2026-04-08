module.exports = function (api) {
  api.cache(true);
  return {
    // NativeWind v4 exports a preset; using it as a plugin can crash Babel
    // with "BABEL_UNKNOWN_PLUGIN_PROPERTY".
    presets: ['babel-preset-expo', 'nativewind/babel'],
    plugins: [],
  };
};

