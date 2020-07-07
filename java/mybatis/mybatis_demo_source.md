## 				 MyBatis 阅读记录



####  题记

​	作为一名 "优秀的" CRUD 工程师,如果不看MyBatis是个怎么大概的执行流程的话,那还真是有点可惜.  所以阅读一下其源码和执行流程,是很有帮助的.  同时,看下其代码(设计模式等对成长也是很有帮助的).



#### 代码

​	其 GitHub[代码地址](https://github.com/mybatis/mybatis-3)

​    其 [官方说明文档](https://mybatis.org/mybatis-3/zh/configuration.html#properties)

​    先将github上的代码clone下来,导入到本地的idea中. 然后按照官方文档的demo搭建就可以了. 这里自行创建一个 resources 目录即可,也就是放置一些配置文件信息的. 

  先写一个实体类.	

```java
public class Phone {
  private Integer id;
  private String phone;
  public Phone() {
  }
  public Phone(Integer id, String phone) {
    this.id = id;
    this.phone = phone;
  }
  public Integer getId() {
    return id;
  }
  public void setId(Integer id) {
    this.id = id;
  }
  public String getPhone() {
    return phone;
  }
  public void setPhone(String phone) {
    this.phone = phone;
  }
  @Override
  public String toString() {
    return "Phone{" + "id=" + id + ", phone='" + phone + '\'' + '}';
  }
}
```



再写一个Mapper的接口. 可以看到我这里使用的方法都没修改,不能遗忘 Ctrl + C/V大师功能.

```java
public interface PhoneMapper {  Phone selectBlog(Integer id);}
```



MyBatis的 xml 配置文件来一份:  resouces下创建:mybatis-config.xml

```java
<?xml version="1.0" encoding="UTF-8" ?>
<!DOCTYPE configuration
  PUBLIC "-//mybatis.org//DTD Config 3.0//EN"
  "http://mybatis.org/dtd/mybatis-3-config.dtd">
<configuration>
  <environments default="development">
    <environment id="development">
      <transactionManager type="JDBC"/>
      <dataSource type="POOLED">
        <property name="driver" value="com.mysql.jdbc.Driver"/>
        <property name="url" value="jdbc:mysql://127.0.0.1:3306/two"/>
        <property name="username" value="root"/>
        <property name="password" value="root"/>
      </dataSource>
    </environment>
  </environments>
  <mappers>
    <mapper resource="pojo/PhoneMapper.xml"/>
  </mappers>
</configuration>
```



对用的pojo的Mapper的xml也给来一份 : pojo/PhoneMapper.xml , 这里是在 resouces下的pojo文件夹中.

```java
<?xml version="1.0" encoding="UTF-8" ?>
<!DOCTYPE mapper
  PUBLIC "-//mybatis.org//DTD Mapper 3.0//EN"
  "http://mybatis.org/dtd/mybatis-3-mapper.dtd">
<mapper namespace="org.apache.ibatis.mapper.PhoneMapper">
  <select id="selectBlog" resultType="org.apache.ibatis.pojo.Phone">
    select * from phone where id = #{id}
  </select>
</mapper>
```



最后写一个启动类即可: StartMain

 这里先运行一下,看下能不能获取到我们想要的结果,也就是有没有错误或者异常等信息给报出来. 如果没有的话,就说明是ok的. 然后就可以开始我们愉快的debug旅行了.

```java
public class StartMain {
  public static void main(String[] args) throws Exception {
    String resouce = "mybatis-config.xml";
    /**
     * 读取 mybatis文件,返回的是 InputStream流
     */
    InputStream inputStream = Resources.getResourceAsStream(resouce);
    /**
     * 使用 SqlSessionFactoryBuilder 来构建出一个 SqlSessionFactory来.
     */
    SqlSessionFactory sqlSessionFactory = new SqlSessionFactoryBuilder().build(inputStream);
    SqlSession session = sqlSessionFactory.openSession();
    PhoneMapper phoneMapper = session.getMapper(PhoneMapper.class);
    System.out.println(phoneMapper.selectBlog(1).toString());
  }
}
```



#### 方法(debug)

​	这里我们只需要跟着 StartMain 中的方法,一步一步的走下去, 弄明白每个方法是说明意思,然后在其内部是怎么走的。



Resources.getResourceAsStream(resouce) 方法:

```java
  /**
   * Returns a resource on the classpath as a Stream object
   *
   * @param loader   The classloader used to fetch the resource
   * @param resource The resource to find
   * @return The resource
   * @throws java.io.IOException If the resource cannot be found or read
   */
  public static InputStream getResourceAsStream(ClassLoader loader, String resource) throws IOException {
// in 最后是从  getResourceAsStream() 方法返回回来的. 
// ClassLoaderWrapper 是 Resources的全局变量,并且最初就已经实例化了,所以这里就直接使用了.      
    InputStream in = classLoaderWrapper.getResourceAsStream(resource, loader);
// 如果inputStream是null的话,就会抛出异常来.      
    if (in == null) {
      throw new IOException("Could not find resource " + resource);
    }
    return in;
  }
  
  
  /**
   * Try to get a resource from a group of classloaders
   *
   * @param resource    - the resource to get
   * @param classLoader - the classloaders to examine
   * @return the resource or null
这里的classLoader集合,分别是 
new ClassLoader[]
{classLoader,defaultClassLoader,
Thread.currentThread().getContextClassLoader(),
getClass.getClassLoader(),systemClassLoader} 
分别是这五个.   
   */
  InputStream getResourceAsStream(String resource, ClassLoader[] classLoader) {
// 对传入进来的classLoader数组进行迭代,跳过classLoader是null的,
//如果 classLoader的getResourceAsStream方法,
//传入进去的是 resource,返回的InputStream不是null的话,就会返回.      
    for (ClassLoader cl : classLoader) {
      if (null != cl) {
        // try to find the resource as passed
        InputStream returnValue = cl.getResourceAsStream(resource);

        // now, some class loaders want this leading "/", so we'll add it and try again if we didn't find the resource
        if (null == returnValue) {
          returnValue = cl.getResourceAsStream("/" + resource);
        }

        if (null != returnValue) {
          return returnValue;
        }
      }
    }
    return null;
  }  
```





new SqlSessionFactoryBuilder().build(inputStream) 方法:



该方法可以看其返回的结果,是返回了一个SqlSessionFactroy的回话工厂.

org.apache.ibatis.session.SqlSessionFactoryBuilder#build(java.io.InputStream, java.lang.String, java.util.Properties)  

该方法最后是走到了这里.

```java
  public SqlSessionFactory build(InputStream inputStream, String environment, Properties properties) {
    try {       
      XMLConfigBuilder parser = new XMLConfigBuilder(inputStream, environment, properties);
      return build(parser.parse());
    } catch (Exception e) {
      throw ExceptionFactory.wrapException("Error building SqlSession.", e);
    } finally {
      ErrorContext.instance().reset();
      try {
       //  最后给流关一下   
        inputStream.close();
      } catch (IOException e) {
        // Intentionally ignore. Prefer previous error.
      }
    }
  }

---------------------------------
new XMLConfigBuilder构造方法
/**该构造方法,其先new一个XMLMapperEntityResolver,然后最后在new一个XPathParser,
最后走this()构造方法.  
new XPathParser构造方法: 
	先是给 validation/entityResolver/variables/xpath进行赋值.
	然后给inputStream给包装成 inputSource.
	掉用createDocument方法: 先弄一个 DocumentBuilderFactory出来,然后对其属性进行设置操作.
	  再调用parse方法, 最后返回的 this.document的类是 DeferredDocumentImpl这个类.	
this()构造方法: new Configuration()可以看到该类,给typeAliasRegistry和languageRegistry里面进行设值等操作,同时其全局参数也会一同会被实例化的,可以看到其全局参数还是蛮多的.  
   	super()方法,也就是给configuration给赋值给BaseBuilder这个类的全局参数.
   	给parsed设置为false  /  parser 设置为 parser.
*/
  public XMLConfigBuilder(InputStream inputStream, String environment, Properties props) {
    this(new XPathParser(inputStream, true, props, new XMLMapperEntityResolver()), environment, props);
  }
  
----------------------------------
org.apache.ibatis.builder.xml.XMLConfigBuilder#parse  (parser.parse()方法)
    
  public Configuration parse() {
    // 定义了一个参数parsed，如果是true就说明已经解析过了,只可以解析一次
    // 所以这里如果是true的话,就会抛出异常来的.
    if (parsed) {
      throw new BuilderException("Each XMLConfigBuilder can only be used once.");
    }
    // 设置为true.
    parsed = true;
    // 从configuration开始解析 
    parseConfiguration(parser.evalNode("/configuration"));
    return configuration;
  }
  

// 这里可以看到 mybatis对于标签的解析顺序，从执行的顺序来看,就是其解析标签的顺序.
private void parseConfiguration(XNode root) {
    try {
      //issue #117 read properties first
//从root.evalNode("properties")中获取出来的值不是null的话,该方法才会走.
//获取其子节点,并且还分别获取resource/url,如果二者都有值的话,就会抛出异常.
//只可以有一种方式来读取. 要么是resource，要么是url. 
//最后获取出来的值,都会调用Properties的putAll给放入进去,最后set到parser和configuration中去.      
      propertiesElement(root.evalNode("properties"));
//获取setting标签,然后走settingsAsProperties方法.
// settingsAsProperties:如果解析出来的值是null的话,就会new一个Properties直接返回.
//否则的话,就会先获取出context.getChildrenAsProperties(),
//然后从MetaClass metaConfig = MetaClass.forClass(Configuration.class, localReflectorFactory);然后迭代context这个集合,然后metaConfig.hasSetter是false的话,就会抛出异常来.如果没抛异常的话,最后就返回props回去.        
      Properties settings = settingsAsProperties(root.evalNode("settings"));
      loadCustomVfs(settings);
 //从setting中获取logImpl的值,也就是log,获取出来的logImpl的值最后设置到configuration中去.
 //也就是配置下你使用那个log的框架.       
      loadCustomLogImpl(settings);
 //获取别名的标签值. parent
 //parent不为null,然后进行迭代,这里别名配置是可以是多个的.
 //分别是 package/alias(type)这二种,如果是package的话,就会放入到configuration的typeAliasRegistry中.  如果是alisa这种形式的话,alisa是null的话,就给class注册进去.
//否则就根据alisa+class给注册进去. 这里也就是放入到TypeAliasRegistry中的typeAliases中来了.
      typeAliasesElement(root.evalNode("typeAliases"));
//获取plugins下面的值,然后再获取其childRen,也即是其下的标签,进行迭代.获取出interceptor的值,
//使用反射来将其实例化,并且给下面的property标签给set进去.        
      pluginElement(root.evalNode("plugins"));
//获取objectFactory标签的值,然后判断其获取出来的值不为null,
//获取type对应的值,然后利用反射对其进行实例化,最后也将其properties子标签给设置进去.
//最后将ObjectFactory给设置到configuration中去.        
      objectFactoryElement(root.evalNode("objectFactory"));
// 与ObjectFactory的处理方式是一样的        
      objectWrapperFactoryElement(root.evalNode("objectWrapperFactory"));
// 与objectFactory的处理方式一样        
      reflectorFactoryElement(root.evalNode("reflectorFactory"));
// 将setting标签的值,给设置到configuration中去,如果没的话,就会使用默认值.        
      settingsElement(settings);
      // read it after objectFactory and objectWrapperFactory issue #631
//读取environments标签对用的值,如果其内部的environment是null的话,就使用默认的去获取
//获取id标签,然后判断id标签的值和default的值是不是一样的,如果不是一样的话,就不进行后续set
//transactionManager和dataSource等操作了.
//如果是一样的话,先是读取transactionManager，再读取dataSource.
//这里根据 POOLED 获取出来的是:PooledDataSourceFactory，然后将其下层的标签的值给set进去.
//最后返回回去.  如果context是null的话,这里就会直接抛出BuilderException这个异常来.
//接着从上面的 PooledDataSourceFactory 获取出 DataSource来, 
//dataSource中就有一些关于db的配置信息     
//最后new一个Environment.Builder出来,并且将上面的transactionManager和dataSource给放入到Environment.Builder中去. 最后 Environment.Builder 是会被放入到configuration中去.
      environmentsElement(root.evalNode("environments"));
//设置 dataBaseId 到 configuration中去.        
      databaseIdProviderElement(root.evalNode("databaseIdProvider"));
// 根据package或者javaType(jdbcType,handler) 来分为二种给注册到typeHandlerRegistry中去.
//如果是javaType(jdbcType,handler)等情况的话,又会根据javaTypeClass等是否有值,
//走不通的重载方法给注册到typeHandlerRegistry中去.        
      typeHandlerElement(root.evalNode("typeHandlers"));
// 然后mappers这个标签的话,机会分为是否用package和resouce(url/class)二种方式给解析
//如果是package的话,就直接添加到configuration中去.
// resource/url/class 就会分为三种情况进行处理:
// ①resource有值,url和class是没有值的,  ②url有值,resouce和class是没有值的,  
// ③class是有值的,url和resouces是没有值的.  
// ① 和 ②的情况都会在new一个XMLMapperBuilder,然后调用其parse方法进行解析.
// 如果是③的话,就会使用Resouce.classForName(mapperClass)返回的
// 	class给添加到configuration中去. (最后是放入到MapperRegistry.knownMappers这个集合中) 
// 最后主要就是看 XMLMapperBuilder.parse() 这个解析的方法,该方法就是解析xml的信息的         
      mapperElement(root.evalNode("mappers"));
    } catch (Exception e) {
      throw new BuilderException("Error parsing SQL Mapper Configuration. Cause: " + e, e);
    }
  }
```





sqlSessionFactory.openSession() 方法:



org.apache.ibatis.session.defaults.DefaultSqlSessionFactory#openSessionFromDataSource

该方法主要就是获取一个SqlSession会话.

```java
  private SqlSession openSessionFromDataSource(ExecutorType execType, TransactionIsolationLevel level, boolean autoCommit) {
    Transaction tx = null;
    try {
// 先获取出 Environment        
      final Environment environment = configuration.getEnvironment();
 //从environment中获取出 TransactionFactory       
      final TransactionFactory transactionFactory = getTransactionFactoryFromEnvironment(environment);
 // new 一个Transaction出来.       
      tx = transactionFactory.newTransaction(environment.getDataSource(), level, autoCommit);
 // 根据 executorType来判断使用那种 Executor. 
 // 这里看 BaseExecutor下,是有SimpleExectour/ReuseExecutor/BatchExecutor三种,
 // 一般情况下都是使用 SimpleExecutor这种的
 //如果cacheEnable是true的话,接着就会替换成CachingExecutor这种.
 //接着走org.apache.ibatis.plugin.InterceptorChain#pluginAll,这个可以看到是之前plugins标签进行扩展的配置. 将Executor给返回回来.      
      final Executor executor = configuration.newExecutor(tx, execType);
//最后是new一个DefaultSqlSession这个session回去,然后初始化其 configuration/executor/dirty/autoCommit等参数配置.        
      return new DefaultSqlSession(configuration, executor, autoCommit);
    } catch (Exception e) {
      closeTransaction(tx); // may have fetched a connection so lets call close()
      throw ExceptionFactory.wrapException("Error opening session.  Cause: " + e, e);
    } finally {
     // 最后重置一下.   
      ErrorContext.instance().reset();
    }
  }
```





session.getMapper(PhoneMapper.class); 获取Mapper的方法



org.apache.ibatis.session.defaults.DefaultSqlSession#getMapper

这里如果细心的话,可以看到其debug的这个类的值或者使用输出给值打印出来:System.out.println(phoneMapper.getClass().toString()); -->class com.sun.proxy.$Proxy0,就可以很明显的看到这是一个代理类了.

```java
// PhoneMapper phoneMapper = session.getMapper(PhoneMapper.class); 
@Override
  public <T> T getMapper(Class<T> type) {
    return configuration.getMapper(type, this);
  }


  public <T> T getMapper(Class<T> type, SqlSession sqlSession) {
    return mapperRegistry.getMapper(type, sqlSession);
  }


---------------------
// org.apache.ibatis.binding.MapperRegistry#getMapper    
  public <T> T getMapper(Class<T> type, SqlSession sqlSession) {
 // 从knownMappers这个集合中获取出对应的Mapper,根据类名字.   
    final MapperProxyFactory<T> mapperProxyFactory = (MapperProxyFactory<T>) knownMappers.get(type);
 //如果不能根据类名字从该集合中获取出来的话,就会抛出异常来.   
    if (mapperProxyFactory == null) {
      throw new BindingException("Type " + type + " is not known to the MapperRegistry.");
    }
    try {
// 先new一个MapperProxy类,传入其构造方法的参数是
//sqlSession/mapperInterface(也就是我们的接口)/ methodCache
 // 最后使用Proxy.newProxyInstance()来创建出一个对象(这里也就是使用了反射).       
      return mapperProxyFactory.newInstance(sqlSession);
    } catch (Exception e) {
      throw new BindingException("Error getting mapper instance. Cause: " + e, e);
    }
  }    
```