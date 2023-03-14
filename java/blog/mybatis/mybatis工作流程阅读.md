---
title: mybatis工作流程阅读
date: 2021-11-04 00:29:16
tags: 
  - java框架
  - mybatis
categories:
  - java框架
  - mybatis
---



#### MyBatis 的工程流程分析

 MyBatis 是我们在学习Java框架，也就是学习完JavaWeb的知识后,要学习到的一个ORM的框架. 我也是学习&使用过后，再次对源码进行阅读的. 所以这篇文章记录 MyBatis 的一个 work flow.

 先放上项目地址 : https://github.com/baoyang23/mybtatis-analysis/tree/master/mybatis-work-flow

 有兴趣的同学,可以clone下来看看.

#### 案例代码

先放上案列的代码, 然后我们可以挨个的分析.

```
public class InitHelloMyBatis {

    public static void main(String[] args) throws IOException {
        // 读取配置文件.
        InputStream mybatisInputStream = Resources.getResourceAsStream("mybatis-config.xml");
        // 传入读取配置文件的流,使用SqlSessionFactoryBuilder来
        // 构建 SqlSessionFactory.
        SqlSessionFactory sqlSessionFactory = new SqlSessionFactoryBuilder().build(mybatisInputStream);
        // 从 SqlSessionFactory 中获取SqlSession会话.
        SqlSession session = sqlSessionFactory.openSession();

        // 从会话中获取 Mapper.
        BlogMapper blogMapper = session.getMapper(BlogMapper.class);
        
        // 调用查询方法.
        TbBlog tbBlog = blogMapper.selectBlog(1);
        System.out.println(tbBlog);
        
    }

}
```

这里说下大致流程 :

- 使用 Resources 来读取 mybatis-config.xml配置文件, 如果该文件不存在或者读取出来 InputStream 是 null 的话,程序就会抛出 IOException 的错误来.
- 读取配置没有问题,来到 new SqlSessionFactoryBuilder().build(io) 来构建出一个 SqlSessionFactory 来, 这里构建出来的 SqlSessionFactory 肯定是有已经讲配置文件给全部加载进去了的.
- SqlSessionFactory.openSession() 从 SqlSessionFactory 中获取一次会话, 然后可以从会话中获取出接口(BlogMapper)来,这里是不是有点好奇,明明这就是一个接口,也没有实现类,怎么就可以get出一个接口对象来?获取出接口来,然后就可以调用接口中的方法, 根据id查询出数据来.

可以看到,根据从官网写的一个列子,从表面来看,代码量并不是很多. 所以接下来点去源码,去跟进源码中的每个方法,到底做了些什么事情.

**读取配置文件**

```
InputStream mybatisInputStream = Resources.getResourceAsStream("mybatis-config.xml");
```

org.apache.ibatis.io.Resources (Class).

可以看到MyBatis源码还写了一个 ClassLoader的包装类，通过ClassLoaderWrapper包装类来讲配置文件转化为InputSream.

如果返回的InputStream是null，就会抛出IOException来.

```
/**
 * Returns a resource on the classpath as a Stream object
 *
 * @param loader   The classloader used to fetch the resource
 * @param resource The resource to find
 * @return The resource
 * @throws java.io.IOException If the resource cannot be found or read
 */
private static ClassLoaderWrapper classLoaderWrapper = new ClassLoaderWrapper();

public static InputStream getResourceAsStream(ClassLoader loader, String resource) throws IOException {
  // 利用 ClasssLoaderWrapper.  
  InputStream in = classLoaderWrapper.getResourceAsStream(resource, loader);
  if (in == null) {
    throw new IOException("Could not find resource " + resource);
  }
  return in;
}
```

于是我们接着看 ClassLoaderWrapper 是怎么 读取配置文件 & 转化为 InputStream 流的.

