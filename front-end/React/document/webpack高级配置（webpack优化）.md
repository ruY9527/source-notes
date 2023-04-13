# webpack高级配置（webpack优化）

1. 优化的角度？

   * 提升开发体验（sourceMap)
   * 提升打包构建速度(HotModuleReplacement、oneOf、Include/Exclude 、Cache、Thread)
   * 减少代码体积(Tree Shaking、Babel、Image Minimizer)
   * 优化代码运行性能（Code Split）

2. ==SourceMap==

   * 是什么：
     * SourceMap(**源代码映射**) 是一个用来生成源代码与构建后代码--投射的文件的方案
     * 它会生成一个xxx.map文件，方便从代码出错位置找到映射后源代码的位置
   * 使用场景：
     * 开发模式：cheap-module-source-map
       * 优点：打包编译速度更快，只包含行映射
       * 缺点：没有列映射
       * `module.export={mode:'development',devtool:'cheap-module-source-map'}`
     * 生产模式：source-map
       * 优点：包含行列映射
       * 缺点：打包编译速度更慢
       * `module.export={mode:'production',devtool:'source-map'}`

3. ==HotModuleReplacement==

   * 是什么：

     * HMR（**热模块替换**）：程序运行中，替换、添加、删除模块，而无需重新加载整个页面

   * 使用场景：

     * 开发时我们修改了其中一个模块的代码，Webpack会默认将所有模块全部重新打包编译，其他速度很慢

       `module.export={devSever:{hot:true}}`

       js本身不能热更新，需要做判断：

       `if(module.hot){module.hot.accept('./a.js');module.hot.accept('./a.js')}`

       开发中vue-loader,react-hot-loader会帮我们解决

       

4. ==OneOf==

   * 是什么：
     * 每个文件在经过Webpack编译时，都需要查询完整的配置项，影响编译速度
     * 用oneOf包裹loader,则每个**文件匹配到对应配置时就不会继续往下匹配**了

5. ==Include/Exclude==

   * 是什么：
     * 开发时使用的三方库，被下载到node_modules里，这些文件是不需要编译直接可以运行的
     * 所以我们对js文件处理时，**需要排除node_modules下面的文件**
     * include: 只处理xxx文件
     * exclude: 除了xxx文件以外其他文件都处理
     * `{test:'/\.js$/',include:'path.resolve(__dirname,'./src)',loader:'babel-loader'}`
     * 或者用exclude: /node_modules/ 替换(二选一)

6. ==Cache==

   * 是什么：
     * 每次打包时，js文件都要经过Eslint检查和Babel编译，速度比较慢。我们可以**缓存上一次检查和编译结果**，这样打包时速度就会更快了
     * `options:{cacheDirectory:true,//开启缓存cacheCompression:false //关闭缓存文件压缩}`

7. ==Thread==

   * 是什么：
     * 当项目越来越大时，打包速度会很慢，想要提升速度，本质上要提升js的打包速度
     * 而对js文件处理主要就是eslint、babel、Terser三个工具。所以要提升他们得运行速度
     * 我们可以开启多进程同时处理js文件，就比单线程的速度更快了
     * **多进程打包**：开启电脑的多个进程同时干一件事，速度更快
     * 注意：仅在特别耗时的操作中使用，因为每个进程启动约有600ms左右开销
   * 使用场景：
     * 启动的进程数量就是CPU的核数
     * `const os=require('os')` 
     * cpu核数：`const threads=os.cpus().length`

8. ==Tree Shaking==

   * 是什么：
     * 开发时我们自己定义了一些工具库函数，或者引入第三方工具函数库或组件库
     * 如果不做特殊处理的话，打包时就会引入整个库，但是实际上可能我们只会用上极小部分的功能
     * Tree Shaking：描述移除js中的没有使用上的代码
     * 注意：它依赖ES Module,webpack已经默认开启这个功能

9. ==Babel==

   * 是什么:
     * Babel为编译的每个文件都插入了辅助代码，使得代码体积过大
     * Babel为辅助的每个文件都使用了非常小的辅助代码，比如_extend 默认情况下会被添加到每一个需要它的文件内
     * 我们可以使这些辅助代码作为独立模块，避免重复引入
     * @babel/plugin-transform-runtime:禁用Babel自动对每个文件的runtime注入，而是引入
     * 并使所有辅助代码从此处引用

10. ==Image Minimizer==

    * 是什么：
      * 压缩静态图片

11. ==Code Split==

    * 是什么：
      * 打包时会将所有js文件打包到一个文件夹中，体积太大了，如果只需要渲染首屏，就应该只加载首页的js文件，其他文件不加载
      * 所以需要将打包生成的文件进行代码分割，渲染哪个页面就只加载某个js文件
      * **分割文件，按需加载**
    * 使用场景：
      * todo

