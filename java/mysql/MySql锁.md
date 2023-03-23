# 锁分类
大体可以分为： 全局锁，表级锁，行级锁
## 全局锁
全局锁指令,执行后，整个数据库就处于只读状态，这时，其它线程执行都会被阻塞：

- 对数据的增删改查，比如insert,update.delete等语句
- 对表结构的更改操作，比如alter table,drop table等语句
```java
flush tables with read lock
```
释放全局锁：
```java
unlock tables
```
全局锁场景：全库逻辑备份，这样在备份数据库期间，不会因为数据或表结构的更新，而出现备份文件的数据和预期的不一样
缺点：整个库都是只读状态
## 表锁

- 表锁
- 元数据锁（MDL）
- 意向锁
- AUTO-INC 锁
### 表锁
表锁除了会限制别的线程的读写外，也会限制本线程接下来的读写操作
当会话退出后，也会释放所有的表锁
不过尽量避免在使用 InnoDB 引擎的表使用表锁，因为表锁的颗粒度太大，会影响并发性能，**InnoDB 牛逼的地方在于实现了颗粒度更细的行级锁**
### 元数据锁
无需显示的使用DML，当我们对数据库表进行操作时候，会自动给这个表加上MDL：

- 对一张表进行CRUD操作时，加的是MDL读锁
- 对一张表做结构变更操作时，加的是MDL写锁

MDL 是为了保证当用户对表执行 CRUD 操作时，防止其他线程对这个表结构做了变更
### 意向锁

- 加上共享锁之前，需要先在表级别加上一个 意向共享锁
- 加上独占锁之前，需要现在表级别加上一个 意向独占锁

意向共享锁 和 意向独占锁都是表级别的，不会和行级的共享锁和独占锁发生冲突，而且意向锁之间也不会发生冲突，只会共享表锁(lock table...read)和独占锁(lock table...wirte)发生冲突
表锁和行锁是满足读读共享、读写互斥、写写互斥的
如果没有「意向锁」，那么加「独占表锁」时，就需要遍历表里所有记录，查看是否有记录存在独占锁，这样效率会很慢。
那么有了「意向锁」，由于在对记录加独占锁前，先会加上表级别的意向独占锁，那么在加「独占表锁」时，直接查该表是否有意向独占锁，如果有就意味着表里已经有记录被加了独占锁，这样就不用去遍历表里的记录。
所以，意向锁的目的是为了快读判断表里是否有记录被加锁
### AUTO-INC锁
在插入数据时，会加一个表级别的AUTO-INC锁，然后被 AUTO_INCREMENT 修饰的字段赋值递增的值，等插入语句执行完成后，才会把 AUTO-INC 锁释放掉
## 行级别锁
InnoDB引擎支持行级别锁，而MyISAM引擎并不支持行级锁
普通的select语句不会对记录加锁，因为它属于快照读。如果要在查询时对记录加锁，可以使用如下方式：
```java

select ... lock in share mode;

select ... for update
```
行级锁的类型主要有三点:

- Record Lock: 记录锁,也就是仅仅把一条记录锁上
- Gap Lock: 间隙锁，锁定一个范围，但是不包含记录本身
- Next-Key Lock: Record Key + Gap Lock的组合,锁定一个范围，并且锁定记录本身

### Record Lock
Record Lock称为记录锁，锁住的是一条记录。记录锁是有S锁和X锁之分：

