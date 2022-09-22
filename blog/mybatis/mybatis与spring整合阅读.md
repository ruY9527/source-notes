---
title: mybatis与spring整合阅读
date: 2021-11-04 00:29:31
tags: 
  - java框架
  - mybatis
categories:
  - java框架
  - mybatis
---



#### 题记

 MyBatis 与 Spring 整合操作. 在我们入门学习 SSM 等东西的时候，就发现了任何东西，最后都是逃不过与Spring整合起来的道路. 然后这里看完 MyBatis 整合完 Spring 之后，那么之后一些其他的第三方，比如axon/redis/apollo/shiro 等这些东西，如果要整合 Spring 的时候，是不是也是相似的整合方式呢？

 这个需要我们看完 MyBatis 与 Spring 之后，探究其整合的操作.

#### 入门

 分几个步骤，操作一把即可,带你回到哪个 SM 时代，不过这回是没有了 tomcat 的.

 先放上一个完成的整合地址 : https://github.com/baoyang23/mybtatis-analysis/tree/master/mybatis-spring-hello 如果不要看下面流程的,一步跳过即可.

1. 先创建一个 maven 项目，引入依赖. 依赖参考地址 : https://github.com/baoyang23/mybtatis-analysis/blob/master/mybatis-spring-hello/pom.xml
2. db配置 : https://github.com/baoyang23/mybtatis-analysis/blob/master/mybatis-spring-hello/src/main/resources/db.properties
3. MyBatis配置: https://github.com/baoyang23/mybtatis-analysis/tree/master/mybatis-spring-hello/src/main/resources/mybatis
4. Spring 配置: https://github.com/baoyang23/mybtatis-analysis/blob/master/mybatis-spring-hello/src/main/resources/spring-beans.xml
5. 最后,来份我们熟悉的 https://github.com/baoyang23/mybtatis-analysis/tree/master/mybatis-spring-hello/src/main/resources/sql mapper.xml 文件.
6. 不忘记再来一份代码 : https://github.com/baoyang23/mybtatis-analysis/tree/master/mybatis-spring-hello/src 这些直接跑测试类即可.

跟着这上面的几个步骤，就可以搭建完一个项目. 然后喊上我们的 永哥， 打上传说中的 debug , 疯狂的调试看每步干了什么事.

这个的时候，可以跑下测试类，是ok的.

#### 分析

 这里我们首先想到的是我们引入的依赖,是不是有个 mybatis-spring 的依赖. 从这个依赖，可以很明显的看出来，就是通过这个依赖，将 MyBatis 和 Spring 整合起来的。

 然后再想想，我们除了这个依赖的话，还再哪里有使用到一些 Spring 和 MyBatis 的东西呢？ 然后看到 spring-beans.xml 这个xml配置, 可以看到 org.mybatis.spring.SqlSessionFactoryBean 给注入到 bean 里面来了.org.mybatis.spring.mapper.MapperScannerConfigurer也是给注入到 bean 里面来了. 并且二者都有通过来进行属性设置值操作.

 那么,我们就基于这二个类的源码开始阅读.

 **SqlSessionFactoryBean (org.mybatis.spring.SqlSessionFactoryBean)**

这里 SqlSessionFactoryBean 是实现了很多接口,这些接口都是Spring的.

FactoryBean 工厂bean,点进去可以看到,其有方法getObject()/getObjectType等方法获取bean的,然后加上泛型,也就是这里获取的 getObject就是泛型.

InitializingBean: afterPropertiesSet 初始化 bean 的时候，会调用该方法.

ApplicationEvent: Spring的事件传播机制，就是使用的这种方式.

