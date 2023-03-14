## 前置条件
### 临界区

- 一个程序运行多线程本身没有问题
- 多个线程访问共享资源
1. 多个线程访问共享资源也没问题
2. 多个线程对共享资源读写操作时发生指令交错,就会出现问题
- 一段代码块内如果存在对共享资源的多线程读写操作，称这段代码块为临界区，其共享资源为临 

界资源
### 竞态条件
多个线程在临界区内执行，由于代码顺序序列不同而导致结果无法预测，称之为发生了竟态条件

- 阻塞解决方法： Synchronized，Lock
- 非阻塞解决方法： 原子变量
## synchronized
synchronized 同步快是 java 提供的一种原子性内置锁，java中的对个对象都可以当作一个同步锁来使用，这些java内置的使用者看不到等锁被称为内置锁，也叫做监视器
基于 Monitor机制实现，依赖底层操作系统的互斥原语Mutex（互斥量）, 它是一个重量级锁，性能较低。
1.5之后进行了优化，锁粗化，锁消除，轻量级锁，偏向锁，自适应自旋等技术来减少锁操作的开销
同步方法是通过 access_flags 中设置 ACC_SYNCHRONIZED 标志来实现;同步代码快是通过 monitorenter 和 monitorexit来实现。两个指令等的执行是JVM通过调用操作系统的斥原语mutex来实现，被阻塞的线程会被挂起来，等待重新调度，会导致 “用户态和内核态” 两个态之间来回切换，对性能影响较大。
![image.png](https://cdn.nlark.com/yuque/0/2023/png/316533/1678782247823-a16267e6-d0aa-437c-8135-202b170edd18.png#averageHue=%23c8e1c4&clientId=u410fc73f-174d-4&from=paste&height=374&id=uebebb6f0&name=image.png&originHeight=468&originWidth=793&originalType=binary&ratio=1.25&rotation=0&showTitle=false&size=247907&status=done&style=none&taskId=uc32ad2b7-6185-4e44-8fd3-baa7fbfdf13&title=&width=634.4)
### 原子性保证
synchronized 保证同一时间只有一个线程拿到锁，能够进入同步代码快
### 可见性保证
执行 synchronized 时，会对应lock原子操作回刷新共享变量的值
### 有序性
as-if-serial:
 不管编译器和CPU如何重拍序，必须保证在单线程情况下程序结果是正确的，还有就是数据依赖的也是不能重拍序的
### 可重入锁
synchronized锁对象的时候有个计数器，他会记录下线程获取锁的次数，在执行完对应的代码块之后，计数器就会-1，直到计数器清零，就释放锁了
###  不可中断
一个线程获取锁之后，另外一个线程处于阻塞或者等待状态，前一个不释放，后一个会一直阻塞或者等待，不可被中断。
## Monitor(管程/监视器)
  管程是指管理共享变量以及对共享变量操作的过程，让它们支持并发。
### MESA模型
  唤醒的时间和获取到锁继续执行的时间是不一致的，被唤醒的线程再次执行时可能条件又不满足了，所以循环检验条件。MESA模型的wait方法有一个超时参数，为了避免线程进入等待队列永久阻塞。

![image.png](https://cdn.nlark.com/yuque/0/2023/png/316533/1678782981773-149d02fd-a97e-4074-8aca-2362c24f3e71.png#averageHue=%23f9f3ed&clientId=u410fc73f-174d-4&from=paste&height=537&id=u3449ffbb&name=image.png&originHeight=671&originWidth=825&originalType=binary&ratio=1.25&rotation=0&showTitle=false&size=87563&status=done&style=none&taskId=u30ee3463-c4b9-47e2-8276-f76554f0178&title=&width=660)
### notify和notifyAll
满足以下三个条件时，可以使用notify，其余情况尽量使用notifyall

1. 所有等待线程拥有相同的等待条件
2. 所有等待线程被唤醒后，执行相同的操作
3. 只需要唤醒一个线程
### Monitor机制java实现
ObjectMonitor 数据结构如下：
```c
ObjectMonitor() {
    _header       = NULL; //对象头  markOop
    _count        = 0;  
    _waiters      = 0,   
    _recursions   = 0;   // 锁的重入次数 
    _object       = NULL;  //存储锁对象
    _owner        = NULL;  // 标识拥有该monitor的线程（当前获取锁的线程） 
    _WaitSet      = NULL;  // 等待线程（调用wait）组成的双向循环链表，_WaitSet是第一个节点
    _WaitSetLock  = 0 ;    
    _Responsible  = NULL ;
    _succ         = NULL ;
    _cxq          = NULL ; //多线程竞争锁会先存到这个单向链表中 （FILO栈结构）
    FreeNext      = NULL ;
    _EntryList    = NULL ; //存放在进入或重新进入时被阻塞(blocked)的线程 (也是存竞争锁失败的线程)
    _SpinFreq     = 0 ;
    _SpinClock    = 0 ;
    OwnerIsThread = 0 ;
    _previous_owner_tid = 0;
```
## 对象内存布局
对象在内存中存储等布局可以分为三块区域： 对象头(Header)，实例数据(Instance Data)和对齐填充(Padding)

- 对象头：hash码，对象所属年代，锁状态标志，偏向锁（线程），偏向时间，数组长度（数组对象才有）
- 实例数据：存放类的属性数据信息，包括父类的属性信息
- 对齐填充：由于虚拟机要求对象起始地址必须是8字节的倍数，填充数据不是必须存在等，仅仅是为了字节对齐。

![image.png](https://cdn.nlark.com/yuque/0/2023/png/316533/1678784638765-a07eb4c4-d935-44d6-8e9b-5afea36bffd6.png#averageHue=%23f1f1f0&clientId=u410fc73f-174d-4&from=paste&height=462&id=ua4bf3a31&name=image.png&originHeight=577&originWidth=773&originalType=binary&ratio=1.25&rotation=0&showTitle=false&size=81501&status=done&style=none&taskId=u6544d860-0178-478d-a871-be23c89afa9&title=&width=618.4)
### 对象头详解

- Mark Word：用于存储对象自身的运行时数据，如哈希码（HashCode）、GC分代年龄、锁状态标志、线程持有的锁、偏向线程ID、偏向时间戳等，这部分数据的长度在32位和64位的虚拟机中分别为32bit和64bit，官方称它为“Mark Word”
- Klass Pointer：对象头的另外一部分是klass类型指针，即对象指向它的类元数据的指针，虚拟机通过这个指针来确定这个对象是那个类的实例。
- 数组长度：如果对象是一个数组, 那在对象头中还必须有一块数据用于记录数组长度
## 用户态和内核态
我们所有的程序都是用户空间运行，进入用户运行状态也是(用户态)，但是很多操作可能涉及内核运行，比如IO，就会进入内核运行状态（内核态）

1. 用户态把一些数据放到寄存器，或者创建对应的堆栈，表明需要操作系统提供的服务
2. 用户态执行系统调用
3. CPU切换到内核态，跳转到对应的内存指定的位置执行指令
4. 系统调用处理器去读取我们先前放到内存的数据参数，并执行下个指令
5. 调用完成，操作系统重置CPU为用户态返回结果，并执行下个指令
## 锁升级场景
32位 JVM 对象结构
![image.png](https://cdn.nlark.com/yuque/0/2023/png/316533/1678791965074-9f4d5df9-eeef-4bb9-896e-215fea994ccc.png#averageHue=%234d6845&clientId=u410fc73f-174d-4&from=paste&height=150&id=u9bd95596&name=image.png&originHeight=187&originWidth=640&originalType=binary&ratio=1.25&rotation=0&showTitle=false&size=90674&status=done&style=none&taskId=u23f1634e-8d8d-4055-a0e7-abd7da7fdc9&title=&width=512)

64位JVM  对象结构
![image.png](https://cdn.nlark.com/yuque/0/2023/png/316533/1678791989270-48871a1a-ae5c-4875-9f24-6a5817806caa.png#averageHue=%235e7658&clientId=u410fc73f-174d-4&from=paste&height=170&id=u48abeef6&name=image.png&originHeight=212&originWidth=640&originalType=binary&ratio=1.25&rotation=0&showTitle=false&size=90818&status=done&style=none&taskId=u1e660f88-abb6-4e57-a72c-ed3cd21f323&title=&width=512)

锁标识位
![image.png](https://cdn.nlark.com/yuque/0/2023/png/316533/1678792032875-cdeb7a8e-0cdb-42de-8933-ef6184f63a36.png#averageHue=%23f1f1f1&clientId=u410fc73f-174d-4&from=paste&height=214&id=ub5582521&name=image.png&originHeight=268&originWidth=834&originalType=binary&ratio=1.25&rotation=0&showTitle=false&size=25337&status=done&style=none&taskId=u7eba8b5f-04ce-4b9a-8a89-23bc03b6bdc&title=&width=667.2)

锁状态变化
![image.png](https://cdn.nlark.com/yuque/0/2023/png/316533/1678792117807-69c546e1-313f-470e-becc-567d42c980c5.png#averageHue=%23f6f3f0&clientId=u410fc73f-174d-4&from=paste&height=483&id=ud554f281&name=image.png&originHeight=604&originWidth=1127&originalType=binary&ratio=1.25&rotation=0&showTitle=false&size=79632&status=done&style=none&taskId=u7fe8e48d-0842-4a0d-976f-021f3ad0640&title=&width=901.6)
### 偏向锁批量偏向&批量撤销
  从偏向锁的加锁解锁过程中可以看出，当只有一个线程反复进入一个同步快时，偏向锁带来的性能开销基本可以忽略，但是当有其他线程尝试获取锁时，就需要等于safe point时，再将偏向锁撤销为无锁状态或者升级为轻量锁，会消耗一定的性能。所以在多线程的情况下，偏向锁不仅不能提高性能，还会导致性能下降。于是就有了批量偏向锁与批量撤销的机制。
### 自旋优化
重量级锁竞争的时候，还可以用自旋来进行优化，如果当前线程自旋成功，这时当前线程就可以避免阻塞。

- 自旋会占用CPU时间，单核CPU自旋是浪费，多核CPU自旋才能发挥优势
- 在 Java 6 之后自旋是自适应的，比如对象刚刚的一次自旋操作成功过，那么认为这次自旋成功的可能性会高，就多自旋几次；反之，就少自旋甚至不自旋，比较智能。 
- Java 7 之后不能控制是否开启自旋功能

注意：自旋的目的是为了减少线程挂起来的次数，尽量避免直接挂起线程（挂起操作涉及系统调用，存在用户态和内核态切换，这才是重量级锁的开销）
### 锁粗化
假设一系列的连续操作都会对同一个对象反复加锁以及解锁，甚至加锁操作是出现在循环中的，即使没有出现线程的竞争，频繁的进行互斥同步操作也会导致不必要等性能损耗。如果JVM检测到有一连串零碎的操作都是同一个对象的加锁，将会扩大加锁同步的范围（即锁粗化）到整个操作序列等外部。
### 锁消除
锁消除即删除不必要的加锁操作。锁消除是在java虚拟机在JIT编译期间，通过运行上下文的扫描，去除不可能存在共享资源竞争的锁，通过锁消除，可以节省毫无意义的请求锁时间。
### 逃逸分析

- 逃逸分析，是一种可以有效减少java程序中同步负载和内存堆分配压力的跨函数全局数据流分析算法。通过逃逸分析，java hotspot编译器能够分析出一个新的对象的引用的使用范围从而决定是否将这个对象分配到堆上。逃逸分析的基本行为就是分析对象动态作用域。
- 方法逃逸：当一个对象在方法中被定义后，它可能被外部方法所引用，例如作为调用参数传递到其他地方中
- 线程逃避：这个对象甚至可能被其他线程访问到，例如赋值给类变量或可以在其他线程中访问的实例变量

使用逃逸分析，编译器可以对代码优化：

1. 同步省略或者锁消除。如果一个对象被发现只能从一个线程被访问到，那么对于这个对象的操作是不考虑同步的
2. 将堆分配转化为栈分配。如果一个对象在子程序中被分配，要使指向该对象的指针永远不会逃逸，对象可能是栈分配的候选，而不是堆分配
3. 分离对象 或 标量替换。有的对象可能不需要连续的内存结构存在也可以被访问到，那么对象的部分（或全部）可以不存储在内存，而是存储在CPU寄存器中
```c
-XX:+DoEscapeAnalysis  //表示开启逃逸分析 (jdk1.8默认开启）
-XX:-DoEscapeAnalysis //表示关闭逃逸分析。
-XX:+EliminateAllocations   //开启标量替换(默认打开)
```
