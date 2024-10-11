const path = require('path');

module.exports = {
  mode: 'production',
  entry: {
    ['login']: './src/login.js',
    ['navbar']: './src/navbar.js',
    ['checkAuthentication']: './src/checkAuthentication.js',
    ['clients']: './src/clients.js',
    ['newClientForm']: './src/newClientForm.js',
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
