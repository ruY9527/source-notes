---
title: mybatis中config-xml代码阅读
date: 2021-11-04 00:28:20
tags: 
  - java框架
  - mybatis
categories:
  - java框架
  - mybatis
---



#### 题记

对于配置文件的解析, 还是相对比较好理解的, 就是读取配置文件, 然后在代码需要的地方给使用到.

这里,可以扩展下, Spring / SpringBoot 等是怎么读取配置文件呢 ? 并且配置文件还是有 xml / properties/yaml 等格式的 ， 其读取代码是怎么写的 ? 然后基于 阿波罗(携程开源) 的配置中心 , 其实现配置又是怎么实现的呢 ? 然后这里，看了 Mybatis 读取配置文件, 后续再出 Spring 配置文件的时候，如果二者读取配置进行对比, 你个人更倾向使用代码呢 ?

所以,这里就开启读取 Mybatis 是如何解析配置文件的操作.

#### 配置文件

这里的配置文件解读,是根据 MyBatis官网来一步一步的解析阅读. 如果有官网没有涉及到的,发现了也会在后续加上去的. 解析多行代码, 才能理解 何为优秀.

**标签一 : properties**

org.apache.ibatis.builder.xml.XMLConfigBuilder#parseConfiguration —> propertiesElement(root.evalNode(“properties”)) 方法中来.

```
// 这里传入进来的 XNode 的值,就是我们写的 properties 标签.
// 可以看到 XNode的属性,name标签的名字,attributes就是key/value属性
// 比如这里: key 就是 resource , value 就是 ./db.properties.
private void propertiesElement(XNode context) throws Exception {
  if (context != null) {
// 这里调用的node.getChildNodes(),如果有点话,会遍历挨个解析,最后封装成为key/value结构.      
    Properties defaults = context.getChildrenAsProperties();
// 获取 resource / url 二者的值.      
    String resource = context.getStringAttribute("resource");
    String url = context.getStringAttribute("url");
// 如果二者都是null,就会抛出异常来.      
    if (resource != null && url != null) {
      throw new BuilderException("The properties element cannot specify both a URL and a resource based property file reference.  Please specify one or the other.");
    }
      
 // 这里先处理resource,再处理url,也就是有可能url会覆盖掉resource的内容.
 // 二者读取的方式不一样,前者是根据 resource开始读,url是根据绝对路径开始读.
 // 最后 defaults 里面放入的全部是 key/value 对应的键值对
 // 也就是db.properties中的 key / value 相对应i起来.     
    if (resource != null) {
      defaults.putAll(Resources.getResourceAsProperties(resource));
    } else if (url != null) {
      defaults.putAll(Resources.getUrlAsProperties(url));
    }
  
// 这里看的是 xml 里面是不是直接有 porperties 配置.     
// 如果有的话,就会putAll进去.      
    Properties vars = configuration.getVariables();
    if (vars != null) {
      defaults.putAll(vars);
    }
// 最后吧 defaults,也就是properties给放入到 BaseBuilder 和 Confifuration中去.      
    parser.setVariables(defaults);
    configuration.setVariables(defaults);
  }
}


-----------------------------
//  如何让 Properties vars = configuration.getVariables(); 有值呢 ?
//  如果只是单个的 MyBatis 项目的话, 就自己手动new一个properties对象
//  然后key输入自己要覆盖掉的key就可以了
        Properties dbConfigProperties = new Properties();
        dbConfigProperties.setProperty("jdbc.password","GavinYang");

        SqlSessionFactory sqlSessionFactory = new SqlSessionFactoryBuilder().build(mybatisInputStream,dbConfigProperties);
```

**标签二 : settings**

这是 MyBatis对 settings 的操作.

具体的 settings 中每项配置参考官网链接 : https://mybatis.org/mybatis-3/configuration.html#properties

```
// 解析 setting ---> 转化为 key /value
Properties settings = settingsAsProperties(root.evalNode("settings"));
// 
loadCustomVfs(settings);
loadCustomLogImpl(settings);
```

settingsAsProperties 方法

可以看到, 该方法就是进行加载,转化为key/value键值对类型, 然后对其key检验是否在

