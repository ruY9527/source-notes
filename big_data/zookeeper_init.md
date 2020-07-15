## 					Zookeeper Init



#### 题记

   最近学习大数据知识在。 Zookeeper 不管是在大数据还是 当注册中心/分布式锁 的情况,都是一个经常被讨论的话题存在.  所以对Zookeeper 了解下是很有必要的.

   Zookeeper 是一个分布式应用的协调服务项目.  Zk从涉及角度看: 是一个基于观察者模式设计的分布式服务管理框架,它负责存储和管理大家都关心的数据,然后接受观察者的注册,一旦数据发送了改变,Zk就负责通知这些已经在Zk上注册的观察者.

   Zk 整体可以看作是一棵树,每个节点成为ZNode.每个ZNode默认是存储的1MB数据,每个ZNode通过其路径唯一标识.



####  单节点安装

​      这里是已经默认你安装好了Java环境的

- ​    Zk 的包上传到服务器上, 解压

     ```
  tar -zxvf zookeeper-3.4.10.tar.gz -C /opt/module/
     ```

-   进入到conf目录下面,  cp zoo_sample.cfg zoo.cfg     修改zoo.cfg 文件

    这里是需要创建相对应的文件夹的, 在相应的文件夹下面创建 zkData 这个文件夹

  ```
  dataDir=/opt/module/zookeeper-3.4.10/zkData
  ```

-   启动指令

    ```
  bin/zkServer.sh start
  ------  jps 是查看java进程的
  jps 
  ----- 可以看到 QuorumPeerMain 进程的话,那么说明启动是基本ok的了
  [root@hp101 zookeeper-3.4.10]# jps
  2005 DataNode
  1894 NameNode
  3161 QuorumPeerMain
  2284 NodeManager
  3231 Jps
  
  ------
  bin/zkServer.sh status : 查看当前ZK的状态的
    ```

  

####  集群配置

​     这里比起单个部署的是,只是缺少了  一些配置

​      在我们创建的 zkData 目录下, vi  myid

​      hp101 中的值是 2 ,  hp102 中的值是3,  hp103 中的值是4

      [root@hp101 zookeeper-3.4.10]# cat /opt/module/zookeeper-3.4.10/zkData/myid 
      2

   修改  conf/zoo.cfg 文件 , 在文件的最后追加我们的内容 , 这里 server.2 的数组都是 相应的机器上的 myid 文件中的数字相互对应上的

  ```
server.2=hp101:2888:3888
server.3=hp102:2888:3888
server.4=hp103:2888:3888
  ```



 然后将 zookeeper-3.4.10 分别复制到 其他的几台服务器上去.  复制完后,记得修改下相应的 myid 里面的数字,就可以启动.

挨个启动每个服务器上的zk

bin/zkServer.sh start 

启动完成后, 可以使用 bin/zkServer.sh status 查看每台服务器上的节点状态,因为这里是主从的状态，

可以看到我这里的主节点,还是hp102,也就是leader节点.

```
[root@hp101 zookeeper-3.4.10]# ./bin/zkServer.sh status
ZooKeeper JMX enabled by default
Using config: /opt/module/zookeeper-3.4.10/bin/../conf/zoo.cfg
Mode: follower

[root@hp102 zookeeper-3.4.10]# ./bin/zkServer.sh status
ZooKeeper JMX enabled by default
Using config: /opt/module/zookeeper-3.4.10/bin/../conf/zoo.cfg
Mode: leader

[root@hp103 zookeeper-3.4.10]# ./bin/zkServer.sh status
ZooKeeper JMX enabled by default
Using config: /opt/module/zookeeper-3.4.10/bin/../conf/zoo.cfg
Mode: follower
```



####    总结

​       相对于其他的搭建,我个人的感觉,Zookeeper的搭建还相对比较简单的容易上手的. 