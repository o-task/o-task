const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');

const rootConfig = {
  mode: 'development',
  optimization: {
    usedExports: true, // tells webpack to tree-shake
  },
  devtool: 'eval-source-map'
};

let webpackConfigList = [];

[
  'index',
  'map',
  'chat',
  'mypage',
].forEach( page => {
  webpackConfigList.push( {
    ...rootConfig,
    entry: `./src/js/${page}.js`,
    output: {
      filename: `${page}.js`,
      path: path.resolve(__dirname, 'public/scripts'),
    },
    plugins: [
      new HtmlWebpackPlugin({
        template: `./src/html/${page}.html`,
        filename: path.resolve(__dirname, `public/${page}.html`),
      })
    ]
  } );
});

const serviceWorkerConfig = {
  ...rootConfig,
  entry: './src/js/firebase-messaging-sw.js',
  // TODO(jhuleatt): Remove this once https://github.com/firebase/firebase-js-sdk/issues/5314 is resolved
  module: {
    rules: [
      {
        test: /\.m?js/,
        resolve: {
          fullySpecified: false,
        },
      },
    ],
  },
  output: {
    filename: 'firebase-messaging-sw.js',
    path: path.resolve(__dirname, 'public'),
  },
};

module.exports = [...webpackConfigList, serviceWorkerConfig];
