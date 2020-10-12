## 			Kafka 生产者发送消息



####  题记

​		在公司使用kafka也有一段时间了,都是停留在最简单的使用上. 配置好ip/consumer/topic等信息,然后就有数据就开始消费数据(也就是开始处理业务逻辑).

​        然后这里记录下,使用kafkaTemplate 来发送消息.

​		为什么要记录呢？ 因为我发现，存在丢失数据的情况哈哈哈哈。

​        怪就怪在只有一个kafka,然后宕机,就丢了.

​        但是是可以在发送端用回调来记录数据的.



#### 代码

​     话不多少, 可以上代码.	

​     这里主要看   future.addCallback() 这个方法,这里可以看到,如果是是失败了的话,就会走到 onFailure方法中来,这里你就对data数据进行处理,并且throwable也是有的,你也可以自定义异常抛出来,交给上游处理.

```java
package com.yang.bootkafkacase.kafka;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Service;
import org.springframework.util.concurrent.ListenableFuture;
import org.springframework.util.concurrent.ListenableFutureCallback;

/**
 * Created by Yang on 2020/10/12 22:14
 *
 *
 * 生产数据: 失败可以走失败的回调,成功可以走成功的回调.
 * 如果下游的kafka是宕机的话,没有该回调的话,数据就有可能会丢失,这对于数据严格的情况,肯定是不容许发生的现象.
 */

@Service
public class GavinGroupProvider {

    private static final Logger LOGGER = LoggerFactory.getLogger(GavinGroupProvider.class);

    @Value("${gavin.test.topic:gavin.test.topic}")
    private String topicName;

    @Autowired
    private KafkaTemplate kafkaTemplate;


    public void sendMessage(){

        String data = "GavinYang is big brother.";
        ListenableFuture future = kafkaTemplate.send(topicName, data);
        future.addCallback(new ListenableFutureCallback() {
            @Override
            public void onFailure(Throwable throwable) {

                // 如果失败了
                LOGGER.error("The failed data is : {} " , data);
            }

            @Override
            public void onSuccess(Object data) {

                LOGGER.debug("The success data is : {} " , data);
            }
        });
    }


}
```





还有这种的话,就是再次调用get方法, 如果发送失败的话，调用get方法就会抛出异常来，当然我这里是丢出去了一个总的Exception, 这里也可以自己catch处理，也可以抛给调用方法的地方处理.

```
public void sendMessage() throws Exception {

    String data = "GavinYang is big brother.";
    ListenableFuture future = kafkaTemplate.send(topicName, data);

    future.get();
}
```





####  总结

​	 当时因为说是丢数据那段时间,kafka宕机了,然后关掉kafka，直接调用发送，再重启kafka，发现果然在kafka里面是没有数据的。

​      然后使用了这种后,可以根据自己的业务需开看,是抛出异常出去,还是在 onFailure 中进行异常处理操作.



个人感觉:  感觉像这种kafka的中间件,在往其发送数据的时候,特别是单个节点的时候,一定要考虑下如果该节点宕机了的话,其会产生什么问题? 如果看到问题现象，该怎么处理.



