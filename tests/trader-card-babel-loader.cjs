module.exports = function(source) {
  return require('next/dist/compiled/babel/core').transformSync(source, {
    filename: this.resourcePath, configFile: false, babelrc: false,
    presets: [[require('next/dist/compiled/babel/preset-react'), { runtime: 'automatic' }]],
  }).code;
};
