module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    // Must be the last plugin - required by react-native-reanimated (a peer
    // dependency of @shopify/react-native-skia) to compile its worklets.
    plugins: ['react-native-reanimated/plugin'],
  };
};
