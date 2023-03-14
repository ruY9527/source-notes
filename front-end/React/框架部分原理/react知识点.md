

## react知识点

1. 如何理解react？

2. 为什么react要用 JSX ？

   * jsx的本质是什么，和js之间有什么关系？

     * JSX是javaScript的一种语法扩展，和模板语法很接近，但是它充分具备JavaScript的能力

     * JSX是如何在javaScript中生效的：认识Babel

       * jsx会被编译为React.createElement(),返回一个叫做“React Element”的JS对象

       * <img src="C:\Users\firefly-g\AppData\Roaming\Typora\typora-user-images\image-20230213104113227.png" alt="image-20230213104113227" style="zoom: 50%;" />

         

   * 为啥要用jsx? 不能用别的嘛？

     * JSx语法糖允许开发者使用我们熟悉的HTM标签语法创建虚拟DOM，减低学习成本，提高研发效率

   * jsx 背后的功能模块是什么？ 都做了哪些事情？

     * jsx代码--- babel编译--- React.createElement调用--- ReactElement调用--- 虚拟DOM ---作为参数传入 ReactDOM.render() --- 渲染处理为真实DOM

3. 如何避免react周期中的坑？

   * ![image-20230211093021627](C:\Users\firefly-g\AppData\Roaming\Typora\typora-user-images\image-20230211093021627.png)

   * 新生命周期 static getDerivedStateFromProps(props，state)

     * 静态方法 不依赖组件实例而存在
     * return 一个对象格式
     * 该方法对state的更新动作并非”覆盖“式的更新，而是对某个对象的定向更新

     * 用途：使用props来派生/更新state

     ![image-20230211150029981](C:\Users\firefly-g\AppData\Roaming\Typora\typora-user-images\image-20230211150029981.png)

   * 为什么要用getDerivedStateFromProps 代替 componentWillRecieveProps ？

     * <img src="C:\Users\firefly-g\AppData\Roaming\Typora\typora-user-images\image-20230213114854651.png" alt="image-20230213114854651" style="zoom:33%;" />

     * 与componentDidUpdate一起，这个新的生命周期涵盖过时componentWillRecieveProps的所有用例

   * 新生命周期 getSnapShotBeforeUpdate(prevProps，prevState)

     * getSnapShotBeforeUpdate的返回值会作为第三个参数给到componentDidUpdate，它的执行时机是在render方法之后，真实DOM更新之前；同时获取到更新前的真实DOM和更新前后的state&props信息

4. React16为何改变生命周期？

   * Fiber: 任务拆解 进程可打断  （可以被打断的异步渲染模式）
   * 生命周期的两个阶段：render阶段（执行中允许被打断）  commit阶段（可同步执行）

5. 数据如何在react组件中流通的？

   * 基于props的单向数据流
     * 父子组件通信：父组件通过this.props传入子组件
     * 子父组件通信: 父组件传递给子组件一个绑定自身上下文的函数，子组件在调用该函数时，就可以将数据以函数入参的形式传给父组件
     * 兄弟组件通信：结合以上两种
   * 利用“发布-订阅”模式驱动数据流
     * on() 监听事件执行回调  emit() 触发事件并携带数据  off() 删除监听

   * 全局通信 Context API
     * store ：单一数据源，只读
     * action：对变化的描述
     * reducer: 对变化进行分发和处理
   * 第三方数据流框架 ：Redux 提供公共数据的仓库
     * <img src="C:\Users\firefly-g\AppData\Roaming\Typora\typora-user-images\image-20230213162913540.png" alt="image-20230213162913540" style="zoom:33%;" />

   

5. 如何设计react组件？

* ![image-20230211092045769](C:\Users\firefly-g\AppData\Roaming\Typora\typora-user-images\image-20230211092045769.png)

6. React-Hook的设计动机与工作模式？

   * 强化函数组件的能力
   * 告别难以理解的Class
   * 解决业务逻辑难以拆分的问题
   * 使状态逻辑复用变得简单可行
   * 函数组件从设计思想上更加契合React理念
   * hook 使用原则：
     * 只在React函数中调用Hook
     * 不要在循环、条件或者嵌套函数中调用Hook（确保Hooks在每次渲染时都保持同样的执行顺序）
   * 以useState为例，分析React-Hooks的调用链路
     * useState---通过resolveDispatcher获取dispatcher --- 调用dispatcher.useState--- 调用mountState --- 返回目标函数（如[state，useState]） 