Configuration 中都有 set 方法.

Notes : 为了验证下, 我们加上一个没有的标签, 可以看到下面的异常. 所以我们看到这种异常的时候，是可以去检查下是不是名字什么有问题.

### Cause: org.apache.ibatis.builder.BuilderException: Error parsing SQL Mapper Configuration. Cause: org.apache.ibatis.builder.BuilderException: The setting nnnnn is not known. Make sure you spelled it correctly (case sensitive).

```
private Properties settingsAsProperties(XNode context) {
  if (context == null) {
    return new Properties();
  }
 // 对 settings 下的 setting 进行解析 并且 转化为 key / value 操作.   
  Properties props = context.getChildrenAsProperties();
  // Check that all settings are known to the configuration class
 // 对 Configuration 进行校验, 确认上面的 props 中的key 在 Configuration
// 中是都有set 方法的,目测是后面反射需要使用到.    
  MetaClass metaConfig = MetaClass.forClass(Configuration.class, localReflectorFactory);
  for (Object key : props.keySet()) {
    if (!metaConfig.hasSetter(String.valueOf(key))) {
      throw new BuilderException("The setting " + key + " is not known.  Make sure you spelled it correctly (case sensitive).");
    }
  }
  return props;
}
```

loadCustomVfs(settings) 方法

该方法,主要就是读取 vfsImpl 对用的value,切割下,然后用 classForName 来获取 class,

最后赋值到 configuration 中去. 这里算是对 vfs 的一种自定义的扩展,虽然目前还不太清楚vfs具体作用.

```
private void loadCustomVfs(Properties props) throws ClassNotFoundException {
  // 获取 vfsImpl 的 value.  
  String value = props.getProperty("vfsImpl");
  if (value != null) {
   // 根据 , 进行切割.   
    String[] clazzes = value.split(",");
    for (String clazz : clazzes) {
      if (!clazz.isEmpty()) {
        @SuppressWarnings("unchecked")
        // 反射,获取出 Class , 最后赋值到 configuration 中去.  
        Class<? extends VFS> vfsImpl = (Class<? extends VFS>)Resources.classForName(clazz);
        configuration.setVfsImpl(vfsImpl);
      }
    }
  }
}
```

loadCustomLogImpl(settings) 方法

```
private void loadCustomLogImpl(Properties props) {
  Class<? extends Log> logImpl = resolveClass(props.getProperty("logImpl"));
  // 将 log set 到 configuration 中去.  
  configuration.setLogImpl(logImpl);
}

-----------------------
// resolve 最后如果不是 null 的话,
org.apache.ibatis.type.TypeAliasRegistry#resolveAlias

 // 就会走到这里,这里可以看先是在 typeAliases(HashMap) 中判断下,如果存在就直接获取
// 如果不存在就用 Resources.ClassForName来操作
// 这里的 HashMap就类似于,记录之前是否已经加载了或者预热.
// 如果是用来做cache的话, 那就应该最后会在 return 之前继续把值给放入进去.    
  public <T> Class<T> resolveAlias(String string) {
    try {
      if (string == null) {
        return null;
      }
      // issue #748
      String key = string.toLowerCase(Locale.ENGLISH);
      Class<T> value;
      if (typeAliases.containsKey(key)) {
        value = (Class<T>) typeAliases.get(key);
      } else {
        value = (Class<T>) Resources.classForName(string);
      }
      return value;
    } catch (ClassNotFoundException e) {
      throw new TypeException("Could not resolve type alias '" + string + "'.  Cause: " + e, e);
    }
  }    


------------
// 如果我们在配置文件中没有定义的话,这里默认是null,也就是说不会set进去.    
  public void setLogImpl(Class<? extends Log> logImpl) {
    if (logImpl != null) {
      this.logImpl = logImpl;
      LogFactory.useCustomLogging(this.logImpl);
    }
  }
```

**标签三 :**

关于别名的配置.

