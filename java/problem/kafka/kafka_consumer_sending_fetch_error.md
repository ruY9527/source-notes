## 			Kafka消费者数据配置问题记录				





####  问题

 最近测试一些bug,  因为有些数据到canal, 然后canal写到kafka, 我们自己的服务消费kafka的数据.

 由于一些参数的配置,导致kafka频繁的出现这个问题. 然后你如果这些关键字去百度的话,那么这个问题,你估计是很那处理了.  因为百度出来的处理方式是牛鬼蛇神,各种花样都有,但是就是没有一个有用的. 

 最后还是去 github上看到一个人提的这个问题,然后跟着他弄下,就ok了. 但是具体的参数配置,还是得仔细去测试下.不然总是会出现各种你想不到的情况发生,奇奇怪怪的问题.

```
2020-06-30 14:35:05.450 INFO 26662 --- [ntainer#0-0-C-1] o.a.kafka.clients.FetchSessionHandler : [Consumer clientId=consumer-2, groupId=gavin_localhost] Error sending fetch request (sessionId=1083316257, epoch=126) to node 0: org.apache.kafka.common.errors.DisconnectException.
2020-06-30 14:35:35.707 INFO 26662 --- [ntainer#0-0-C-1] o.a.kafka.clients.FetchSessionHandler : [Consumer clientId=consumer-2, groupId=gavin_localhost] Error sending fetch request (sessionId=1083316257, epoch=INITIAL) to node 0: org.apache.kafka.common.errors.DisconnectException.
2020-06-30 14:36:05.969 INFO 26662 --- [ntainer#0-0-C-1] o.a.kafka.clients.FetchSessionHandler : [Consumer clientId=consumer-2, groupId=gavin_localhost] Error sending fetch request (sessionId=1083316257, epoch=INITIAL) to node 0: org.apache.kafka.common.errors.DisconnectException.
2020-06-30 14:36:36.202 INFO 26662 --- [ntainer#0-0-C-1] o.a.kafka.clients.FetchSessionHandler : [Consumer clientId=consumer-2, groupId=gavin_localhost] Error sending fetch request (sessionId=1083316257, epoch=INITIAL) to node 0: org.apache.kafka.common.errors.DisconnectException.
2020-06-30 14:37:06.452 INFO 26662 --- [ntainer#0-0-C-1] o.a.kafka.clients.FetchSessionHandler : [Consumer clientId=consumer-2, groupId=gavin_localhost] Error sending fetch request (sessionId=1083316257, epoch=INITIAL) to node 0: org.apache.kafka.common.errors.DisconnectException.
2020-06-30 14:37:36.713 INFO 26662 --- [ntainer#0-0-C-1] o.a.kafka.clients.FetchSessionHandler : [Consumer clientId=consumer-2, groupId=gavin_localhost] Error sending fetch request (sessionId=1083316257, epoch=INITIAL) to node 0: org.apache.kafka.common.errors.DisconnectException.
2020-06-30 14:38:06.946 INFO 26662 --- [ntainer#0-0-C-1] o.a.kafka.clients.FetchSessionHandler : [Consumer clientId=consumer-2, groupId=gavin_localhost] Error sending fetch request (sessionId=1083316257, epoch=INITIAL) to node 0: org.apache.kafka.common.errors.DisconnectException.
```



####  配置



这是最初的配置.  然后kafka那头,就有蛮多数据堆积在那里的. 接着就出现了上面的那个error, 但是没有抛异常出来,就是log里面打印了info的信息,说里面有error.

```java
public Map<String, Object> consumerConfigs(String groupId) {    Map<String, Object> props = new HashMap<>(16);    props.put(ConsumerConfig.GROUP_ID_CONFIG,groupId);    props.put(ConsumerConfig.BOOTSTRAP_SERVERS_CONFIG, "127.0.0.1:9092");    props.put(ConsumerConfig.ENABLE_AUTO_COMMIT_CONFIG, false);    props.put(ConsumerConfig.SESSION_TIMEOUT_MS_CONFIG, 30000);    props.put(ConsumerConfig.KEY_DESERIALIZER_CLASS_CONFIG, StringDeserializer.class);    props.put(ConsumerConfig.VALUE_DESERIALIZER_CLASS_CONFIG, StringDeserializer.class);    props.put(ConsumerConfig.AUTO_OFFSET_RESET_CONFIG,"earliest");     props.put(ConsumerConfig.MAX_POLL_RECORDS_CONFIG,100);    props.put(ConsumerConfig.MAX_PARTITION_FETCH_BYTES_CONFIG,31457280);    props.put(ConsumerConfig.MAX_POLL_INTERVAL_MS_CONFIG,300000);    return props;}
```





[处理方案地址](https://github.com/spring-projects/spring-kafka/issues/1180)



可以看着别人的配置跟着配置下,但是最好要自己理解下你配置这些参数的值大小,代表着什么意思.  因为你获取这些数据的多少,是直接与你的业务代码和服务器内存进行挂钩的.



比如你的业务代码,拿到了kafka的数据,然后根据kafka的数据去db中query(假设你查询的数据很多), 那么就一定要注意内存的使用等问题了.



最后的配置样子. 当然了,这里只是我进行测试一些bug的配置,具体的上线代码配置,肯定还要再仔细看下.

```
    public Map<String, Object> consumerConfigs(String groupId) {
        Map<String, Object> props = new HashMap<>(16);
        props.put(ConsumerConfig.GROUP_ID_CONFIG,groupId);
        props.put(ConsumerConfig.BOOTSTRAP_SERVERS_CONFIG, "127.0.0.1:9092");
        props.put(ConsumerConfig.ENABLE_AUTO_COMMIT_CONFIG, false);
        props.put(ConsumerConfig.SESSION_TIMEOUT_MS_CONFIG, 30000);
        props.put(ConsumerConfig.KEY_DESERIALIZER_CLASS_CONFIG, StringDeserializer.class);
        props.put(ConsumerConfig.VALUE_DESERIALIZER_CLASS_CONFIG, StringDeserializer.class);
        props.put(ConsumerConfig.AUTO_OFFSET_RESET_CONFIG,"earliest");
        props.put(ConsumerConfig.FETCH_MAX_WAIT_MS_CONFIG,60000);
        props.put(ConsumerConfig.REQUEST_TIMEOUT_MS_CONFIG,70000);
        props.put("spring.kafka.listener.poll-timeout",60000);

        props.put(ConsumerConfig.MAX_POLL_RECORDS_CONFIG,100);
        props.put(ConsumerConfig.MAX_PARTITION_FETCH_BYTES_CONFIG,31457280);
        props.put(ConsumerConfig.MAX_POLL_INTERVAL_MS_CONFIG,300000);
        return props;
    }
```



####  总结



 可以看到类似kafka这种中间件,其配置的参数还是相当的重要,所以弄明白是很重要的. 不然你配置的参数,可能刚刚好适应你的电脑,但是对服务器就不适应了(这样的话,不排除内存使用的问题).  还是就是数据量的不同, 分别是kafka没有堆积数据,有数据过来就消费,这样的话,肯定是没啥问题的. 如果kafka那头堆积的几百万呢? 那你的这个配置会不会问题?  消费了数据后,有去db做查询的操作,查询获取出来的数据多少? 这些都是需要注意的.