7. 类组件与函数组件有什么区别？

   * 类组件需要继承class 函数组件不用
   * 类组件可以访问生命周期方法 函数组件不能
   * 类组件中可以获取到实例化的this，并基于this做任何事情，函数组件不能
   * 类组件中可以定义并维护state（状态），而函数组件不能
   * 类组件是面向对象编程思想的一种表征：
     * 封装： 将一类属性和方法，‘聚拢’到一个class中
     * 继承： 新的class 可以继承现有class 实现对某一类属性和方法的复用

   * 函数组件会捕获render内部的状态，这是两类组件最大的不同

8. 如何理解虚拟DOM？

   * 本质上是JS和DOM之间的一个映射缓存，在形态上表现为一个能描述DOM结构及属性信息的JS对象

   * 在react中如何工作：

     * 挂载阶段：react将JSX的描述，构建出虚拟DOM树，然后通过ReactDOM.render实现虚拟DOM到真实DOM的映射（触发渲染流水线）
     * 更新阶段：页面的变化会先作用于虚拟DOM，虚拟DOM将在js层借助算法对比出具有真实改变的DOM，再作用于真实DOM

   * 历史中的DOM操作的解决方案：

     * 前期前端中页面展示的需求要大于交互，导致JS只起到辅助作用

     * jQuery时期，大量DOM操作需求带来前端工作量激增，将DOM api 封装成为相对简单形式，实现浏览器兼容，链式调用等一系列能力

     * 模板引擎：jQuery不能解决DOM操作量过大带来的压力，模板引擎更倾向于点对点解决繁琐DOM操作问题，是和jQuery共存的，缺点是每次都要重新生成DOM，性能差

     * 数据驱动视图（虚拟DOM）：既然操作虚拟DOM损耗性能这么大，那操作假的DOM不就行了？

       <img src="C:\Users\firefly-g\AppData\Roaming\Typora\typora-user-images\image-20230213214931254.png" alt="image-20230213214931254" style="zoom:33%;" />

       * 虚拟DOM的劣势：主要在于JS计算的耗时，DOM操作的能耗和JS计算的能耗根本不在一个量级

       * 虚拟DOM解决了哪些问题？
         * 研发体验和效率
         * 跨平台的问题：通过同一套虚拟DOM对应不同平台

9. React中的“栈调和”过程是怎样的（react 15的运作机制）？

   * 调和过程与diff算法：
     * “调和”又译为“协调”，将虚拟DOM映射为真实DOM的过程
     * 调和是“使一致”的过程，Diff是“找不同”的过程
   * Diff策略的设计思想：
     * 传统的思想是进行循环递归进行树节点的一一对比 （O(n*3)）
     * diff 灵感：
       * 两个组件是同一个类型时，将拥有相同的DOM树形结构
       * 处于同一级别的一组子节点，通过设置key作为唯一标识
     * Diff算法拆分与解读：
       1. Diff算法性能突破的关键点在于“分层对比”
       2. 类型一致的节点才有继续Diff的必要性
       3. key属性的设置，可以帮助我们尽可能重用同一层级内的节点

10. setState到底是同步的还是异步的？

    * setState的表现会因为调用场景的不同而不同：

      * 在React钩子函数及合成事件中，它表现为异步
      * 在setTimeout、setInterval等函数中，包括在DOM原生事件中，它都表现为同步

    * 异步的动机和原理---批量更新的艺术：

      <img src="C:\Users\firefly-g\AppData\Roaming\Typora\typora-user-images\image-20230213222359450.png" alt="image-20230213222359450" style="zoom:33%;" />

    * 解读setState工作流：

      <img src="C:\Users\firefly-g\AppData\Roaming\Typora\typora-user-images\image-20230213222838400.png" alt="image-20230213222838400" style="zoom:33%;" />

    * 理解React中的Transaction（事务）机制：

      * Transaction是创建的一个黑盒，可以封装任何方法

