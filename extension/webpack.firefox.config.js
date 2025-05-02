const path = require('path');
const CopyWebpackPlugin = require('copy-webpack-plugin');

module.exports = {
  mode: 'production',
  entry: {
    popup: './popup/index.tsx',
    background: './background/background.ts',
    content: './content/content.ts'
  },
  output: {
    path: path.resolve(__dirname, 'dist-firefox'),
    filename: '[name]/[name].js',
  },
  resolve: {
    extensions: ['.ts', '.tsx', '.js', '.jsx'],
    alias: {
      '@components': path.resolve(__dirname, 'libs/components'),
      '@assets': path.resolve(__dirname, 'libs/assets'),
      '@utils': path.resolve(__dirname, 'libs/utils'),
      '@hooks': path.resolve(__dirname, 'libs/hooks'),
      '@types': path.resolve(__dirname, 'libs/types'),
    },
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },
      {
        test: /\.css$/i,
        use: ['style-loader', 'css-loader'],
      },
      {
        test: /\.(png|jpe?g|gif|svg)$/i,
        type: 'asset/resource',
      },
    ],
  },
  plugins: [
    new CopyWebpackPlugin({
      patterns: [
        { from: 'manifest.firefox.json', to: 'manifest.json' },
        { from: 'icons', to: 'icons' },
        { from: 'popup/popup.html', to: 'popup/popup.html' },
        { from: 'popup/styles', to: 'popup/styles' },
      ],
    }),
  ],
};