```
/**  可以看到这个类实现了 Spring 这个多接口,那么就有个问题,实现了这么多接口的方法,到底是哪个方法先执行的呢？ 如果你对Spring源码很熟悉的话,是有可能清楚的,但是还是会有点绕的. 
这里我们给 getObject/afterPropertiesSet/onApplicationEvent这三个方法打上断点来进行debug,
debug每走的一步,就是执行的先后顺序。如果不是特别熟悉源码的执行顺序,这种笨方法其实也是可以的.
*
* 所以这里debug的执行顺序是 : afterPropertiesSet --> getObject  ---> onApplicationEvent
* 于是我们就跟着这个顺序来阅读.
* 注意在调用这些方法之前,<property>标签的值都是已经赋值进来了的,是通过反射走的set 方法进来的.
*/
public class SqlSessionFactoryBean
    implements FactoryBean<SqlSessionFactory>, InitializingBean, ApplicationListener<ApplicationEvent> {}

// 实现FactoryBean 方法,这里是实现了该接口的三个方法. 其实这里的 isSingle是可以不用实现的
// 因为接口是用 default 来修饰的.
  /**
   * 该方法是判断并且再次确认 SqlSessionFactory是不是有了. 如果没有的话,就会调用afterProperties来初始化.
   * {@inheritDoc}
   */
  @Override
  public SqlSessionFactory getObject() throws Exception {
    if (this.sqlSessionFactory == null) {
      afterPropertiesSet();
    }

    return this.sqlSessionFactory;
  }

  @Override
  public Class<? extends SqlSessionFactory> getObjectType() {
    return this.sqlSessionFactory == null ? SqlSessionFactory.class : this.sqlSessionFactory.getClass();
  }

  @Override
  public boolean isSingleton() {
    return true;
  }


// InitializingBean 实现的方法
  @Override
  public void afterPropertiesSet() throws Exception {
// 先对 dataSource/sqlSessionFactoryBuilder进行非null的判断.
    notNull(dataSource, "Property 'dataSource' is required");
    notNull(sqlSessionFactoryBuilder, "Property 'sqlSessionFactoryBuilder' is required");
    state((configuration == null && configLocation == null) || !(configuration != null && configLocation != null),
        "Property 'configuration' and 'configLocation' can not specified with together");
// 这里构建出 一个 sqlSessionFactory工厂来,想想我们最初再看单个MyBatis项目的时候,是不是也有一个获取SqlSessionFactroy的方法,然后从sqlSessionFactory会话中获取出SqlSession来.
    this.sqlSessionFactory = buildSqlSessionFactory();
  }

// ApplicationListener实现方法
  /**
   * failFast 时ture 并且传过来的 event是 ContextRefreshedEvent的话,就会进来.
   *  这里目前都是调用get方法,没有很仔细看出其作用.
   * {@inheritDoc}
   */
  @Override
  public void onApplicationEvent(ApplicationEvent event) {
    if (failFast && event instanceof ContextRefreshedEvent) {
      // fail-fast -> check all statements are completed
      this.sqlSessionFactory.getConfiguration().getMappedStatementNames();
    }
  }
```

**org.mybatis.spring.SqlSessionFactoryBean#buildSqlSessionFactory**

该方法需要单独拿出来说下,因为内容还是比较多的.

