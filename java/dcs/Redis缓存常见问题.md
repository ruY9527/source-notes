## 缓存更新
- 定时更新，定时将底层数据库内的数据更新到缓存中，该方法比较简单，适合需要缓存的数据，不是很大的应用场景
- 过期更新：定时将缓存中过期的数据更新为最新数据并更新缓存的过期时间
- 写请求更新：在用户有写请求时先写数据库同时更新缓存，这使用于用户对缓存数据和数据库的数据有实时强制性要求的情况
- 读请求更新：在用户有读请求的时候，先判断该请求的数据是否存在或者过期，如果不存在或已过期，则进行底层数据库查询并将查询的时候更新到缓存中，将结果返回给用户
## 缓存穿透
 缓存穿透是一些无效的请求，请求到redis，mysql中都没有的数据，这些无效的请求非常多的话，还会占用系统IO，影响整个系统
解决办法：

1. 缓存空值：你要判断A在不在数据库里面,最简单的就是把A存到缓存,但是这样存,数据太大了；缓存无效的数据，会被刷爆
2. 布隆过滤器：用布隆过滤器映射A,下次查询只要先经过布隆过滤器是否存在,就可以了.(布隆过滤器用的是bit数组,用的内存很少；bitset + hash)
3. 接口检验：在正常业务流程中可能会存在少量访问不存在 key 的情况，但是一般不会出现大量的情况，所以这种场景最大的可能性是遭受了非法攻击。可以在最外层先做一层校验：用户鉴权、数据合法性校验等，例如商品查询中，商品的ID是正整数，则可以直接对非正整数直接过滤等等。根据业务来校验数据是否合法。
#### 布隆过滤器
布隆过滤器的特点是判断不存在的，则一定不存在；判断存在的，大概率存在，但也有小概率不存在。并且这个概率是可控的，我们可以让这个概率变小或者变高，取决于用户本身的需求。
布隆过滤器由 bitSet 和 一组 Hash 函数组成，是一种空间效率极高的概率型算法和数据结构，主要判断一个元素是否在集合中存在
查询流程：比如查询 "jionghui"

1. 首先将“jionghui”跟3组 Hash 函数分别计算，得到 bitSet 的下标为：1、7、10
2. 查看 bitSet 的这3个下标是否都为1，如果这3个下标不都为1，则说明该值必然不存在，如果这3个下标都为1，则只能说明可能存在，并不能说明一定存在

比如 jionghui 对应1,7,10; diaosi 对应 4,10,11; 此时查询 java 算出是 1,7,11;那么此时无法判断java 存不存在
其原因是不同的值跟hash函数计算后，可能会得到相同的的下标，所以某个值的标记位，可能也会被其它的值给标记上
这也是为啥布隆过滤器只能判断某个值可能存在，无法判断必然存在的原因。但是反过来，如果该值根据 Hash 函数计算的标记位没有全部都为1，那么则说明必然不存在，这个是肯定的。
降低这种误判率的思路也比较简单：

1. 加大bitset长度，这样不同的值出现的冲突的概率就降低了
2. 提升hash函数的个数，hash函数越多，每个值对应的bit越多

