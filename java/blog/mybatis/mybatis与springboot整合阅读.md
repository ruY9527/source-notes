---
title: mybatis与springboot整合阅读
date: 2021-11-04 00:29:43
tags: 
  - java框架
  - mybatis
categories:
  - java框架
  - mybatis
---

#### 前提

 MyBatis 与 SpringBoot 整合操作. 在这次整合的过程中,再次明白自己毫无疑问的是一个比较手残的同学了.

 这里我们是基于 sql 语句写在 xml 里面进行整合的操作.

#### 入门

 这里说下创建一个 入门 项目的大致流程.

 先创建一个 SpringBoot 项目 , 引入依赖 : https://github.com/baoyang23/mybtatis-analysis/blob/master/mybatis-spring-boot-hello/pom.xml

 创建 MyBatis 的配置文件信息 : https://github.com/baoyang23/mybtatis-analysis/blob/master/mybatis-spring-boot-hello/src/main/resources/mybatis-config.xml

 创建查询的 sql 语句，也就是我们的 mapper 文件 : https://github.com/baoyang23/mybtatis-analysis/tree/master/mybatis-spring-boot-hello/src/main/resources/mapper

 application.properties : https://github.com/baoyang23/mybtatis-analysis/blob/master/mybatis-spring-boot-hello/src/main/resources/application.properties

 扫描 mapper 接口 : @MapperScan(basePackages = {“com.iyang.mybatis.springboot.hello.mapper”}) https://github.com/baoyang23/mybtatis-analysis/blob/master/mybatis-spring-boot-hello/src/main/java/com/iyang/mybatis/springboot/hello/MybatisSpringBootHelloApplication.java

这里是没有引入 web 依赖的 , 直接启动 main 方法 , 然后就可以看到我们查询出来的结果了.

如果你熟悉 SpringBoot 源码的话，就会晓得有一个自动装配的操作.

如果不熟悉的话，那么就只能通过 @MapperScan(basePackages = {“com.iyang.mybatis.springboot.hello.mapper”}) 去看 , 这样有些是依赖自动装配（spring.factories） 中的配置加载的, 所以这里建议在看之前，如果是有一点 SpringBoot 扩展的知识了解是很好的。如果没有怎么办呢？没有就来看我接下来的内容。

其实这个地方你仔细想下，在 MyBatis 与 Spring 整合的时候，通过 xml 的方式给 MyBatis 的bean 已经 mybatis-spring 中自己写的扫描类，最后将扫描出来的 bd 在还没初始化之前，将bd 的beanClass 替换为我们的代理类.

那么，SpringBoot 与 MyBatis 整合的时候，最后要做的事情是不是也是将 MyBatis 的信息注入到 SpringBoot 来呢？只不过，SpringBoot 就不像 Spring 一样了，还将 bean 的信息配置到 xml 文件中.

于是，接下来跟我的阅读&分析来一步一步的往下看.

#### 方法分析

 **关注点一** : 这里我们点入到 org.mybatis.spring.annotation.MapperScan 注解里面来，可以看到有一个 @Import(MapperScannerRegistrar.class) , 于是我们顺手跟进来 : org.mybatis.spring.annotation.MapperScannerRegistrar , 从名字上来，这个类就做了一个扫描mapper并且将mapper注入到Spring容器中来的事情.

 **关注点二** : 我们从引入进来的依赖来看, mybatis-spring-boot-starter-2.1.2.jar 跟进到 这个包来，可以看到这个包也是引入一些进来. mybatis/mybatis-spring/spring-boot-starter-jdbc 这三个依赖我们应该不是很陌生的，mybatis-spring-boot-autoconfigure主要来看这个。 spring.factories 的作用大家可以去了解下，SpringBoot很多 EnableAutoConfiguration 的配置都是放入在这个里面的，在启动的时候，会去一层一层的去读取 spring.factories 文件的内容。 这里我们主要来看 : org.mybatis.spring.boot.autoconfigure.MybatisAutoConfiguration 这个类皆可.

 MyBatis 在 properties 中的配置文件读取 : org.mybatis.spring.boot.autoconfigure.MybatisProperties

可以看到该类上是有: @ConfigurationProperties(prefix = MybatisProperties.MYBATIS_PREFIX)

