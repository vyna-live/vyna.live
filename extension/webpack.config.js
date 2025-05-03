const path = require('path');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');

module.exports = {
  mode: 'production',
  entry: {
    popup: path.resolve(__dirname, 'popup/index.tsx'),
    background: path.resolve(__dirname, 'background/background.ts'),
    content: path.resolve(__dirname, 'content/content.ts')
  },
  output: {
    path: path.resolve(__dirname, 'dist/chrome'),
    filename: '[name].js'
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.js'],
    alias: {
      '@libs': path.resolve(__dirname, 'libs'),
      '@assets': path.resolve(__dirname, 'assets')
    }
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: 'ts-loader',
        exclude: /node_modules/
      },
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader']
      },
      {
        test: /\.(png|jpg|jpeg|svg|gif)$/i,
        type: 'asset/resource'
      }
    ]
  },
  plugins: [
    new CleanWebpackPlugin(),
    new CopyWebpackPlugin({
      patterns: [
        { from: 'manifest.json' },
        { from: 'icons/*.png', to: 'icons/[name][ext]' }
      ]
    }),
    new HtmlWebpackPlugin({
      template: path.resolve(__dirname, 'popup/popup.html'),
      filename: 'popup.html',
      chunks: ['popup']
    })
  ]
};