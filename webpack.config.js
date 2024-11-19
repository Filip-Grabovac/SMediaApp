const path = require('path');

module.exports = {
  mode: 'production',
  entry: {
    ['usStates']: './src/usStates.js',
    ['homepage']: './src/pages/homepage.js',
    ['login']: './src/pages/login.js',
    ['clients']: './src/pages/clients.js',
  },
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: '[name].js',
    library: '[name]',
    libraryTarget: 'umd',
    globalObject: 'this',
    umdNamedDefine: true,
    clean: true,
  },
};
