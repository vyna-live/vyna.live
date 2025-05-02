const path = require('path');
const CopyPlugin = require('copy-webpack-plugin');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');

module.exports = {
  mode: 'development',
  entry: {
    popup: path.resolve(__dirname, 'popup/popup.tsx'),
    dashboard: path.resolve(__dirname, 'dashboard/index.tsx'),
    content: path.resolve(__dirname, 'content/content.ts'),
    background: path.resolve(__dirname, 'background/background.ts'),
  },
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: '[name].js',
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
    alias: {
      '@components': path.resolve(__dirname, 'libs/components'),
      '@hooks': path.resolve(__dirname, 'libs/hooks'),
      '@utils': path.resolve(__dirname, 'libs/utils'),
    },
  },
  plugins: [
    new CleanWebpackPlugin(),
    new CopyPlugin({
      patterns: [
        { from: 'manifest.json', to: '.' },
        { from: 'assets', to: 'assets' },
        { from: 'popup/popup.html', to: 'popup.html' },
        { from: 'popup/popup.css', to: 'popup.css' },
        { from: 'dashboard/index.html', to: 'dashboard.html' },
      ],
    }),
  ],
  devtool: 'cheap-module-source-map',
};
