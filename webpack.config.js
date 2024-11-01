const path = require('path');

module.exports = {
  mode: 'production',
  entry: {
    ['newClientModal']: './src/newClientModal.js',
    ['loadClientHomepage']: './src/loadClientHomepage.js',
    ['functions']: './src/functions.js',
    ['usStates']: './src/usStates.js',
    ['searchState']: './src/searchState.js',
    ['searchZip']: './src/searchZip.js',
    ['selectionDone']: './src/selectionDone.js',
    ['homepage']: './src/pages/homepage.js',
    ['login']: './src/pages/login.js',
    ['clients']: './src/pages/clients.js',
    ['navbar']: './src/elements/navbar.js',
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
