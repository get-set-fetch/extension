const path = require('path');
const webpack = require('webpack');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');

/* eslint-disable no-param-reassign */
module.exports = {
  entry: {
    index: './src/gsf/index.js',
    popup: './src/popup/js/popup.js',
  },
  output: {
    filename: '[name].js',
    path: path.resolve(__dirname, 'dist'),
  },
  target: 'web',
  devtool: 'source-map',
  plugins: [
    new HtmlWebpackPlugin({
      chunks: ['popup'],
      filename: 'popup.html',
      template: 'src/popup/html/popup.html',
    }),
    new CopyWebpackPlugin([
      { from: 'src/manifest.json', to: './' },
      { from: 'src/popup/resources/icons', to: './icons' },
    ]),
    new webpack.NormalModuleReplacementPlugin(
      /NodeFetchPlugin|ChromeFetchPlugin|JsDomPlugin|ExtractUrlPlugin|RobotsFilterPlugin|PersistResourcePlugin|UrlUtils|Logger/,
      ((resource) => {
        // only attempt to modify resources coming from get-set-fetch/lib
        if (resource.context.match(/get-set-fetch.lib/) === null) {
          return;
        }

        const filename = path.parse(resource.request).base;
        switch (filename) {
          case 'Logger':
            resource.request = path.resolve(__dirname, 'src', 'gsf', 'logger', 'Logger.js');
            break;
          case 'UrlUtils':
            resource.request = path.resolve(__dirname, 'src', 'gsf', 'utils', 'UrlUtils.js');
            break;
          default:
            resource.request = path.resolve(__dirname, 'src', 'gsf', 'plugins', 'MockPlugin.js');
        }
      }),
    ),
  ],
  module: {
    rules: [
      {
        test: /\.js/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
        },
      },
      {
        test: /KnexStorage|MongoStorage/,
        use: 'null-loader',
      },
    ],
  },

};