于是我们一下子就多了二个关注点, 这里我们可以采用之前的 笨方法， 当你对整合流程执行不是很熟悉的话，可以在这二个关注点的重写方法上都打算断点，看下其执行顺序是怎么执行的. 弄清楚了执行流程,就可以跟着流程来一步一步的分析. 从我们打上 debug 开始，往下的执行流程就是一步一步来的，那么就跟着我们debug 的方法来一步一步的分析.

org.mybatis.spring.annotation.MapperScannerRegistrar#registerBeanDefinitions() —> org.mybatis.spring.boot.autoconfigure.MybatisAutoConfiguration#MybatisAutoConfiguration —> org.mybatis.spring.boot.autoconfigure.MybatisAutoConfiguration#afterPropertiesSet —-> org.mybatis.spring.boot.autoconfigure.MybatisAutoConfiguration#sqlSessionFactory —> org.mybatis.spring.boot.autoconfigure.MybatisAutoConfiguration#sqlSessionTemplate() —->

**org.mybatis.spring.annotation.MapperScannerRegistrar#registerBeanDefinitions() 方法** :

```
/**
 * {@inheritDoc}
 */
@Override
public void registerBeanDefinitions(AnnotationMetadata importingClassMetadata, BeanDefinitionRegistry registry) {
/***
*  这里是获取出了注解里面属性的值. 
*/   
  AnnotationAttributes mapperScanAttrs = 
  AnnotationAttributes.fromMap(importingClassMetadata.getAnnotationAttributes(MapperScan.class.getName()));

// 能获取到有注解,不是null,就会走到下面的代码中来.    
  if (mapperScanAttrs != null) {
    registerBeanDefinitions(importingClassMetadata, mapperScanAttrs, registry,
        generateBaseBeanName(importingClassMetadata, 0));
  }
}

/**
* 
*/
  void registerBeanDefinitions(AnnotationMetadata annoMeta, AnnotationAttributes annoAttrs,
      BeanDefinitionRegistry registry, String beanName) {

// 利用 BeanDefinitionBuilder 构造者,传入了一个 MapperScannerConfigurer.class
// 这里的 builder里面是有一个 bd 的,里面的beanClass就是 MapperScannerConfigurer      
    BeanDefinitionBuilder builder = BeanDefinitionBuilder.genericBeanDefinition(MapperScannerConfigurer.class);
    builder.addPropertyValue("processPropertyPlaceHolders", true);

// 这里获取 @MapperScan 注解的属性, 如果属性是有值的话,就会设置到 builder 中来. 
    Class<? extends Annotation> annotationClass = annoAttrs.getClass("annotationClass");
    if (!Annotation.class.equals(annotationClass)) {
      builder.addPropertyValue("annotationClass", annotationClass);
    }

    Class<?> markerInterface = annoAttrs.getClass("markerInterface");
    if (!Class.class.equals(markerInterface)) {
      builder.addPropertyValue("markerInterface", markerInterface);
    }

    Class<? extends BeanNameGenerator> generatorClass = annoAttrs.getClass("nameGenerator");
    if (!BeanNameGenerator.class.equals(generatorClass)) {
      builder.addPropertyValue("nameGenerator", BeanUtils.instantiateClass(generatorClass));
    }

    Class<? extends MapperFactoryBean> mapperFactoryBeanClass = annoAttrs.getClass("factoryBean");
    if (!MapperFactoryBean.class.equals(mapperFactoryBeanClass)) {
      builder.addPropertyValue("mapperFactoryBeanClass", mapperFactoryBeanClass);
    }

    String sqlSessionTemplateRef = annoAttrs.getString("sqlSessionTemplateRef");
    if (StringUtils.hasText(sqlSessionTemplateRef)) {
      builder.addPropertyValue("sqlSessionTemplateBeanName", annoAttrs.getString("sqlSessionTemplateRef"));
    }

    String sqlSessionFactoryRef = annoAttrs.getString("sqlSessionFactoryRef");
    if (StringUtils.hasText(sqlSessionFactoryRef)) {
      builder.addPropertyValue("sqlSessionFactoryBeanName", annoAttrs.getString("sqlSessionFactoryRef"));
    }


// 下面是根据 value/basePackages/basePackageClasses 来获取包的信息,
// 这里也就说, 我们可以跟着这三个属性来配置包信息.      
    List<String> basePackages = new ArrayList<>();
    basePackages.addAll(
        Arrays.stream(annoAttrs.getStringArray("value")).filter(StringUtils::hasText).collect(Collectors.toList()));

    basePackages.addAll(Arrays.stream(annoAttrs.getStringArray("basePackages")).filter(StringUtils::hasText)
        .collect(Collectors.toList()));

    basePackages.addAll(Arrays.stream(annoAttrs.getClassArray("basePackageClasses")).map(ClassUtils::getPackageName)
        .collect(Collectors.toList()));

// 如果没有获取到包的信息,那就根据注解所在的路径来获取默认的路径.      
    if (basePackages.isEmpty()) {
      basePackages.add(getDefaultBasePackage(annoMeta));
    }
// 如果有lazyInitialization属性的值,就设置到 builder 中来. 
    String lazyInitialization = annoAttrs.getString("lazyInitialization");
    if (StringUtils.hasText(lazyInitialization)) {
      builder.addPropertyValue("lazyInitialization", lazyInitialization);
    }
// 添加包的属性
    builder.addPropertyValue("basePackage", StringUtils.collectionToCommaDelimitedString(basePackages));

//  getBeanDefinition() 在返回 bd 之前，会走一个 validate 方法.
// org.springframework.beans.factory.support.DefaultListableBeanFactory#registerBeanDefinition
// 走这个方法来将 bd 给注入到 Spring 容器中来.
// 这里注入进去的 beanName 的值是 :  com.iyang.mybatis.springboot.hello.MybatisSpringBootHelloApplication#MapperScannerRegistrar#0
// 注入进去的 bd 的 beanClass : class org.mybatis.spring.mapper.MapperScannerConfigurer 
    registry.registerBeanDefinition(beanName, builder.getBeanDefinition());

  }
```

