## 							Hadoop知识了解



### 介绍

​     大数据 :  无法在一定时间内用常规的软件工具进行捕捉,管理和处理的数据集合,是需要新处理模式才能具有更强的决策力、洞察发现力和流程优化能力的海量、高增长率和多样化的信息资产.

​	  大数据主要解决 , 海量数据的采集,存储和分析计算问题.



### 特点

​    Volume(大量) 

​    Velocity(高速)

​    Variety(多样)

​    Value(低价值密度)



### 版本

​    Apache 版本

​    CDH 版本

   CDP 版本



### hadoop

​    	Hadoop 是一个 Apache 基金会所开发的 **分布式系统基础架构** , 主要处理了海里数据存储和海量数据的分析计算问题.



### HDFS

​        Hadoop Distributed File System , 简称 HDFS ,  分布式文件系统.



  组成结构有 : 

> Name Node   : 存储文件的元结构,比如文件名,文件结构,文件属性,以及每个文件的快列表和快所在的DataNode等.
>
> DateNode :   在本地文件系统存储快文件快数据,以及快数据的检验和.
>
> Secondary Node :  每隔一段时间对 NameNode 元数据备份.





### MapReduce 

​	MapReduce 分为二个阶段: 

> Map 阶段并行处理输入数据
>
> Reduce 阶段对 Map 结果进行汇总





### YARN

​     Yet  Another Resource Negotiator  , 简称 yarn ,  宁一种资源协调者,是hadoop的资源管理器.

​    

组成结构有:

> ResourceManager (RM) :  整个集群资源(CPU,内存等)的老大.
>
> NodeManager(NM) : 单个节点服务器资源的老大.
>
> ApplicationMaster(AM) : 单个任务运行的老大.
>
> Container: 容器,相当一台独立的服务器.



###  Hadoop生态圈



- Flume  :  Flume 是一个高可用, 高可靠,分布式的海量日志采集，聚合和传输的系统 , Flume 支持在日志系统中定制各类数据发送方,用于收集数据.
- Sqoop :  Sqoop 主要用于 Hadoop,Hive与传统数据库(MYSQL)间进行数据的传递,可以将一个关系型数据库中的数据导进到Hadoop到HDFS中,也可以将HDFS到数据导进到关系型数据库中.
- Kafka :  一种高吞吐量的分布式发布订阅消息系统
- Spark : 开源大数据内存计算框架, 可以基于hadoop上存储的大数据进行计算.
- Flink : 开源大数据内存计算框架,用于实时计算的场景较多.
-  Ooize : 一个管理Hadoop作业(Job)到工作流程度管理系统 .
-  HBase : 分布式的、面向列的开源数据库.HBase 不同于一般的关系数据库，它是一个适合于非结构化数据存储的数据库.
-  Hive : 基于 Hadoop 的一个数据仓库工具,可以将结构化的数据文件映射为一张数据库表,并提供简单的sql查询功能,可以将 SQL 语句转换为 MapReduce 任务进行运行。其优点是学习成本低，可以通过类 SQL 语句快速实现简单的 MapReduce 统计，不必开发专门的 MapReduce 应用，十分适合数据仓库的统计分析.
-  Zookeeper : 分布式系统的可靠协调系统，提供的功能包括：配置维护、名字服务、分布式同步、组服务等