```
typeAliasesElement(root.evalNode("typeAliases"));
private void typeAliasesElement(XNode parent) {
  if (parent != null) {
   // 对 typeAliases 下的子标签进行迭代.
   // 分为是 package 和非 package   
    for (XNode child : parent.getChildren()) {
      if ("package".equals(child.getName())) {
       // 获取你输入的包   
        String typeAliasPackage = child.getStringAttribute("name");
        configuration.getTypeAliasRegistry().registerAliases(typeAliasPackage);
      } else {
 // <typeAlias type="com.iyang.mybatis.pojo.TbBlog" alias="TbBlog" />
 // 这里就是对这种进行解析的         
        String alias = child.getStringAttribute("alias");
        String type = child.getStringAttribute("type");
        try {
          Class<?> clazz = Resources.classForName(type);
   // 如果没写别名,就只传入 clazz.         
          if (alias == null) {
            typeAliasRegistry.registerAlias(clazz);
          } else {
   // 写了别名,就别名和clazz一起传入进来.           
            typeAliasRegistry.registerAlias(alias, clazz);
          }
        } catch (ClassNotFoundException e) {
          throw new BuilderException("Error registering typeAlias for '" + alias + "'. Cause: " + e, e);
        }
      }
    }
  }
}


----------------
// 这里可以看到是根据 packageName 来 register进来的.    
  public void registerAliases(String packageName, Class<?> superType) {
    // new 一个解析器工具类
    ResolverUtil<Class<?>> resolverUtil = new ResolverUtil<>();
    // 获取包的path,然后获取该包下的文件,如果文件是.class结尾的话
    // 最后在 ResolverUtil 中matchess是有该包下的全名称.
    resolverUtil.find(new ResolverUtil.IsA(superType), packageName);
    // 这里返回的是上一步说的 matches
    Set<Class<? extends Class<?>>> typeSet = resolverUtil.getClasses();
    for (Class<?> type : typeSet) {
      // Ignore inner classes and interfaces (including package-info.java)
      // Skip also inner classes. See issue #6
      // 如果不是接口,不是内部类等条件的话,就走  registerAlias 方法
      if (!type.isAnonymousClass() && !type.isInterface() && !type.isMemberClass()) {
 // 先获取类名字,判断该类上有没有 @Alias 注解,如果有注解的话,就用注解的值作为缩写的.
 // 最后判断是不是null,是null就会抛出异常来.最后将上面获取出来的缩写名字,转化为大写.
 // 如果此时 typeAliases 是已经有了该值的话,就会抛出异常来.否则就放入到typeAliases来
 // private final Map<String, Class<?>> typeAliases = new HashMap<>();
 // 可以看到 typeAliases 是一个HashMap,并且其存储的Key/Value还是蛮明显的.         
        registerAlias(type);
      }
    }
  }
```

**标签四**

扩展的 demo 可以参考 MyBatis官网 : https://mybatis.org/mybatis-3/configuration.html

然后看 MyBatis 是如何将插件给利用上的呢 ?

首先在 mybatis-config.xml 中配置好我们自己定义的 plugin

这里以我配置了二个插件

```
<plugins>
    <plugin interceptor="com.iyang.mybatis.plugins.ExamplePlugin">
        <property name="name" value="GavinYang"/>
        <property name="age" value="22"/>
        <property name="hobby" value="lwf"/>
    </plugin>

    <plugin interceptor="com.iyang.mybatis.plugins.QuerySqlPlugin">

        <property name="name" value="GavinYang"/>
    </plugin>
</plugins>
```

// 处理 plugin 的代码

```
private void pluginElement(XNode parent) throws Exception {
  // 这里传入进来的就是 <plugins>整个标签内容.  
  if (parent != null) {
   // 获取 <plugins> 下的 <plugin> 集合,进行迭代处理.   
    for (XNode child : parent.getChildren()) {
     // 获取插件的 全限定名字.   
      String interceptor = child.getStringAttribute("interceptor");
     // 获取我们定义在 plugin 下的 properties.   
      Properties properties = child.getChildrenAsProperties();
// resolveClass是最后注册到typeAliasRegistry来.    
// 实例化,这里就可以看到我们在定义的Plugin中,无参构造函数打印出来的内容了.        
      Interceptor interceptorInstance = (Interceptor) resolveClass(interceptor).getDeclaredConstructor().newInstance();
// 将 properties 赋值给  interceptorInstance
// 也就是放入到 interceptorInstance 来.        
      interceptorInstance.setProperties(properties);
// org.apache.ibatis.plugin.InterceptorChain
// 这是是将interceptorInstance添加到InterceptorChain的interceptors中来.        
      configuration.addInterceptor(interceptorInstance);
    }
  }
}
```