- 当一个事务对一条记录加了S锁，其它事务也可以继续对该记录加S锁记录锁（S锁与S锁兼容），但是不可以对该记录加X锁记录锁（S锁与X锁不兼容）
- 当一个事务对一条记录加了X锁记录锁后，其它事务既不可以对该记录加S锁记录锁（S锁与X锁不兼容），也不可以对该记录加X型记录锁（X型与X型锁不兼容）
### Gap Lock
Gap Lock称为间隙锁，只存在于可重复读隔离级别，目的是为了解决可重复读隔离级别下幻读的出现
比如，表中一个范围id是(3,5)间隙锁，那么其它事务就无法插入id=4的这条记录，这样就可以有效防止幻读现象的发生
间隙锁虽然存在X型间隙锁和 S型间隙锁，但是并没有什么区别，间隙锁之间是兼容的，即两个事务可以同时持有包含共同间隙范围的间隙锁，并不存在互斥关系，因为间隙锁的目的是防止插入幻影记录而提出的
![](https://cdn.nlark.com/yuque/0/2023/png/316533/1679407696898-0034c458-7d26-4744-b9fc-45b9bf64a2d3.png#averageHue=%23f5f5f5&clientId=u39d55f2d-1745-4&from=paste&id=u144b770d&originHeight=231&originWidth=411&originalType=url&ratio=1&rotation=0&showTitle=false&status=done&style=none&taskId=u56224238-cfcf-44f4-bf08-31e316d7ab0&title=)
### Next-Key Lock
Next-Key Lock 称为 临键锁，是 Record Lock + Gap Lock 的组合，锁定一个范围，并且锁定记录本身
假设，表中有一个范围id为 (3,5] 的next-key lock,那么其它事务既不能插入id=4记录，也不能修改id=5这条数据
next-key lock 既能保护该记录，又能阻止其它事务将新记录插入到被保护记录前面的间隙中
Next-Key Lock 是包含了 间隙锁 + 记录锁的，如果一个事务获取了X型的next-key lock，那么另外一个事务在获取相同范围的X型的next-key lock时，是会被阻塞的
比如，一个事务持有了范围为 (1, 10] 的 X 型的 next-key lock，那么另外一个事务在获取相同范围的 X 型的 next-key lock 时，就会被阻塞
![](https://cdn.nlark.com/yuque/0/2023/png/316533/1679408059059-9d23a14e-2614-4982-93d9-db1986f9e329.png#averageHue=%23f5f2f2&clientId=u39d55f2d-1745-4&from=paste&id=uccc2bc38&originHeight=231&originWidth=411&originalType=url&ratio=1&rotation=0&showTitle=false&status=done&style=none&taskId=u3f6fbadc-2a47-43cb-a291-2a3dc718211&title=)


### 插入意向锁
一个事务在插入一条记录的时候，需要判断插入位置是否已被其它的事务加了间隙锁(next-key lock 也包含间隙锁)
如果有的话，插入操作就会发生阻塞，直到拥有间隙锁的哪个事务提交为止（释放间隙锁的时刻），在此期间会生成一个插入意向锁，表明事务想在某个区间插入新纪录，但是现在处于等待状态
比如，假设事务A已经对表加了一个范围id为（3，5）间隙锁
当事务A还没提交的时候，事务B向该表插入一条id=4的新纪录，这时会判断到插入的位置已经被事务A加了间隙锁，于是事务B会生成一个插入意向锁，然后将锁的状态设置为等待状态，此时事务B就会发生阻塞，直到事务A提交了事务
插入意向锁名字虽然有意向锁，但是它并不是意向锁，它是一种特殊的间隙锁，属于行级别锁
![](https://cdn.nlark.com/yuque/0/2023/png/316533/1679408472902-656c12c0-313f-4c3f-8b53-e25f896bd181.png#averageHue=%23f5f5f5&clientId=u39d55f2d-1745-4&from=paste&id=u2d0c8ec1&originHeight=231&originWidth=411&originalType=url&ratio=1&rotation=0&showTitle=false&status=done&style=none&taskId=u24b0f722-8c68-48bf-9e92-d3634aeaeea&title=)

# MySql加锁
## 加锁SQL语句
InnoDB 引擎是支持行级锁的，而 MyISAM 引擎并不支持行级锁
普通的select语句是不会对记录加锁的（除了串行化隔离级别），因为它属于快照读，是通过MVCC（多版本并发控制）实现的
如果要在查询的对记录加行级锁，使用如下：
```
//对读取的记录加共享锁(S型锁)
select ... lock in share mode;

//对读取的记录加独占锁(X型锁)
select ... for update;
```

update和delete操作都会加行级锁，且锁的类型都是独占锁(X锁)
```
//对操作的记录加独占锁(X型锁)
update table .... where id = 1;

//对操作的记录加独占锁(X型锁)
delete from table where id = 1;
```
共享锁(S锁)满足读读共享，读写互斥。独占锁(S锁)，满足写写互斥，读写互斥
![](https://cdn.nlark.com/yuque/0/2023/png/316533/1679409055041-3dcb980e-5f41-4164-85a4-70ac01dc1d90.png#averageHue=%23faedce&clientId=u39d55f2d-1745-4&from=paste&id=u26bad9b1&originHeight=226&originWidth=572&originalType=url&ratio=1&rotation=0&showTitle=false&status=done&style=none&taskId=u244ae302-335a-45f1-a380-16e45cc8ad3&title=)
## 如何加行级锁
加锁的对象是索引，加锁的基本单位是 next-key lock,它是由记录锁和间隙锁组合而成的，next-key lock 是前开后闭，而间隙锁是前开后后区间
next-key lock退化成记录锁或者间隙锁场景： 在能使用记录锁或者间隙锁就能避免幻读现场的场景下，next-key lock就会退化成记录锁或者间隙锁
LOCK_MODE可以确定是 next-key 锁 还是 间隙锁，还是记录锁：

- 如果 LOCK_MODE 是 x , 说明是 next-key 锁
- 如果 LOCK_MODE 是 x, REC_NOT_GAP, 说明是记录锁
- 如果 LOCK_MODE 是 x, GAP, 说明是间隙锁
### 唯一索引等值查询

- 当查询的记录是存在的话，在索引树上定位到这一条记录后，将该记录的索引中的next-key lock会退化成记录锁

![](https://cdn.nlark.com/yuque/0/2023/png/316533/1679409998711-392487ee-7027-4758-99f4-24c40329f6de.png#averageHue=%23eddda1&clientId=u39d55f2d-1745-4&from=paste&id=ubd16f70e&originHeight=231&originWidth=511&originalType=url&ratio=1&rotation=0&showTitle=false&status=done&style=none&taskId=uc988f514-6459-4e54-a794-c7997f78781&title=)
![](https://cdn.nlark.com/yuque/0/2023/png/316533/1679410004919-e7d3e898-bbdb-400b-9c31-bf5fcb2a5549.png#averageHue=%231f1a19&clientId=u39d55f2d-1745-4&from=paste&id=ue25b8287&originHeight=482&originWidth=722&originalType=url&ratio=1&rotation=0&showTitle=false&status=done&style=none&taskId=u10ff789f-a010-4e11-a2f8-f3554bec8ea&title=)

- 当查询的记录是不存在的话，在索引树找到第一条大于该查询记录的记录后，将该记录的索引命中的next-key lock 会退化成间隙锁

此时事务A在id=5记录的主键索引上加的是间隙锁，锁住的范围是（1，5），接下来如果有其它事务插入id值为2，3，4这些记录的话，这些插入语句都会发生冲突；如果是插入1和5的话，就出现主键冲突的错误
![](https://cdn.nlark.com/yuque/0/2023/png/316533/1679410014751-ca636a8f-8070-4272-b930-f24a22b7c5f6.png#averageHue=%23f6e5a9&clientId=u39d55f2d-1745-4&from=paste&id=u1aa807f2&originHeight=407&originWidth=767&originalType=url&ratio=1&rotation=0&showTitle=false&status=done&style=none&taskId=u6c1ed42a-a1b7-4cc7-be9a-806277aa84c&title=)
![](https://cdn.nlark.com/yuque/0/2023/png/316533/1679410103320-12219b56-9a13-4fa0-bd99-df5b9918a756.png#averageHue=%2363874e&clientId=u39d55f2d-1745-4&from=paste&id=u5c009587&originHeight=321&originWidth=521&originalType=url&ratio=1&rotation=0&showTitle=false&status=done&style=none&taskId=u38a0b0c9-da7e-40f2-8d5e-b2682b1c93f&title=)

### 唯一索引范围查询
当唯一索引进行范围查询的时候，会对每一个扫描到的索引加next-key lock锁，然后如果遇到下面这些情况，会退化成记录锁或者间隙锁：

- 情况一： 针对大于等于的范围查询，因为存在等值查询的条件，那么如果等值查询的记录是存在于表中，那么该记录的索引中的next-key锁
- 情况二： 针对小于或者小于等于的范围查询，看条件值的记录是否存在于表中：
   1. 当条件值的记录不在表中，那么不管是 小于 还是 小于等于 条件的范围查询，扫描到终止范围查询的时候时，该记录的索引的next-key锁会退化成间隙锁，其它扫描到的记录，都是在这些记录的索引上加next-key锁
   2. 当条件值的记录在表中，如果是小于条件的范围查询，扫描到终止范围的记录时，该记录的索引的next-key锁会退化成间隙锁，其它扫描到的记录，都是在这些记录的索引上加 next-key 锁；如果「小于等于」条件的范围查询，扫描到终止范围查询的记录时，该记录的索引 next-key 锁不会退化成间隙锁。其他扫描到的记录，都是在这些记录的索引上加 next-key 锁
### 非唯一索引等值查询
当我们用非唯一索引进行等值查询的时候，因为存在两个索引，一个是主键索引，一个是非唯一索引（二级索引），所以在加锁时，同时会对这两个索引都加锁，但是对主键索引加锁的时候，只有满足查询条件的记录才会对它们的主键索引加锁

- 当查询的记录存在时，由于不是唯一索引，所以肯定存在索引值相同的记录，于是非唯一索引等值查询的过程是一个扫描过程，直到扫描到第一个不合符条件的二级索引记录就停止扫描，然后扫描的过程中，对扫描的二级索引记录是next-key lock锁，而对于第一个不符合条件的二级索引记录，该二级索引的next-key lock锁退化成间隙锁。同时，在符合查询条件的记录的主键索引上加记录锁
- 当查询记录不存在时，扫描到第一条不符合的二级索引记录，该二级索引的next-key lock锁会退化成间隙锁。因为不存在满足查询条件的记录，所以不会对主键锁加锁
### 非唯一索引范围查询
非唯一索引和主键索引的范围查询的加锁也有锁不同，不同之处在于非唯一索引的范围查询，索引的next-key lock不会有退化为间隙锁和记录锁的情况，也就是非唯一索引进行范围查询时，对二级索引加锁都是next-key lock
### 没加索引的查询
**如果锁定读查询语句，没有使用索引列作为查询条件，或者查询语句没有走索引查询，导致扫描是全表扫描。那么，每一条记录的索引上都会加 next-key 锁，这样就相当于锁住的全表，这时如果其他事务对该表进行增、删、改操作的时候，都会被阻塞**
** **不只是锁定查询语句不加索引才会导致这种情况，update和delete语句如果查询条件不加索引，那么由于扫描的方式是全表扫描，于是就会对每一条记录的索引上都会加 next-key 锁，这样就相当于锁住的全表
因此，**在线上在执行 update、delete、select ... for update 等具有加锁性质的语句，一定要检查语句是否走了索引，如果是全表扫描的话，会对每一个索引加 next-key 锁，相当于把整个表锁住了**，这是挺严重的问题

![](https://cdn.nlark.com/yuque/0/2023/jpeg/316533/1679411672749-49203927-d125-47ac-ba50-192a3c99afec.jpeg#averageHue=%23f5f5f5&clientId=u39d55f2d-1745-4&from=paste&id=u6681e179&originHeight=1292&originWidth=2264&originalType=url&ratio=1&rotation=0&showTitle=false&status=done&style=none&taskId=u45c7b761-35d2-41d5-b451-0b0dff51264&title=)

![](https://cdn.nlark.com/yuque/0/2023/jpeg/316533/1679411677178-61a46e94-f9b5-4cfc-a664-e9a03465a0c5.jpeg#averageHue=%23f3f3f3&clientId=u39d55f2d-1745-4&from=paste&id=u46161208&originHeight=1554&originWidth=1020&originalType=url&ratio=1&rotation=0&showTitle=false&status=done&style=none&taskId=u7edfd73c-e9c9-455b-a8d1-dbf2789722e&title=)