```
// 这里返回的是 ClassLoader的数组,如果对ClassLoader不是很了解的话,可以先去百度了解下.
ClassLoader[] getClassLoaders(ClassLoader classLoader) {
  return new ClassLoader[]{
      // 传递进来的 
      classLoader,
      // 默认的 ClassLoader
      defaultClassLoader,
      // 根据当前线程获取出来的
      Thread.currentThread().getContextClassLoader(),
      // 根据当前 Class 获取出来的.
      getClass().getClassLoader(),
      // 系统的ClassLoader.
      systemClassLoader};
}


// 获取到了 classLoader的数组,然后对其进行迭代.
// 也就是使用 ClassLoader的  getResourceAsStream 方法,来讲 mybatis-config.xml
// 配置文件转化为 InputStream.
// 最后如果获取到InputStream都是null的话,那么返回的也就是null了.
// 根据上面的说法,返回的如果是null的话,就会出 IOException来.
InputStream getResourceAsStream(String resource, ClassLoader[] classLoader) {
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

**至此,MyBatis读取 mybatis-config.xml 配置文件也就是解析完毕,可以看到采用了自己写的 ClassLoaderWrapper来操作的, 传递一种 ClassLoader进来,其默认的&系统&线程的,加一起也是有四种. 最后挨个进来迭代，满足条件的会读取文件转化为InputStream,如果都是null的话,也会返回null.**

------

**获取SqlSessionFactory & 解析配置文件**

new SqlSessionFactoryBuilder() 也是new了一个 SqlSessionFactoryBuild,个人理解 SqlSessionFactoryBuilder 就是专程用来构建出 SqlSessionFactory 来的,毕竟其后面有一个 build 方法.

Problem ? 这里有个问题,为什么不将 SqlSessionFactoryBuilder 的build 方法,修改为静态的 ? 如果修改为静态的话，那就不用new了,就可以直接 SqlSessionFactoryBuilder.build(mybatisInputStream);

```
SqlSessionFactory sqlSessionFactory = new                     SqlSessionFactoryBuilder().build(mybatisInputStream);
```

**SqlSessionFactory**

接着我们来到 SqlSessionFactory 的 build 方法.

这里在 finnaly 中, 可以看到 ErrorContext 利用了 ThreadLocal , 刚好这周出了 ThreadLocal 的视频.

视频地址 : https://www.bilibili.com/video/BV1Ga4y1W72w

有兴趣&乐于学习&分享的,可以共同进步.

```
public SqlSessionFactory build(InputStream inputStream, String environment, Properties properties) {
  try {
    // 利用传入进来的参数,new出来了一个 XMLConfigBuilder.
    XMLConfigBuilder parser = new XMLConfigBuilder(inputStream, environment, properties);
    return build(parser.parse());
  } catch (Exception e) {
    throw ExceptionFactory.wrapException("Error building SqlSession.", e);
  } finally {
    // 这里对 ThreadLocal 中进行 remove() 操作   
    ErrorContext.instance().reset();
    try {
      // 关闭流.  
      inputStream.close();
    } catch (IOException e) {
      // Intentionally ignore. Prefer previous error.
    }
  }
}
```

new XmlConfigBuilder() 方法:

```
public XMLConfigBuilder(InputStream inputStream, String environment, Properties props) {
  // 先new一个XMLMapperEntityResolver,再new一个XPathParser,然后就走到下面的构造函数.
  this(new XPathParser(inputStream, true, props, new XMLMapperEntityResolver()), environment, props);
}

// 最后还是走到这个构造方法中来.
private XMLConfigBuilder(XPathParser parser, String environment, Properties props) {
  super(new Configuration());
  ErrorContext.instance().resource("SQL Mapper Configuration");
  this.configuration.setVariables(props);
  this.parsed = false;
  this.environment = environment;
  this.parser = parser;
}


----------------------------------------
// new XPathParser代码:
    
  public XPathParser(InputStream inputStream, boolean validation, Properties variables, EntityResolver entityResolver) {
    // 普通的构造方法.
    // 对 XPathParser的validation/entityResolver/variables/xpath
    // 的属性进行赋值操作.
    commonConstructor(validation, variables, entityResolver);
    this.document = createDocument(new InputSource(inputStream));
  }    