```
/**
 * Build a {@code SqlSessionFactory} instance.
 *
 * The default implementation uses the standard MyBatis {@code XMLConfigBuilder} API to build a
 * {@code SqlSessionFactory} instance based on a Reader. Since 1.3.0, it can be specified a {@link Configuration}
 * instance directly(without config file).
 *
 * @return SqlSessionFactory
 * @throws Exception
 *           if configuration is failed
 */
protected SqlSessionFactory buildSqlSessionFactory() throws Exception {

  final Configuration targetConfiguration;

  XMLConfigBuilder xmlConfigBuilder = null;
    
 // 这里分为configuration/ configLocation / 非前二者(可以理解为默认的).
 // 三种处理方式.   
  if (this.configuration != null) {
    targetConfiguration = this.configuration;
    if (targetConfiguration.getVariables() == null) {
      targetConfiguration.setVariables(this.configurationProperties);
    } else if (this.configurationProperties != null) {
      targetConfiguration.getVariables().putAll(this.configurationProperties);
    }
  } else if (this.configLocation != null) {
// 这里就是我们配置的情况 
// org.apache.ibatis.builder.xml.XMLConfigBuilder#XMLConfigBuilder(java.io.InputStream, java.lang.String, java.util.Properties),可以看到这个熟悉的操作,也就是我们单个解析 MyBatis的时候有进行分析过的.      
    xmlConfigBuilder = new XMLConfigBuilder(this.configLocation.getInputStream(), null, this.configurationProperties);
// 获取出 configuration 配置信息.      
    targetConfiguration = xmlConfigBuilder.getConfiguration();
  } else {
    LOGGER.debug(
        () -> "Property 'configuration' or 'configLocation' not specified, using default MyBatis Configuration");
    targetConfiguration = new Configuration();
    Optional.ofNullable(this.configurationProperties).ifPresent(targetConfiguration::setVariables);
  }


// 这里采用 Optional,如果objectFactory不是null的话,就会调用targetConfiguration的 setObjectFactory方法.下面这二个是同理.
  Optional.ofNullable(this.objectFactory).ifPresent(targetConfiguration::setObjectFactory);
  Optional.ofNullable(this.objectWrapperFactory).ifPresent(targetConfiguration::setObjectWrapperFactory);
  Optional.ofNullable(this.vfs).ifPresent(targetConfiguration::setVfsImpl);

// 这里如果有配置typeAliasesPackage这个参数的话,就会对该包下进行扫描,进行一系列的过滤,
// 如果都满足条件的话,targetConfiguration.getTypeAliasRegistry()::registerAlias就会注册到这里. 
  if (hasLength(this.typeAliasesPackage)) {
    scanClasses(this.typeAliasesPackage, this.typeAliasesSuperType).stream()
        .filter(clazz -> !clazz.isAnonymousClass()).filter(clazz -> !clazz.isInterface())
        .filter(clazz -> !clazz.isMemberClass()).forEach(targetConfiguration.getTypeAliasRegistry()::registerAlias);
  }
// 是否有typeAliases这个参数,如果有的话,也是可以看到是注册到上面哪一步的里面来.
  if (!isEmpty(this.typeAliases)) {
    Stream.of(this.typeAliases).forEach(typeAlias -> {
      targetConfiguration.getTypeAliasRegistry().registerAlias(typeAlias);
      LOGGER.debug(() -> "Registered type alias: '" + typeAlias + "'");
    });
  }

//判断是否有插件,如果有插件的话,也会添加到configuration中来.    
  if (!isEmpty(this.plugins)) {
    Stream.of(this.plugins).forEach(plugin -> {
      targetConfiguration.addInterceptor(plugin);
      LOGGER.debug(() -> "Registered plugin: '" + plugin + "'");
    });
  }

  if (hasLength(this.typeHandlersPackage)) {
    scanClasses(this.typeHandlersPackage, TypeHandler.class).stream().filter(clazz -> !clazz.isAnonymousClass())
        .filter(clazz -> !clazz.isInterface()).filter(clazz -> !Modifier.isAbstract(clazz.getModifiers()))
        .forEach(targetConfiguration.getTypeHandlerRegistry()::register);
  }

  if (!isEmpty(this.typeHandlers)) {
    Stream.of(this.typeHandlers).forEach(typeHandler -> {
      targetConfiguration.getTypeHandlerRegistry().register(typeHandler);
      LOGGER.debug(() -> "Registered type handler: '" + typeHandler + "'");
    });
  }

  targetConfiguration.setDefaultEnumTypeHandler(defaultEnumTypeHandler);

  if (!isEmpty(this.scriptingLanguageDrivers)) {
    Stream.of(this.scriptingLanguageDrivers).forEach(languageDriver -> {
      targetConfiguration.getLanguageRegistry().register(languageDriver);
      LOGGER.debug(() -> "Registered scripting language driver: '" + languageDriver + "'");
    });
  }
  Optional.ofNullable(this.defaultScriptingLanguageDriver)
      .ifPresent(targetConfiguration::setDefaultScriptingLanguage);

  if (this.databaseIdProvider != null) {// fix #64 set databaseId before parse mapper xmls
    try {
      targetConfiguration.setDatabaseId(this.databaseIdProvider.getDatabaseId(this.dataSource));
    } catch (SQLException e) {
      throw new NestedIOException("Failed getting a databaseId", e);
    }
  }

  Optional.ofNullable(this.cache).ifPresent(targetConfiguration::addCache);
// 这这之前,都是对一些配置信息的读取,如果有的话,就会进行相应的赋值之类的操作.
    
  if (xmlConfigBuilder != null) {
    try {
// 最后这里的 parse 解析方法,是和单个 Mybatis的解读是一样的.        
      xmlConfigBuilder.parse();
      LOGGER.debug(() -> "Parsed configuration file: '" + this.configLocation + "'");
    } catch (Exception ex) {
      throw new NestedIOException("Failed to parse config resource: " + this.configLocation, ex);
    } finally {
      ErrorContext.instance().reset();
    }
  }

//这里可以看事务工厂,是使用了mybatis-spring包下的.
  targetConfiguration.setEnvironment(new Environment(this.environment,
      this.transactionFactory == null ? new SpringManagedTransactionFactory() : this.transactionFactory,
      this.dataSource));

// 这里是处理 mapper.xml 文件的配置,如果在这里是有配置的话,那么也是会被解析到的.    
  if (this.mapperLocations != null) {
    if (this.mapperLocations.length == 0) {
      LOGGER.warn(() -> "Property 'mapperLocations' was specified but matching resources are not found.");
    } else {
      for (Resource mapperLocation : this.mapperLocations) {
        if (mapperLocation == null) {
          continue;
        }
        try {
          XMLMapperBuilder xmlMapperBuilder = new XMLMapperBuilder(mapperLocation.getInputStream(),
              targetConfiguration, mapperLocation.toString(), targetConfiguration.getSqlFragments());
          xmlMapperBuilder.parse();
        } catch (Exception e) {
          throw new NestedIOException("Failed to parse mapping resource: '" + mapperLocation + "'", e);
        } finally {
          ErrorContext.instance().reset();
        }
        LOGGER.debug(() -> "Parsed mapper file: '" + mapperLocation + "'");
      }
    }
  } else {
    LOGGER.debug(() -> "Property 'mapperLocations' was not specified.");
  }
//org.apache.ibatis.session.defaults.DefaultSqlSessionFactory,最后到这里也是new了一个mybatis包下的默认SqlSessionFactory类.
  return this.sqlSessionFactoryBuilder.build(targetConfiguration);
}
```

