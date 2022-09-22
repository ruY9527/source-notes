---
title: mybatis本地缓存阅读
date: 2021-11-04 00:28:33
tags: 
  - java框架
  - mybatis
categories:
  - java框架
  - mybatis
---

#### 题记

####  缓存这个知识点在许多地方都有的，利用到好的话，对系统的很多地方查询是有很大的提升的. 可以看到,MyBatis 也是有 cache 的，那MyBatis 是怎么利用这个缓存的呢？ 在 INSERT/UPDATE/DELETE/SELECT中,是不是只有SELECT的时候用到了缓存，如果是 INSERT/UPDATE/DELETE 是否会对缓存有影响？

 可以看结果来分析，然后跟进源码来仔细分析.

 MyBatis 是分为 一级缓存 和 二级缓存的. 那么，我们就先从一级缓存开始.

#### 一级缓存

 案例代码 :

 这里我们是打印的查询sql的语句，再第二次再查询的时候，是

```
InputStream mybatisInputStream = Resources.getResourceAsStream("mybatis-config.xml");

SqlSessionFactory sqlSessionFactory = new SqlSessionFactoryBuilder().build(mybatisInputStream);
SqlSession session = sqlSessionFactory.openSession();
BlogMapper blogMapper = session.getMapper(BlogMapper.class);
TbBlog tbBlog = blogMapper.selectBlog(1);
System.out.println(blogMapper.selectBlog(1));
System.out.println(tbBlog);


// 结果可以看到,第二次并没有再打印出 sql 语句来.
==>  Preparing: select * from tb_blog where id = ? 
==> Parameters: 1(Integer)
<==    Columns: id, name
<==        Row: 1, 6565
<==      Total: 1
TbBlog{id=1, name='6565'}
TbBlog{id=1, name='6565'}
```

案例二 : 我们再第二次查询之前 加入 一个add 方法

```
InputStream mybatisInputStream = Resources.getResourceAsStream("mybatis-config.xml");

SqlSessionFactory sqlSessionFactory = new SqlSessionFactoryBuilder().build(mybatisInputStream);
SqlSession session = sqlSessionFactory.openSession();
BlogMapper blogMapper = session.getMapper(BlogMapper.class);
TbBlog tbBlog = blogMapper.selectBlog(1);

System.out.println(blogMapper.addBlog("GavinYang"));
System.out.println(blogMapper.selectBlog(1));
System.out.println(tbBlog);

// 看结果,可以看到当中间穿插一个 insert 的sql语句,那么在第二次查询的时候,就会执行sql语句.
// 那么也就说，这个时候缓存是失效了.
==>  Preparing: select * from tb_blog where id = ? 
==> Parameters: 1(Integer)
<==    Columns: id, name
<==        Row: 1, 6565
<==      Total: 1
==>  Preparing: insert into tb_blog (name) values(?) 
==> Parameters: GavinYang(String)
<==    Updates: 1
1
==>  Preparing: select * from tb_blog where id = ? 
==> Parameters: 1(Integer)
<==    Columns: id, name
<==        Row: 1, 6565
<==      Total: 1
TbBlog{id=1, name='6565'}
TbBlog{id=1, name='6565'}
```

案例三 : 使用二个 SqlSession 案例

可以很明显的看到 , 在第二次的时候还出现了脏数据.

这里也可以看到一级缓存是只在 SqlSession 中存在的,也就是数据库会话内部共享的.

