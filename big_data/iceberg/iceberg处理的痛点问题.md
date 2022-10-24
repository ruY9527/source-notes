## 痛点问题

### 痛点一

1. 不提供ACID语义,在发生数据改动时,很难隔离对分析任务的影响。典型的操作: Insert OverWrite;修改分区,修改Scheme
2. 无法处理多个数据改动,造成冲突问题
3. 无法有效回溯历史版本
### 痛点二
1. 数据访问接口直接依赖 HDFS API
2. 依赖RENAME接口的原子性,这在类似S3这样的对象存储上很难实现同样的语义
3. 大量依赖文件目录的list接口，这在对象存储系统上很低效
### 太多细节
1. Scheme变更时,不同文件格式行为不一致。不同的fileFormat甚至连数据类型的支持都不一致
2. Metastore仅维护partition级别的统计信息，造成task plan开销；Hive Metastore难以扩展
3. 非partition字段不能做partition prune

## Iceberg核心设计
### 标准化设计
1. 完美解耦计算引擎
2. Schema标准化
3. 开放的数据格式
4. 支持java和python
### 完善的Table语义
1. Schema定义与变更
2. 灵活的partition策略
3. ACID语义
4. Snapshot语义
### 丰富的数据管理
1. 存储的流批一体
2. 可扩展的META设计支持
3. 批更新和CDC
4. 支持文件加密
### 性价比
1. 计算下推设计
2. 低成本的元数据管理
3. 向量化计算
4. 轻量级索引

## CDC结合Iceberg场景
### CDC到HIVE分析
MySql到Hibe的数据流向, 维护一个全量分区,然后每天做一个增量分区,然后把新增分区写好之后进行一次merge,写入一个新的分区.
新增数据和全量数据的Merge是有延时的，数据不是实时的写入，典型的是一天进行一次Merge，这就是T+1的数据。时效性很差，不支持实时的upsert。每次Merge都需要把所有的数据全部重读重写一遍，效率比较差，比较浪费资源
### Spark+Delta分析CDC数据
Spark+Delta在分析CDC数据的时候提供了Merge Into的语法,这并不是仅仅是对Hive数仓的语法简化,Spark+Delta作为新型数据湖架构(例如 Iceberg,Hidu),它对数据的管理不是分区，而是文件，因此Detla优化Merge Into语法,仅扫描和重写发生变化的文件即可，因此高效很多。

