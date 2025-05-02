const path = require('path');
const CopyWebpackPlugin = require('copy-webpack-plugin');

module.exports = {
  entry: {
    popup: path.resolve(__dirname, './popup/index.tsx'),
    background: path.resolve(__dirname, './background/background.ts'),
  },
  output: {
    path: path.resolve(__dirname, './dist'),
    filename: '[name]/[name].js',
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader'],
      },
      {
        test: /\.(png|jpg|jpeg|gif|svg)$/,
        type: 'asset/resource',
        generator: {
          filename: 'assets/[name][ext]',
        },
      },
    ],
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.js'],
  },
  plugins: [
    new CopyWebpackPlugin({
      patterns: [
        {
          from: 'manifest.json',
          to: './',
        },
        {
          from: 'popup/popup.html',
          to: './popup/',
        },
        {
          from: 'assets',
          to: './assets/',
        },
      ],
    }),
  ],
};
