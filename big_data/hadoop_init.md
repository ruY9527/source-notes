## 			 			Hadoop

####  Hadoop 2.X 

​			Hadoop 2.x 基于 1 添加了 Yarn.  Yarn 负责资源的调度,MapReduce负责运算. Hdfs:数据存储.

####   HDFS (Hadoop Distributed File System)

​            NameNode : 存储文件的元数据,如文件名,文件目录结构,文件属性,每个文件的快列表和快所在的DataNode等信息.

​			DataNode :  本地文件系统存储文件快数据,以及数据的检验和.

​            Secondary NameNode: 用来监控HDFS状态的辅助后台程序,每隔一段时间获取HDFS元数据的快照.

#### Hadoop 搭建

-    使用Vm虚拟机来安装Linux,这里使用的Centos.
-    先安装好一个 hp001, 然后hp002,hp003直接使用 clone 即可。不需要自己在一个一个的安装
-    每台Linux安装好Java环境,当然你可以在clone之前安装好即可.



​    环境 : 

| 192.168.247.137 | 192.168.247.138 | 192.168.247.139 |
| --------------- | --------------- | --------------- |
| hp101           | hp102           | ho103           |



​	每台的/etc/hosts中进行配置 , 这里是配置/etc/hosts映射

```sh
	192.168.247.137 hp101
	192.168.247.138 hp102
	192.168.247.139 hp103
```





​	然后配置免密登陆

   hp101上 :  

​		生成密钥 :   ssh-keygen -t rsa

​        公钥拷贝远其他server上 : ssh-copy-id hp102      ssh-copy-id hp103 

​         执行完成了: 如果在hp101上,使用ssh hp102,不用输入密码能直接登陆上去的话,就说明是安装成功的.



将hadoop的 gz 包上传到服务器上, 然后配置到环境变量中. 这里可以看到,配置的环境变量. 然后将hp101中的给copy到 hp102/hp103上去. 

这里copy到其他的服务器上,是可以使用scp指令来执行的. scp:可以实现 服务器与服务器 之间的拷贝

eg : scp -r /opt/module root@hp102:/opt/module 这样就copy到hp102上去了. 

然后分别在 hp102/hp103上分别执行 source /etc/profile , 执行 hadoop就可以看是否配置成功

```sh
#JAVA_HOME
export JAVA_HOME=/opt/module/jdk1.8.0_121
export PATH=$PATH:$JAVA_HOME/bin
export HADOOP_HOME=/opt/module/hadoop-2.7.2
export PATH=$PATH:$HADOOP_HOME/bin
export PATH=$PATH:$HADOOP_HOME/sbin
```

 到这里基本都是对于环境变量的配置,copy文件到所有的server上操作. 接下来才是配置 hadoop的信息.



|      | hp101                 | hp102                             | hp103                         |
| ---- | --------------------- | --------------------------------- | ----------------------------- |
| HDFS | NameNode     DateNode | DateNode                          | SecondaryNameNode    DataNode |
| YARN | NodeManager           | ResourceManager   ResourceManager | NodeManager                   |

 

然后我们统一在 hp101 上配置一些hadoop的参数,然后,最后再转发给copy到其他的服务其上即可.

- core-site.xml  :   这里hp101是hostname  ,  下面的tmp是文件路径

  ```xml
   <property>
  	<name>fs.defaultFS</name>
         <value>hdfs://hp101:9000</value>
  </property>
  <property>
  		<name>hadoop.tmp.dir</name>
  		<value>/opt/module/hadoop-2.7.2/data/tmp</value>
  </property>
  ```

  

-  hadoop-env.sh   :  修改export JAVA_HOME=/xxxx    这里指向你的JAVA环境地址

    export JAVA_HOME=/opt/module/jdk1.8.0_121

-   hdfs-site.xml   :   hp103:50090 是配置的 secondary nameNode

  ```xml
  <property>
  		<name>dfs.replication</name>
  		<value>3</value>
  </property>
  <property>
        <name>dfs.namenode.secondary.http-address</name>
        <value>hp103:50090</value>
  </property>
  ```

  

-   yarn-env.sh  : 也是配置 JAVA 环境

-   yarn-site.xml    :  这里配置的是 resourcemanager, 也对应上面table的内容

  ```xml
  <property>
  		<name>yarn.nodemanager.aux-services</name>
  		<value>mapreduce_shuffle</value>
  </property>
  <property>
  		<name>yarn.resourcemanager.hostname</name>
  		<value>hp102</value>
  </property>
  ```

-   mapred-env.sh  : 也是配置JAVA_HOME的环境变量

-  mapred-site.xml :  从 mapred-site.xml.template 复制一份过来, 也就是 cp mapred-site.xml.template mapred-site.xml  即可. 配置上yarn

  ```xml
  <property>
  	<name>mapreduce.framework.name</name>
  	<value>yarn</value>
  </property>
  ```

  最后配置一下 salves  ：  便于使用集群来启动.  该salves文件我们自己创建即可,vi salves : 然后输入自己的hostname即可.

​	 hp101
​	hp102
​	hp103

  然后需要将上面的配置文件都copy一份到 hp102/hp103上面去.

 

启动操作

1.  如果是第一次启动的话,那么先format下nameNode.   也就是先执行 hdfs namenode -format
2.  start-dfs.sh      执行完指令后,你可以使用 jps 来查询进程
3.  start-yarn.sh   启动yarn, ResourceManger 和 NameNode不是在一台机器上的话,就需要去ResourceManager所在的机器上启动 YARN.  比如这里我就在hp102上执行的此指令.



  