可以看到 MyBatis在加载plugin的时候,是利用了反射来new出一个对象来,并且注册到 typeAliasRegistry 中来. 这里主要是解析 plugin 的配置, 后面在执行sql的时候,都是如何使用到这些 plugin 的呢 ? 肯定是有一个从InterceptorChain中获取interceptors来,然后进行处理.

**标签五 : < objectFactory >**

objectFactory 的处理方式是和 标签四相似的,只是最后在使用场景是有点不同的.

代码上的操作也是类似的.

```
private void objectFactoryElement(XNode context) throws Exception {
  if (context != null) {
    String type = context.getStringAttribute("type");
    Properties properties = context.getChildrenAsProperties();
    ObjectFactory factory = (ObjectFactory) resolveClass(type).getDeclaredConstructor().newInstance();
    factory.setProperties(properties);
    configuration.setObjectFactory(factory);
  }
}
```

**标签五 :**

该标签在 MyBatis 官网是没有demo, 我是根据代码来顺藤摸瓜写的一个.

参考 : org.apache.ibatis.reflection.wrapper.DefaultObjectWrapperFactory 这个源码,来模仿写的一个.

```
objectWrapperFactoryElement(root.evalNode("objectWrapperFactory"));
private void objectWrapperFactoryElement(XNode context) throws Exception {
  if (context != null) {
   // 获取 配置文件中的type值   
    String type = context.getStringAttribute("type");
 // 先注册到  typeAliasRegistry 来,然后实例化这个类.
 // 我们在自己定义的类中,写一个无参构造函数,就可以看到我们打印的内容了.     
    ObjectWrapperFactory factory = (ObjectWrapperFactory) resolveClass(type).getDeclaredConstructor().newInstance();
// 最后赋值到 confifuration 中来.      
    configuration.setObjectWrapperFactory(factory);
  }
}
```

**标签六 : < reflectorFactory >**

处理方式和上面类似.

这里我们自己写一个 com.iyang.mybatis.factory.GavinReflectorFactory 来继承DefaultReflectorFactory,在无参数构造函数中打印下内容, 然后debug跟进.

```
private void reflectorFactoryElement(XNode context) throws Exception {
  if (context != null) {
    String type = context.getStringAttribute("type");
    ReflectorFactory factory = (ReflectorFactory) resolveClass(type).getDeclaredConstructor().newInstance();
    configuration.setReflectorFactory(factory);
  }
}
```

**标签七 :**

environments 标签都是放入一些 db 的配置信息等.