// createDocument 方法
  private Document createDocument(InputSource inputSource) {
    // important: this must only be called AFTER common constructor
    try {
      // 这里通过debug看,返回的对象是DocumentBuilderFactoryImpl
      // 也就是其实现类.  
      DocumentBuilderFactory factory = DocumentBuilderFactory.newInstance();
     // 对 factory 的 features(HashMap) 添加值,   
      factory.setFeature(XMLConstants.FEATURE_SECURE_PROCESSING, true);
     // 对 factory 的 validating 进行赋值  
      factory.setValidating(validation);
	 // 这下面都是对 factory的属性进行赋值操作.	
      factory.setNamespaceAware(false);
      factory.setIgnoringComments(true);
      factory.setIgnoringElementContentWhitespace(false);
      factory.setCoalescing(false);
      factory.setExpandEntityReferences(true);
		
      // 可以看到 return new DocumentBuilderImpl
      // 最后返回的也是其实现类. 
      DocumentBuilder builder = factory.newDocumentBuilder();
      builder.setEntityResolver(entityResolver);
      // 设置错误的handler,可以看到ErrorHandler是接口,这里是匿名实现的
      // 也就是直接new了接口,然后重写其方法.  
      builder.setErrorHandler(new ErrorHandler() {
        @Override
        public void error(SAXParseException exception) throws SAXException {
          throw exception;
        }

        @Override
        public void fatalError(SAXParseException exception) throws SAXException {
          throw exception;
        }

        @Override
        public void warning(SAXParseException exception) throws SAXException {
          // NOP
        }
      });
      //   DocumentBuilderImpl 的 parse 解析方法
      return builder.parse(inputSource);
    } catch (Exception e) {
      throw new BuilderException("Error creating document instance.  Cause: " + e, e);
    }
  }

-------------
//   builder.parse(inputSource)

    public Document parse(InputSource is) throws SAXException, IOException {
        if (is == null) {
            throw new IllegalArgumentException(
                DOMMessageFormatter.formatMessage(DOMMessageFormatter.DOM_DOMAIN,
                "jaxp-null-input-source", null));
        }
    // fSchemaValidator 是 null ,跳过.
        if (fSchemaValidator != null) {
            if (fSchemaValidationManager != null) {
                fSchemaValidationManager.reset();
                fUnparsedEntityHandler.reset();
            }
            resetSchemaValidator();
        }
  // 使用 xml 的相关类对 is 进行解析  
        domParser.parse(is);
 //  ?   
        Document doc = domParser.getDocument();
 // ? 这些解析 Document 的地方.....   
        domParser.dropDocumentReferences();
        return doc;
    }    


---------------
// 最后看到 this 构造函数.

  private XMLConfigBuilder(XPathParser parser, String environment, Properties props) {
    /** new Configuration() 中,TypeAliasRegistry typeAliasRegistry中的 typeAliases,
    *   在初始化这个对象的时候,就默认设置了一些别名配置.
    *   初始化的时候,还有对 LanguageDriverRegistry 的 LANGUAGE_DRIVER_MAP 赋值.
    *  父类 :  BaseBuilder抽象类.
    *  然后调用super方法,将configuration赋值父类的configuration
    *  同时将 configuration的typeAliasRegistry和typeHandlerRegistry也赋值
    *  给当前的这个对象.
    *   
    */
    super(new Configuration());
    // instance() 方法是往 ThreadLocal里面去set了一个ErrorContext
    // 最后会在finnaly中进行remove掉.
    ErrorContext.instance().resource("SQL Mapper Configuration");
    // 将 props 赋值到 configuration 的 variable 参数.
    this.configuration.setVariables(props);
    // 表示还没有被解析
    this.parsed = false;
    this.environment = environment;
    this.parser = parser;
  }
```

到这里,就可以看到 this构造方法以及其之前还有new对象的方法,都已经走完了. 这上面的方法,基本都是再为后面的解析xml文件做准备, 并且还有一些初始化数据的赋值操作.

**Note** : 注意这里的 BaseBuilder是抽象类,其实现类是有好几个的. 这种写法,其实是将子类的一些common的方法,写入到 BaseBuilder父类中,然后不同的方法,需要子类自己去重写这个方法实现自己的业务逻辑. 当然一些参数也是可以放在抽象类中.

**build(parser.parse())** : 解析代码.

parser.parse() 方法 :

```
public Configuration parse() {
  // 用 parsed 来控制是否解析过,如果已经解析过了,那就抛出异常.  
  if (parsed) {
    throw new BuilderException("Each XMLConfigBuilder can only be used once.");
  }
  parsed = true;
  //   
  parseConfiguration(parser.evalNode("/configuration"));
  return configuration;
}



