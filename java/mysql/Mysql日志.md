# Mysql日志
分为 undo log(回滚日志), redo log(重做日志),binlog(归档日志)

- undo log(回滚日志)：innodb存储引擎层生成的日志，实现了事务中的原子性，主要用于事务回滚和MVCC
- redo log(重做日志)：innodb存储引擎层生成的日志，实现了事务中的持久性，主要用于掉电等故障恢复
- binlog(归档日志)：是Server层生成的日志，主要用于数据备份和主从复制
# undo log
每次执行事务的过程中，都记录下回滚时需要的信息到一个日志里，那么在事务执行中发生了MYSQL崩溃后，就不用担心无法回滚到事务之前的数据，我们可以通过这个日志回滚到事务之前的数据
undo log 这个机制，它保证了事务的ACID中的原子性
每当innodb引擎对一条记录进行操作（增加，修改，删除）时，需要把回滚时需要的信息都记录到undo log里：

- 在插入一条记录时，把这条记录的主键值记录下来，这样回滚时，只需要把这个主键值对应的记录删掉即可
- 在删除一条记录时，把这条记录的内容都记下来，这样回滚时，再把这些内容组成记录插入到表中
- 更新一条记录时，要把被更新的列的旧值记下来，这样回滚时，再把这些列更新为旧值即可

在回滚时，就读取undo log里的数据，然后做原先相反操作。比如当delete一条记录时，undo log中会把记录中的内容都记下来，然后执行回滚操作的时候，就读取undo log里的数据，然后进行insert操作
undo log 还有一个作用，通过 ReadView + undo log 实现 MVCC(多版本并发控制)
对于 读提交 与 可重复读 隔离级别的事务来说，它们的快照读(普通select语句)是通过ReadView + undo log来实现的，区别在于

- 读提交：每个select都会生成一个新的ReadView，也意味着，事务期间的多次读取同一条数据，前后两次读的数据可能会出现不一致，因为可能这期间另外一个事务修改了该记录，并提交了事务
- 可重复读：事务启动的时候，生成一个ReadView，整个事务期间都在用这个Read View，这样就保证了在事务期间读取到的数据都是事务启动前的记录