可以看到该方法给人感觉, 先是判断一些配置信息是不是有值，如果是有值的话，就会进行相应的处理。最后调用我们在看单个 mybatis 的 parse 解析方法,最后new了一个默认的sqlSessionFactory工厂类出来.

**MapperScannerConfigurer(org.mybatis.spring.mapper.MapperScannerConfigurer)**

接着看,spring-beans.xml 里面的第二个配置.

可以看到该类，也是实现了 spring 的很多接口.

BeanDefinitionRegistryPostProcessor : 注册BeanDefinition到Spring容器中来.

ApplicationContextAware : 获取 ApplicationContext

BeanNameAware : 设置 beanName名字.

这里也可以按照上面的笨方法，一次对重写的方法打上断点. 然后开启我们的debug来看看方法的执行顺序.

其执行顺序 : setBeanName —> setApplicationContext —> afterPropertiesSet —> postProcessBeanDefinitionRegistry , 跟着这四个方法执行的顺序来看.

```
public class MapperScannerConfigurer
    implements BeanDefinitionRegistryPostProcessor, InitializingBean, ApplicationContextAware, BeanNameAware { }
```

赋值给 beanName 值. org.mybatis.spring.mapper.MapperScannerConfigurer#0

```
@Override
public void setBeanName(String name) {
  this.beanName = name;
}


// 然后这里是给到 ApplicationContext. 这也就说这个类现在有了 ApplicationContext,可以根据context提供的api来进行相应的操作.
  @Override
  public void setApplicationContext(ApplicationContext applicationContext) {
    this.applicationContext = applicationContext;
  }

// 检验配置包的值不能为null.
  @Override
  public void afterPropertiesSet() throws Exception {
    notNull(this.basePackage, "Property 'basePackage' is required");
  }



  /**
   * {@inheritDoc}
   * 可以感受到这个方法, 在拿到了BeanDefinitionRegistry的情况下,往里面注册bd.
   * @since 1.0.2
   */
  @Override
  public void postProcessBeanDefinitionRegistry(BeanDefinitionRegistry registry) {
    if (this.processPropertyPlaceHolders) {
      processPropertyPlaceHolders();
    }

// 这段是创建了一个 ClassPathMapperScanner 对象,然后往里面set属性.      
    ClassPathMapperScanner scanner = new ClassPathMapperScanner(registry);
    scanner.setAddToConfig(this.addToConfig);
    scanner.setAnnotationClass(this.annotationClass);
    scanner.setMarkerInterface(this.markerInterface);
    scanner.setSqlSessionFactory(this.sqlSessionFactory);
    scanner.setSqlSessionTemplate(this.sqlSessionTemplate);
    scanner.setSqlSessionFactoryBeanName(this.sqlSessionFactoryBeanName);
    scanner.setSqlSessionTemplateBeanName(this.sqlSessionTemplateBeanName);
    scanner.setResourceLoader(this.applicationContext);
    scanner.setBeanNameGenerator(this.nameGenerator);
    scanner.setMapperFactoryBeanClass(this.mapperFactoryBeanClass);
      
    if (StringUtils.hasText(lazyInitialization)) {
      scanner.setLazyInitialization(Boolean.valueOf(lazyInitialization));
    }
    if (StringUtils.hasText(defaultScope)) {
      scanner.setDefaultScope(defaultScope);
    }
      
// 对register里的信息进行过滤      
    scanner.registerFilters();
// org.springframework.context.annotation.ClassPathBeanDefinitionScanner#scan
// 这里主要看扫描的方法. 根据,来切割我们写的 basePackage 信息.扫描类的信息,最后还是借用了 org.springframework.context.annotation.ClassPathBeanDefinitionScanner#doScan 来进行扫描的. //  doScan(basePackages) 是对 xml 进行扫描的.
// AnnotationConfigUtils.registerAnnotationConfigProcessors(this.registry); 是对注解进行扫描的.
// 最后返回注册到 Spring 容器中的 bean 个数
// 所以如果我们配置了下面的标签,那么在这里都会被扫描到并且注册到Spring容器中.
//     <bean class="org.mybatis.spring.mapper.MapperScannerConfigurer">
//        <property name="basePackage" value="com.iyang.sm.mapper" ></property>
//    </bean>
// 这里需要注意的是:  org.mybatis.spring.mapper.ClassPathMapperScanner#processBeanDefinitions
//   definition.setBeanClass(this.mapperFactoryBeanClass);  这里的这行代码,是给bd的beanClass给换成了 MapperFactoryBean.class , 
//  definition.getConstructorArgumentValues().addGenericArgumentValue(beanClassName);     // 这句代码,将 beanClassName 给到 db之后, 然后就才用 beanClassName来new一个 MapperFactoryBean 对象来, 所以这里并不是使用无参构造函数.
// 也许会问,怎么证实没有走无参数构造函数呢 ? 而是去走的 set 方法呢 ? 
// 再不能动源码的情况下, 面对这种情况情况最好的办法就是, 在无参构造函数上打上断点.
// 如果没走到断点上,那就说明不是走的无参构造函数来初始化的.      
    scanner.scan(
        StringUtils.tokenizeToStringArray(this.basePackage, ConfigurableApplicationContext.CONFIG_LOCATION_DELIMITERS));
  }
```