**这里可以总结下 registerBeanDefinitions 方法，该方法就是将 @MapperScan 的注解属性的值给到 : BeanDefinitionBuilder builder, 该builder 里面有bd,bd的beanClass是MapperScannerConfigurer，最后将MapperScannerConfigurer注入到 Spring 容器中来.**

------

**MyBatisAutoConfiguration() 有参构造函数**

这里我们在 MybatisAutoConfiguration 构造函数上打上断点, 可以根据 断点来分析，走完👆面的方法，然后我们点击走到下一个断点来，就会走到 这个 有参构造函数.

如果好奇的话，可以跟踪debug 的堆栈信息，是怎么走到这步来的. 走到这个方法来 : finishBeanFactoryInitialization(beanFactory) 这是最初的入口.

```
public MybatisAutoConfiguration(MybatisProperties properties, ObjectProvider<Interceptor[]> interceptorsProvider,
    ObjectProvider<TypeHandler[]> typeHandlersProvider, ObjectProvider<LanguageDriver[]> languageDriversProvider,
    ResourceLoader resourceLoader, ObjectProvider<DatabaseIdProvider> databaseIdProvider,
    ObjectProvider<List<ConfigurationCustomizer>> configurationCustomizersProvider) {
// 这里都是赋值    
  this.properties = properties;
  this.interceptors = interceptorsProvider.getIfAvailable();
  this.typeHandlers = typeHandlersProvider.getIfAvailable();
  this.languageDrivers = languageDriversProvider.getIfAvailable();
  this.resourceLoader = resourceLoader;
  this.databaseIdProvider = databaseIdProvider.getIfAvailable();
  this.configurationCustomizers = configurationCustomizersProvider.getIfAvailable();
}
```

**org.mybatis.spring.boot.autoconfigure.MybatisAutoConfiguration#afterPropertiesSet()方法**

这里可以看到是对配置文件是否存在进行检验.

```
@Override
public void afterPropertiesSet() {
  checkConfigFileExists();
}

// 检验配置文件是否存在
  private void checkConfigFileExists() {
    if (this.properties.isCheckConfigLocation() && StringUtils.hasText(this.properties.getConfigLocation())) {
      Resource resource = this.resourceLoader.getResource(this.properties.getConfigLocation());
      Assert.state(resource.exists(),
          "Cannot find config location: " + resource + " (please add config file or check your Mybatis configuration)");
    }
  }
```

**org.mybatis.spring.boot.autoconfigure.MybatisAutoConfiguration#sqlSessionFactory 方法**

