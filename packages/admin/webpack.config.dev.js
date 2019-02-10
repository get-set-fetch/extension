const path = require('path');
const webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');

module.exports = {
  entry: './src/ts/index.ts',
  output: {
    filename: 'admin.js',
    path: path.resolve(__dirname, 'dist'),
    publicPath: '/admin/',
    pathinfo: false,
  },
  target: 'web',

  devtool: 'source-map',
  devServer: {
    port: 8090,
    historyApiFallback: {
      rewrites: [
        { from: /^\/$/, to: '/admin/admin.html' }
      ]
    }
  },

  optimization: {
    minimize: false,
    removeAvailableModules: false,
    removeEmptyChunks: false,
    splitChunks: false,
  },

  plugins: [
    new HtmlWebpackPlugin({
      filename: 'admin.html',
      template: 'src/html/admin.html',
    }),
    new MiniCssExtractPlugin({
      filename: '[name].css',
    }),
    /*
    new webpack.ProvidePlugin({
      $: 'jquery',
      jQuery: 'jquery',
      'window.jQuery': 'jquery',
      Popper: ['popper.js', 'default'],
      // individual imported plugins:
      Util: 'exports-loader?Util!bootstrap/js/dist/util',
      Dropdown: 'exports-loader?Dropdown!bootstrap/js/dist/dropdown',
    }),
    */
  ],

  module: {
    rules: [
      {
        parser: {
          system: false
        }
      },
      {
        test: /\.(ts|tsx)$/,
        exclude: /node_modules/,
        use: {
          loader: 'ts-loader',
          options: {
            transpileOnly: true,
            experimentalWatchApi: true,
          }
        },
      },
      {
        test: /\.(scss|css)$/,
        use: [
          MiniCssExtractPlugin.loader,
          'css-loader',          
          {
            loader: "postcss-loader",
            options: {
              ident: 'postcss',
              plugins: [
                require('autoprefixer')({
                  browsers: ["defaults"]
                }),
              ]
            }
          },
          'sass-loader'
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
      {
        test: /\.(png|jpg)$/,
        use: [{
          loader: 'file-loader',
          options: {
            name: '[name].[ext]',
            outputPath: 'images/',
          },
        }],
      },
    ],
  },

  resolve: {
    extensions: ['.js', '.jsx', '.ts', '.tsx'],
  },

};

