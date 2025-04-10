const path = require('path');

module.exports = {
  mode: 'production',
  entry: {
    ['usStates']: './src/usStates.js',
    ['usFips']: './src/usStatesFips.js',
    ['homepage']: './src/pages/homepage.js',
    ['login']: './src/pages/login.js',
    ['clients']: './src/pages/clients.js',
    ['single-client']: './src/pages/single-client.js',
    ['test']: './src/test.js',
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
