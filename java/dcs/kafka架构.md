## 架构图
- producer： 生产者，消息的产生者。
- Broker： broker是kafka实例，每个服务器上有一个或多个kafka实例，理想情况下，每个broker对应一台服务器。比如broker-0,broker-1,broker-2分别是不重复等编号
- Topic：消息的主题，可以理解为消息分类，kafka的数据就保存在topic里。每个broker可以创建多个topic
- Partition：Topic的分区，每个topic有多个分区，分区的作用是负载，提高kafka的吞吐量。同一个topic在不同的分区数据是不重复等，每个partition的表形式就是一个一个文件夹
- Replication：每个分区都有副本，副本的作用是备胎。当主分区(Leader)故障的时候会选择一个Follower上位，成为Leader。
- Message：每一条消息的主题
- Consumer：消费者，消息的消费方
- ConsumerGroup：将多个消费者组成一个消费者，同一个分区的数据只能被消费者组中的某一个消费者消费。同一个消费者组的消费可以消费同一个topic的不同分区的数据，提供kafka的吞吐量
- Zookeeper：Kafka集群依赖zookeeper来保存集群的元数据，来保证系统的可用性

![image.png](https://cdn.nlark.com/yuque/0/2023/png/316533/1678946884657-a4131bbb-4de4-4417-9271-855c70272c57.png#averageHue=%23eae4c0&clientId=u566a98c0-54a2-4&from=paste&height=562&id=uf1a68ec8&name=image.png&originHeight=703&originWidth=1080&originalType=binary&ratio=1.25&rotation=0&showTitle=false&size=197590&status=done&style=none&taskId=u31260a44-8336-48c3-8e94-a0c98e0e03f&title=&width=864)
## 工作流程分析
### 高性能

- 顺序读写磁盘 ： 持久化消息的时候，仅仅是将消息追加到日志文件的结尾，也就是磁盘顺序写，性能极高
- MMap内存映射技术
- 零拷贝技术
- 数据批处理

![image.png](https://cdn.nlark.com/yuque/0/2023/png/316533/1678950833906-77e76de1-a1e0-41f1-818d-0e77fc6254a5.png#averageHue=%23e6e6e6&clientId=u8567aee7-ea27-4&from=paste&height=382&id=uf3e6ad6e&name=image.png&originHeight=477&originWidth=993&originalType=binary&ratio=1.25&rotation=0&showTitle=false&size=229148&status=done&style=none&taskId=u7f10b1f5-46c4-4847-a617-ce358a9eb52&title=&width=794.4)
#### MMap内存映射
MMap就是内存映射文件，在64位操作系统中一般可以表示20G的数据文件，它的工作原理是直接利用操作系统的Page来实现文件到物理内存的直接映射，完成映射之后对物理内存的操作会被同步到磁盘上
通过MMap技术，进程可以像读写磁盘一样读写内存（逻辑内存），不必关心内存的大小，因为有虚拟内存兜底。这种方式可以极大的提升IO能力，省去了数据从用户空间到内核空间的复制开销
注意：MMap中的数据并没有真正的写入到磁盘，操作系统会定时定时刷盘操作，将Page Cache的数据flush到磁盘。kafka提供 producer.type 参数来控制是否同步刷盘
![image.png](https://cdn.nlark.com/yuque/0/2023/png/316533/1678951168446-b2d8d6b5-f728-480c-a9e8-71b1bb9d1069.png#averageHue=%23efefee&clientId=u8567aee7-ea27-4&from=paste&height=476&id=ufe6602fb&name=image.png&originHeight=595&originWidth=1080&originalType=binary&ratio=1.25&rotation=0&showTitle=false&size=280278&status=done&style=none&taskId=ucc9a93eb-24a8-4ab2-9508-5852dae2eb7&title=&width=864)
#### 零拷贝
consumer消费消息时，会请求kafka broker从磁盘文件里读取消息，然后通过网络发送出去，整个过程涉及零拷贝
kafka broker利用linux的sendfile函数，直接将读取操作交给os，os会查看Page Cache中是否有数据，如果没有就从磁盘上读取并缓存到Page Cache，如果有就直接将Os Cache里的数据拷贝给网卡引擎，这样减少了上下文切换和数据复制的开销
![image.png](https://cdn.nlark.com/yuque/0/2023/png/316533/1678951666114-344605a0-070e-4c1d-af28-6ba1fa9e4235.png#averageHue=%23f7f7f7&clientId=u8567aee7-ea27-4&from=paste&height=614&id=u2673ca8d&name=image.png&originHeight=767&originWidth=1218&originalType=binary&ratio=1.25&rotation=0&showTitle=false&size=39625&status=done&style=none&taskId=u19093e2c-e43b-414d-a94e-f3bfee5c901&title=&width=974.4)
#### 数据批处理
当Consumer需要消费数据时，首先想到的是消费一条，Kafka发送一条。但实际上，Kafka 会把一批消息压缩存储，当消费者拉取数据时，实际上是拉到一批数据。比如说100万条消息压缩放到一个文件中可能就是10M的数据量，如果消费者和Kafka之间网络良好，10MB大概1秒就能发送完，即Kafka每秒处理了100万条消息。
正是因为这种批处理的方式，Kafka才有了极高的吞吐量。
###  发送数据
producer写入数据的时候永远找leader，不会直接将数据写入follower
消息写入leader后，follower是主动的去leader进行同步的
![image.png](https://cdn.nlark.com/yuque/0/2023/png/316533/1678947643423-ec201e02-e0f9-4081-951a-3839b85f9085.png#averageHue=%23f5e4d7&clientId=u566a98c0-54a2-4&from=paste&height=388&id=uae211a03&name=image.png&originHeight=485&originWidth=1080&originalType=binary&ratio=1.25&rotation=0&showTitle=false&size=114775&status=done&style=none&taskId=u33e09d50-9f4a-462b-ab99-d6b5ffaf0ab&title=&width=864)

写入分区，分区的好处

- 方便扩展：一个topic可以有多个partition，通过扩展机器去轻松的应对日益增长的数据量
- 提高并发：以partition为读写单位，可以多个消费者同时消费数据，提高了消息的处理效率

写入partition原则

- partition在写入的时候可以指定需要写入的partition，如果有指定，则写入对应的partition
- 如果没有指定partition，但是设置了数据的key，则会根据key的值hash出一个partition
- 即没有指定partition，也没有设置key，则会轮询选出一个partition

写入消息的ack机制

- 0代表producer往集群发送数据不需要等到集群的返回，不确保消息发送成功。安全性最低但是效率最高
- 1代表producer往集群发送消息只要leader应答就可以发送下一条，只确保leader发送成功
- all代表producer往集群发送数据需要所有的follower都完成从leader的同步才回发送下一条，确保leader发送称该和所有的副本都完成备份。安全性最高，但是效率最低

![image.png](https://cdn.nlark.com/yuque/0/2023/png/316533/1678947832654-9d5da942-914c-4af3-ba71-a1bd72ccf691.png#averageHue=%23e3f4f4&clientId=u566a98c0-54a2-4&from=paste&height=411&id=u64d73cdc&name=image.png&originHeight=514&originWidth=1080&originalType=binary&ratio=1.25&rotation=0&showTitle=false&size=76507&status=done&style=none&taskId=u03b0e199-6a57-4969-bd0a-106945b1299&title=&width=864)
### 保存数据
kafka初始化会单独开辟一块磁盘空间，顺序写入数据（效率比随机写入高）。
#### partition结构
partition在服务器上的表现形式就是一个一个文件夹，每个partition文件夹下面会有多组segment文件，每组segment文件又包含 .index文件 , .log文件,.timeindex文件三个文件。
log文件实际存储message的地发
index 和 timeindex 文件成为检索文件，用于检索消息
文件的命名是以该segment最小的offset来命名的，如00000.index存储等是 0~368795 的消息，kafka就是利用分段+索引的方法来解决查找效率的问题
![image.png](https://cdn.nlark.com/yuque/0/2023/png/316533/1678948525200-ce7da806-6ad7-4c6b-9301-088769027644.png#averageHue=%23bbebeb&clientId=u566a98c0-54a2-4&from=paste&height=340&id=uaafed9ff&name=image.png&originHeight=425&originWidth=514&originalType=binary&ratio=1.25&rotation=0&showTitle=false&size=82422&status=done&style=none&taskId=u7365d036-3513-49e1-985b-9793a43ed77&title=&width=411.2)
#### Message结构
log文件就实际存储message地方，我们在producer往kafka写入的也是一条一条的message，那存储log中的message是什么样子？消息主要包含消息体，消息大小，offset，压缩类型等

- offset： offset是一个占8字节的有序id号，它可以唯一确定每条消息在partition内的位置
- 消息大小：消息大小占4byte，用于描述消息的大小
- 消息体：消息体存放的是实际的消息数据（被压缩过），占用的空间根据具体的消息而不一样
#### 存储策略

- 基于时间：默认配置是7天
- 基于大小：默认配置是1073741824
### 消费消息
consumer存在两种消费模型：

- push：优势在于消息实时性高。劣势在于没有考虑consumer消费能力和饱和情况，容易导致producer压跨consumer情况
- pull：优势在可以控制消费速度和消费数量，保证consumer不会出现饱和。劣势在于当没有数据，会出现空轮询，消耗cpu

kafka是采用pull模式，消费者主动的去kafka集群拉取消息，与producer相同的是，消费者在拉取消息也是找leader去拉取的
多个消费者可以组成一个消费组，每个消费组都有一个组id，同一个消费者组的消费者可以消费同一个topic下不同分区的数据，但是不会组内多个消费者消费同一个分区的数据
图示是消费者组内的消费者小于partition数量的情况，所以会出现某个消费者消费多个partition数据的情况，消费的速度也就不及只处理一个partition的消费者的处理速度！如果是消费者组的消费者多于partition的数量，那会不会出现多个消费者消费同一个partition的数据呢？上面已经提到过不会出现这种情况！多出来的消费者不消费任何partition的数据。所以在实际的应用中，**建议消费者组的consumer的数量与partition的数量一致**！
![image.png](https://cdn.nlark.com/yuque/0/2023/png/316533/1678949329040-5d02a9bd-c08c-4af1-bd2e-af1429c8a4a5.png#averageHue=%23eaeabc&clientId=u566a98c0-54a2-4&from=paste&height=324&id=u9faf9780&name=image.png&originHeight=405&originWidth=1080&originalType=binary&ratio=1.25&rotation=0&showTitle=false&size=84304&status=done&style=none&taskId=ua9671804-04ff-49dc-b2fa-511fdecbd97&title=&width=864)
### 查找消息
查找消息的时候，是怎么利用 sagment + offset配合查找的？
假设我们查找一个 offset为368801的message

1. 先找到offset为368801的segment（二分查找）
2. 从segment中的.index文件（也就是368796.index文件，该文件起始偏移量为368796+1，我们要查找的offset为368801的message在该index内的偏移量为368796+5=368801，所以这里要查找的相对offset为5）。由于该文件采用的是稀疏索引的方式存储着相对的offset及对应message物理偏移量的关系，所以直接找相对的offset为5的索引（同样二分查询）
3. 根据 2 中的offset确定message存储的物理位置，开始顺序扫描找到对应的message

这套机制是建立在offset为有序的基础上，利用 segment + 有序offset + 稀疏索引 + 二分查询 + 顺序查找等多种手段来高效查找数据
![image.png](https://cdn.nlark.com/yuque/0/2023/png/316533/1678949636417-6a3de7c9-57f0-4611-92c0-04cecf6d0666.png#averageHue=%23bae78d&clientId=u566a98c0-54a2-4&from=paste&height=284&id=ue5d574fb&name=image.png&originHeight=355&originWidth=1080&originalType=binary&ratio=1.25&rotation=0&showTitle=false&size=143096&status=done&style=none&taskId=ufd6a6fdc-f8f2-4e31-9a24-5cc1b096315&title=&width=864)
## 数据同步
### ISR/OSR
每个分区的follow副本都会从leader同步消息，既然是同步，就一定会有滞后性。

- AR(Assigned Replicas)：在kafka中，分区中的所有副本（包含leader）统称AR
- ISR(On-Sync Replicas)：所有与leader保持一定程度同步的副本（包括leader在内）组成ISR
- OSR(Out-of-Sync Replicas)：与Leader副本同步滞后过多的副本（不包括leader副本）组成OSR

AR = ISR + OSR
leader负责维护和跟踪ISR集合中所有follower副本的滞后状态(Leader会维护每个Follower的LEO，Follower来拉取消息时会带上自己的LEO)，当follow副本落后太多或者失效时，leader会把它从ISR集合中剔除，转移到OSR。默认情况下，当leader副本发生故障时，只有在ISR集合中的副本才有资格被选举新的leader
### HW/LEO

- HW（High Watermark高水位）：标识了一个特定的消息偏移量（offset），消费者只能拉取到这个offset之前的数据。保证消费数据的一致性和副本数据的一致性。
- LEO（Log End Offset）：标识了当前日志文件中的下一条写入消息的offset

![image.png](https://cdn.nlark.com/yuque/0/2023/png/316533/1678952395242-ce37216d-a91a-4ded-9bc0-6d56d1fea191.png#averageHue=%23f7f7f7&clientId=u8567aee7-ea27-4&from=paste&height=401&id=u1b239895&name=image.png&originHeight=501&originWidth=1019&originalType=binary&ratio=1.25&rotation=0&showTitle=false&size=322134&status=done&style=none&taskId=u8227df86-be09-4bd9-9795-cf5b8e2448f&title=&width=815.2)
ISR集合中每个副本都会维护自身的LEO，而ISR集合中最小的LEO即为这个分区的HW，对于消费者而言，只能消费HW之前的消息
### ISR
0.11.x 版本时，kafka 引入 Leader Epoch 机制，大致可以理解为每个leader的版本号，以及自己都是从offset开始写数据，类似[epoch=0,offset=0]
#### replica.lag.max.messages
0.9.x之前版本，kafka broker有一个核心参数， replica.lag.max.messages，默认是4000,表示如果follow落后Leader的消息数量超过了这个参数值，就认为follow是out-of-sync，就会从isr列表中移除
replica.lag.max.messages 这一机制，在瞬间高并发访问的情况下会出现问题：比如Leader瞬间接受到几万条消息，然后所有的follower还没来得及同步过去，此时所有的follower都会被剔除isr，然后同步完了，又再加入isr列表
#### replica.lag.time.max.ms
0.9.x开始，引入 replica.lag.max.ms 参数，默认值为 10 秒，表示如果某个 follower的LEO一直落后Leader超时了10秒，那么才判定这个follower是out-of-sync，会从ISR中移除
这样的话，即使出现瞬间的流量洪峰，一下子导致几个Follower都落后了不少数据，但是只要在限定的时间内尽快追上来，别一直落后，就不会认为是_**out-of-sync**_
#### 同步数据慢原因

1. follower所在的机器性能变差，比如网络负载过高，IO负载过高，CPU负载过高
2. follower所在机器的kafka broker进程出现卡顿，常见的发生了full gc
3. 动态添加partition的副本，此时新加入的follower会拼命从leader上同步数据，但是这个是需要时间的，所以如果参数配置不当，会导致生产者等待同步完成
### follower故障
follower发生故障后会被临时踢出ISR（动态变化），待该follower恢复后，follower会读取本地磁盘记录的上次HW，并将该log文件高于HW的部分截取掉，从HW开始向leader进行同步，该follower的LEO大于等于该Parititon的HW，即follower追上leader后，可重新加入ISR
### leader故障
leader发生故障后，会从ISR中选出一个新的leader，为了保证多个副本之间的数据一致性，其他的follower会先将各自的log高于hw的部分截掉（新leader不会截取），然后从新leader同步数据
![image.png](https://cdn.nlark.com/yuque/0/2023/png/316533/1678954969895-bd5d028c-da77-413a-883f-9dc20782a51c.png#averageHue=%23e9aaa6&clientId=u8567aee7-ea27-4&from=paste&height=267&id=ua7204bf7&name=image.png&originHeight=334&originWidth=633&originalType=binary&ratio=1.25&rotation=0&showTitle=false&size=108047&status=done&style=none&taskId=u4fb5b522-a08a-4246-8622-b04743e82a8&title=&width=506.4)