---------------------------------
// parseConfiguration
// 这里 debug 可以看到 root 是 configuration 的配置文件信息.   
// 这里可以初步看到实对 我们的配置文件mybatis-config.xml进行解析,并且加载到 configuration中.
// 后面我们跟着官网文档一步一步的阅读,会有专门对解析配置的源码进行分析.    
  private void parseConfiguration(XNode root) {
    try {
      //issue #117 read properties first
      //   
      propertiesElement(root.evalNode("properties"));
      Properties settings = settingsAsProperties(root.evalNode("settings"));
      loadCustomVfs(settings);
      loadCustomLogImpl(settings);
      typeAliasesElement(root.evalNode("typeAliases"));
      pluginElement(root.evalNode("plugins"));
      objectFactoryElement(root.evalNode("objectFactory"));
      objectWrapperFactoryElement(root.evalNode("objectWrapperFactory"));
      reflectorFactoryElement(root.evalNode("reflectorFactory"));
      settingsElement(settings);
      // read it after objectFactory and objectWrapperFactory issue #631
      environmentsElement(root.evalNode("environments"));
      databaseIdProviderElement(root.evalNode("databaseIdProvider"));
      typeHandlerElement(root.evalNode("typeHandlers"));
      mapperElement(root.evalNode("mappers"));
    } catch (Exception e) {
      throw new BuilderException("Error parsing SQL Mapper Configuration. Cause: " + e, e);
    }
  }
```

**build(parser.parse()) 方法**

这里是对 parser.parse() 调用玩返回的 Configuration 传入到新创建的 DefaultSqlSessionFactory 对象中.

也就是说,我们拿到的 SqlSessionFactory 是 DefaultSqlSessionFactory.

```
public SqlSessionFactory build(Configuration config) {
  return new DefaultSqlSessionFactory(config);
}
```

**获取 SqlSession**

```
SqlSession session = sqlSessionFactory.openSession();

// org.apache.ibatis.session.defaults.DefaultSqlSessionFactory#openSessionFromDataSource
// 看到这个方法,直接跟进到这个方法来.

  private SqlSession openSessionFromDataSource(ExecutorType execType, TransactionIsolationLevel level, boolean autoCommit) {
    Transaction tx = null;
    try {
        
// 从 configuration中获取出environment来,这里的 getEnvironment对应的是
// 标签的 <environment>  里面的内容
// org.apache.ibatis.mapping.Environment
// 可以看到这个对象,id对应mybatis-config.xml中的environment id
// datasource 对应  environment > dataSource 字段.
      final Environment environment = configuration.getEnvironment();
// 根据    environment 来获取 TransactionFactory,也就是MyBatis的事务工厂.
// debug 是可以看到  environment 中是有一个JdbcTransactionFactory的,
// 如果没用的话,就会自己new一个 ManagedTransactionFactory 来.        
      final TransactionFactory transactionFactory = getTransactionFactoryFromEnvironment(environment);

// 在 JdbcTransactionFactory 中new出了一个 JdbcTransaction
// 也就是new了一个JDBC事务.
// org.apache.ibatis.transaction.jdbc.JdbcTransaction,
// 可以看到 JdbcTransaction 中有commit / rollback的方法,
// 也就是说这个地方就是对事务进行操作的地方        
      tx = transactionFactory.newTransaction(environment.getDataSource(), level, autoCommit);
// 这里是获取是执行器,
// 具体代码: org.apache.ibatis.session.Configuration#newExecutor(org.apache.ibatis.transaction.Transaction, org.apache.ibatis.session.ExecutorType)
// 这里有 SIMPLE, REUSE, BATCH ,CachingExecutor 还可以在 plugin 中自己定义.
//executor = (Executor) interceptorChain.pluginAll(executor); 从这行代码可以看到,
// 其实还是可以自己扩展的.        
//org.apache.ibatis.plugin.InterceptorChain        
      final Executor executor = configuration.newExecutor(tx, execType);
// 最后 new 出了一个默认的 SqlSession 会话.
// 该会话中存有 configuration / executor 等核心东西.        
      return new DefaultSqlSession(configuration, executor, autoCommit);
    } catch (Exception e) {
      closeTransaction(tx); // may have fetched a connection so lets call close()
      throw ExceptionFactory.wrapException("Error opening session.  Cause: " + e, e);
    } finally {
// 最后还是不忘记对使用过的ThreadLocal 进行remove 操作.        
      ErrorContext.instance().reset();
    }
  }