```
// 这里说下 @ConditionalOnMissingBean 的作用,当bean不存在的时候，则实例化这个bean.
// 这里会传入 dataSource 进来.
@Bean
@ConditionalOnMissingBean
public SqlSessionFactory sqlSessionFactory(DataSource dataSource) throws Exception {
// 创建 sqlSessionBean 对象.    
  SqlSessionFactoryBean factory = new SqlSessionFactoryBean();
// 设置 dataSource & SpringBootVFS.class      
  factory.setDataSource(dataSource);
  factory.setVfs(SpringBootVFS.class);
// 获取到 MyBatis 的配置文件属性,如果有的话,就会设置到 configLocation属性来.    
  if (StringUtils.hasText(this.properties.getConfigLocation())) {
    factory.setConfigLocation(this.resourceLoader.getResource(this.properties.getConfigLocation()));
  }
    
// 这里从 properties 中获取 configuration,没有值就会是null.    
  applyConfiguration(factory);
  if (this.properties.getConfigurationProperties() != null) {
    factory.setConfigurationProperties(this.properties.getConfigurationProperties());
  }

// 如果有插件,就会设置插件.    
  if (!ObjectUtils.isEmpty(this.interceptors)) {
    factory.setPlugins(this.interceptors);
  }
  if (this.databaseIdProvider != null) {
    factory.setDatabaseIdProvider(this.databaseIdProvider);
  }
// 包的名别设置    
  if (StringUtils.hasLength(this.properties.getTypeAliasesPackage())) {
    factory.setTypeAliasesPackage(this.properties.getTypeAliasesPackage());
  }
  if (this.properties.getTypeAliasesSuperType() != null) {
    factory.setTypeAliasesSuperType(this.properties.getTypeAliasesSuperType());
  }
  if (StringUtils.hasLength(this.properties.getTypeHandlersPackage())) {
    factory.setTypeHandlersPackage(this.properties.getTypeHandlersPackage());
  }
  if (!ObjectUtils.isEmpty(this.typeHandlers)) {
    factory.setTypeHandlers(this.typeHandlers);
  }
  if (!ObjectUtils.isEmpty(this.properties.resolveMapperLocations())) {
    factory.setMapperLocations(this.properties.resolveMapperLocations());
  }
// 这里都是配置属性的设置.    

// 获取 propert 字段属性的名字.    
  Set<String> factoryPropertyNames = Stream
      .of(new BeanWrapperImpl(SqlSessionFactoryBean.class).getPropertyDescriptors()).map(PropertyDescriptor::getName)
      .collect(Collectors.toSet());
  Class<? extends LanguageDriver> defaultLanguageDriver = this.properties.getDefaultScriptingLanguageDriver();
  if (factoryPropertyNames.contains("scriptingLanguageDrivers") && !ObjectUtils.isEmpty(this.languageDrivers)) {
    // Need to mybatis-spring 2.0.2+
    factory.setScriptingLanguageDrivers(this.languageDrivers);
    if (defaultLanguageDriver == null && this.languageDrivers.length == 1) {
      defaultLanguageDriver = this.languageDrivers[0].getClass();
    }
  }
// 设置默认的脚本语言解析器. 这里没有,设置的是默认的null.    
  if (factoryPropertyNames.contains("defaultScriptingLanguageDriver")) {
    // Need to mybatis-spring 2.0.2+
    factory.setDefaultScriptingLanguageDriver(defaultLanguageDriver);
  }
// org.mybatis.spring.SqlSessionFactoryBean#getObject,这里走到了 SqlSessionBean.
// 这个SqlSessionFactoryBean是在有之前 mybatis和Spring 整合分析有提过到的,可以参考getObject方法: https://github.com/baoyang23/mybtatis-analysis/tree/master/mybatis-spring-hello    
// 这里会走 org.mybatis.spring.SqlSessionFactoryBean#getObject 的 afterPropertiesSet 方法来创建一个 SqlSessionFactory , 这里返回的 SqlSessionFactory 就注入到 Spring 容器中来.    
  return factory.getObject();
}
```

**所以这个方法 ： 先是new了一个SqlSessionFactoryBean对象，如果你仔细看的话，你会发现这个对象在之前 mybatis-spring 整合的时候，我们通过 xml 配置文件配置进来的，并且同时通过标签给赋值了datasource等信息， 而这里是通过代码，if等判断，来对 SqlSessionFactoryBean 的属性进行set值的. 最后也是创建出一个 SqlSessionFactory 给注入到 Spring 容器中来.**

------

**org.mybatis.spring.boot.autoconfigure.MybatisAutoConfiguration#sqlSessionTemplate 方法**

