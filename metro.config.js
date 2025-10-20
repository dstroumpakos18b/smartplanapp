// metro.config.js
const { getDefaultConfig } = require("expo/metro-config");

const config = getDefaultConfig(__dirname);

// ✅ keep Expo's default transformer (assetPlugins, etc.)
config.transformer.babelTransformerPath = require.resolve("react-native-svg-transformer");

// ✅ treat only .svg with the svg transformer
config.resolver.assetExts = config.resolver.assetExts.filter((ext) => ext !== "svg");
config.resolver.sourceExts.push("svg");

module.exports = config;
