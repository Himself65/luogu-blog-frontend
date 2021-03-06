const path = require('path')
const os = require('os')
const webpack = require('webpack')
const HappyPack = require('happypack')
const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin
const LodashModuleReplacementPlugin = require('lodash-webpack-plugin')
const VueLoaderPlugin = require('vue-loader/lib/plugin')
const MiniCssExtractPlugin = require('mini-css-extract-plugin')
const OptimizeCSSAssetsPlugin = require('optimize-css-assets-webpack-plugin')
const UglifyJsPlugin = require('uglifyjs-webpack-plugin')
const FriendlyErrorsWebpackPlugin = require('friendly-errors-webpack-plugin')

const isProd = process.env.NODE_ENV === 'production'
const extractCSS = isProd || process.env.TARGET === 'development'

const happyThreadPool = HappyPack.ThreadPool({
  size: Math.min(os.cpus().length, 4)
})

const stylusCssLoaders = [
  extractCSS ? MiniCssExtractPlugin.loader : 'style-loader',
  { loader: 'css-loader', options: { sourceMap: !isProd } },
  { loader: 'postcss-loader', options: { sourceMap: !isProd } },
  { loader: 'stylus-loader', options: { sourceMap: !isProd } }
]

const cssLoader = [
  extractCSS ? MiniCssExtractPlugin.loader : 'vue-style-loader',
  { loader: 'css-loader', options: { sourceMap: !isProd, importLoaders: 1 } },
  { loader: 'postcss-loader', options: { sourceMap: !isProd } }
]

const plugins = [
  // https://vue-loader.vuejs.org/guide/#vue-cli
  new VueLoaderPlugin(),
  new FriendlyErrorsWebpackPlugin({
    clearConsole: true
  }),
  new LodashModuleReplacementPlugin(),
  new webpack.ProvidePlugin({
    $: 'jquery',
    jQuery: 'jquery'
  }),
  new webpack.optimize.OccurrenceOrderPlugin(),
  new HappyPack({
    id: 'js',
    threadPool: happyThreadPool,
    loaders: ['babel-loader', 'eslint-loader?cache=true?emitWarning=true']
  }),
  new MiniCssExtractPlugin({ filename: '[name].css' })
]

if (isProd) {
  plugins.push(
    new webpack.LoaderOptionsPlugin({
      minimize: true
    })
  )
}

const themeName = process.env.THEME || 'debug'

module.exports = {
  entry: {
    article_list: path.resolve(__dirname, '../src/templates', themeName, './article_list.js'),
    article: path.resolve(__dirname, '../src/templates', themeName, './article.js'),
    katex: path.resolve(__dirname, '../src/katex_import.js')
  },
  output: {
    path: path.resolve(__dirname, '../dist', themeName),
    filename: '[name].js'
  },
  mode: isProd ? 'production' : 'development',
  module: {
    rules: [
      {
        test: /\.vue$/,
        loader: 'vue-loader',
        options: {}
      },
      {
        test: /\.css$/,
        use: cssLoader
      },
      {
        test: /\.styl(us)?$/,
        use: stylusCssLoaders
      },
      {
        test: /\.js$/,
        use: 'happypack/loader?id=js',
        exclude: /(node_modules|semantic)/
      },
      {
        test: /\.(png|jpg|gif|svg)$/,
        loader: 'file-loader',
        options: {
          name: '[name].[ext]?[hash]'
        }
      },
      {
        // Font Awesome
        test: /\.(ttf|eot|svg|woff|woff2)(\?v=[0-9]\.[0-9]\.[0-9])?$/,
        loader: 'file-loader'
      }
    ]
  },
  plugins,
  performance: {
    hints: false
  },
  stats: { children: false },
  optimization: {
    splitChunks: {
      cacheGroups: {
        commons: {
          name: 'common',
          filename: 'common.js',
          chunks: 'all',
          test: /article|article_list/
        }
      }
    }
  },
  resolve: {
    alias: {
      'vue$': 'vue/dist/vue.runtime.esm.js'
    },
    extensions: ['*', '.js', '.vue', '.json'],
    modules: [
      path.resolve('./src'),
      path.resolve('./node_modules'),
      path.resolve('./semantic/dist')
    ]
  },
  node: {
    fs: 'empty'
  },
  devServer: {
    historyApiFallback: true,
    noInfo: true,
    overlay: true
  },
  devtool: isProd ? '#source-map' : '#eval-source-map'
}

if (process.env.BUNDLE_ANALYZE === 'true') {
  module.exports.plugins = (module.exports.plugins || []).concat([
    new BundleAnalyzerPlugin()
  ])
}