```
@Bean
@ConditionalOnMissingBean
public SqlSessionTemplate sqlSessionTemplate(SqlSessionFactory sqlSessionFactory) {
// 这里根据 executorType 是否有值来判断要走的构造函数方法.    
  ExecutorType executorType = this.properties.getExecutorType();
  if (executorType != null) {
    return new SqlSessionTemplate(sqlSessionFactory, executorType);
  } else {
// 这里默认的获取是 SIMPLE 这个 ExecutorType.      
    return new SqlSessionTemplate(sqlSessionFactory);
  }
}

// org.mybatis.spring.SqlSessionTemplate#SqlSessionTemplate(org.apache.ibatis.session.SqlSessionFactory, org.apache.ibatis.session.ExecutorType, org.springframework.dao.support.PersistenceExceptionTranslator),最后可以跟进到这个方法中来.

  public SqlSessionTemplate(SqlSessionFactory sqlSessionFactory, ExecutorType executorType,
      PersistenceExceptionTranslator exceptionTranslator) {
// 对sqlSessionFactory 和 executorType 进行校验
    notNull(sqlSessionFactory, "Property 'sqlSessionFactory' is required");
    notNull(executorType, "Property 'executorType' is required");

    this.sqlSessionFactory = sqlSessionFactory;
    this.executorType = executorType;
    this.exceptionTranslator = exceptionTranslator;
// 这里通过 JDK 的代码来生成了一个 sqlSessionProxy 代理的对象.      
    this.sqlSessionProxy = (SqlSession) newProxyInstance(SqlSessionFactory.class.getClassLoader(),
        new Class[] { SqlSession.class }, new SqlSessionInterceptor());
  }
```

该方法是将 SqlSessionTemplate 给注入到 Spring 容器中啦.

#### 疑惑点

 大家有没有疑惑我们定义的 mapper 接口 好像从这个流程分析下来，并没有提到 ，那么是在上面时候被注入到 Spring 容器中来的呢？

 registerBeanDefinitions() 这个方法 , 注入了MapperScannerConfigurer 到 Spring 容器中来了，可以回顾下之前 mybatis 整合 Spring 的时候，我们是通过 xml 配置了这个对象注入到 spring 容器中来的。 那么注入进来的,回调到 org.mybatis.spring.mapper.MapperScannerConfigurer#postProcessBeanDefinitionRegistry 这个方法的时候，就会将扫描并且将我们的mapper接口文件，给注入到 Spring 容器中来的. 然后扫描的包，是根据@MapperScan 解析注解的时候，是有对扫描的包进行解析的.

#### 总结

 其实 SpringBoot 整合 MyBatis , 我们从二个切入点来分析是怎么整合进来的.
​ 一是 @MapperScan 注解中的 @Import(MapperScannerRegistrar.class) 将 MapperScannerRegistrar 给导入到 Spring 容器中来, 然后MapperSacnnerRegistrar 来讲 org.mybatis.spring.mapper.MapperScannerConfigurer 给注入到 Spring中来，替换了我们之前用 Spring 整合 Mybatis 的时候，通过xml配置文件整合进来.

 二是利用 SpringBoot 提供的 spring-boot-autoconfigure + spring.factories() 来 配置自动注入, 这里注入了 MybatisAutoConfiguration 配置类. 然后注入进来的 MyBatis 配置类做了什么事情呢？ 可以看到这个类中是有做: 注入了 SqlSessionFactory. SqlSessionFactory 又是怎么注入进来的呢？ 可以看到 org.mybatis.spring.boot.autoconfigure.MybatisAutoConfiguration#sqlSessionFactory 方法是有先创建一个 org.mybatis.spring.SqlSessionFactoryBean 的， 看到 SqlSessionFactoryBean 这个对象，我们就不难想起 Spring + Mybatis 里面的 beans.xml 是将该对象注入到 Spring 容器中来. 这里是直接new的，然后将一些配置属性并满足条件,给set到 SqlSessionFactoryBean 中来，最后调用 org.mybatis.spring.SqlSessionFactoryBean#getObject 方法来获取 SqlSessionFactory.

spring.factories 文件内容

```
# Auto Configure
org.springframework.boot.autoconfigure.EnableAutoConfiguration=\
org.mybatis.spring.boot.autoconfigure.MybatisLanguageDriverAutoConfiguration,\
org.mybatis.spring.boot.autoconfigure.MybatisAutoConfiguration
```

最后从写的案例里面看, MyBatis 整合 SpringBoot 其实都是在 mybatis —> MyBatis + Spring 等一步一步推导上来的，所以这里不难理解，好的技术都是在有需要和时间的沉淀下一步一步成长起来的.