```
<environments default="development">
    <environment id="development">
        <!-- 事务 -->
        <transactionManager type="JDBC"/>
        
        <!-- DB 连接配置 -->
        <dataSource type="POOLED">
            <property name="driver" value="${jdbc.driver}" />
            <property name="url" value="${jdbc.url}" />
            <property name="username" value = "${jdbc.username}" />
            <property name="password" value="${jdbc.password}" />
        </dataSource>
    </environment>
</environments>
private void environmentsElement(XNode context) throws Exception {
  if (context != null) {
    if (environment == null) {
// 获取 default 对应字段的值         
      environment = context.getStringAttribute("default");
    }
// 这里的 getChildren 获取的是 <environments> --> <environment>下的子标签      
    for (XNode child : context.getChildren()) {
      String id = child.getStringAttribute("id");
// 确保 id 和  上一步的environment 的值是相同的,就会返回true.      
      if (isSpecifiedEnvironment(id)) {
/**
*  获取出 transactionManager 对应的标签.
*  然后根据 JBDC(配置文件中的值),然后从 typeAliasRegistry中获取出来，
*  调用反射来 实例化 这个对象. 
*  最后还是可以配置 properties,会被set到txFactory中去的.
*  但是 JdbcTransactionFactory 好像没有重写 setProperties 方法.
*/          
        TransactionFactory txFactory = transactionManagerElement(child.evalNode("transactionManager"));
// 先获取  dataSource 字段
/**
*  先获取type的值,然后再获取 properties的标签字段值.
*  根据我们的配置 : org.apache.ibatis.datasource.pooled.PooledDataSourceFactory,应该会获取出这个对象.该对象其内部是有一个,org.apache.ibatis.datasource.pooled.PooledDataSource的,里面有部分默认值的.
*最后将  properties 调用 org.apache.ibatis.datasource.unpooled.UnpooledDataSourceFactory#setProperties方法,
最后是将 properties 里面的key/value 都设置到 MetaObject metaDataSource = SystemMetaObject.forObject(dataSource);来了.
*/
        DataSourceFactory dsFactory = dataSourceElement(child.evalNode("dataSource"));
// 从  PooledDataSourceFactory 中获取 datasource 属性.         
        DataSource dataSource = dsFactory.getDataSource();
// 这里采用链式编程,也就是将id/txFactory/dataSource 都给set到 Environment.Builder来了.         
        Environment.Builder environmentBuilder = new Environment.Builder(id)
            .transactionFactory(txFactory)
            .dataSource(dataSource);
  //    environmentBuilder.build() 也就是new 了一个 Environment 
  // 最后 赋值到 configuration 中来了.        
        configuration.setEnvironment(environmentBuilder.build());
      }
    }
  }
}
```

解析 environments ,利用 typeAliasRegistry 中已经注册好了的信息,然后根据名字缩写(比如JDBC)这种,来获取class对象, 用 反射来 new 一波对象出来,真是美滋滋. 接着就是解析 事务/JDBC连接配置信息等, 最后将信息保存到 DataSource 中来. 反手再来一波 链式编程 来new对象出来, 最后就是一个 Environment 对象出来,给set 到 configuration 中来.

**标签八**

到这里,可以看到对xml的解析操作. 先解析 标签 的值出来,然后根据值进行分类处理或者根据自己的需求来进行处理.

```
private void typeHandlerElement(XNode parent) {
  if (parent != null) {
    for (XNode child : parent.getChildren()) {
      // 如果子标签是 package   
      if ("package".equals(child.getName())) {
       // 获取出 name 对应的值.   
        String typeHandlerPackage = child.getStringAttribute("name");
      // 注册到   typeHandlerRegistry 中来.  
        typeHandlerRegistry.register(typeHandlerPackage);
      } else {
 // 这里获取出三种值来,   javaType/jdbcType/  handler    
        String javaTypeName = child.getStringAttribute("javaType");
        String jdbcTypeName = child.getStringAttribute("jdbcType");
        String handlerTypeName = child.getStringAttribute("handler");
        Class<?> javaTypeClass = resolveClass(javaTypeName);
        JdbcType jdbcType = resolveJdbcType(jdbcTypeName);
        Class<?> typeHandlerClass = resolveClass(handlerTypeName);
  // 分为  javaTypeClass 是不是 null 的情况       
        if (javaTypeClass != null) {
         // 基于 javaTypeClass 是不是 null的情况,再判断 jdbcType 是不是null  
          if (jdbcType == null) {
            typeHandlerRegistry.register(javaTypeClass, typeHandlerClass);
          } else {
            typeHandlerRegistry.register(javaTypeClass, jdbcType, typeHandlerClass);
          }
        } else {
// 这是根据   handlerTypeName 注册到 typeHandlerRegistry 中来.           
          typeHandlerRegistry.register(typeHandlerClass);
        }
      }
    }
  }
}
```

**标签九 :**

该标签是对我们对应的对象,其sql语句存放的地址. 也就是里面放入的是于mapper接口对应的方法,查询的sql语句.

接下来看下 MyBatis 是对 mappers 标签的内容进行了说明解析和处理.

