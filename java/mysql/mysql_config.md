## 			MySql中Config配置信息



mysql 8 之前是每次重启是读取的 my.cnf 配置文件, 到了mysql8,是采用的mysqld.cnf每次写入进去的最后一次值.



SQL_MODE :  配置MySql处理sql的方式.

-  ONLY_FULL_GROUP_BY : 对应 group by 聚合操作, 如果 select 中的列没有出现在 Having 或者 group by 子句的非聚合列,就会报错
-  ANSI_QUOTES :  禁止用双引号来引用字符串.
- REAL_AS_FLOAT :  Real 作为 float 的同义词。 Real 默认是 double.
- PIPES_AS_COUNT : 将 || 视为字符串的连接操作而不是 或 运算符.



 日志 :

-   错误日志 : 记录mysql启动,暂停 或者 停止出现的问题.
-   常规日志 :  记录所有发向mysql的日志.
-   慢查询日志 :  记录符合条件的查询
-    二进制日志 :  记录全部有效的数据日志修该
-    中继日志 :   用于主从复制, 临时存储从主库同步的二进制日志.



   日志指令 : 

​		select @@general_log_file;    查看 general 生成的log 文件.

