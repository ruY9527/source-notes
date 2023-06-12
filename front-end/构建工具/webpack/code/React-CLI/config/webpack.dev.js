const path = require('path')
const EslintWebpackPlugin = require('eslint-webpack-plugin')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const getStyleLoaders = (pre) => {
  return [
    'style-loader',
    'css-loader',
    {
      loader: 'postcss-loader',    //考虑兼容性问题时可配置,配合browserslist
      options: {
        postcssOption: {
          plugin: ['postcss-preset-env']
        }
      }
    },
    pre
  ].filter(Boolean)

}
module.export = {
  entry: './src/index.js',
  output: {
    path: undefined,
    filename: 'static/js/[name].js',
    chunkFilename: 'static/js/[name].chunk.js',
    assetModuleFilename: 'static/media/[hash:10][ext][query]'
  },
  //配置loader规则
  module: {
    rules: [
      //处理css
      {
        test: /\.css$/,
        use: getStyleLoaders()
      },
      {
        test: /\.less$/,
        use: getStyleLoaders('less-loader')
      },
      {
        test: /\.s[ac]ss$/,
        use: getStyleLoaders('sass-loader')
      },
      {
        test: /\.stylus$/,
        use: getStyleLoaders('stylus-loader')
      },

      //处理图片
      {
        test: /\.(jpg?e|png|gif|webp|svg)/,
        type: 'asset',
        parser: {
          dataUrlCondition: {
            maxSize: 10 * 1024   //图片小于等于10kb时，会被转化为base64格式，减少请求数量
          }
        }
      },
      //处理其他资源
      {
        test: /\.(woff2?|ttf)$/,
        type: 'asset/resource'
      },
      //处理js 
      {
        test: /\.(js|jsx)$/,
        include: path.resolve(__dirname, '../src'),
        loader: "babel-loader",
        options: {
          cacheDirectory: true,
          cacheCompression: false
        }
      }
    ]
  },
  //处理html
  plugins: [
    new EslintWebpackPlugin({
      context: path.resolve(__dirname, '../src'),
      exclude: 'node_modules',
      cache: true,
      cacheLocation: path.resolve(__dirname, '../node_modules/.cache/.eslintcache')
    }),
    new HtmlWebpackPlugin({
      template: path.resolve(__dirname, '../public/index.html')
    })
  ],
  mode: 'development',
  devtool: 'cheap-module-source-map',
  //代码分割
  optimization: {
    splitChunks: {
      chunks: 'all'     //node_modules和import动态导入的代码
    },
    runtimeChunk: {
      name: entrypoint => `runtime~${entrypoint}.js`
    }
  },
  //webpack 解析模板加载选项
  resolve: {
    //自动补全文件扩展名
    extensions: ['.jsx', '.js', '.json']
  },
  devSever: {
    host: 'localhost',
    port: '3000',
    open: true,
    hot: true
  }
}