```java
private void mapperElement(XNode parent) throws Exception {
  if (parent != null) {
      
 // getChildren 获取的是 mappers 下的 mapper 标签
    for (XNode child : parent.getChildren()) {
// 如果配置的是 package.        
      if ("package".equals(child.getName())) {
        String mapperPackage = child.getStringAttribute("name");
        configuration.addMappers(mapperPackage);
      } else {
// 获取出    resource/url/class 这三类的值.       
        String resource = child.getStringAttribute("resource");
        String url = child.getStringAttribute("url");
        String mapperClass = child.getStringAttribute("class");
 // 对 resource 处理         
        if (resource != null && url == null && mapperClass == null) {
          // 将 resource 赋值给 ErrorContext 中  
          ErrorContext.instance().resource(resource);
     // 读取文件.       
          InputStream inputStream = Resources.getResourceAsStream(resource);
// 使用 XMLMapperBuilder 来对解析xml内容.            
          XMLMapperBuilder mapperParser = new XMLMapperBuilder(inputStream, configuration, resource, configuration.getSqlFragments());
          mapperParser.parse();
// url 处理            
        } else if (resource == null && url != null && mapperClass == null) {
          ErrorContext.instance().resource(url);
          InputStream inputStream = Resources.getUrlAsStream(url);
          XMLMapperBuilder mapperParser = new XMLMapperBuilder(inputStream, configuration, url, configuration.getSqlFragments());
          mapperParser.parse();
// mapperClass 处理            
        } else if (resource == null && url == null && mapperClass != null) {
          Class<?> mapperInterface = Resources.classForName(mapperClass);
          configuration.addMapper(mapperInterface);
        } else {
          throw new BuilderException("A mapper element may only specify a url, resource or class, but not more than one.");
        }
      }
    }
  }
}



-----------------------
// 这里我们跟进 mapperParser.parse() 方法来
// org.apache.ibatis.builder.xml.XMLMapperBuilder
  public void parse() {
  // 判断 configuration 的 loadedResources 是否含有该值,如果不含有的话,就会去解析.  
    if (!configuration.isResourceLoaded(resource)) {
// 对mapper 标签进行解析        
      configurationElement(parser.evalNode("/mapper"));
      configuration.addLoadedResource(resource);
      bindMapperForNamespace();
    }

    parsePendingResultMaps();
    parsePendingCacheRefs();
    parsePendingStatements();
  }    

-----------------------------------
//   configurationElement 方法

  private void configurationElement(XNode context) {
    try {
 // 获取 namespace       
      String namespace = context.getStringAttribute("namespace");
      if (namespace == null || namespace.equals("")) {
        throw new BuilderException("Mapper's namespace cannot be empty");
      }
//  MapperBuilderAssistant 将 namespace 绑定到该类的参数中来.        
      builderAssistant.setCurrentNamespace(namespace);
  
   // 这里的 cache-ref / cache 都是暂时没有配置的.     
      cacheRefElement(context.evalNode("cache-ref"));
      cacheElement(context.evalNode("cache"));
        
 //  /mapper/parameterMap 也是暂时没有配置的  
      parameterMapElement(context.evalNodes("/mapper/parameterMap"));
        
// resultMap 是对对象字段的映射
// mapper/sql 是对一些公用的sql进行抽取
// 二者暂时都没有配置        
      resultMapElements(context.evalNodes("/mapper/resultMap"));
      sqlElement(context.evalNodes("/mapper/sql"));
// 获取 select / insert / update / delete 等 标签.        
      buildStatementFromContext(context.evalNodes("select|insert|update|delete"));
    } catch (Exception e) {
      throw new BuilderException("Error parsing Mapper XML. The XML location is '" + resource + "'. Cause: " + e, e);
    }
  }    

// 往下跟方法
  private void buildStatementFromContext(List<XNode> list, String requiredDatabaseId) {
    for (XNode context : list) {
      final XMLStatementBuilder statementParser = new XMLStatementBuilder(configuration, builderAssistant, context, requiredDatabaseId);
      try {
        statementParser.parseStatementNode();
      } catch (IncompleteElementException e) {
        configuration.addIncompleteStatement(statementParser);
      }
    }
  }
```

