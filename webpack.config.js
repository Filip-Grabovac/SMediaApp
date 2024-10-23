const path = require('path');

module.exports = {
  mode: 'production',
  entry: {
    ['login']: './src/login.js',
    ['navbar']: './src/navbar.js',
    ['checkAuthentication']: './src/checkAuthentication.js',
    ['clients']: './src/clients.js',
    ['newClientModal']: './src/newClientModal.js',
    ['loadClientHomepage']: './src/loadClientHomepage.js',
    ['functions']: './src/functions.js',
    ['loadMap']: './src/loadMap.js',
    ['usStates']: './src/usStates.js',
    ['searchMap']: './src/searchMap.js',
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