所以到这里, 可以看到 MyBatis 与 Spring 整合的过程就已经完成了.

我们这里是主要对 SqlSessionFactoryBean 和 MapperScannerConfigurer 来进行分析的, 可以很明显的感觉到,我们是配置好这二个bean后,就可以使用了. 着重看第二个, org.mybatis.spring.mapper.MapperScannerConfigurer 这个bean,就是做了如何将 MyBatis 的 mapper接口文件给加载到 Spring 中来的. **那么这里我在想, 如果有天我自己开发出一个好用的框架来,要与 Spring 进行整合的话,是不是也这样整合就可以了？**

```
<!-- 配置sqlSessionFactory，SqlSessionFactoryBean是用来产生sqlSessionFactory的 -->
<bean id="sqlSessionFactory" class="org.mybatis.spring.SqlSessionFactoryBean">
    <!-- 加载mybatis的全局配置文件，放在classpath下的mybatis文件夹中了 -->
    <property name="configLocation" value="mybatis/SqlMapConfig.xml" />
    <!-- 加载数据源，使用上面配置好的数据源 -->
    <property name="dataSource" ref="dataSource" />
</bean>

<!--  配置扫描 MyBatis 接口的包 -->
<bean class="org.mybatis.spring.mapper.MapperScannerConfigurer">
    <property name="basePackage" value="com.iyang.sm.mapper" ></property>
</bean>
```

#### 总结

 可以看到 MyBatis 与 Spring 整合后, 对于解析 MyBatis 的 mapper 配置文件等，都是走的之前单个 mybatis 的逻辑, 是没有什么变化的. 主要的是将 , SqlSessionFactory 和 Mapper.class(接口类) 给注入到 Spring 容器中.然后接口的话, 是怎么使用的代理类来进行实例化完后, 将对象给注入到 Spring 容器中的呢 ？ 这里看 org.mybatis.spring.mapper.MapperScannerConfigurer 做的事情就明白了.

 不过在看 mybatis 与 Spring 整合的时候, 还是建议要有对 BeanDefinitionRegistryPostProcessor / InitializingBean / ApplicationContextAware / BeanNameAware 有一定的了接. 就是有了了解后, 你就会很明显的感受到， mybatis 为什么是实现这个接口，实现这个接口并且重写这个方法，在后面是什么时候被调用的. 意思也就是，你至少得明白点 Spring 对外提供的一些扩展点，才能很好的理解这些东西.