这两个隔离级别实现是通过 事务的 ReadView 里的字段，记录中的两个隐藏列 (trx_id 和 roll_pointer)的对比，如果不满足可见性，就会顺着 undo log 版本链里找到满足其可见性的记录，从而控制并发事务访问同一条记录的行为，这就叫 MVCC(多版本并发控制)
![](https://cdn.nlark.com/yuque/0/2023/png/316533/1679449450998-4a474520-8812-4eba-95b5-996a5b978fc3.png#averageHue=%23f9f6ef&clientId=ucf90cdd1-2569-4&from=paste&id=u461d9e99&originHeight=571&originWidth=352&originalType=url&ratio=1&rotation=0&showTitle=false&status=done&style=none&taskId=u5c3a4e35-6334-4ecd-9438-691e873d029&title=)
# Buffer Pool
Innodb引擎设计一个缓冲池(Buffer Pool)，来提高数据库的读写性能
有Buffer Pool后：

- 当读取数据时，如果数据存于 Buffer Pool中，客户端就会直接读取 Buffer Pool中的数据，否则再去磁盘中读取
- 当修改数据时，如果数据存在于Buffer Pool中，那直接修改 Buffer Pool中数据所在的页，然后将其页设置为脏页(该内的内存数据和磁盘上的数据已经不一致)，为了减少磁盘IO，不会立即将脏页写入磁盘，后续由后台线程选择一个合适的时机将脏页写入到磁盘
## Buffer Pool缓存内容
Buffer Pool 默认 128M
InnoDB 会把存储的数据划分为若干个页，以页作为磁盘和内存交互的基本单位，一个页的默认大小为16K。因此Buffer Pool同样需要按页来划分
MYSQL启动的时候，InnoDB会为Buffer Pool申请一片连续的内存空间，然后按照默认的 16k 大小划分出一个个页，Buffer Pool中的页就叫缓存页。
Buffer Pool除了缓存 索引页 和 数据页，还包括了 Undo 页，插入缓存，自适应哈希索引，锁信息等
当我们查询一条记录时，InnoDB会把整个页的数据加载到Buffer Pool中，将页加载到Buffer Pool后，在通过页里的 页目录 去定位到某条具体的记录
当有了Buffer Pool后:

- 当读取数据时，如果数据存在于Buffer Pool中，客户端就会直接读取Buffer Pool的数据，否则再去磁盘中读取
- 当修改数据时，首先修改Buffer Pool中数据所在的页，然后将其页设置为脏页，最后由后台线程将脏页写入磁盘中

![](https://cdn.nlark.com/yuque/0/2023/png/316533/1679450377374-173a538a-3b15-4bf8-a47c-e841803a40f1.png#averageHue=%23f1ebd8&clientId=ucf90cdd1-2569-4&from=paste&id=u26d0ebdd&originHeight=969&originWidth=725&originalType=url&ratio=1&rotation=0&showTitle=false&status=done&style=none&taskId=u4fc1b230-4e67-4a93-8a97-3e4c3b79111&title=)
![](https://cdn.nlark.com/yuque/0/2023/png/316533/1679451043123-8a592274-2d9b-4a4e-a00e-a5e23b94b05f.png#averageHue=%23f8ebd8&clientId=ucf90cdd1-2569-4&from=paste&id=u79b82075&originHeight=377&originWidth=812&originalType=url&ratio=1&rotation=0&showTitle=false&status=done&style=none&taskId=u0afc80a7-8f0c-49b4-bb5b-d90625301b1&title=)
为了更好的管理这些Buffer Pool的缓存页，InnoDB为每一个缓存页都创建了一个控制块，控制块包括了 缓存页信息，页号，缓存页地址，链表节点 等
控制块也是占空间空间的，它放在Buffer Pool最前面，接着才是缓存页
![](https://cdn.nlark.com/yuque/0/2023/png/316533/1679537236077-a2ddf2e5-e468-4f38-baed-a72982fb035c.png#averageHue=%23f8f8f8&clientId=uf7da27a8-96fe-4&from=paste&id=ufaeb51a4&originHeight=234&originWidth=962&originalType=url&ratio=1&rotation=0&showTitle=false&status=done&style=none&taskId=uf8555f19-264f-49b1-a858-d781e867531&title=)
## Buffer Pool空闲页
Buffer Pool是一片连续的内存空间，当MYSQL运行一段时间后，这片连续的内存空间中的缓存页既有空闲的，也有被使用的
为了能够快速找到空闲的缓存页，可以使用链表结构，将空闲缓存页的控制块作为链表的节点，这个链表称为 Free 链表
有了 Free 链表后，每当需要从磁盘中加载一个页到Buffer Pool中时,就从Free链表中取出一个空闲的缓存页，并且把该缓存页对应的控制块的信息填上，然后把该缓存页对应的控制块从Free链表中移除
![](https://cdn.nlark.com/yuque/0/2023/png/316533/1679537548851-69f2749d-421a-410c-b6bc-f5e20d3ce848.png#averageHue=%23f8f3ed&clientId=uf7da27a8-96fe-4&from=paste&id=u2719e970&originHeight=597&originWidth=1217&originalType=url&ratio=1&rotation=0&showTitle=false&status=done&style=none&taskId=u2896960a-b596-4c6e-9a97-d4b762e647f&title=)
## 脏页管理
Buffer Pool除了能提高读性能，还能提高写性能，也就是更新数据的时候，不需要每次都写入磁盘，而是将Buffer Pool对应的缓存页标记为脏页，然后再由后台线程将脏页写入到磁盘
为了能快速晓得那些缓存页是脏页，于是就设计出Flush链表，跟Free链类似，链表的节点也是控制块，区别在于Flush链表的元素都是脏页
有了Flush链表后，后台线程就可以遍历Flush链表，将脏页刷新到磁盘
![](https://cdn.nlark.com/yuque/0/2023/png/316533/1679537918903-a008de91-7751-4dc7-9ec4-1ffb457d7837.png#averageHue=%23f8f3ed&clientId=uf7da27a8-96fe-4&from=paste&id=ue02ba191&originHeight=597&originWidth=1217&originalType=url&ratio=1&rotation=0&showTitle=false&status=done&style=none&taskId=u67a0cdbe-f751-4007-aa1e-8e1ca5129a1&title=)
## 脏页刷盘
InnoDB的更新操作采用 Write Ahead Log 策略，即先写入日志，再写入磁盘，通过redo log日志让mysql拥有了恢复能力
触发脏页的刷新:

- 当 redo log 日志满了后，会主动触发脏页刷新到磁盘
- Buffer Pool空间不足时，需要将一部分数据页淘汰掉，如果淘汰的是脏页，需要先将脏页同步到磁盘
- Mysql认为空闲时，后台线程会定期将适量的脏页刷新到磁盘
- Mysql正常关闭后，会把所有的脏页刷新到磁盘
## 提高缓存命中率
Buffer Pool大小是有限的，对于一些频繁访问的数据希望可以一直留在Buffer Pool,而一些很少访问的数据希望可以在某些时机可以淘汰掉，从而保证Buffer Pool不会因为太满而导致无法再缓存新的数据，同时还保留常用的数据在Buffer Pool中
实现思路：

- 当访问的页在 Buffer Pool里，就直接把该页对应的 LRU 链节点移动到链表的头部
- 当访问的页不在Buffer Pool里，除了要把页放入到 LRU 链表的头部，还要淘汰 LRU 链表尾部的节点

Buffer Pool使用三种页和链表管理数据

- Free Page(空闲页)，表示此页面未被使用，位于 Free 链表
- Clean Page(干净页)，表示此页已被使用，但是页面未发生修改，位于LRU链表
- Dirty Page(脏页)，表示此页 已被使用 且 已经被修改，起数据和磁盘上的数据已经不一致了.当脏页上的数据写入磁盘后,内存数据和磁盘数据一致,那么该页就变成了干净页.脏页同时存在于 LRU 链表 和 Flush 链表

![](https://cdn.nlark.com/yuque/0/2023/png/316533/1679540715218-5f986706-d05e-407d-b20f-9eea9942154a.png#averageHue=%23e9eae7&clientId=uf7da27a8-96fe-4&from=paste&id=uc7010fc2&originHeight=605&originWidth=1342&originalType=url&ratio=1&rotation=0&showTitle=false&status=done&style=none&taskId=u2c2c2864-d2a5-4a7e-be84-ac6d798de2d&title=)
### 预读失效
MySql在加载数据页的时候,会把相邻的数据页一并加载进来,目的是为了减少磁盘IO
但是可能这些数据页,并没有被访问,相当于这个预读是白做的,这就是预读失效
### 预读命中率低
要避免缓存失效带来的影响,最好就是让预读的停留在Buffer Pool里的时间要尽可能的短,让真正被访问的页才移动到LRU链表的头部,从而保证真正被读取的热数据保留在Buffer Pool里的时间尽可能的长
将LRU划分为 2 个区域, old区域 和 young 区域
young 区域在 LRU 链表的前半部分, old在后半部分
old 区域占整个 LRU 链表长度的比例 可以通过 innodb_old_blocks_pct 参数来设置, 代表整个 LRU 链表的 young 区域 和 old 区域比例是 63:37
划分 2 个区域后,预读的页就只需要加入到 old 区域的头部,当真正被访问的时候,才将页插入到young区域的头部.如果预读的页一致没有被访问,就会从old区域移除,这样就不影响young区域中的热点数据
![](https://cdn.nlark.com/yuque/0/2023/png/316533/1679541469311-3f8bd624-eb97-4c28-b7f4-a81483f162a5.png#averageHue=%23f6eeda&clientId=uf7da27a8-96fe-4&from=paste&id=u605b112e&originHeight=212&originWidth=842&originalType=url&ratio=1&rotation=0&showTitle=false&status=done&style=none&taskId=u86244c86-dec2-4f21-a51c-6549cbc888b&title=)
## Buffer Pool污染
全表扫描,很多缓存页其实只会被访问一次,但是它却只因为被访问一次而进入到young区域,从而导致热点数据被替换了
LRU 链表中 young 区域就是热点数据,只要我们提高进入到 young 区域的门槛,就能有效的保证young区域里的热点数据不会被替换掉
进入到 young 区域条件增加一个停留在 old 区域的时间判断

- 如果后续的访问时间与第一次访问的时间在某个时间间隔内,那么该缓存页就不会被从old区域移动到young区域的头部
- 如果后续的访问时间与第一次访问的时间不在某个时间间隔内,那么该缓存页移动到young区域的头部

这个时间间隔由 innodb_old_blocks_time 控制的,默认是 1000 ms
## 总结
Buffer Pool来 提高 数据库的 读写性能
InnoDB通过三种链表来管理缓存页：

- Free List(空闲页链表)：管理空闲页
- Flush List(脏页链表)：管理脏页
- LRU List(管理脏页+干净页)：将最近且经常查询的数据缓存其中，而不是经常查询的数据就淘汰出去

InnoDB对LRU做了一些优化，

- 将LRU链表 分为 young和old两个区域，加入缓存池的页，优先插入old区域；页被访问时，才进入young区域，目的是为了解决预读失效的问题
- 当**「页被访问」且「 old 区域停留时间超过 innodb_old_blocks_time 阈值（默认为1秒）」**时，才会将页插入到 young 区域，否则还是插入到 old 区域，目的是为了解决批量数据访问，大量热数据淘汰的问题
# redo log
Buffer Pool 提高了独写效率，但是Buffer Pool是基于内存的，而内存总是不可靠的，万一断电重启，还没来得及落盘的脏页数据就会丢失
为了防止断电导致数据丢失的问题，当有一条记录需要更新的时候，innodb引擎就会先更新内存（同时标记为脏页），然后将本次对这个页的修改以 redo log 的形式记录下来，这时候更新算是完成
InnoDB会在适当的时候，由后台线程将缓存在Buffer Pool的脏页刷新到磁盘里，这就是WAL(Write-Ahead Logging)技术
WAL：MYSQL的写操作并不是立马写到磁盘上，而是先写日志，然后在合适的时间再写到磁盘上。
WAL优点：MYSQL的写操作从磁盘的随机写变成了顺序写，提升语句的执行性能。
redo log是物理日志，记录了某个数据页做了什么修改，比如对XXX表空间中的YYY数据页ZZZ偏移量的地方做了AAA更新，每当执行一个事务就会产生这样的一条或者多条物理日志
在提交事务的时候，只要先将 redo log持久化到磁盘，可以不需要等待将缓存在 Buffer Pool 里的脏页数据持久化到磁盘。当系统奔溃的时候，虽然脏页数据没有持久化，但是redo log持久化了，接着MYSQL重启，可以根据 redo log的内容，将所有的数据恢复到最新状态
写入 redo log的方式是追加写，所以磁盘操作是顺序写，而写入数据需要先找到写入位置，然后才写入磁盘，所以磁盘是随机写。
磁盘的顺序写 比 随机写 要高效很多，因此 redo log 写入磁盘的开销更小
![](https://cdn.nlark.com/yuque/0/2023/png/316533/1679452938700-29cac64f-f3eb-4b48-a214-af43abb0ec56.png#averageHue=%23f8f3ec&clientId=ucf90cdd1-2569-4&from=paste&id=u1317f027&originHeight=977&originWidth=1292&originalType=url&ratio=1&rotation=0&showTitle=false&status=done&style=none&taskId=ue9ac4ae2-ac28-4708-81ae-793d466006f&title=)
## undo log 和 redo log 区别

- redo log 记录了此次事务 完成后 的数据状态，记录的是更新之后的值
- undo log 记录了此次事务 开始前 的数据状态，记录的是更新之前的值

![](https://cdn.nlark.com/yuque/0/2023/png/316533/1679455664437-4a246bb4-cf34-483a-a809-3f8ecab7d805.png#averageHue=%23fbf7f3&clientId=ucf90cdd1-2569-4&from=paste&id=u4ec0021a&originHeight=601&originWidth=551&originalType=url&ratio=1&rotation=0&showTitle=false&status=done&style=none&taskId=u91a66136-b634-472d-8246-366a8534d39&title=)
## redo log buffer
执行一个事务的过程中，产生的redo log也不是直接写入磁盘的，因为这样会产生大量的IO操作，而且磁盘的运行速度远慢于内存。所以 redo log 也有自己的缓存， redo log buffer，每产生一条 redo log时，会先写入到 redo log buffer
redo log buffer 默认大小 16 MB，可以通过 innodb_log_buffer_size 参数动态调整大小，增大它的大小可以让 MYSQL处理 大事务 是不必写入磁盘，进而提升写 IO 性能
![](https://cdn.nlark.com/yuque/0/2023/webp/316533/1679456479192-8d996d79-7519-4eac-a292-c614e8939ae6.webp#averageHue=%23f1efec&clientId=ucf90cdd1-2569-4&from=paste&id=u40aa485c&originHeight=1344&originWidth=1398&originalType=url&ratio=1&rotation=0&showTitle=false&status=done&style=none&taskId=u32e40623-662b-4c44-9d91-56e637bf1bf&title=)
## redo log刷盘
缓存在 redo log buffer 里的 redo log 还是在内存中，它是什么时候刷盘的？

- MYSQL正常关闭时
- 当 redo log buffer 中记录的写入量大于 redo log buffer 内存空间的一半时，会触发落盘
- InnoDB的后台线程每隔1秒，将redo log buffer 持久化到磁盘
- 每次事务提交的时都将缓存在 redo log buffer 里的 redo log 直接持久化到磁盘(这个策略可由innodb_flush_log_at_trx_commit 参数控制)

单独执行一个更新语句的时候，InnoDB引擎会自己启动一个事务，在执行更新语句的过程中，生成的redo log先写入到redo log buffer中，然后等事务提交的时候，再将缓存在redo log buffer中的redo log按照顺序写到磁盘
innodb_flush_log_at_trx_commit 含义:

1. 设置为0时，表示每次事务提交，还是将 redo log 留在 redo log buffer 中，该模式下在事务提交时不会主动触发写入磁盘的顺序
2. 设置为1时，表示每次事务提交时，都将缓存在 redo log buffer 里的redo log直接持久化到磁盘，这样可以保证MYSQL异常重启之后数据不丢失
3. 设置为2时，表示每次事务提交时，都只缓存在 redo log buffer 里的 redo log 写到 redo log 文件,写入到 redo log 并不意味着写入到磁盘，因为操作系统的文件中有个Page Cache。Page Cache是专门用来缓存文件数据的，所以写入 redo log 文件意味着写入到操作系统的文件缓存

![](https://cdn.nlark.com/yuque/0/2023/png/316533/1679474386187-a9e6c7b6-ae70-4dfd-af81-ad89cdb46e0f.png#averageHue=%23f3ebd2&clientId=ucf90cdd1-2569-4&from=paste&id=ub17ff87d&originHeight=863&originWidth=951&originalType=url&ratio=1&rotation=0&showTitle=false&status=done&style=none&taskId=ufc8c0ec9-fbb7-4e0f-abd4-c77f2cf4515&title=)
## redo log 写满
InnoDB存储引擎有1个重做日志组(redo log Group),重做日志文件组由2个redo log文件组成，这两个redo日志文件名叫: ib_logfile0 和 ib_logfile1
![](https://cdn.nlark.com/yuque/0/2023/png/316533/1679474604682-2fc6fe8f-b730-4854-933b-c08830a215dd.png#averageHue=%23eeeeee&clientId=ucf90cdd1-2569-4&from=paste&id=u38d31584&originHeight=101&originWidth=350&originalType=url&ratio=1&rotation=0&showTitle=false&status=done&style=none&taskId=ud8418b5f-84fc-4bdc-ac2e-93bfd1f4a5d&title=)
重做日志文件是以循环写的方式工作的，从头开始写，写到尾部就又回到头部，相当于一个环形
比如 innoDB存储引擎会先写 ib_logfile0文件，当 ib_logfile0文件被写满后，会切换到 ib_logfile1 文件,当 ib_logfile1文件也被写满时，会切换换 ib_logfile0文件
![](https://cdn.nlark.com/yuque/0/2023/png/316533/1679474875670-fce9d2c4-6966-4c2e-917b-f940b462b48b.png#averageHue=%23f6f4ea&clientId=ucf90cdd1-2569-4&from=paste&id=u495734fc&originHeight=261&originWidth=441&originalType=url&ratio=1&rotation=0&showTitle=false&status=done&style=none&taskId=u9563225e-985c-4805-a02a-661b7d1fd74&title=)

redo log是为了防止Buffer Pool中的脏页丢失而设计的，那么如果随着系统运行，Buffer Pool的脏页刷新到磁盘中，那么 redo log对应的记录也就没用了，这时候我们擦除这些旧记录，腾出空间记录新的更新操作
redo log是循环写的方式，相当于一个环形，InnoDB用write pos表示redo log当前记录写到的位置，用checkpoint表示当前要擦除的位置

- write pos 和 checkpoint 的移动都是顺时针方向
- write pos ~ checkpoint 之间的部分，红色部分，用来记录新的更新记录
- checkpoint ~ write pos 之间的部分，蓝色部分，待落盘的脏数据页记录

当 write pos 追上了 checkpoint , 意味着 redo log 文件满了，这时mysql不能再执行新的更新操作，也就是说mysql会被阻塞，此时会停下来将 Buffer Pool中脏页的数据刷新到磁盘中，然后redo log那些记录可以被擦除，接着对旧的redo log进行擦除，等擦除旧记录腾出了空间，checkpoint就会往后移动，然后mysql恢复正常运行，继续执行新的更新操作
![](https://cdn.nlark.com/yuque/0/2023/png/316533/1679475208490-765eb1fc-9dec-41fb-9d73-d7b369100a84.png#averageHue=%23ede7e7&clientId=ucf90cdd1-2569-4&from=paste&id=ub3e78fcb&originHeight=906&originWidth=1362&originalType=url&ratio=1&rotation=0&showTitle=false&status=done&style=none&taskId=ue3188704-836a-4d99-a00a-e3da19d9330&title=)
# binlog
mysql 在完成一条更新后，Server层还会生成一条binlog，等之后事务提交的时候，会将该事务执行过程中产生的binlog统一写入binlog文件
binlog追加写，写满一个文件，就创建一个新的文件继续写，不会覆盖以前的日志，保存的是全量的日志
## binlog模式

- statement模式:    每一条会修改数据的sql都会记录在binlog中. 不需要记录每一行的变化,减少 binlog 日志量,节省IO,提高性能. 由于sql的执行是有上下文的,因此在保存的时候需要保存相关信息,同时还有一些使用了函数之类的使用的语句无法被复制和记录
-  row级别:   不记录sql语句上下文信息,仅保存那条记录被修改.记录单元为每一行的改动,基本是可以全部记录下来的但是由于很多操作，会导致大量的改动(比如alter table),因此这种模式的文件保存的信息太多,日志量太大
- mixed:   这种方案,普通操作使用的 statement记录,当无法使用 stetement的时候,使用row
## 主从复制原理
MySql主从复制依赖binlog,也就是记录mysql上所有变化并以二进制形式保存在磁盘上。复制过程就是将binlog中的数据从主库传输到从库上
这个过程是异步的，也就是从库上执行事务操作的线程不会等待binlog的线程完成同步
这个过程一般是异步的，也是就主库上执行事务操作的线程不会等待复制binlog的线程完成同步

- 写入binlog: 主库写binlog日志,提交事务,并更新本地存储数据
- 同步binlog: 把binlog复制到所有的从库上，每个从库把binlog写到暂存日志中
- 回放binlog:  回放binlog,并更新存储引擎中的数据

![](https://cdn.nlark.com/yuque/0/2023/png/316533/1679477711910-994c35d8-3be0-40d3-9fb8-4fe4d844b9bd.png#averageHue=%23f7f2e5&clientId=ucf90cdd1-2569-4&from=paste&id=u309370ca&originHeight=401&originWidth=991&originalType=url&ratio=1&rotation=0&showTitle=false&status=done&style=none&taskId=u21fb8ba5-44f7-4635-b8a6-c6a1b083b6a&title=)

   - 


执行流程如下:

- mysql主库在接受客户端提交事务的请求之后，会先写入binlog，再提交事务，更新存储引擎中的数据，事务提交完成后，返回客户端 "操作成功" 的响应
- 从库会创建一个专门的IO线程，连接从库的log dump线程，来接受主库的binlog日志，再把binlog信息写入relay log的中继日志里，再返回给主库"复制成功"的响应
- 从库会创建一个用于回放binlog的线程，去读relay log中继日志，然后放回binlog更新存储引擎中的数据，最终实现主从的数据一致性

![](https://cdn.nlark.com/yuque/0/2023/png/316533/1679478949644-aafe4b8d-197c-4c14-8c40-5944450cda83.png#averageHue=%23f8f5f1&clientId=ucf90cdd1-2569-4&from=paste&id=u8d04b63b&originHeight=471&originWidth=451&originalType=url&ratio=1&rotation=0&showTitle=false&status=done&style=none&taskId=u4c6f6fd5-a83d-4b8d-a466-4ca525b0e23&title=)