```
InputStream mybatisInputStream = Resources.getResourceAsStream("mybatis-config.xml");
SqlSessionFactory sqlSessionFactory = new SqlSessionFactoryBuilder().build(mybatisInputStream);

SqlSession openSession1 = sqlSessionFactory.openSession();
SqlSession openSession2 = sqlSessionFactory.openSession();
BlogMapper blogMapper1 = openSession1.getMapper(BlogMapper.class);
BlogMapper blogMapper2 = openSession2.getMapper(BlogMapper.class);

System.out.println("blogMapper1 读取数据 " + blogMapper1.selectBlog(1));
System.out.println("blogMapper2 读取数据" + blogMapper2.selectBlog(1));

System.out.println(blogMapper1.updateHashCode("PeterWong"));

System.out.println("blogMapper1 读取数据 " + blogMapper1.selectBlog(1));
System.out.println("blogMapper2 读取数据" + blogMapper2.selectBlog(1));

// 然后我们可以看到 log 打印出来的内容
==>  Preparing: select * from tb_blog where id = ? 
==> Parameters: 1(Integer)
<==    Columns: id, name
<==        Row: 1, 6565
<==      Total: 1
blogMapper1 读取数据 TbBlog{id=1, name='6565'}
Created connection 433287555.
Setting autocommit to false on JDBC Connection [com.mysql.jdbc.JDBC4Connection@19d37183]
==>  Preparing: select * from tb_blog where id = ? 
==> Parameters: 1(Integer)
<==    Columns: id, name
<==        Row: 1, 6565
<==      Total: 1
blogMapper2 读取数据TbBlog{id=1, name='6565'}
==>  Preparing: update tb_blog set name = ? where id = 1; 
==> Parameters: PeterWong(String)
<==    Updates: 1
1
==>  Preparing: select * from tb_blog where id = ? 
==> Parameters: 1(Integer)
<==    Columns: id, name
<==        Row: 1, PeterWong
<==      Total: 1
blogMapper1 读取数据 TbBlog{id=1, name='PeterWong'}
blogMapper2 读取数据TbBlog{id=1, name='6565'}
```

可以看到我们说了三面的这三种情况, 具体的执行流程可以我们可以现在 案例一里面对第二次 query 进行 debug 分析操作. 当我们debug到 org.apache.ibatis.executor.BaseExecutor#query(org.apache.ibatis.mapping.MappedStatement, java.lang.Object, org.apache.ibatis.session.RowBounds, org.apache.ibatis.session.ResultHandler, org.apache.ibatis.cache.CacheKey, org.apache.ibatis.mapping.BoundSql) 的时候，可以看到 org.apache.ibatis.executor.BaseExecutor#localCache 只有一个 缓存的值的 ， 根据 getObject 方法可以跟进到 org.apache.ibatis.cache.impl.PerpetualCache#cache 中来,

传入进来的 key 值是 : -1896651191:1062027004:com.iyang.mybatis.mapper.BlogMapper.selectBlog:0:2147483647:select * from tb_blog where id = ?:1:development 然后从 cache 中获取出值来, 所以这里就没有走 query 的查询语句.

这是命中缓存的情况.

下面我们来看下, 在第二次 query 之前如果执行了一个 add 方法，为什么就命中不了了呢？

这里可以大致猜测下，在执行完 add 方法后，是不是给 cache 给清除掉了，然后再去查询的时候，就查询不到了.

于是我们在 add 方法上进行 debug 查看下 :

最后我们 debug 跟进到这里 : org.apache.ibatis.executor.BaseExecutor#clearLocalCache 就可以发现

这里是有二个 clear 方法，也就是清除方法.

localCache.clear() —-> org.apache.ibatis.cache.impl.PerpetualCache#clear 对应的就是这里的清楚方法，直接调用 HashMap 的clear 方法进行清除.

```
localCache.clear();
localOutputParameterCache.clear();
```

所以这里可以看出在第二次调用 query 之前，如果是有 insert/update/delete 等方法的话，就会去重置这二个地方的缓存的.

MyBatis 的一级缓存的是跟随 SqlSession 的，这里是可以根据简单的案例效果看出来的.

一级缓存只是使用了一个 HashMap , 最后清除缓存的时候，也是调用 HashMap 的clear 方法

最后从案例三可以看出来，当多个 SqlSession 的时候，由于各自有存有各自的缓存，所以是很容易引起脏数据的, 将缓存级别设置为 Statement.

#### 二级缓存

 可以看到一级缓存的话，是局限于 SqlSession . 如果要多个 sqlSession 之间共享缓存的话，就需要开启二级缓存. 开启的话,我们在 MyBatis 配置文件中加上:

```
<settings>
    <setting name="logImpl" value="STDOUT_LOGGING"/>

    <!-- 开启二级缓存 -->
    <setting name="cacheEnabled" value="true"/>
</settings>
```

 **案例一 : 是否提交事务**

