const path = require('path');
const webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');

module.exports = {
  entry: './src/js/index.js',
  output: {
    filename: 'admin.js',
    path: path.resolve(__dirname, 'dist'),
    publicPath: '/admin/',
  },
  target: 'web',
  devtool: 'source-map',
  watchOptions: {
    aggregateTimeout: 1000,
    poll: 1000,
  },

  plugins: [
    new HtmlWebpackPlugin({
      filename: 'admin.html',
      template: 'src/html/admin.html',
    }),
    new MiniCssExtractPlugin({
      filename: '[name].css',
    }),
    new webpack.ProvidePlugin({
      $: 'jquery',
      jQuery: 'jquery',
      'window.jQuery': 'jquery',
      Popper: ['popper.js', 'default'],
      // individual imported plugins:
      Util: 'exports-loader?Util!bootstrap/js/dist/util',
      Dropdown: 'exports-loader?Dropdown!bootstrap/js/dist/dropdown',
    }),
  ],

  module: {
    rules: [
      {
        test: /\.(js|jsx)$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
        },
      },
      {
        test: /\.(scss|css)$/,
        use: [
          MiniCssExtractPlugin.loader,
          'css-loader',
          'sass-loader',
        ],
      },
      {
        test: /\.(woff|woff2|ttf|eot|svg)$/,
        use: [{
          loader: 'file-loader',
          options: {
            name: '[name].[ext]',
            outputPath: 'fonts/',
          },
        }],
      },
    ],
  },

  resolve: {
    extensions: ['.js', '.jsx'],
  },

};

