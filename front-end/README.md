## 							Front_End Plan



####  html & html5

​		html 这块需要对基本的标签使用是没有问题的, 当然有些标签还是有一些属性的.

  比如:

​         h1 等标题标签  /  p 标签   / a 链接标签 /  img 标签 .   然后就是 单表标签和div .

​     html5 中的一些新特性也是需要了解的. 



参考连接:  [菜鸟教程](https://www.runoob.com/html/html-tutorial.html)      /      [w3school](https://www.w3school.com.cn/html/index.asp)

  

#### css & css3

   css 中一些基本的使用.  理解盒模型.   这里的css 对基本使用没问题,也即是能调试出一些样式的代码.  

  当然了 css3 中的特性也是要学会使用的.    css 中的东西很多,肯定也不会都记下来的,要了解并且掌握使用,每次使用的时候,晓得要用什么来进行调试.  使用忘记了的时候,就需要多看手册了.



参考链接:   [菜鸟教程](https://www.runoob.com/cssref/css-reference.html)        /     [w3school](https://www.w3school.com.cn/css/index.asp)



#### JavaScript

  js 是需要打好基础的, 相对于 html 和 css 而言, js中的东西,更准备的说是一门变成语言. 

  Html 定义页面内容(表单等)    Css描述网页布局      JavaScript 网页的行为(比如弹框等)

-   Js 语法:  变量 (基本变量和引用变量),  操作符(+ - * /等) , 

-  js 函数(一般叫方法) , 方法可以传入参数,也可以不传入。 调用完了,可以返回参数,也可以不返回参数.

-  js 对象, 相对于es6的话,js的对象你可以理解为 键值对,  比如 var person = { name: "GanTian" } .    有一个对象,指向的名字是 person , 然后该对象中有一个 name(属性,也可以叫字段), 然后该属性的值叫 GanTian.  我们也可以修改为 person.name = "GavinYang"

-  js 作用域(这里相当于es6的let,使用var的话,可能会有一个变量提升的).  js 事件, 比如点击按钮的时候,就会有一个onclick() 事件出来.

- js 中的 字符串, 主要记住一些常用的 字符串 内置的方法, 比如split/replace/toLocaleUpperCase/toLocaleUpperCase/trim 等,也就是要熟练使用

-  if / else / while / for  / switch /  break  / counite  / typeof 等基础的使用.  对于类型之间相互转换,如果不放心是不是你需要的类型,可以先使用 typeof 先判断下.

- this /  正则表达式  /   JSON  /  异步编程  

-  Js 对 浏览器中的 document 操作 (DOM).

-  代码规范

   

  网道是 阮一峰老师的, 推荐看(看的知识点顺序是非常推荐的). 

  参考链接:  [菜鸟教程](https://www.runoob.com/js/js-htmldom.html)      /    [w3school](https://www.w3school.com.cn/js/index.asp)    /     [网道](https://wangdoc.com/javascript/)



#### ES6

   es6 也可以在 网道中直接看, 也是阮一峰的.  [地址](https://wangdoc.com/es6/)  



#### Vue  框架

​     vue 框架在国内使用是越来越多了,并且基于vue开源的项目也很多. 

​     在学习 vue 的 模板语法/条件语句/循环语句/计算属性/监听属性/样式绑定等,都可以直接使用来学习,没必要使用脚手架,但是在后面 不管看开源的项目还是自己想做项目的时候,都是要必须使用 脚手架的.   

```javascirpt
<script src="https://cdn.jsdelivr.net/npm/vue/dist/vue.js"></script>
```



-  vue-router 路由, 必须要掌握的. 路由是可以使用不同的路径,来访问不同的内容的.  比如/user路径访问user信息的内容,/orders访问的是商品信息内容.

-  axios : 可以理解为和 ajax一样的效果, 比如我们将表单的数据都填写完了,然后将表单的数据传递给后端的话,那么就需要与后端进行交互(后端会提供Api接口给你), 然后axios就是请求接口的.

-  vuex :  状态统一管理. 

- 饿了么UI:   https://element.eleme.cn/#/zh-CN/component/installation     对于vue使用者来说,饿了么UI组件库还是很不错的. 目前很多国内人写的开源vue项目,都是有使用到 饿了么UI 组件库的.

  

  看开源的项目, clone 到本地跑起来, 然后看代码,看别人项目的设计/代码. 

  然后看下自己可不可以模仿这一个相似的或者  仿照这一些好的网站来写一个类似的.

  

  #### webpack

     webpack 的功能就是打包, 也是需要去理解的.

  

  #### node.js

    至于node, 也是一个不可少的.

  

  #### typeScript

     前面的底子打好了,typeScript也是需要学习的.  

  