```
public static void main(String[] args) throws Exception {

    InputStream mybatisInputStream = Resources.getResourceAsStream("mybatis-config.xml");
    SqlSessionFactory sqlSessionFactory = new SqlSessionFactoryBuilder().build(mybatisInputStream);
    SqlSession sqlSession1 = sqlSessionFactory.openSession(true);
    SqlSession sqlSession2 = sqlSessionFactory.openSession(true);

    BlogMapper blogMapper1 = sqlSession1.getMapper(BlogMapper.class);
    BlogMapper blogMapper2 = sqlSession2.getMapper(BlogMapper.class);

    System.out.println("blogMapper1 获取数据" + blogMapper1.selectBlog(1));
    
    // sqlSession1.commit();
    
    System.out.println("blogMapper2 获取数据" + blogMapper2.selectBlog(1));

}

//   ----------------   true结果   -----------------------

Created connection 492079624.
==>  Preparing: select * from tb_blog where id = ? 
==> Parameters: 1(Integer)
<==    Columns: id, name
<==        Row: 1, 6565
<==      Total: 1
blogMapper1 获取数据TbBlog{id=1, name='6565'}
Opening JDBC Connection
    
Created connection 433287555.
==>  Preparing: select * from tb_blog where id = ? 
==> Parameters: 1(Integer)
<==    Columns: id, name
<==        Row: 1, 6565
<==      Total: 1
blogMapper2 获取数据TbBlog{id=1, name='6565'}    
    

// ------------   加上commit()方法结果   ---------------

Created connection 630074945.
==>  Preparing: select * from tb_blog where id = ? 
==> Parameters: 1(Integer)
<==    Columns: id, name
<==        Row: 1, 6565
<==      Total: 1
blogMapper1 获取数据TbBlog{id=1, name='6565'}
Cache Hit Ratio [com.iyang.mybatis.mapper.BlogMapper]: 0.5
blogMapper2 获取数据TbBlog{id=1, name='6565'}
```

 从这里看, 是否提交事务可以看出来，是会影响二级缓存的.

**案例二 : 中间穿插更新语句**

```
public static void main(String[] args)  throws Exception {

    InputStream mybatisInputStream = Resources.getResourceAsStream("mybatis-config.xml");
    SqlSessionFactory sqlSessionFactory = new SqlSessionFactoryBuilder().build(mybatisInputStream);
    SqlSession sqlSession1 = sqlSessionFactory.openSession(false);
    SqlSession sqlSession2 = sqlSessionFactory.openSession(false);
    SqlSession sqlSession3 = sqlSessionFactory.openSession(false);

    BlogMapper blogMapper1 = sqlSession1.getMapper(BlogMapper.class);
    BlogMapper blogMapper2 = sqlSession2.getMapper(BlogMapper.class);
    BlogMapper blogMapper3 = sqlSession3.getMapper(BlogMapper.class);

    System.out.println(" blogMapper1 查询出来的数据 : " + blogMapper1.selectBlog(1));
    sqlSession1.commit();

    System.out.println(" blogMapper2 查询出来的结果 : " + blogMapper2.selectBlog(1));

    System.out.println(blogMapper3.updateHashCode("GavinYang"));
    sqlSession3.commit();

    System.out.println(" blogMapper2 查询出来的结果 : " + blogMapper2.selectBlog(1));
}

//  ------------------  打印结果 ------

Created connection 630074945.
Setting autocommit to false on JDBC Connection [com.mysql.jdbc.JDBC4Connection@258e2e41]
==>  Preparing: select * from tb_blog where id = ? 
==> Parameters: 1(Integer)
<==    Columns: id, name
<==        Row: 1, 6565
<==      Total: 1
 blogMapper1 查询出来的数据 : TbBlog{id=1, name='6565'}
Cache Hit Ratio [com.iyang.mybatis.mapper.BlogMapper]: 0.5
 blogMapper2 查询出来的结果 : TbBlog{id=1, name='6565'}

Created connection 603443293.
Setting autocommit to false on JDBC Connection [com.mysql.jdbc.JDBC4Connection@23f7d05d]
==>  Preparing: update tb_blog set name = ? where id = 1; 
==> Parameters: GavinYang(String)
<==    Updates: 1
1
Committing JDBC Connection [com.mysql.jdbc.JDBC4Connection@23f7d05d]
Cache Hit Ratio [com.iyang.mybatis.mapper.BlogMapper]: 0.3333333333333333
Opening JDBC Connection
    
    
Created connection 707976812.
Setting autocommit to false on JDBC Connection [com.mysql.jdbc.JDBC4Connection@2a32de6c]
==>  Preparing: select * from tb_blog where id = ? 
==> Parameters: 1(Integer)
<==    Columns: id, name
<==        Row: 1, GavinYang
<==      Total: 1
 blogMapper2 查询出来的结果 : TbBlog{id=1, name='GavinYang'}
```