11. 如何理解Fiber架构的迭代动机与设计思想？

    * 前置知识：
      * **JavaScript是单线程**的，而**浏览器是多线程**的（JavaScript线程、UI渲染线程、eventLoop线程....），而jav线程是可以操作DOM的。那么如果渲染线程和JavaScript线程同时在工作，那么渲染结果必然是难以预测的
      * 所以**JavaScript线程和渲染线程必须是互斥**的：当其中一个线程执行时，另一个只能挂起等待
      * 当渲染页面的更新长时间的等待，会造成页面卡顿

    * Stack Reconciler有根深蒂固的局限性：
      * Stack Reconciler是一个**同步**的**递归**过程----->导致JavaScript对主线程的超时占用问题
      * 栈调和机制下的Diff算法，确实是树的深度优先遍历过程
    * Fiber是如何解决问题的：
      * Fiber定义：
        * Fiber:比线程还要纤细的一个过程，即“纤程”，纤程的出现意在对渲染过程实现更加精细的控制
        * 从架构角度：Fiber是对React核心算法的重写；从编码角度：Fiber是React内部定义的一种数据结构；从工作流角度：Fiber节点保存了组件需要更新的状态和副作用；
      * Fiber的应用目的：实现“**增量渲染**”：
        * 即**<u>实现任务的可中断、可恢复、并给不同任务赋予不同的优先级</u>**，最终达成更加顺滑的体验
        * 栈调和下： Reconciler(找不同)----------->Renderer(渲染不同)
        * Fiber下：**Scheduler(调度更新的优先级)**------>Reconciler(找不同)----->Renderer(渲染不同)
        * 每个更新任务都会被赋予一个优先级，当发现B的优先级高于当前任务时，那么当前处于Reconciler层的A任务就会被中断，之后A会被重新推入Reconciler层，即“可恢复”
      * Fiber架构对生命周期的影响：
        * 由以前的： render----->停不下来的递归计算（**同步**）---->commit提交渲染
        * 变为： render----->工作单元|工作单元|工作单元...（**异步**）---->commit提交渲染

12. ReactDOM.render调用栈是怎么运行的？

    <img src="C:\Users\firefly-g\AppData\Roaming\Typora\typora-user-images\image-20230214120547095.png" alt="image-20230214120547095" style="zoom:33%;" />

13. Fiber节点的创建过程？

    * <img src="C:\Users\firefly-g\AppData\Roaming\Typora\typora-user-images\image-20230214142647895.png" alt="image-20230214142647895" style="zoom: 50%;" />

    * <img src="C:\Users\firefly-g\AppData\Roaming\Typora\typora-user-images\image-20230214143012611.png" alt="image-20230214143012611" style="zoom: 50%;" />

    * Fiber节点是如何连接的呢？

      <img src="C:\Users\firefly-g\AppData\Roaming\Typora\typora-user-images\image-20230214143516011.png" alt="image-20230214143516011" style="zoom: 50%;" />

14. completeWork的工作原理？

    * completeWork的工作内容：负责处理Fiber节点到DOM的映射逻辑
    * completeWork内部有三个关键动作：
      * 创建DOM节点（createInstance）
      * 为DOM节点设置属性（FinalizeInitialChildren）
      * 创建好的DOM节点会被赋值给workInProgress节点的stateNode属性
      * 将DOM节点插入到DOM树中（AppendAllChildren()实现,实际上是将子Fiber节点对应的DOM节点挂载到其父Fiber节点所对应的DOM节点里去）
    * completeWork是**自底向上执行**的，也就是说子节点的completeWork总是比父节点先执行

15. completeUnitOfWork------开启收集EffectList的‘大循环’

    * 针对传入的当前节点，调用completeWork()
    * 将当前节点的副作用链插入到其父节点对应的副作用链中
    * 以当前节点为起点，循环遍历其兄弟节点及其父节点（即重复以上两条逻辑）

16. 副作用链（effectList）的设计与实现？

    * 副作用链可以理解为render阶段“工作成果”的一个集合
    * Fiber节点的effectList里记录的是需要更新的后代节点
    * 把所有需要更新的Fiber节点单独串成一串链表，方便后续有针对性的进行更新，这就是“收集副作用”的过程

17. Fiber架构下的Concurrent模式（异步渲染）下的“时间切片”和“优先级”实现（**Scheduler**）

    * <img src="C:\Users\firefly-g\AppData\Roaming\Typora\typora-user-images\image-20230214151837010.png" alt="image-20230214151837010" style="zoom:33%;" />

    * current树 和 workInProgress树 双缓冲模式在Fiber架构下的实现

      * 双缓冲模式的优势：极大限度的实现Fiber节点的复用，减小性能方面的开销
      * 当current树呈现在用户眼前时，所有的更新都会由workInProgress树来承接，

    * 时间切片是如何实现的？

      * 同步模式下：workLoopSync（）

        <img src="C:\Users\firefly-g\AppData\Roaming\Typora\typora-user-images\image-20230214154001700.png" alt="image-20230214154001700" style="zoom:33%;" />

      * 异步模式下：workLoopConcurrent（）

        <img src="C:\Users\firefly-g\AppData\Roaming\Typora\typora-user-images\image-20230214154130848.png" alt="image-20230214154130848" style="zoom:33%;" />

        shouldYield()调用返回为true时，说明当前需要对主线程进行让出了

    * 优先级调用是如何是实现的？

      * 通过调用unstable_scheduleCallback来发起调度的，结合任务的优先级信息执行不同的调度

      * startTime：任务开始的时间

      * expirationTime：expirationTime越小，任务得优先级就越高

      * timerQueue：一个以startTime为排序依据的小顶堆，它存储的是startTime大于当前时间（待执行）任务

      * taskQueue: 一个以expirationTime为排序依据的小顶堆，它存储的是expirationTime小于当前时间（已过期）任务

      * unstable_scheduleCallback调度的整个过程：

        <img src="C:\Users\firefly-g\AppData\Roaming\Typora\typora-user-images\image-20230214194141855.png" alt="image-20230214194141855" style="zoom: 50%;" />

