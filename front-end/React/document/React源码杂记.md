React源码杂记

1. 拆解ReactDOM.render调用栈——初始化阶段

   * legacyRenderSubtreeIntoContainer(null,element,container,false,callback)
     * 做的主要逻辑：
       1. 调用legacyCreateRootFromDOMContainer,创建==container._reactRootContainer==对象，并赋值给==root==
       2. 将==root==上的==_internalRoot==属性赋值给==fiberRoot==
       3. 将==fiberRoot==与方法入参一起，传入updateContainer方法，形成回调
       4. 将updateContainer回调作为参数传入，调用unbatchedUpdates
     * updateContainer方法做了什么：
       1. 请求当前Fiber节点的lane（优先级）
       2. 结合lane创建当前节点的update对象,并将其入队
       3. 调度当前节点(rootFiber)

2. 拆解ReactDOM.render调用栈——render阶段(找不同)

   * 做的逻辑：
   * 调用renderRootSync-->prepareFreshStack-->createWorkInProgress
   * 其中：createWorkInProgress调用createFiber,返回一个workInProgress,workInProgress的alternate将指向current; current的alternate将反过来指向workInProgress

   * workInProgress节点是什么？其实就是current节点，==即rootFiber的副本==

   * beginWork开启节点创建过程：

     1. beginWork的入参是一对用alternate连接起来的workInProgress和current节点
     2. beginWork的核心逻辑是根据fiber节点（workInProgress）的tag属性不同，调用不同的节点创建函数
     3. workLoopSync循环创建新的节点

   * completeWork的工作原理：

     * 负责处理Fiber节点到DOM的映射
     * 内部有三个关键动作
       1. 创建DOM节点（createInstance）
       2. 将DOM节点插入到DOM树中（AppendAllChildren)
       3. 为DOM节点设置属性（FinalizeInitialChildren）
     * 创建好的DOM节点会被赋值给workInProgress节点的stateNode属性

   * completeUnitOfWork——开启收集Effectlist的大循环

     1. 针对传入的当前节点，调用completeWork
     2. 将当前节点的副作用链插入到其父节点对应的副作用链中
     3. 以当前节点为起点，循环遍历其兄弟节点及其父节点
     4. 副作用链Effectlist可以理解为render阶段‘工作成果’的一个集合
     5. Fiber节点的effectList里记录的是其需要更新的后代节点
     6. 把所有需要更新的Fiber节点单独串成一串链表，方便后续有针对性的对它们进行更新，这就是所谓的“==收集副作用==”的过程

   * react为什么要用current树和workInProgress树？
  * 双缓冲模式
   
3. 拆解ReactDOM.render调用栈——commit阶段

   * performSyncWorkOnRoot
     1. before mutation阶段：此时DOM节点还没有被渲染到界面上去
     2. mutation阶段：负责DOM节点的渲染
     3. layout阶段：处理DOM渲染完毕后的收尾工作
     4. 它还会把fiberRoot的current指针指向workInProgress Fiber树

