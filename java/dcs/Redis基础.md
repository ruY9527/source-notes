![image.png](https://cdn.nlark.com/yuque/0/2023/png/316533/1678967588681-4e1bcbfe-264b-4db3-bc50-ec138da9994c.png#averageHue=%23f3f3f3&clientId=u80011aa0-31fb-4&from=paste&height=2949&id=uc2fd7657&name=image.png&originHeight=3686&originWidth=2526&originalType=binary&ratio=1.25&rotation=0&showTitle=false&size=2996431&status=done&style=none&taskId=u10426fda-9b22-44e5-9937-087ce359606&title=&width=2020.8)
## redis结构
高性能主线： 线程模型，数据结构，持久化
网络框架：高可靠主线，包括主从复制，哨兵机制
高可扩展主线：数据分片，负载均衡

Redis是一种运行速度很快，并发很强的跑在内存上的NOSQL数据库

1. 基于内存运行，CPU不是瓶颈，所以不用多线程，单线程实现简单，瓶颈在于内存
2. 支持8种数据结构
3. 支持分布式，理论上可以无线扩充，cluster集群模式
4. key-value存储模式
5. 可持久化文件
6. 最多每秒可以处理10w+请求

![image.png](https://cdn.nlark.com/yuque/0/2023/png/316533/1678967666684-02a95b09-dd68-4244-b8e0-14ae81c72b66.png#averageHue=%23f6f2e4&clientId=u80011aa0-31fb-4&from=paste&height=901&id=ue907ae89&name=image.png&originHeight=1126&originWidth=2001&originalType=binary&ratio=1.25&rotation=0&showTitle=false&size=406806&status=done&style=none&taskId=u3ce33f73-3af5-4637-9049-911b26edf7c&title=&width=1600.8)

![image.png](https://cdn.nlark.com/yuque/0/2023/png/316533/1678967748487-78b01b4f-5007-4635-ab6d-f555392f1301.png#averageHue=%23dbd1c2&clientId=u80011aa0-31fb-4&from=paste&height=1229&id=u167403d9&name=image.png&originHeight=1536&originWidth=2048&originalType=binary&ratio=1.25&rotation=0&showTitle=false&size=1680634&status=done&style=none&taskId=u182d4cd1-8d25-49f5-b719-e400df1ea76&title=&width=1638.4)
## redis为什快

1. 完全基于内存，绝大部分请求是纯粹的内存操作，非常快速。数据存在内存中，类似HashMap，HashMap的优势就是查找和操作的时间复杂度都是O(1)
2. 数据结构使用高效，Redis中的数据结构专门进行设计，并且操作的时间复杂度较低
3. 采用单线程，避免了不必要的上下文切换和竞态条件，也不存在多进程或多线程导致的切换而消耗CPU，不用去考虑各种锁的问题，不存在加锁释放锁操作，没有因为可能出现死锁而导致的性能消耗;redis的IO模型是: client -> io多路复用 --> 事件分发器 --> 事件处理器
4. 使用 io 多路复用，非阻塞IO
5. 使用底层模型不同，它们之间底层实现方式以及客户端之间通信的应用协议不一样，redis直接自己构建 VM 机制，因为有一些系统函数效率不高，内核态转换代价太高，会浪费一定的时间去移动和请求

6.0 版本之后的多线程
Redis一直是多线程的，只是执行命令的事件处理器是单线程，所以线程安全
6.0之前网络处理器也是单线程，6.0之后处理网络，删除key的部分功能改成了异步线程去操作的
## Redis过期策略
### 过期key删除策略

1. 惰性删除： 一个key过期后并不会直接删除，而是等到该key再次访问时，才执行删除，惰性删除对内存不友好，但是对CPU友好。只有到key被访问了，我们才会去判断key是否过期，过期就直接删除key，返回nil。但是如果有key长时间没有被访问到，内存就一直被占用
2. 定期删除：多少秒去遍历下内存里面的key，如果过期了删除(核心在于不要去影响性能，时间不宜过长，次数不宜过多)

定期删除时会遍历每个database(默认16个)，检查当前库中指定个数的key(默认是20个)。 
随机抽查这些key，如果有过期的，就删除。 
程序中有一个全局变量记录到秒到了哪个数据库

3. 定时删除： 绑定一个定时器，这个定时器会在时间到的时候，把这个key从内存中删除

定时删除是对内存最友好的，但是对cpu不友好。键只要一过期，我们就立马去删除key，释放内存空间。但是这意味着cpu需要不断的去遍历所有的key，来判断对方有没有过期

总结： redis最终采用 惰性删除 + 定期删除 的方式搭配使用，从库不会主动执行定期删除等策略
### 内存淘汰策略

1. volatile-lru： 从已设置过期时间的key中，移出最近最少使用的key进行淘汰
2. volatile-ttl：  从已设置过期时间的key中，移除将要过期的key
3. volatile-random： 从已设置过期的key中，随机选择key淘汰
4. allkeys-lru： 从key中选择最近最少使用的进行淘汰
5. allkeys-random： 从key中选择key进行淘汰
6. noeviction： 当内存达到阈值的时候，新写入的操作报错
## Redis分布式锁
### 指令加锁
**set key value PX milliseconds NX**
**参数意义如下：**
key、value：键值对 
PX milliseconds：设置键的过期时间为 milliseconds 毫秒。 
NX：只在键不存在时，才对键进行设置操作。SET key value NX 效果等同于 SETNX key value。 
PX、expireTime 参数则是用于解决没有解锁导致的死锁问题。因为如果没有过期时间，万一程序员写的代码有 bug 导致没有解锁操作，则就出现了死锁，因此该参数起到了一个“兜底”的作用。 
NX 参数用于保证在多个线程并发 set 下，只会有1个线程成功，起到了锁的“唯一”性。

为了防止死锁，我们会给分布式锁加一个过期时间，但是万一这个时间到了，我们的业务逻辑还没处理完怎么办？
首先，我们在设置过期时间时要结合业务场景去考虑，尽量设置一个比较合理的值，就是理论上正常处理的话，在这个过期时间内是一定能处理完毕的
### Redission
锁上成功后，分线程时不时看锁还在不在，主要主线程不删除，会一直加时间
![image.png](https://cdn.nlark.com/yuque/0/2023/png/316533/1678977744882-f1908718-1a29-4aff-845a-4feb712ea135.png#averageHue=%23f9f8f5&clientId=u5b4f7120-8eb1-4&from=paste&height=665&id=ub58a02a0&name=image.png&originHeight=665&originWidth=1022&originalType=binary&ratio=1&rotation=0&showTitle=false&size=225774&status=done&style=none&taskId=u68916ee9-f4ef-4af8-a533-3ea079c6c09&title=&width=1022)

加锁使用lua脚本来完成，lua脚本保证原子性
![image.png](https://cdn.nlark.com/yuque/0/2023/png/316533/1678977851707-ff58ec71-de75-4e77-a73d-218be70edb69.png#averageHue=%23402e25&clientId=u5b4f7120-8eb1-4&from=paste&height=492&id=u8a69e070&name=image.png&originHeight=492&originWidth=1261&originalType=binary&ratio=1&rotation=0&showTitle=false&size=412028&status=done&style=none&taskId=u28dad26c-7596-431c-b253-5c9cb262d4c&title=&width=1261)

判断主线程的锁还不在
![image.png](https://cdn.nlark.com/yuque/0/2023/png/316533/1678977922817-af4ac2d6-e127-47b6-baf7-0ad8ea3ba6a3.png#averageHue=%2323201f&clientId=u5b4f7120-8eb1-4&from=paste&height=659&id=uae7900a3&name=image.png&originHeight=659&originWidth=1142&originalType=binary&ratio=1&rotation=0&showTitle=false&size=419635&status=done&style=none&taskId=ub82df3d5-6863-4bf8-8469-b6e32471844&title=&width=1142)

总结redis分布式锁续命如何实现：

1. 首先尝试加锁时，加锁返回值为一个RFuture，RFuture添加了一个futurelistener的回调，等待加锁操作的结果
2. 加锁操作成功后，如果加锁成功，那么就会开启续命逻辑，续命逻辑是一个timeout方法
3. timeout时间到则运行run方法，run方法内部通过lua脚本给其续命
4. 续命操作同样返回值为一个RFuture，RFuture添加了一个futurelistener的回调，等待续命结果
5. 续命如果成功，接着调用timeout方法，实现循环续命
### 分布式锁优化

1. 分段锁，分开存储一部分数据
2. 锁的颗粒度，尽量低，像银行这种，同1个银行卡或者ID使用一个锁

## Redis的delete指令

1. 如果删除String类型的话，时间复杂度是O(1),单个字符串(BigKey也会阻塞)
2. 如果删除的是List,Set,Hash集合类型，时间复杂度是O(N).n是集合内有多少个元素数量
3. 返回值：被删除了多少个元素
4. 如果删除的元素非常大，可能会造成阻塞，大Key的删除会额外有线程去异步删除