18. 特别的事件系统：React事件与原生DOM事件有什么不同？

    * 原生DOM下的事件流：

      * 一个页面往往会被绑定许许多多的事件，而页面接收事件的顺序，就是事件流

      * W3C标准规定了一个事件的传播要经历以下3个阶段：事件捕获阶段、目标阶段、事件冒泡阶段

        <img src="C:\Users\firefly-g\AppData\Roaming\Typora\typora-user-images\image-20230214195221658.png" alt="image-20230214195221658" style="zoom:33%;" />

      * 事件流下的性能优化思路：事件委托

        * 把多个子元素的同一类型的监听逻辑，合并到父元素上通过一个监听函数来管理

    * React有自成一派的事件系统：
      * 当事件在具体的DOM节点上被触发后，最终都会冒泡到document上，document上绑定的**统一事件处理程序**会将事件分发到具体的组件实例
      * **React合成事件**：react自己定义的事件对象，在底层**抹平了不同浏览器的差异**，在上层向开发者暴露**统一的、稳定的、与DOM原生事件相同的事件接口**。虽然合成事件不是原生事件，但其保留了原生DOM事件的引用
    * React事件系统工作流拆解：
      * **事件绑定**:事件的绑定是在completeWork中完成的：
        
        * <img src="C:\Users\firefly-g\AppData\Roaming\Typora\typora-user-images\image-20230214201405115.png" alt="image-20230214201405115" style="zoom: 50%;" />![image-20230214201552710](C:\Users\firefly-g\AppData\Roaming\Typora\typora-user-images\image-20230214201552710.png)
        
          
        * 为什么针对同一个事件，即使可能会存在多个回调，document也只需要注册一次监听？
          
          * 因为React最终注册到document上的，并不是某一个DOM节点上对应的具体回调逻辑，而是一个统一的事件分发函数（dispatchEvent()）
      * **事件触发**：本质上是对dispatchEvent函数的调用
        
        * <img src="C:\Users\firefly-g\AppData\Roaming\Typora\typora-user-images\image-20230214212055474.png" alt="image-20230214212055474" style="zoom: 50%;" />

