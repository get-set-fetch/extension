const path = require('path');
const webpack = require('webpack');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');

/* eslint-disable no-param-reassign */
module.exports = {
  entry: {
    'gsf/gsf': './src/gsf/gsf.js',
    'popup/popup': './src/popup/js/popup.js',
    'admin/admin': './src/admin/js/index.js',
  },
  output: {
    filename: '[name].js',
    path: path.resolve(__dirname, 'dist'),
  },
  target: 'web',
  devtool: 'source-map',
  watchOptions: {
    aggregateTimeout: 1000,
    poll: 1000,
  },

  plugins: [
    new HtmlWebpackPlugin({
      chunks: ['popup/popup'],
      filename: 'popup/popup.html',
      template: 'src/popup/html/popup.html',
    }),
    new HtmlWebpackPlugin({
      chunks: ['admin/admin'],
      filename: 'admin/admin.html',
      template: 'src/admin/html/admin.html',
    }),
    new MiniCssExtractPlugin({
      filename: '[name].css',
    }),
    new CopyWebpackPlugin([
      { from: 'src/manifest.json', to: './' },
      { from: 'src/popup/resources/icons', to: './icons' },
    ]),

    new webpack.NormalModuleReplacementPlugin(
      /NodeFetchPlugin|ChromeFetchPlugin|JsDomPlugin|PersistResourcePlugin|Logger/,
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
          default:
            resource.request = path.resolve(__dirname, 'src', 'gsf', 'plugins', 'MockPlugin.js');
        }
      }),
    ),
  ],

  module: {
    rules: [
      {
        test: /\.js|.jsx/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
        },
      },
      {
        test: /KnexStorage|MongoStorage/,
        use: 'null-loader',
      },
      {
        test: /\.scss$/,
        use: [
          MiniCssExtractPlugin.loader,
          'css-loader',
          'sass-loader',
        ],
      },
    ],
  },

  resolve: {
    extensions: ['.js', '.jsx'],
  },

};
