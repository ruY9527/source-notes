## 							Kafka 基础知识概念



#### 题记

​		在工作也有多多少少的使用过 kafka (消息队列) , 使用其作用有作为服务接口之间解耦，也有作为不同语言之间通信，也有使用标记数据重试等.....  但是使用了这么多场景，我们对 kafka 真的了解嘛？ 与外界交流起来的时候, 都能很好的说出来 kafka 相关的知识嘛 .

​       所以对于 kafka 有深入一层的了解是很有必要的.

​       那么就从这里开始把.



​	  使用 docker 安装参考地址 :  https://juejin.cn/post/6844903829624848398 

​       需要注意的是,  这里是没有对你运行的容器什么进行挂载的,如果只是用于简单的个人学习是可以的，但是用于公司或者企业级是不行的.



#### 问题记录

1. Kafka在多个 partition 的情况下, 生产数据的生产者 和 消费数据的消费者 , 是如何保证消息的顺序？
2. 一个服务对应消费一个topic，如果我们部署了多个服务的话, 那么这多个服务是怎么消费的数据，kafka的多个分区的.
3. Kafka 对于队列里面的数据是怎么存储的？一个topic如果只有一个分区？一个topic有多个分区呢？





#### 错误记录



警告级别的log , 由于没有链接上 kafka 导致的错误.

>
>
>2021-02-06 00:46:37.149  WARN 18488 --- [ntainer#0-0-C-1] org.apache.kafka.clients.NetworkClient   : [Consumer clientId=consumer-baoyang_consumer-1, groupId=baoyang_consumer] Bootstrap broker thisforyou.cn:9200 (id: -1 rack: null) disconnected
>
>2021-02-06 00:46:37.154  WARN 18488 --- [ntainer#0-1-C-1] org.apache.kafka.clients.NetworkClient   : [Consumer clientId=consumer-baoyang_consumer-2, groupId=baoyang_consumer] Bootstrap broker thisforyou.cn:9200 (id: -1 rack: null) disconnected
>
>2021-02-06 00:46:37.166  WARN 18488 --- [ntainer#0-2-C-1] org.apache.kafka.clients.NetworkClient   : [Consumer clientId=consumer-baoyang_consumer-3, groupId=baoyang_consumer] Bootstrap broker thisforyou.cn:9200 (id: -1 rack: null) disconnected





#### 问题记录解答

   这里是测试过或者根据网上找寻的答案来对问题记录进行解答的 , 是按照 index 下标来标识的.



  2 :  如果我们部署了多个实例, 这里我就拿部署了二个服务, 然后 kafka 的分区是三个，经过测试可以发现，我们在启动服务的时候， A 和 B 二个服务, 这二个服务是一个服务，一个服务启动多个实例的意思.  是可以发现 , A 消费的分区是0，B消费的分区是1和2.  所以这也就是在默认的情况下.

![topic的创建](https://raw.githubusercontent.com/baoyang23/images_repository/master/distributed/kafka/kafka_dev_create_topic.png)



A 服务消费情况

![A](https://github.com/baoyang23/images_repository/blob/master/distributed/kafka/kafka_many_server1.png?raw=true)



B 服务消费情况

![B](https://raw.githubusercontent.com/baoyang23/images_repository/master/distributed/kafka/kafka_many_server2.png)



关掉 B 服务后 , A 服务中打印的 log.

![关闭B服务](https://raw.githubusercontent.com/baoyang23/images_repository/master/distributed/kafka/kafka_close_other_server.png)



从这里 log 里面相应打印出来的顺序是可以看到之前自己的疑惑. 所以说，如果是多个分区的情况下，其部署和消费的情况，也就是消费的分区是多少分区，是可以很明显的看到的.



3 ： 关于 kafka 文件的疑问

​        这个问题可以参看 美团技术文章的一篇文章 :  https://tech.meituan.com/2015/01/13/kafka-fs-design-theory.html

​        也就是说 topic 中的 partition 存储,每个 partition 对应一个文件夹，然后每个partition是由多个segment够成的, segment又分别由 index 和 log , index 就是记录offset, index 对应的.log就是记录这些offset的具体数据.  

​         这里可以看到，我部署的 kafka 的文件信息.

![kafka_file](https://raw.githubusercontent.com/baoyang23/images_repository/master/distributed/kafka/kafka_file.png)







#### 参考文献

   对于一些其他的知识参考地址 :

   kafka 问题 参考地址 :  https://segmentfault.com/a/1190000023716306