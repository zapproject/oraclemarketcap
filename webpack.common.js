const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');

module.exports = {
  entry: {
    index: [path.resolve(__dirname, './src/index.ts')],
  },
  performance: {
    hints: false
  },
  plugins: [
    new CleanWebpackPlugin(),
    new HtmlWebpackPlugin({
      template: 'src/index.html'
    }),
    new CopyWebpackPlugin([
      {from: 'src/assets', to: 'assets'}
    ]),
  ],
  resolve: {
    extensions: [".js", ".json", ".jsx", ".css", ".ts", ".tsx"],
    mainFiles: ['index']
  },
  output: {
    path: path.resolve(__dirname, './dist'),
    publicPath: '/',
    chunkFilename: '[name].js',
    filename: '[name].js'
  },
  module: {
    rules: [
      {
        test: /\.css$/,
        loader: 'style-loader',
      },
      {
        test: /\.css$/,
        loader: 'css-loader',
        /* options: {
          modules: true,
          localIdentName: '[name]__[local]___[hash:base64:5]',
        }, */
      },
      {
        test: /\.tsx?$/,
        use: 'ts-loader',
        exclude: /node_modules/
      },
      {
        test: /\.(png|jpg|gif|svg)$/,
        use: [
          {
            loader: 'file-loader',
            options: {}
          }
        ]
      },
      {
        test: /\.html$/,
        use: 'raw-loader'
      },
    ],
  },
}