```

至此, 可以看到 MyBatis 从SqlSessionFactory中获取出来SqlSession会话, 也可以理解为几个步骤.

首先获取事务工厂, 然后再从事务工厂中获取一个事务来, JdbcTransaction 有兴趣的同学可以看下这个类,里面也是封装了写 commit / rollback等方法. 再接着获取出 执行器(Executor),这里从代码哪里看,执行器还是有几种类型的,也执行自定义. 最后new了一个 DefaultSqlSession 回去.

**session.getMapper(BlogMapper.class);**

接着看,上一步返回的session,是怎么获取到我们写的Mapper接口文件(Mapper这种文件,在解析配置文件的时候,其实就已经解析到MyBatis的configuration里面去了).

```
@SuppressWarnings("unchecked")
public <T> T getMapper(Class<T> type, SqlSession sqlSession) {
 // knownMappers  中 key 是我们定义接口的Class,value是MapperProxyFactory,
// MapperProxyFactory中的mapperInterface中存放了我们的接口class    
  final MapperProxyFactory<T> mapperProxyFactory = (MapperProxyFactory<T>) knownMappers.get(type);
    
// 如果获取出来的是null,那么MyBatis就认为你传入进来的接口是不存在的,就会抛出异常来.    
  if (mapperProxyFactory == null) {
    throw new BindingException("Type " + type + " is not known to the MapperRegistry.");
  }
  try {
// 满足条件的话,调用newInstance方法,从方法名字上看,是创建一个instance的实例.      
    return mapperProxyFactory.newInstance(sqlSession);
  } catch (Exception e) {
    throw new BindingException("Error getting mapper instance. Cause: " + e, e);
  }
}

-------------------------------------------
// mapperProxyFactory.newInstance(sqlSession) 代码

    
  public T newInstance(SqlSession sqlSession) {
    // new 了一个 MapperProxy对象.
    final MapperProxy<T> mapperProxy = new MapperProxy<>(sqlSession, mapperInterface, methodCache);
    return newInstance(mapperProxy);
  }    

// 最后可以看到使用 Proxy.newProxyInstance方法来创建的一个对象.
  @SuppressWarnings("unchecked")
  protected T newInstance(MapperProxy<T> mapperProxy) {
    return (T) Proxy.newProxyInstance(mapperInterface.getClassLoader(), new Class[] { mapperInterface }, mapperProxy);
  }



-------
// 如果你是debug模式的话,那么你可以看到BlogMapper的对象地址池在 debug 中显示的值.
// org.apache.ibatis.binding.MapperProxy@ef9296d    
BlogMapper blogMapper = session.getMapper(BlogMapper.class);
```

从SqlSession 中获取 BlogMapper我们写的mapper流程, 先从 knownMappers 中根据key获取出来之前加载配置已经加载完毕的信息,如果没用的话,就会抛出没有的异常. 最后使用 Proxy.newProxyIntsance来生成的一个类似接口实现类的代码,不同的是, 在 new MapperProxy 的时候,就已经将接下来需要的信息全部传入进去.

**blogMapper.selectBlog(1) 方法**

竟然 BlogMapper是通过Proxy.newInstance获取出来的,那它是怎么查询的数据库? 又是怎么将字段给映射到 Object一一对应的呢 ?

debug会走到 MapperProxy的invoke方法来

```
@Override
public Object invoke(Object proxy, Method method, Object[] args) throws Throwable {
  try {
    if (Object.class.equals(method.getDeclaringClass())) {
      return method.invoke(this, args);
    } else {
      return cachedInvoker(method).invoke(proxy, method, args, sqlSession);
    }
  } catch (Throwable t) {
    throw ExceptionUtil.unwrapThrowable(t);
  }
}



