const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');

module.exports = (env) => {
  const browser = env.browser || 'chrome';
  
  return {
    mode: 'development',
    entry: {
      popup: './popup/index.tsx',
      background: './background/background.ts'
    },
    output: {
      path: path.resolve(__dirname, 'dist', browser),
      filename: '[name]/[name].js',
    },
    module: {
      rules: [
        {
          test: /\.(js|jsx|ts|tsx)$/,
          exclude: /node_modules/,
          use: {
            loader: 'babel-loader',
            options: {
              presets: [
                '@babel/preset-env',
                '@babel/preset-react',
                '@babel/preset-typescript',
              ],
            },
          },
        },
        {
          test: /\.css$/,
          use: ['style-loader', 'css-loader'],
        },
        {
          test: /\.(png|svg|jpg|jpeg|gif)$/i,
          type: 'asset/resource',
        },
      ],
    },
    resolve: {
      extensions: ['.tsx', '.ts', '.js', '.jsx'],
      alias: {
        '@components': path.resolve(__dirname, 'libs/components'),
      },
    },
    plugins: [
      new HtmlWebpackPlugin({
        template: './popup/popup.html',
        filename: 'popup/popup.html',
        chunks: ['popup'],
      }),
      new CopyWebpackPlugin({
        patterns: [
          {
            from: './assets',
            to: 'assets',
          },
          {
            from: browser === 'firefox' ? './manifest.firefox.json' : './manifest.json',
            to: 'manifest.json',
          },
        ],
      }),
    ],
  };
};