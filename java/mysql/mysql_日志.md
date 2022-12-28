# MYSQL三大日志

## redo log（重做日志）

### 问题

持久性：只是事务提交成功，那么对数据库做的修改就被永久保存下来，不可能因为任何原因再回到原来的状态

- 简单做法是，每次事务提交的时候，将该事务涉及的数据页全部刷新到磁盘中，但是这样会有严重的性能问题。
  1. 一个事务可能只修改了一个数据页的几个字节，这个时候将完整的数据页刷到磁盘的话，太浪费资源了（刷新一个完整的数据页太浪费）
  2. 一个事务可能涉及多个数据页，并且这些数据页在物理上并不连续，使用随机IO写入性能太差（随机IO刷起来比较慢）

因此，redo log只记录事务对数据页做了哪些操作，这样就能完美地解决性能问题了(相对而言文件更小并且是顺序IO)。

### 基本概念

redo日志放在512字节的块(block)中

redo log buffer的连续内存空间，redo日志缓冲区，简称为 log buffer，这块内存空间被划分成若干个连续的redo log block，可以通过启动参数 innodb_log_buffer_size来指定log buffer的大小，该启动参数默认值是16M

- 内存中的日志缓冲(redo log buffer)
- 磁盘上的日志文件(rede log file)

WAL: 先将记录写入 redo log buffer，后续某个时间再一次性将多个操作记录写入到redo log file。mysql将redo log buffer 写入 redo log file的机制，可以通过innodb_flush_log_at_trx_commit参数配置，参数含义如下

1.  0（延迟写）事务提交时不会将redo log buffer中日志写入到os buffer，而是每秒写入os buffer并调用fsync()写入到redo log file中。也就是说设置为0时是(大约)每秒刷新写入到磁盘中的，当系统崩溃，会丢失1秒钟的数据。
2. 1（实时写，实时刷）事务每次提交都会将redo log buffer中的日志写入os buffer并调用fsync()刷到redo log file中。这种方式即使系统崩溃也不会丢失任何数据，但是因为每次提交都写入磁盘，IO的性能较差。
3. 2（实时写，延迟刷）每次提交都仅写入到os buffer，然后是每秒调用fsync()将os buffer中的日志写入到redo log file。

![参数配置](./images/redo_参数配置1.jpg)

### 日志格式

- type：该条redo日志的类型，redo日志涉及大约有53种不同的类型日志
- space ID：表空间ID
- page number： 页号
- data：该调redo日志的具体内容

### redo日志文件组

数据目录查看语句

```sql
show variables like 'datadir';
```

默认有 ib_logfile0和ib_logfile1的文件，log buffer中的日志默认情况下就是刷新到这两个磁盘中。

- innodb_log_group_home_dir：指定了redo日志文件所在的目录，默认值就是当前的数据目录
- innodb_log_file_size：该参数指定了每个redo日志文件大小，默认值是48M
- innodb_log_files_in_group：指定redo日志文件的个数，默认是2，最大值是100

### Log Sequence Number

redo日志的量在不断的递增

Innodb为记录已经写入redo的日志量，设计了一个Log Sequence Number的全局变量，翻译过来就是日志序列号，LSN。

redo日志都有一个唯一的LSN值与其对应，LSN值越小，说明redo日志产生的越早

- Log sequence number：代表系统中的lsn值，也就是当前系统已经写入的redo日志量，包括写入log buffer的日志
- Log flushed up to ：代表flushed_to_disk_lsn的值，也就是当前系统写入磁盘的redo日志量
- Pages flushed up to：代表flush链表中被最早修改的哪个页面对应的oldest_modification属性值
- Last checkpoint at：当前系统的checkpoint_lsn值

### 刷盘机制

redo日志在内存中有个log buffer,可是这些日志在内存里，在一些情况下也会被刷新到磁盘中：

1. log buffer空间不足时候，log buffer的大小是有限的（通过系统变量innodb_log_buffer_size执行），如果不停的往这个有限大小的log buffer里塞入日志，很快会被它填满。innodb认为如果当前写入log buffer的redo日志量已经占满了log buffer总容量的大约一半左右，就需要把这些日志刷新到磁盘上
2. 事务提交时，redo日志主要占用的空间少，还是顺序写，在事务提交时可以不把修改过的buffer pool页面刷新到磁盘，但是为了保证持久性，必须把修改这些页面对应的redo日志刷新到磁盘
3. 后台有一个线程，大约每秒都会刷新一次log buffer中的redo日志到磁盘
4. 正常关闭服务器等

### 记录形式

![记录形式](./images/redo_记录形式.jpg)

write pos表示rede log当前记录的LSN(逻辑序号)位置，check point表示数据页更改记录刷盘后对应redo log所处的LSN位置。write pos 和 check point之间的部分redo log空着的部分，用于记录新的记录，check point到write pos之间是redo log待落盘的数据页更改记录。当write pos追上check point时，会推动check point向前移动，空出位置再记录新的日志。

**在innodb中，既有redo log需要刷盘，还有数据页也需要刷盘，redo log存在的意义主要就是降低对数据页刷盘的要求**。

重启innodb时，首先检查磁盘中数据页的LSN，如果数据页的LSN小于日志中的LSN,则会从check point开始恢复。

有种情况，在宕机前，正处于check point的刷盘过程，且数据页的刷盘进度超过了日志页的刷盘进度，此时会出现数据页中记录的LSN大于日志的LSN，这时超出日志进度的部分将不会重做，因为这本身表示已经做过的事情，无需再重做。

## undo log（撤销日志）

### undo介绍

原子性底层通过undo log实现。

undo log主要记录了数据的逻辑变化，比如insert一条语句，对应一条delete语句的undo log，对于update，对应一条相反的update的undo log，这样发生错误时，就能回滚到事务之前的数据状态.

- 插入一条记录时，至少要把这条记录的主键值记下来，之后回滚的时候只需要把这个主键值对应的记录删掉
- 删除了一条记录，至少要把这条记录中的内容都记下来，这样之后回滚时再把由这些内容组成的记录插入到表中
- 修改了一条记录，至少要把修改这条记录前的旧值都记录下来，这样之后回滚时再把这条记录更新为旧值

### undo日志格式

表空间其实由许许多多的页面构成，页面默认是16kb，这些页面由不同的类型，其中就有一种称为 file_page_undo_log 类型的页面是专门用来存储undo日志的。也就是说undo log跟存储的数据和索引的页等是类似的。

## binlog

