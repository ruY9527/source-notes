## 								Hive_Init

####  题记

​		最近一直在学习大数据模块的东西,Hive是需要去学习以及使用下的.  



####  介绍

​        Hive 是基于Hadoop的一个 数据仓库工具 , 将结构化的数据映射为一张表,然后是表的话,你就可以像写Sql语句一样,对其进行Query等功能.

​         Hive处理的数据存储在HDFS上的, 分析数据是使用 MapReduce , 程序是运行在 yarn 上的. 可以通过 history来看的.    启动历史服务 :   mr-jobhistory-daemon.sh start historyserver  (这是基于配置了环境变量的)

​         Hive 在加载数据的过程中不会对数据进行任何处理的. 也就是说,暴力扫描整个数据的. Hive 中的查询执行都是通过 Hadoop的MapReduce来实现的.



####  安装

   Hive的安装, 由于Hive是基于 Hadoop 的,所以在Hive之前,肯定是要有Hadoop的安装的.  Hadoop[搭建](https://github.com/baoyang23/source-notes/blob/master/big_data/hadoop_init.md) , 可以参考之前写的.

​    准备好 :  apache-hive-1.2.1-bin.tar.gz  /  MySql.

-  上传Hive到Hp101上,并且压缩后的位置是在 :  /opt/module/hive    ， 这里我是修改了名字的.

    cp hive-env.sh.template hive-env.sh  复制一个启动的脚本文件 

    编辑 hive.env.sh 脚本文件, 配置路径

  ```shell
  export HADOOP_HOME=/opt/module/hadoop-2.7.2
  export HIVE_CONF_DIR=/opt/module/hive/conf
  ```

-  HDFS上创建 /tmp 和  /user/hive/warehouse 二个目录 ,  并且给相应的权限.

  ```shell
  hadoop fs -mkdir /tmp
  hadoop fs -mkdir -p /user/hive/warehouse
  hadoop fs -chmod g+w /tmp
  hadoop fs -chmod g+w /user/hive/warehouse
  ```

-   hive的目录兴下执行:bin/hive , 即进入到与 Hive 进行交互的界面来了

   从下面看执行的语句来看,和我们使用sql来操作是什么区别的,很是相似的

  ```shell
  // 查看数据库
  show databases;
  // 使用哪个库, 这里是使用的默认的
  use default;
  // 查看使用库下面的表
  show tables;
  // 创建表
  create table student(id int, name string);
  // 插入数据
  insert into student values(1000,"ss");
  // 查询数据
  select * from student;
  // 退出,二个中的一个都满足退出的条件
  exit / quit;
  ```

-    如果你这时候打开二个界面的话,就会有错误的. 这是因为 Metastore 默认是存储在自带的derby数据库中,推荐使用 MySql 来存储.

-   安装 MySql (如果是已经安装了的话,就跳过)  

     MySql 修改 user表内容

    ```mysql
  update user set host='%' where host='localhost';
  // 删除root 用户的其他host
  delete from user where Host='hp101';
  delete from user where Host='hp101';
  delete from user where Host='hp101';
  // 刷新
  flush privileges;
    ```

  

-   cp mysql驱动的jar到hive对应的目录下, 

    cp mysql-connector-java-5.1.27-bin.jar  /opt/module/hive/lib/

    hive 目录下 conf 文件夹创建 vi hive-site.xml 文件 , 将下面的配置文件给 copy 上面. mysql的对应配置信息,是需要填写自己的.  这样配置完后,再启动 hive 在多个窗口是不会有错误的了.

  ```xml
  <?xml version="1.0"?>
  <?xml-stylesheet type="text/xsl" href="configuration.xsl"?>
  
  <configuration>
  	<property>
  	 <name>javax.jdo.option.ConnectionURL</name>
  	 <value>jdbc:mysql://hp101:3306/metastore?createDatabaseIfNotExist=true</value>
  	 <description>JDBC connect string for a JDBC metastore</description>
  </property>
  
  
  	<property>
  	 <name>javax.jdo.option.ConnectionDriverName</name>
  	 <value>com.mysql.jdbc.Driver</value>
  	 <description>Driver class name for a JDBC metastore</description>
  	</property>
  
  	<property>
  	 <name>javax.jdo.option.ConnectionUserName</name>
  	 <value>root</value>
  	 <description>username to use against metastore database</description>
  	</property>
  
  	<property>
  	 <name>javax.jdo.option.ConnectionPassword</name>
  	 <value>123456</value>
  	 <description>password to use against metastore database</description>
  	</property>
  
  </configuration>
  ```

  

  ####  指令

     Hive 的一些常用的指令

     执行 bin/hive -help  指令,就可以看到hive贴出来的一些常用的

  ```shell
  [root@hp101 hive]# bin/hive -help
  usage: hive
   -d,--define <key=value>          Variable subsitution to apply to hive
                                    commands. e.g. -d A=B or --define A=B
      --database <databasename>     Specify the database to use
   -e <quoted-query-string>         SQL from command line
   -f <filename>                    SQL from files
   -H,--help                        Print help information
      --hiveconf <property=value>   Use value for given property
      --hivevar <key=value>         Variable subsitution to apply to hive
                                    commands. e.g. --hivevar A=B
   -i <filename>                    Initialization SQL file
   -S,--silent                      Silent mode in interactive shell
   -v,--verbose                     Verbose mode (echo executed SQL to the
                                    console)
  ```

  -e : 不进入到 hive 的交互窗口执行 sql 语句  eg : bin/hive -e "select id from student;"

  -f  : 执行脚本中的sql   ： eg : touch 123.sql    写入一条查询语句到123.sql中去,select *from student;

  ​       然后执行: bin/hive -f /opt/module/datas/123.sql

  ​       执行并且写入结果到文件中:   bin/hive -f /opt/module/datas/123.sql  > /opt/module/datas/hive_result.txt

  

  #### 运行日志

  ####    默认存放的日志文件地址 :   root这里对应的是用户名.

  [root@hp101 hive]# cat /tmp/root/hive.log

  ​    放日志的地方也是可以进行修改的,  hive下的 conf 下的,

     cp  hive-log4j.properties.template   hive-log4j.properties

     然后编辑 ： vi hive-log4j.properties 文件.

  ​                    hive.log.dir=/opt/module/hive/logs

  

  ####  导入本地文件 

     自己定义一个目录,里面存放文件. 我这里就在 /opt/module 目录下创建一个 datas目录,里面存放文件.

      ```shell
  vi student.txt
  1001	GavinYang
  1002	PeterWong
  1003	AlexShen
      ```

  

    库就按照上面的指令使用默认的即可:

    ```shell
  // 创建 Table , 并且是按照分隔符'\t'来进行申明的
  create table student(id int, name string) ROW FORMAT DELIMITED FIELDS TERMINATED
   BY '\t';
  // 加载本地文件进去
  create table student(id int, name string) ROW FORMAT DELIMITED FIELDS TERMINATED
   BY '\t';
  // 查询,查询出来的结果就是上面vi添加进去的值
  select * from student;
    ```



####  总结:

   Hive 的基础入门是这样的,当然了,肯定是还有更高深的东西,比如 分区表 / 分桶表  ， 基于 Tez/Spark 上运行 , 还有相应的一些使用小技巧以及优化等操作是需要去了解的. 