------------------
// 通过 invoke 方法, 走 mapperMethod的execute方法,来到了这里.
// switch 有 INSERT/UPDATE/DELETE/SELECT/FLUSH,如果这几种没有匹配到的话,就会抛出异常来.    
  public Object execute(SqlSession sqlSession, Object[] args) {
    Object result;
    switch (command.getType()) {
            
// 不难看到 INSERT/UPDATE/DELETE都是先调用 convertArgsToSqlCommandParam 方法,
// 也就是先将参数转化为sql,然后将执行的结果 赋值 给 result 参数.            
      case INSERT: {
        Object param = method.convertArgsToSqlCommandParam(args);
        result = rowCountResult(sqlSession.insert(command.getName(), param));
        break;
      }
      case UPDATE: {
        Object param = method.convertArgsToSqlCommandParam(args);
        result = rowCountResult(sqlSession.update(command.getName(), param));
        break;
      }
      case DELETE: {
        Object param = method.convertArgsToSqlCommandParam(args);
        result = rowCountResult(sqlSession.delete(command.getName(), param));
        break;
      }
// 如果是 select 语句,可以根据返回值来分类,如果是void&&method.hasResultHandler,就会返回null
// 多个 / Map类型  /    Cursor 类型   /  最后查询一个        
      case SELECT:
        if (method.returnsVoid() && method.hasResultHandler()) {
          executeWithResultHandler(sqlSession, args);
          result = null;
        } else if (method.returnsMany()) {
          result = executeForMany(sqlSession, args);
        } else if (method.returnsMap()) {
          result = executeForMap(sqlSession, args);
        } else if (method.returnsCursor()) {
          result = executeForCursor(sqlSession, args);
        } else {
          Object param = method.convertArgsToSqlCommandParam(args);
          result = sqlSession.selectOne(command.getName(), param);
          if (method.returnsOptional()
              && (result == null || !method.getReturnType().equals(result.getClass()))) {
            result = Optional.ofNullable(result);
          }
        }
        break;
 // 刷新会话.           
      case FLUSH:
        result = sqlSession.flushStatements();
        break;
      default:
        throw new BindingException("Unknown execution method for: " + command.getName());
    }
// 如果result 是 null, 方法返回的修饰符是private并且 返回值不是void的话,就会抛出异常.    
    if (result == null && method.getReturnType().isPrimitive() && !method.returnsVoid()) {
      throw new BindingException("Mapper method '" + command.getName()
          + " attempted to return null from a method with a primitive return type (" + method.getReturnType() + ").");
    }
    return result;
  }
```

这里可以看到,先是对 INSERT / UPDATE / DELETE / SELECT 进行分类处理, 然后对再分别根据不同的类型进行处理. 都是先有转化为sql,然后将执行结果赋值给result.

至于里面详细的查询执行sql,还有动态sql,每次会话缓存等,后面看到详细的情况再一一说明. 这里只是对MyBatis的基本工作进行了一个梳理. 然后后面再根据基础梳理,再来挨个击碎他们.

至此, MyBatis的入门分析流程是结束的. 理解起来,应该还不是那么难.

#### 总结

根据 com.iyang.mybatis.InitHelloMyBatis , 也就是入门的demo来梳理下流程.

1. 读取配置文件,也就是将配置文件读取,转化为inptStream流.
2. 利用 SqlSessionFactoryBuilder 来 解析流, 起内部又利用 BaseBuilder(其又很多实现类,这里用的XMLConfigBuilder)也解析xml配置文件. Configuration configuration 该类中是保存着xml配置文件的很多信息. 然后 DefaultSqlSessionFactory 中有configuration字段,也就是属性.
3. 然后从 DefaultSqlSessionFactory 中获取 SqlSession来, 并且也会是否开启事务(参考:org.apache.ibatis.transaction.jdbc.JdbcTransaction)类,然后获取 Executor,Executor也是有几种种类的,也可以自己自定义,最后返回一个 DefaultSqlSession 来.
4. 然后从 SqlSession 中获取我们的接口Mapper, 最后也是利用 Proxy.newProxyInstance 来生成的接口,也就是代理(这里打印出地址池或者debug看地址池,就会很明显的看到是代理对象).
5. 最后走查询的方法, 也就是走到了 MapperProxy 来. 可以看到MapperProxy里面是有sqlSession的,而SqlSession是有 Executor/configuration/autoCommit等信息的, 有了sqlSession,就剩下执行sql和映射sql查询出来的结果来了(这里是 mapperMethod.execute(sqlSession, args) —> org.apache.ibatis.binding.MapperMethod#execute 走到这里来了,这里之后就会分类进行处理,然后映射sql语句).
6. 至此,一个 MyBatis 的 HelloWorld分析流程是完毕的.
