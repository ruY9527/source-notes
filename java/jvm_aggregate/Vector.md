##                            Vector 源码分析



Vector 的结构和对数据的添加和删除 与 [ArrayList](https://github.com/baoyang23/source-notes/blob/master/java/jvm_aggregate/ArrayList_Source.md) 是非常相似的. 可以点进去看看.



具体的执行逻辑代码还是非常相似的. 



Vector 比起 ArrayList 是线程安全的原因是, Vector 在一些方法上是使用了 synchronized 来进行加锁,从而保证了线程安全问题。