19. Redux设计思想与原理？

    * Redux背后的架构思想---认识Flux架构（可以认为Redux是Flux的一种实现形式）

      * 它是一套由Facebook技术团队提出的应用架构，这套架构约束的是**应用处理数据的模式**

    * Flux：

      * View视图层：该用户界面可以是以任何形式实现出来的
      * action 动作：视图层发出的消息，可以理解为应用状态的改变
      * dispatcher派发器：负责对action进行分发
      * store数据层：存储应用状态的“仓库“，此外还会定义修改状态的逻辑
      * <img src="C:\Users\firefly-g\AppData\Roaming\Typora\typora-user-images\image-20230214214003541.png" alt="image-20230214214003541" style="zoom:33%;" />

    * Flux的核心（单向数据流）：

      * 单向数据流的好处：

        * MVC模式（双向数据流）在前端场景下的局限性：

          <img src="C:\Users\firefly-g\AppData\Roaming\Typora\typora-user-images\image-20230214214306911.png" alt="image-20230214214306911" style="zoom:33%;" />

          <img src="C:\Users\firefly-g\AppData\Roaming\Typora\typora-user-images\image-20230214214617724.png" alt="image-20230214214617724" style="zoom:33%;" />

          * 用户除了通过View触发流程之外，还可以通过Controller来触发流程

          * 实际开发中，前端框架出于交互的需要，允许View和Model直接通信

          <img src="C:\Users\firefly-g\AppData\Roaming\Typora\typora-user-images\image-20230214214809583.png" alt="image-20230214214809583" style="zoom:33%;" />

          

          * 这就出现了双向数据流，当业务复杂度过高时，会出现混乱

          

          * Redux关键要素与工作流：

          * store： 单一数据源，只读
          * action： 对变化的描述
          * reducer:负责对变化进行分发和处理，最终返回新的数据给到store

          <img src="C:\Users\firefly-g\AppData\Roaming\Typora\typora-user-images\image-20230215103302878.png" alt="image-20230215103302878" style="zoom:33%;" />

          * Redux工作流的核心：**dispatch**动作 （将action、reducer、store这三位“主角”串联起来）

          * Redux中的“发布-订阅”模式： 认识subscribe：

            * subscribe不是一个严格必要的方法，只有在需要监听状态的变化时，才会调用

          * Redux中间件实现原理：（面向切面编程思想AOP）

            * 作为createStore函数的一个（function类型的）参数

          * React中间件的工作模式：

            * 中间件的引入，会为Redux工作流带来什么样的改变？

            * 中间件的执行时机：action被分发之后，reducer触发之前

          20. 前端路由解决方案---React-Router

              * browserRouter :路由器，比如browserRouter和 hashRouter
              * Route：路由，如Route(定义路径与组件之间的映射关系) 和Switch
              * Link:导航，如Link（触发路径的改变），NavLink, Redirect

              * **路由器**根据Route定义的映射关系为新的路径匹配对应逻辑
              * 前端路由可以拦截用户的刷新操作，避免服务端盲目响应、返回不符合预期的资源内容
              * 实践思路---hash与history
                * hash模式：通过改变URL后面以“#”分隔的字符串改变路径
                * history模式：window.history.[forward() /back() /go() /pushState() / replaceState() ]

          21. react如何进行性能优化？

              * react是以组件的形式来组织逻辑的，组件允许我们将UI拆分为独立可复用的代码逻辑
              * 优化1：使用shouldComponentUpdate规避冗余的更新逻辑
              * 优化2：PureComponent+Immutable.js
                * PureComponent会在shouldComponentUpdate中对组件更新前后的props和state进行浅比较，并根据比较结果，决定是否需要继续更新
                * 浅比较的缺陷：
                  * 数据内容没变，引用变了，则浅比较会认为“数据发生了变化”，触发一次不必要的渲染
                  * 数据内容变了，引用没变，则浅比较会认为“数据没有发生变化”，导致不渲染
                * Immutable.js解决浅比较的缺陷
              * 优化3：React.memo与useMemo
                * React.memo: ”函数版“的shouldComponentUpdate/PureComponent
                * 若希望复用的是组件中的某一个或几个部分这种更加精细化的管控，就需要用到useMemo
                * **React.memo 控制是否需要重新渲染一个组件， useMemo控制是否重复执行某一段逻辑**

          22. React/React 组件的设计模式?

              * **高阶组件（HOC）**
                * 是react中用于复用组件逻辑的一种高级技巧。HOC自身不是React API的一部分，而是一种基于React的组合特性而形成的设计模式
                * 在概念上沿袭了高阶函数（**接收函数作为输入，或者输出另一个函数的一类函数**）
                * 因此，高阶组件就是参数为组件，返回值为新组件的函数
              * **Render Props**
                * 是指一种在React组件之间使用一个值为函数的prop共享代码的技术
                * 高阶组件是用**函数包裹组件**，而Render props强调用**组件包裹函数**
                * Render props的载体应该是一个React组件，工作的前提是它的子组件需要以函数的形式存在
                * <img src="C:\Users\firefly-g\AppData\Roaming\Typora\typora-user-images\image-20230215154818123.png" alt="image-20230215154818123" style="zoom:33%;" />
                * ”**开放封闭原则**“：对拓展开放，对修改封闭
              * **剥离有状态组件与无状态组件**
                * 单一职责原则：一个类或者模块应该有且只有一个改变的原因
                * 什么是有状态组件/无状态组件？
                  * 函数组件早期在没有react-hook加持，件数组件内部无法定义和维护state，因此也叫无状态组件
                * 为何要剥离有状态组件和无状态组件？
                  * 把数据处理和界面渲染这两个工作剥离开来 UI=render(data)
              * 无论是高阶组件还是Render props 都是为了弥补类组件在 ’**逻辑复用**‘这个层面的不灵活性，即这些设计模式都不能很好的解决问题
              * 由此推出**函数式编程**：
                * 使用自定义Hook去复用一段逻辑