这里是可以看到在更新之后并且 commit 了事务之后，后面紧跟的 sql 是去查询 数据库了的. 所以这里是可以看出来，update等操作是会去 清空对应的缓存的。

这里我们根据 案例一 的情况来分析，在开启了 二级缓存 的时候，是从哪里获取出来的数据的呢？

debug 跟进来 : org.apache.ibatis.executor.CachingExecutor#query(org.apache.ibatis.mapping.MappedStatement, java.lang.Object, org.apache.ibatis.session.RowBounds, org.apache.ibatis.session.ResultHandler, org.apache.ibatis.cache.CacheKey, org.apache.ibatis.mapping.BoundSql)

```
@Override
public <E> List<E> query(MappedStatement ms, Object parameterObject, RowBounds rowBounds, ResultHandler resultHandler, CacheKey key, BoundSql boundSql)
    throws SQLException {
  Cache cache = ms.getCache();
  if (cache != null) {
    flushCacheIfRequired(ms);
    if (ms.isUseCache() && resultHandler == null) {
      ensureNoOutParams(ms, boundSql);
      @SuppressWarnings("unchecked")
// debug 到这里，可以看到,就已经返回了我们需要的数据.        
      List<E> list = (List<E>) tcm.getObject(cache, key);
      if (list == null) {
        list = delegate.query(ms, parameterObject, rowBounds, resultHandler, key, boundSql);
        tcm.putObject(cache, key, list); // issue #578 and #116
      }
      return list;
    }
  }
  return delegate.query(ms, parameterObject, rowBounds, resultHandler, key, boundSql);
}
```

org.apache.ibatis.executor.CachingExecutor#tcm 调用这个对象的 getObject 方法获取到了我们需要的值, 跟进来又从 org.apache.ibatis.cache.decorators.TransactionalCache 的 getObject 获取出我们的值, 最后从 org.apache.ibatis.cache.decorators.TransactionalCache#delegate 获取出值, 返回回来的.

org.apache.ibatis.cache.decorators.TransactionalCache#getObject

```
@Override
public Object getObject(Object key) {
  // issue #116
// 从缓存中获取出值.    
  Object object = delegate.getObject(key);
  if (object == null) {
// 如果获取出来是null,也就是缓存中没有的话,org.apache.ibatis.cache.decorators.TransactionalCache#entriesMissedInCache 就添加到这个集合中来.      
    entriesMissedInCache.add(key);
  }
  // issue #146
// commit 后需要 clear 的话，就会返回 null.
// 这里想下这个变量会不会和我门案例二中的 update 操作有关系呢？
// 这里再 update后再 debug 发现,  delegate 中获取出来的是 null ,也就是确实是获取不到缓存了
// 和这个参数没关系.    
  if (clearOnCommit) {
    return null;
  } else {
    return object;
  }
}
```

MyBatis 二级缓存不适应于配置文件中存在多表查询的情况. 一般我们是单表的 cache, 由于 mybatis 的二级缓存是基于 namespace 的, 多表查询语句所在的 namespace 无法感应到其他的 namespace 中的语句对多表中设计修改，就会引发脏数据. 这个时候，可以采用 cache-ref 来做处理，但是这样的话,缓存的颗粒度就变粗了.

执行流程 : 如果开启了二级缓存的话， MyBatis 会先走二级缓存，如果二级缓存没有的话，就会去一级缓存看看，如果都没有的话，就去查询数据库.

二级缓存 : 用 org.apache.ibatis.executor.CachingExecutor 装饰了 org.apache.ibatis.executor.BaseExecutor 的子类, 委托具体职责给 delegate 之前，实现了二级缓存的查询和写入功能.

#### 总结

最后看 一级缓存和二级缓存，都是利用的 HashMap 这种来做到本地缓存， 只是二级缓存的作用范围比起一级缓存的话，是要大的，并且也利用了一些 装饰者 等设计模式来设计二级缓存的.

如果是部署的分布式项目的话，那么还是 得切换到 redis 这种缓存来了， 本地利用 HashMap 这种缓存满足不了的.

文献参考地址 : https://tech.meituan.com/2018/01/19/mybatis-cache.html
