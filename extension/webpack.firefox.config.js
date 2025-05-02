const path = require('path');
const CopyPlugin = require('copy-webpack-plugin');
const baseConfig = require('./webpack.config');

module.exports = {
  ...baseConfig,
  output: {
    path: path.resolve(__dirname, 'dist-firefox'),
    filename: '[name].js',
    clean: true,
  },
  plugins: [
    new CopyPlugin({
      patterns: [
        { from: 'manifest.firefox.json', to: 'manifest.json' },
        { from: 'popup.html', to: '.' },
        { from: 'icons', to: 'icons' },
        { from: 'popup/styles', to: 'popup/styles' },
      ],
    }),
  ],
};