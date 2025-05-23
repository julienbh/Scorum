const path = require('path');
const CopyWebpackPlugin = require('copy-webpack-plugin');

module.exports = {
  entry: {
    options: './options.js',
    scorum: './scorum.js',
    background: './background.js'
  },
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: '[name].bundle.js'
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader'
        }
      }
    ]
  },
  plugins: [
    new CopyWebpackPlugin({
      patterns: [
        { from: 'manifest.json', to: 'manifest.json' },
        { from: 'options.html', to: 'options.html' },
        { from: 'betting.html', to: 'betting.html' },
        { from: 'style.css', to: 'style.css' },
        { from: 'icon.png', to: 'icon.png' },
        { from: 'iconSmall.png', to: 'iconSmall.png' },
        { from: 'vendor', to: 'vendor' }
      ]
    })
  ]
};