![](https://cdn.nlark.com/yuque/0/2023/webp/316533/1678979757597-6fb5b8df-7aad-40ff-9739-761b482842cf.webp#averageHue=%23e1ebde&clientId=u4828899d-28ea-4&from=paste&id=Rg8m2&originHeight=268&originWidth=596&originalType=url&ratio=1&rotation=0&showTitle=false&status=done&style=none&taskId=u92f6141c-cc64-4ef9-ab5d-23c50e7df06&title=)

## 缓存击穿
缓存击穿，一些key在接受请求的时候，突然失效了，会打到mysql上，如果这些key是热点key，可能会把数据库打挂掉
解决方法:

1. 加互斥锁，注意此时的锁颗粒度，最小颗粒度优化。在并发的多个请求中，只有第一个请求线程能拿到锁并执行数据库查询操作，其它的线程拿不到锁就阻塞，等到第一个线程将数据写入缓存后，直接走缓存
2. 热点数据不过期；直接将缓存设置为不过期，然后定时任务异步加载数据，更新缓存

## 缓存雪崩
大量的热点key设置了相同的过期时间，导致缓存在同一时刻全部失效，造成瞬间数据库请求量大，压力骤增，引起雪崩，然后后续请求打入db，可能会被打挂掉
缓存雪崩其实有点像“升级版的缓存击穿”，缓存击穿是一个热点 key，缓存雪崩是一组热点 key
解决方法：

1. 过期时间打散：既然是大量缓存集中失效，那最容易想到就是让他们不集中生效。可以给缓存的过期时间时加上一个随机值时间，使得每个 key 的过期时间分布开来，不会集中在同一时刻失效
2. 热点数据不过期：该方式和缓存击穿一样，也是要着重考虑刷新的时间间隔和数据异常如何处理的情况
3. 加互斥锁：该方式和缓存击穿一样，按 key 维度加锁，对于同一个 key，只允许一个线程去计算，其他线程原地阻塞等待第一个线程的计算结果，然后直接走缓存即可
## 缓存数据一致性
### 查询通用流程
缓存设计模式（Cache Aside Pattern） 中的一种
![](https://cdn.nlark.com/yuque/0/2023/webp/316533/1678981045069-51f91868-f375-4941-a843-8613963858ed.webp#averageHue=%23f8f8f5&clientId=u4828899d-28ea-4&from=paste&id=u2333a9a0&originHeight=514&originWidth=343&originalType=url&ratio=1&rotation=0&showTitle=false&status=done&style=none&taskId=ucf62b98b-0024-46ca-932f-21307522e0b&title=)

次流程会引出两个问题：

1. 为什么先操作数据库，可以先操作缓存嘛？
2. 为什么是失效缓存，可以更新缓存嘛？
### 先操作数据库
场景，有2个并发，一个写请求，一个读请求
脏数据范围：更新数据库后，失效缓存前。这个时间范围很小，通常不会超过几毫秒
![](https://cdn.nlark.com/yuque/0/2023/webp/316533/1678981422161-c9e9e5b7-2a86-4fad-a872-c8f023aab365.webp#averageHue=%23f7f7f6&clientId=u4828899d-28ea-4&from=paste&id=u6674ba0d&originHeight=435&originWidth=565&originalType=url&ratio=1&rotation=0&showTitle=false&status=done&style=none&taskId=u6b3a29db-df53-4257-ac01-1583e464cb6&title=)
### 先操作缓存
场景，有2个并发，一个写请求，一个读请求
脏数据时间范围：更新数据库后，下一次对该数据的更新前，这个时间范围不确定性很大，情况如下：

1. 如果下一次对该数据的更新马上来，那么会失效缓存，脏数据的时间很短
2. 如果下一次对该数据的更新要很久才到来，那这期间缓存保存的一直是脏数据，时间范围很长。

![](https://cdn.nlark.com/yuque/0/2023/webp/316533/1678981539859-80e90b5e-aa5c-4cf5-8e41-6d6e66cd5563.webp#averageHue=%23f6f5f5&clientId=u4828899d-28ea-4&from=paste&id=u7daa2ef7&originHeight=626&originWidth=562&originalType=url&ratio=1&rotation=0&showTitle=false&status=done&style=none&taskId=ua2f2b43f-8f72-4de2-9834-2ce541c1bc4&title=)

小总结： 无论是先操作数据库还是先操作缓存都会存在脏数据的情况下。但是相比之下，先操作数据库，再操作缓存是更优的方式，即使在极端情况下，也只会出现很小的脏数据。
### 更新缓存
场景：有2个并发的写请求
数据库中的数据是请求B的，缓存中的数据是请求A的，数据库和缓存中数据不一致
![](https://cdn.nlark.com/yuque/0/2023/webp/316533/1678981934196-2404e651-4114-4611-8a4f-7d5a4d2c1028.webp#averageHue=%23f6f5f4&clientId=u4828899d-28ea-4&from=paste&id=u473476d7&originHeight=471&originWidth=566&originalType=url&ratio=1&rotation=0&showTitle=false&status=done&style=none&taskId=u8b13dce0-3d75-4f95-977b-0fcdf7415d9&title=)

### 失效缓存
场景：有2个并发的写请求
由于是删除缓存，所以不存在不一致的情况
![](https://cdn.nlark.com/yuque/0/2023/webp/316533/1678982106794-718af989-4d6b-4110-a533-3ebe9ada8334.webp#averageHue=%23f6f5f4&clientId=u4828899d-28ea-4&from=paste&id=u2dd68aa7&originHeight=465&originWidth=555&originalType=url&ratio=1&rotation=0&showTitle=false&status=done&style=none&taskId=ua86c7ef8-44bd-4ce7-81a2-b294176f4c5&title=)
### 如何保证数据一致性
无论是先操作数据库还是先操作缓存，都会存在脏数据的情况。
由于数据库和缓存是2个不同的数据源，要保证其数据一致性，其实就是典型的分布式事务场景，引入分布式事务解决，常见的有：2PC、TCC、MQ事务消息等
引入分布式事务必须会带来性能上的影响，这与当初我们引入缓存来提升性能的目的是相违背的
在实际使用中，通过不会去保证缓存和数据库的强一致性，而是做出一定的牺牲，保证二者的最终一致性。
![](https://cdn.nlark.com/yuque/0/2023/webp/316533/1678982335542-22dc8954-a827-4e3f-93d0-699c623186c3.webp#averageHue=%23f9f7f4&clientId=u4828899d-28ea-4&from=paste&id=u3e6e3e62&originHeight=517&originWidth=553&originalType=url&ratio=1&rotation=0&showTitle=false&status=done&style=none&taskId=u2e2df0a1-ff97-4f94-aae0-db1c55099bf&title=)
### 一致性思路
![image.png](https://cdn.nlark.com/yuque/0/2023/png/316533/1678982411657-86d43136-1c19-4dde-974b-7e7d07e40b4a.png#averageHue=%23f6f5f5&clientId=u4828899d-28ea-4&from=paste&height=916&id=u3c5d7e49&name=image.png&originHeight=916&originWidth=832&originalType=binary&ratio=1&rotation=0&showTitle=false&size=192041&status=done&style=none&taskId=u2cd4170b-5a69-4140-bff5-96c1586f1c0&title=&width=832)
![image.png](https://cdn.nlark.com/yuque/0/2023/png/316533/1678982419682-cf1a7cff-5d18-41d3-8dda-cfe342a96a02.png#averageHue=%23f7f7f7&clientId=u4828899d-28ea-4&from=paste&height=754&id=u55614099&name=image.png&originHeight=754&originWidth=862&originalType=binary&ratio=1&rotation=0&showTitle=false&size=162216&status=done&style=none&taskId=ufa374cdc-caba-49d8-87fe-cf4068ba6ec&title=&width=862)
![image.png](https://cdn.nlark.com/yuque/0/2023/png/316533/1678982428857-03a1d370-a475-4a35-81c4-f7758c12b4e1.png#averageHue=%23f9f8f7&clientId=u4828899d-28ea-4&from=paste&height=569&id=u36c61d82&name=image.png&originHeight=569&originWidth=1287&originalType=binary&ratio=1&rotation=0&showTitle=false&size=297595&status=done&style=none&taskId=ue9b36861-f8bc-4f8f-ab9b-dcd98672e6a&title=&width=1287)

1. 延迟双删策略 - 会导致系统的吞吐量下降，所有的操作都延迟一点（坚决不用）
2. 阅binlog日志,发生变更的时候推送到MQ,用MQ去消费删除缓存数据，可以使用阿里的canal将binlog日志采集发送到MQ队列里面，然后通过ACK机制确认处理这条更新消息，**删除缓存(注意是删除缓存,而不是更新**)，保证数据缓存一致性
3. 被动更新缓存,(时效性一般的数据适合 , 因为时效性一般的数据, 错了问题也不大,不花额外资源去修正他 , 让它到期了再重新缓存新数据)
4. **读写锁(CAP中,短暂实现CP,能保证强一致性,不会发生数据一致性错乱问题, 写锁释放之后,继续保持AP,仍有高可用), 完美**
5. **每天某个时间点job更新**
6. **延迟校验：更新一个消息的时候，发送一条1分钟后延迟的MQ消息，这条MQ消息做的时间是校验现在数据库的值和改的那时相不相同，不同的话就更新缓存**
## 大key
### 什么是大key

- 一个STRING类型的Key，它的值为5MB（数据过大）
- 一个LIST类型的Key，它的列表数量为20000个（列表数量过多）
- 一个ZSET类型的Key，它的成员数量为10000个（成员数量过多）
- 一个HASH格式的Key，它的成员数量虽然只有1000个但这些成员的value总大小为100MB（成员体积过大）

需要注意的是，在以上的例子中，为了方便理解，我们对大Key的数据、成员、列表数给出了具体的数字。为了避免误导，在实际业务中，大Key的判定仍然需要根据Redis的实际使用场景、业务场景来进行综合判断
### 大key危害

1. 内存不均：单value较大时，可能会导致节点之间的内存使用不均匀，间接的影响key的部分和负载不均匀
2. 阻塞请求：redis作为单线程，单value较大读写需要较长的时间处理，会阻塞后续的请求处理
3. 阻塞网络：单value较大会占用服务器网卡较多宽带，可能会影响该服务器上的其它redis实例或者应用
### 大key场景

1. 单个简单的key存储的value过大
2. hash，set，zset，list存储的元素过多
### 大key删除

1. 异步删除，先把key清了
2. value丢到LRU队列尾部
3. 然后fork线程去异步删除value

好处： 如果异步线程挂了，LRU列队下次会清除，由于key已经删了，其他人get不到，不影响使用
### 大key解决方法

- 尽可能的拆分key，根据业务来设计或者打散
## 热key
### 什么是热key
在某个Key接收到的访问次数、显著高于其它Key时，我们可以将其称之为热Key，常见的热Key如：
某Redis实例的每秒总访问量为10000，而其中一个Key的每秒访问量达到了7000（访问次数显著高于其它Key）
### 热key的危害

- 热key占用大量的redis CPU时间是其性能变差并影响其它请求
- Redis Cluster中各node流量不均衡造成Redis Cluster的分布式优势无法被Client利用，一个分片负载很高而其它分片十分空闲从而产生读/写热点问题
- 抢购、秒杀活动中，由于商品对应库存Key的请求量过大超出Redis处理能力造成超卖
- 热Key的请求压力数量超出Redis的承受能力造成缓存击穿，此时大量强求将直接指向后端存储将其打挂并影响到其它业务
### 发现热key

1. monitor指令：它的缺点同样为不可定制化输出报告，大量的信息会使你在分析结果时复杂度较大，另外，使用该方案的前提条件是将redis-server的maxmemory-policy参数设置为LFU
### 热key处理方式

- 使用读写分离架构： 多个节点分担读写压力
