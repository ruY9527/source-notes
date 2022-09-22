---
title: spring的refresh方法阅读
date: 2021-11-04 00:17:10
tags: 
  - java
  - spring
categories:
  - java
  - spring
---



#### 前言

这里是相对上一次再次的阅读和记录,比上次有了更深入的理解.

这里是再次整理的阅读 Spring 的源码, 相对比上次的阅读，我希望这次可以更清晰&更深刻的理解Spring,也不仅仅会从一个案例来进行分析，会结合多方面的知识来进行整理分析.

 这里放上之前阅读的比例 : https://github.com/baoyang23/source-notes/tree/master/java/spring_bean

 该目录下面有 : bean/get/extend 三个主要地方的分析.

 此模块还是讲述 整体的 flow,后面会对单个进行分析&Spring提供怎么样的扩展方式来进行增强扩展等.

案例入门操作的话,可以参考之前的博客.

#### 分析

 这里我们先不忙这其他类型的bean分析, 就对我们作为 config 的 bean 进行分析. 先单个分析容易理解些.

 入口类 :

```java
public class InitWorkFlowSpring {


    public static void main(String[] args) {

        AnnotationConfigApplicationContext context =
                new AnnotationConfigApplicationContext(YangBeanScannerConfig.class);
        YangBeanScannerConfig yangBeanScannerConfig = context.getBean(YangBeanScannerConfig.class);
        yangBeanScannerConfig.say();

    }

}
```

 配置类:

```java
@ComponentScan(basePackages = "com.iyang.spring")
@Description(value = "This is GavinYang DemoWorld.")
public class YangBeanScannerConfig {

    public YangBeanScannerConfig(){
        System.out.println("配置扫描初始化打印");
    }

    public void say(){
        System.out.println("我是从Spring容器中获取出来的");
    }
}
```

可以看到，当我们启动 main 方法的时候，是可以看到 YangBeanScannerConfig 中构造函数打印的内容和调用say方法打印出来的内容.

基于这个基础上,我们debug一层一层的走进去看,Spring做了什么事情.

先进入到我们new出来的AnnotationConfigApplicationContext中来

调用自身的无参构造函数

调用 register 注册方法

最后调用一个 refresh, refresh 方法中是做了很多事的.

```java
public AnnotationConfigApplicationContext(Class<?>... componentClasses) {
   this();
   register(componentClasses);
   refresh();
}
```

那么有了入口，我们就根据这些方法来一个一个的分析.

#### this() 方法 —> org.springframework.context.annotation.AnnotationConfigApplicationContext#AnnotationConfigApplicationContext()

先来看 this 方法做了什么事情.

创建了二个对象，分别是 注解bd读取/类路口db扫描.

比如有意思的是,传入this(AnnotationConfigApplicationContext), 然后返回来的reader/scanner又属于this.也是相互之间各自都持有各自的引用.

```java
public AnnotationConfigApplicationContext() {
   this.reader = new AnnotatedBeanDefinitionReader(this);
   this.scanner = new ClassPathBeanDefinitionScanner(this);
}
```

##### new AnnotatedBeanDefinitionReader

来，看下new一个对象做了什么事情.

```java
public AnnotatedBeanDefinitionReader(BeanDefinitionRegistry registry) {
// 这里的 getOrCreateEnvironment 方法中,AnnotationConfigApplicationContext是EnvironmentCapable的子类,
// 所以Environment也是从AnnotationConfigApplicationContext中获取出来的.    
   this(registry, getOrCreateEnvironment(registry));
}

--------------
    
public AnnotatedBeanDefinitionReader(BeanDefinitionRegistry registry, Environment environment) {
 // 检验 registry/environment都不能为null.   
		Assert.notNull(registry, "BeanDefinitionRegistry must not be null");
		Assert.notNull(environment, "Environment must not be null");
		this.registry = registry;
// 这里将 registry/environment 给传入构造到 org.springframework.context.annotation.ConditionEvaluator 中来.
// ConditionEvaluator又借助org.springframework.context.annotation.ConditionEvaluator.ConditionContextImpl#ConditionContextImpl 来存储这些信息,所以这里最后的信息是在ConditionContextImpl中来了.    
		this.conditionEvaluator = new ConditionEvaluator(registry, environment, null);
// org.springframework.context.annotation.AnnotationConfigUtils#registerAnnotationConfigProcessors(org.springframework.beans.factory.support.BeanDefinitionRegistry, java.lang.Object)
// 从该方法的名字上看,是对注册注解配置进行处理.    
		AnnotationConfigUtils.registerAnnotationConfigProcessors(this.registry);
}
```

###### org.springframework.context.annotation.AnnotationConfigUtils#registerAnnotationConfigProcessors(org.springframework.beans.factory.support.BeanDefinitionRegistry, java.lang.Object) 分析

这里根据我们的案列，传入进来的source是null.

```java
public static Set<BeanDefinitionHolder> registerAnnotationConfigProcessors(
      BeanDefinitionRegistry registry, @Nullable Object source) {
// 根据 registry 的类型来获取 DefaultListableBeanFactory.
// 这里的registry属于GenericApplicationContext,调用其getDefaultListableBeanFactory来获取.    
   DefaultListableBeanFactory beanFactory = unwrapDefaultListableBeanFactory(registry);
   if (beanFactory != null) {
// beanFactory.getDependencyComparator() 返回的是null,满足条件.       
      if (!(beanFactory.getDependencyComparator() instanceof AnnotationAwareOrderComparator)) {
// 设置 AnnotationAwareOrderComparator 到beanFactory中来          
         beanFactory.setDependencyComparator(AnnotationAwareOrderComparator.INSTANCE);
      }
// get方法获取出来的是SimpleAutowireCandidateResolver,       
      if (!(beanFactory.getAutowireCandidateResolver() instanceof ContextAnnotationAutowireCandidateResolver)) {
// 设置ContextAnnotationAutowireCandidateResolver到beanFactory中来.          
         beanFactory.setAutowireCandidateResolver(new ContextAnnotationAutowireCandidateResolver());
      }
   }

   Set<BeanDefinitionHolder> beanDefs = new LinkedHashSet<>(8);

// 可以看到每个都有 internal 来特意表明内部的意思.    
// org.springframework.context.annotation.internalConfigurationAnnotationProcessor --->  ConfigurationClassPostProcessor
// org.springframework.context.annotation.internalAutowiredAnnotationProcessor  --> AutowiredAnnotationBeanPostProcessor
// org.springframework.context.annotation.internalCommonAnnotationProcessor   ---> CommonAnnotationBeanPostProcessor 
// org.springframework.context.annotation.internalPersistenceAnnotationProcessor  ---> PersistenceAnnotationBeanPostProcessor
// org.springframework.context.event.internalEventListenerProcessor   ---> EventListenerMethodProcessor
// org.springframework.context.event.internalEventListenerFactory  --- > DefaultEventListenerFactory
   if (!registry.containsBeanDefinition(CONFIGURATION_ANNOTATION_PROCESSOR_BEAN_NAME)) {
      RootBeanDefinition def = new RootBeanDefinition(ConfigurationClassPostProcessor.class);
      def.setSource(source);
      beanDefs.add(registerPostProcessor(registry, def, CONFIGURATION_ANNOTATION_PROCESSOR_BEAN_NAME));
   }

   if (!registry.containsBeanDefinition(AUTOWIRED_ANNOTATION_PROCESSOR_BEAN_NAME)) {
      RootBeanDefinition def = new RootBeanDefinition(AutowiredAnnotationBeanPostProcessor.class);
      def.setSource(source);
      beanDefs.add(registerPostProcessor(registry, def, AUTOWIRED_ANNOTATION_PROCESSOR_BEAN_NAME));
   }

   // Check for JSR-250 support, and if present add the CommonAnnotationBeanPostProcessor.
   if (jsr250Present && !registry.containsBeanDefinition(COMMON_ANNOTATION_PROCESSOR_BEAN_NAME)) {
      RootBeanDefinition def = new RootBeanDefinition(CommonAnnotationBeanPostProcessor.class);
      def.setSource(source);
      beanDefs.add(registerPostProcessor(registry, def, COMMON_ANNOTATION_PROCESSOR_BEAN_NAME));
   }

   // Check for JPA support, and if present add the PersistenceAnnotationBeanPostProcessor.
   if (jpaPresent && !registry.containsBeanDefinition(PERSISTENCE_ANNOTATION_PROCESSOR_BEAN_NAME)) {
      RootBeanDefinition def = new RootBeanDefinition();
      try {
         def.setBeanClass(ClassUtils.forName(PERSISTENCE_ANNOTATION_PROCESSOR_CLASS_NAME,
               AnnotationConfigUtils.class.getClassLoader()));
      }
      catch (ClassNotFoundException ex) {
         throw new IllegalStateException(
               "Cannot load optional framework class: " + PERSISTENCE_ANNOTATION_PROCESSOR_CLASS_NAME, ex);
      }
      def.setSource(source);
      beanDefs.add(registerPostProcessor(registry, def, PERSISTENCE_ANNOTATION_PROCESSOR_BEAN_NAME));
   }

   if (!registry.containsBeanDefinition(EVENT_LISTENER_PROCESSOR_BEAN_NAME)) {
      RootBeanDefinition def = new RootBeanDefinition(EventListenerMethodProcessor.class);
      def.setSource(source);
      beanDefs.add(registerPostProcessor(registry, def, EVENT_LISTENER_PROCESSOR_BEAN_NAME));
   }

   if (!registry.containsBeanDefinition(EVENT_LISTENER_FACTORY_BEAN_NAME)) {
      RootBeanDefinition def = new RootBeanDefinition(DefaultEventListenerFactory.class);
      def.setSource(source);
      beanDefs.add(registerPostProcessor(registry, def, EVENT_LISTENER_FACTORY_BEAN_NAME));
   }

   return beanDefs;
}
```

这里都是先判断这些内部的bean,是不是已经在 registry 中已经存在了,如果没有存在的话，就会利用类信息来构造出一个RootBeanDefinition来,接着就是调用 registerPostProcessor 方法给注册到 registry 中来.

最后返回一个注册过的 bean 的 Set 集合回去.

总结下这里就是为了给spring容器中注册一些内部的 bean 进去. 这些注册进去的bean,都是在后面初始化bean&解析bean等情况有使用到的.

##### new ClassPathBeanDefinitionScanner() 方法

```java
public ClassPathBeanDefinitionScanner(BeanDefinitionRegistry registry, boolean useDefaultFilters) {
   this(registry, useDefaultFilters, getOrCreateEnvironment(registry));
}

-----------------------------------------------------
// 最后走到 org.springframework.context.annotation.ClassPathBeanDefinitionScanner#ClassPathBeanDefinitionScanner(org.springframework.beans.factory.support.BeanDefinitionRegistry, boolean, org.springframework.core.env.Environment, org.springframework.core.io.ResourceLoader) 构造函数来.    
public ClassPathBeanDefinitionScanner(BeanDefinitionRegistry registry, boolean useDefaultFilters,
			Environment environment, @Nullable ResourceLoader resourceLoader) {

		Assert.notNull(registry, "BeanDefinitionRegistry must not be null");
// 赋值 registry 来.    
		this.registry = registry;

		if (useDefaultFilters) {
// 添加 filter 到 includeFilters 中来.
// AnnotationTypeFilter(Component.class)
// AnnotationTypeFilter(((Class<? extends Annotation>) ClassUtils.forName("javax.annotation.ManagedBean", cl)     
// 等信息进来      
			registerDefaultFilters();
		}
// org.springframework.context.annotation.ClassPathScanningCandidateComponentProvider#setEnvironment
// 设置 enviornment到父类中来.    
		setEnvironment(environment);
// 这里也是这是到父类来了.
// 返回的resourcePatternResolver是AnnotationConfigApplicationContext.
// metadataReaderFactory 是 CachingMetadataReaderFactory 对象来.
// componentsIndex 是 null.    
		setResourceLoader(resourceLoader);
}
```

该方法可以看到,添加了三个 filter 到 includeFilters 中来.

设置environment / resource 到 其父类org.springframework.context.annotation.ClassPathScanningCandidateComponentProvider 中来.

也就是setXXX方法是调用的父类.

#### register(componentClasses) 方法

```java
@Override
public void register(Class<?>... componentClasses) {
   //  检验传入进来的 comonpentClasses是一定要有值的. 
   Assert.notEmpty(componentClasses, "At least one component class must be specified");
   this.reader.register(componentClasses);
}

-------------------------
// 这里从名字上就可以很容易看出是注册 bean 的    
public void register(Class<?>... componentClasses) {
		for (Class<?> componentClass : componentClasses) {
			registerBean(componentClass);
		}
	}

-----------------------------
private <T> void doRegisterBean(Class<T> beanClass, @Nullable String name,
			@Nullable Class<? extends Annotation>[] qualifiers, @Nullable Supplier<T> supplier,
			@Nullable BeanDefinitionCustomizer[] customizers) {
// new 一个 bd 出来.
		AnnotatedGenericBeanDefinition abd = new AnnotatedGenericBeanDefinition(beanClass);
// 这里没有 @Conditional 注解和 metadata 是 null 就会直接返回 false 来.    
		if (this.conditionEvaluator.shouldSkip(abd.getMetadata())) {
			return;
		}

		abd.setInstanceSupplier(supplier);
 
// 在对象上获取 @Scope 注解,这里没有,所以就不会往下走.
// 这里返回的 ScopeMetadata应该是默认的,scopeName是singleton,scopedProxyMode是No/1    
		ScopeMetadata scopeMetadata = this.scopeMetadataResolver.resolveScopeMetadata(abd);
		abd.setScope(scopeMetadata.getScopeName());
// 获取 beanName 来    
		String beanName = (name != null ? name : this.beanNameGenerator.generateBeanName(abd, this.registry));

// 对一些注解的处理.
// @Lazy , @Primary , @DependsOn , @Role , @Description 如果有这些注解的话,就会进行处理.
// 根据注解的名字,来调用相应的set方法.    
		AnnotationConfigUtils.processCommonDefinitionAnnotations(abd);
    
 // 这里是对是否有 @Primary / @Lazy /   @Qualifier 注解进行判断.
		if (qualifiers != null) {
			for (Class<? extends Annotation> qualifier : qualifiers) {
				if (Primary.class == qualifier) {
					abd.setPrimary(true);
				}
				else if (Lazy.class == qualifier) {
					abd.setLazyInit(true);
				}
				else {
					abd.addQualifier(new AutowireCandidateQualifier(qualifier));
				}
			}
		}
//这里 BeanDefinitionCustomizer[] customizers 数组如果有值的话,
// 会调用 customizer 的 customize 方法传入 bd.
// TODO , 这里由于没有具体的值,也不是很清楚做了什么事情.    
		if (customizers != null) {
			for (BeanDefinitionCustomizer customizer : customizers) {
				customizer.customize(abd);
			}
		}

// 用 bd 和 bean的名字，创建出一个 bd 的持有者.    
		BeanDefinitionHolder definitionHolder = new BeanDefinitionHolder(abd, beanName);
// 这里由于传入进来的 scopeMetadata的值是NO,所以就直接返回bdHolder的持有者了.
// 可以看到返回下面的代码,是满足一个增强类的概念的.    
		definitionHolder = AnnotationConfigUtils.applyScopedProxyMode(scopeMetadata, definitionHolder, this.registry); 
// org.springframework.beans.factory.support.DefaultListableBeanFactory#registerBeanDefinition
//走到beanFactory中的registerBeanDefinition方法来,先是对bd进行校验,然后利用org.springframework.beans.factory.support.DefaultListableBeanFactory#beanDefinitionMap+beaName来判断是不是已经包含了该bean
// 此时如果你是debug的话,你会发现有五个内置的bean已经在该beanDefinitionMap中了.这也是对应了AnnotatedBeanDefinitionReader中处理的内置的bean.
//如果beanDefinitionMap中没有的话,就分为是不是已经开始创建bean了.
//如果没有已经开始创建了,就添加到beanDefinitionMap中来,beanName也会添加到beanDefinitionNames,其实这里有个问题, beanDefinitionMap的key集合就已经是beanName集合了,为什么还单独使用一个集合来维护呢？
// 这样这个bean的信息和bd就放入到 BeanFactory中来了.    
// 如果有别名的注解或者配置的话,就会走到registry.registerAlias(beanName, alias);来进行别名的注册. 
		BeanDefinitionReaderUtils.registerBeanDefinition(definitionHolder, this.registry);
	}
```

这里可以总结下看到 register 方法就是对我们的配置类进行扫描, 然后对是否有一些注解进行判断等. 最后使用 BeanDefinitionReaderUtils 工具类的方法将 bd 给 注册到 Spring 容器中来, 注意这时候是没有实例化我们的 YangBeanScannerConfig,只是封装成 bd + beanName 给注册到 BeanFactory 的 beanDefinitionMap 中来了.

#### refresh() 方法

 更新方法，可以看到这个方法内部是走了很多方法,其逻辑也是比较绕的. 不过没事，我们一个一个方法的来看.

org.springframework.context.support.AbstractApplicationContext#refresh()

可以看到其内部的每个方法上面都是有一行注释的.

于是我们挨个方法来debug进来分析.

```java
// 利用 Object 来当锁对象,避免多个线程同时调用到 refresh 方法来.
private final Object startupShutdownMonitor = new Object();

@Override
public void refresh() throws BeansException, IllegalStateException {
   synchronized (this.startupShutdownMonitor) {
      // Prepare this context for refreshing.
  
      prepareRefresh();

      // Tell the subclass to refresh the internal bean factory.
      ConfigurableListableBeanFactory beanFactory = obtainFreshBeanFactory();

      // Prepare the bean factory for use in this context.
      prepareBeanFactory(beanFactory);

      try {
         // Allows post-processing of the bean factory in context subclasses.
         postProcessBeanFactory(beanFactory);

         // Invoke factory processors registered as beans in the context.
         invokeBeanFactoryPostProcessors(beanFactory);

         // Register bean processors that intercept bean creation.
         registerBeanPostProcessors(beanFactory);

         // Initialize message source for this context.
         initMessageSource();

         // Initialize event multicaster for this context.
         initApplicationEventMulticaster();

         // Initialize other special beans in specific context subclasses.
         onRefresh();

         // Check for listener beans and register them.
         registerListeners();

         // Instantiate all remaining (non-lazy-init) singletons.
         finishBeanFactoryInitialization(beanFactory);

         // Last step: publish corresponding event.
         finishRefresh();
      }

      catch (BeansException ex) {
         if (logger.isWarnEnabled()) {
            logger.warn("Exception encountered during context initialization - " +
                  "cancelling refresh attempt: " + ex);
         }

         // Destroy already created singletons to avoid dangling resources.
         destroyBeans();

         // Reset 'active' flag.
         cancelRefresh(ex);

         // Propagate exception to caller.
         throw ex;
      }

      finally {
         // Reset common introspection caches in Spring's core, since we
         // might not ever need metadata for singleton beans anymore...
         resetCommonCaches();
      }
   }
}
```

##### prepareRefresh() 方法

从注释来看, 设置startup数据 & 标识active来表示状态,同时也会初始化一些资源.

```java
/**
 * Prepare this context for refreshing, setting its startup date and
 * active flag as well as performing any initialization of property sources.
 */
protected void prepareRefresh() {
   // Switch to active.
   this.startupDate = System.currentTimeMillis();
// 对状态标识的设置.    
   this.closed.set(false);
   this.active.set(true);

   if (logger.isDebugEnabled()) {
      if (logger.isTraceEnabled()) {
         logger.trace("Refreshing " + this);
      }
      else {
         logger.debug("Refreshing " + getDisplayName());
      }
   }

   // Initialize any placeholder property sources in the context environment.
// 这里暂时没有实现来做事情.    
   initPropertySources();

   // Validate that all properties marked as required are resolvable:
   // see ConfigurablePropertyResolver#setRequiredProperties
// org.springframework.core.env.AbstractEnvironment#validateRequiredProperties
// 对 org.springframework.core.env.AbstractPropertyResolver#requiredProperties 进行检验,如果检验到有问题的话,就会抛出异常来.
// 这里是对 properties 进行检验.    
   getEnvironment().validateRequiredProperties();

   // Store pre-refresh ApplicationListeners...
// earlyApplicationListeners是null的话,利用applicationListeners来初始化.   
   if (this.earlyApplicationListeners == null) {
      this.earlyApplicationListeners = new LinkedHashSet<>(this.applicationListeners);
   }
   else {
// 如果已经存在值了,就对  applicationListeners 清空，然后全部添加applicationListeners来.     
      // Reset local application listeners to pre-refresh state.
      this.applicationListeners.clear();
      this.applicationListeners.addAll(this.earlyApplicationListeners);
   }

   // Allow for the collection of early ApplicationEvents,
   // to be published once the multicaster is available...
   this.earlyApplicationEvents = new LinkedHashSet<>();
}
```

可以看到该方法的话,对状态标识进行设置. 接着地 propertySources 资源来进行初始化, 于是就对property来进行检验. 接下来是对 earlyApplicationListeners/earlyApplicationEvents根据条件来初始化操作.

##### obtainFreshBeanFactroy()

```
protected ConfigurableListableBeanFactory obtainFreshBeanFactory() {
   refreshBeanFactory();
   return getBeanFactory();
}

---------------------------
org.springframework.context.support.GenericApplicationContext#refreshBeanFactory
  
// 看到 compareAndSet 有点cas 的味道.    
protected final void refreshBeanFactory() throws IllegalStateException {    
		if (!this.refreshed.compareAndSet(false, true)) {
			throw new IllegalStateException(
					"GenericApplicationContext does not support multiple refresh attempts: just call 'refresh' once");
		}
// private String id = ObjectUtils.identityToString(this);
// 这里获取出来的id在这个类被new或者子类调用父类的super()构造方法的时候,就已经被初始化值了的.    
		this.beanFactory.setSerializationId(getId());
	}    
    
-----------------
org.springframework.context.support.GenericApplicationContext#getBeanFactory

// 这里就直接返回了 DefaultListableBeanFactory.   
	@Override
	public final ConfigurableListableBeanFactory getBeanFactory() {
		return this.beanFactory;
	}
```

该方法 设置了一个 SerializationId 到 beanFactory 中来. 最后也是返回了一个 DefaultListableBeanFactory 来.

##### prepareBeanFactory() 方法

```java
/**
 * Configure the factory's standard context characteristics,
 * such as the context's ClassLoader and post-processors.
 * @param beanFactory the BeanFactory to configure
 */
protected void prepareBeanFactory(ConfigurableListableBeanFactory beanFactory) {
   // Tell the internal bean factory to use the context's class loader etc.
// org.springframework.core.io.DefaultResourceLoader#getClassLoader   
// 设置 class 加载器&赋值进去.    
   beanFactory.setBeanClassLoader(getClassLoader());
// 将 beanClassLoader放入SpelParserConfiguration中来,SpelExpressionParser中有含有SpelParserConfiguration作为configuration,StandardBeanExpressionResolver属性又含有SpelExpressionParser. 这也就可以理解为beanClassLoader最后是放入到SpelParserConfiguration来.
   beanFactory.setBeanExpressionResolver(new StandardBeanExpressionResolver(beanFactory.getBeanClassLoader()));
    
// 传入applicationContext和environment到ResourceEditorRegistrar对象来.
//然后添加到beanFactory中来.    
   beanFactory.addPropertyEditorRegistrar(new ResourceEditorRegistrar(this, getEnvironment()));

   // Configure the bean factory with context callbacks.
// 添加ApplicationContextAwareProcessor后置处理器到org.springframework.beans.factory.support.AbstractBeanFactory#beanPostProcessors中来.
// 在添加后置处理器到Spring容器之前,会判断这个后置处理起是不是InstantiationAwareBeanPostProcessor/DestructionAwareBeanPostProcessor 这二种情况.
// 最后添加到 beanPostProcessors 中来.    
   beanFactory.addBeanPostProcessor(new ApplicationContextAwareProcessor(this));
// 然后这里忽略了六种情况的接口. 为什么要忽略呢? 看一个地方.
// org.springframework.context.support.ApplicationContextAwareProcessor#postProcessBeforeInitialization &  org.springframework.context.support.ApplicationContextAwareProcessor#invokeAwareInterfaces 结合这二个方法来看,是已经对这六种情况的接口做了处理的.    
   beanFactory.ignoreDependencyInterface(EnvironmentAware.class);
   beanFactory.ignoreDependencyInterface(EmbeddedValueResolverAware.class);
   beanFactory.ignoreDependencyInterface(ResourceLoaderAware.class);
   beanFactory.ignoreDependencyInterface(ApplicationEventPublisherAware.class);
   beanFactory.ignoreDependencyInterface(MessageSourceAware.class);
   beanFactory.ignoreDependencyInterface(ApplicationContextAware.class);

   // BeanFactory interface not registered as resolvable type in a plain factory.
   // MessageSource registered (and found for autowiring) as a bean.
// private final Map<Class<?>, Object> resolvableDependencies = new ConcurrentHashMap<>(16);    
// org.springframework.beans.factory.support.DefaultListableBeanFactory#resolvableDependencies,这里将 BeanFactory.class和beanFactory给添加到 resolvableDependencies中来了,这里可以看到resolvableDependencies的key是一个Class类型.
   beanFactory.registerResolvableDependency(BeanFactory.class, beanFactory);
   beanFactory.registerResolvableDependency(ResourceLoader.class, this);
   beanFactory.registerResolvableDependency(ApplicationEventPublisher.class, this);
   beanFactory.registerResolvableDependency(ApplicationContext.class, this);

   // Register early post-processor for detecting inner beans as ApplicationListeners.
// 这里又添加了一个后置处理器.
// 传入一个 ApplicationContext 给后置处理器,然后添加到BeanFactory中来.
// org.springframework.beans.factory.support.AbstractBeanFactory#beanPostProcessors,也即是添加到专门存放 后置处理器的集合中来了.    
   beanFactory.addBeanPostProcessor(new ApplicationListenerDetector(this));

   // Detect a LoadTimeWeaver and prepare for weaving, if found.
// beanFactory如果有loadTimeWeaver,那么就添加 LoadTimeWeaverAwareProcessor 后置处理器进来   
   if (beanFactory.containsBean(LOAD_TIME_WEAVER_BEAN_NAME)) {
      beanFactory.addBeanPostProcessor(new LoadTimeWeaverAwareProcessor(beanFactory));
      // Set a temporary ClassLoader for type matching.
      beanFactory.setTempClassLoader(new ContextTypeMatchClassLoader(beanFactory.getBeanClassLoader()));
   }

   // Register default environment beans.
// 不包含environment/systemProperties/systemEnvironment，就会添加到org.springframework.beans.factory.support.DefaultSingletonBeanRegistry#singletonObjects中来.    
   if (!beanFactory.containsLocalBean(ENVIRONMENT_BEAN_NAME)) {
      beanFactory.registerSingleton(ENVIRONMENT_BEAN_NAME, getEnvironment());
   }
   if (!beanFactory.containsLocalBean(SYSTEM_PROPERTIES_BEAN_NAME)) {
      beanFactory.registerSingleton(SYSTEM_PROPERTIES_BEAN_NAME, getEnvironment().getSystemProperties());
   }
   if (!beanFactory.containsLocalBean(SYSTEM_ENVIRONMENT_BEAN_NAME)) {
      beanFactory.registerSingleton(SYSTEM_ENVIRONMENT_BEAN_NAME, getEnvironment().getSystemEnvironment());
   }
}
```

这里可以看到,prepareBeanFactory 中做了这些事情 : 添加了 beanClassLoader,添加了二个后置处理器,然后注册了四个 BeanFactory/ResourceLoader/ApplicationEventPublisher/ApplicationContext 到DefaultListableBeanFactory#resolvableDependencies中来了.

最后判断beanFactory是不是不包含一些关于环境的bean,如果是的话,那就调用registerSingleton方法给注册进来.

还是可以看到，这里都是在为环境做准备工作.

##### postProcessBeanFactory() 方法

略略略, 该方法暂无实现类来搞事情…..

```java
/**
 * Modify the application context's internal bean factory after its standard
 * initialization. All bean definitions will have been loaded, but no beans
 * will have been instantiated yet. This allows for registering special
 * BeanPostProcessors etc in certain ApplicationContext implementations.
 * @param beanFactory the bean factory used by the application context
 */
protected void postProcessBeanFactory(ConfigurableListableBeanFactory beanFactory) {
}
```

##### invokeBeanFactoryPostProcessors 方法

这些是对beanFactoryPostProcessors进行处理. 是借用了 PostProcessorRegistrationDelegate.

```java
/**
 * Instantiate and invoke all registered BeanFactoryPostProcessor beans,
 * respecting explicit order if given.
 * <p>Must be called before singleton instantiation.
 */
protected void invokeBeanFactoryPostProcessors(ConfigurableListableBeanFactory beanFactory) {
// getBeanFactoryPostProcessors() 获取出来的是空集合.    
   PostProcessorRegistrationDelegate.invokeBeanFactoryPostProcessors(beanFactory, getBeanFactoryPostProcessors());

   // Detect a LoadTimeWeaver and prepare for weaving, if found in the meantime
   // (e.g. through an @Bean method registered by ConfigurationClassPostProcessor)
   if (beanFactory.getTempClassLoader() == null && beanFactory.containsBean(LOAD_TIME_WEAVER_BEAN_NAME)) {
      beanFactory.addBeanPostProcessor(new LoadTimeWeaverAwareProcessor(beanFactory));
      beanFactory.setTempClassLoader(new ContextTypeMatchClassLoader(beanFactory.getBeanClassLoader()));
   }
}
```

###### org.springframework.context.support.PostProcessorRegistrationDelegate#invokeBeanFactoryPostProcessors(org.springframework.beans.factory.config.ConfigurableListableBeanFactory, java.util.List<org.springframework.beans.factory.config.BeanFactoryPostProcessor>)

该方法从代码上来看,还是做了蛮多的事情.

```java
public static void invokeBeanFactoryPostProcessors(
      ConfigurableListableBeanFactory beanFactory, List<BeanFactoryPostProcessor> beanFactoryPostProcessors) {

   // Invoke BeanDefinitionRegistryPostProcessors first, if any.
   Set<String> processedBeans = new HashSet<>();

// 这里是满足条件的    
   if (beanFactory instanceof BeanDefinitionRegistry) {
      BeanDefinitionRegistry registry = (BeanDefinitionRegistry) beanFactory;
      List<BeanFactoryPostProcessor> regularPostProcessors = new ArrayList<>();
      List<BeanDefinitionRegistryPostProcessor> registryProcessors = new ArrayList<>();

// 对 beanFactory的后置处理器进行迭代处理操作.       
      for (BeanFactoryPostProcessor postProcessor : beanFactoryPostProcessors) {
         if (postProcessor instanceof BeanDefinitionRegistryPostProcessor) {
            BeanDefinitionRegistryPostProcessor registryProcessor =
                  (BeanDefinitionRegistryPostProcessor) postProcessor;
            registryProcessor.postProcessBeanDefinitionRegistry(registry);
            registryProcessors.add(registryProcessor);
         }
         else {
            regularPostProcessors.add(postProcessor);
         }
      }

      // Do not initialize FactoryBeans here: We need to leave all regular beans
      // uninitialized to let the bean factory post-processors apply to them!
      // Separate between BeanDefinitionRegistryPostProcessors that implement
      // PriorityOrdered, Ordered, and the rest.
      List<BeanDefinitionRegistryPostProcessor> currentRegistryProcessors = new ArrayList<>();

      // First, invoke the BeanDefinitionRegistryPostProcessors that implement PriorityOrdered.
// 根据 BeanDefinitionRegistryPostProcessor.class 来获取beanNames数组,
// org.springframework.context.annotation.internalConfigurationAnnotationProcessor 这里是获取到了一个内置的BeanFactroyPostProcessor.      
      String[] postProcessorNames =
            beanFactory.getBeanNamesForType(BeanDefinitionRegistryPostProcessor.class, true, false);
      for (String ppName : postProcessorNames) {
 // 判断是不是有PriorityOrdered,         
         if (beanFactory.isTypeMatch(ppName, PriorityOrdered.class)) {
 // 这里的getBean就已经对bean进行初始化，是真正的走反射构造函数拿出来的实例对象.
 // getBean需要仔细分析下，因为其内部在 createBean是走了很多后置处理起来进行增强的. 
// ConfigurationClassPostProcessor 给添加进来.             
            currentRegistryProcessors.add(beanFactory.getBean(ppName, BeanDefinitionRegistryPostProcessor.class));
// beanName 添加到 processedBeans集合中来了.             
            processedBeans.add(ppName);
         }
      }
// 对集合进行排序,从beanFactory中获取出dependencyComparator来,如果没有的话,就用OrderComparator.INSTANCE默认的
      sortPostProcessors(currentRegistryProcessors, beanFactory);
// 全部添加到 registryProcessors 中来.       
      registryProcessors.addAll(currentRegistryProcessors);
// org.springframework.context.annotation.ConfigurationClassPostProcessor#postProcessBeanDefinitionRegistry
//这里是进入到ConfigurationClassPostProcessor中来了,可以看到其接口 BeanDefinitionRegistryPostProcessor,是重写了接口的方法. 
// ConfigurationClassPostProcessor#postProcessBeanDefinitionRegistry 做了什么事情呢?
// 用System.identityHashCode(registry);计算出registryId来,如果在org.springframework.context.annotation.ConfigurationClassPostProcessor#registriesPostProcessed/factoriesPostProcessed(二个集合)中已经包含了的话,就会抛出已经被调用过的异常来.如果没有的话,就会添加到registriesPostProcessed中来
// 继续看 org.springframework.context.annotation.ConfigurationClassPostProcessor#processConfigBeanDefinitions 方法,
//先从registry中获取beanNames来,这其中就有Spring内置的和我们自己定义的yangBeanScannerConfig
//对beanNames迭代处理,接着就用ConfigurationClassUtils.checkConfigurationClassCandidate(beanDef, this.metadataReaderFactory)来判断要不要添加到List<BeanDefinitionHolder> configCandidates集合中来,最后是我们定义的beanName给添加进来了.
// 对configCandidates集合进行排序,
// 创建一个ConfigurationClassParser对象来解析每个@Configuration注解类.调用其parse和validate方法,解析完后就是一个ConfigurationClass的Set集合,接着就是new了一个ConfigurationClassBeanDefinitionReader对象来,
// this.reader.loadBeanDefinitions(configClasses); 这行代码有点根据Config去解析bean的意思.    
// 具体要等到后面深度解析再反过来定位每行代码的意思.
// 最后再清除下缓存.       
      invokeBeanDefinitionRegistryPostProcessors(currentRegistryProcessors, registry);
// 清空 currentRegistryProcessors 集合      
      currentRegistryProcessors.clear();

      // Next, invoke the BeanDefinitionRegistryPostProcessors that implement Ordered.
      postProcessorNames = beanFactory.getBeanNamesForType(BeanDefinitionRegistryPostProcessor.class, true, false);
      for (String ppName : postProcessorNames) {
// 如果processedBeans集合中不包含并且type是Ordered.class才满足进来的条件.          
         if (!processedBeans.contains(ppName) && beanFactory.isTypeMatch(ppName, Ordered.class)) {
            currentRegistryProcessors.add(beanFactory.getBean(ppName, BeanDefinitionRegistryPostProcessor.class));
            processedBeans.add(ppName);
         }
      }
// 所以这里的currentRegistryProcessors集合是空集合.       
      sortPostProcessors(currentRegistryProcessors, beanFactory);
      registryProcessors.addAll(currentRegistryProcessors);
      invokeBeanDefinitionRegistryPostProcessors(currentRegistryProcessors, registry);
      currentRegistryProcessors.clear();

      // Finally, invoke all other BeanDefinitionRegistryPostProcessors until no further ones appear.
// 这里用 while 循环来最后解析,判断从getBeanNamesForType获取出来的bean是不是被解析过了的. 
// 也是用 processedBeans 集合来进行控制的. 
      boolean reiterate = true;
      while (reiterate) {
         reiterate = false;
         postProcessorNames = beanFactory.getBeanNamesForType(BeanDefinitionRegistryPostProcessor.class, true, false);
         for (String ppName : postProcessorNames) {
            if (!processedBeans.contains(ppName)) {
               currentRegistryProcessors.add(beanFactory.getBean(ppName, BeanDefinitionRegistryPostProcessor.class));
               processedBeans.add(ppName);
               reiterate = true;
            }
         }
         sortPostProcessors(currentRegistryProcessors, beanFactory);
         registryProcessors.addAll(currentRegistryProcessors);
         invokeBeanDefinitionRegistryPostProcessors(currentRegistryProcessors, registry);
         currentRegistryProcessors.clear();
      }

      // Now, invoke the postProcessBeanFactory callback of all processors handled so far.
// org.springframework.context.annotation.ConfigurationClassPostProcessor#postProcessBeanFactory,这里是走到了postProcessBeanFactory回调方法来了.用org.springframework.context.annotation.ConfigurationClassPostProcessor#factoriesPostProcessed集合来控制是否解析过了.用registriesPostProcessed集合来判断上次是否进入到postProcessBeanDefinitionRegistry方法中来. 如果没有的话,就会再走一边processConfigBeanDefinitions,可以看到 postProcessBeanDefinitionRegistry 方法最后也是走到了processConfigBeanDefinitions中来了.
//org.springframework.context.annotation.ConfigurationClassPostProcessor#enhanceConfigurationClasses 该方法判断是不是需要代理来增强,这里是没有的,所以就直接return掉了.
// 最后添加一个 ImportAwareBeanPostProcessor 后置处理器进来.       
      invokeBeanFactoryPostProcessors(registryProcessors, beanFactory);
// 这里的regularPostProcessors 集合是empty.       
      invokeBeanFactoryPostProcessors(regularPostProcessors, beanFactory);
   }

   else {
      // Invoke factory processors registered with the context instance.
      invokeBeanFactoryPostProcessors(beanFactoryPostProcessors, beanFactory);
   }

   // Do not initialize FactoryBeans here: We need to leave all regular beans
   // uninitialized to let the bean factory post-processors apply to them!
 // org.springframework.context.annotation.internalConfigurationAnnotationProcessor和org.springframework.context.event.internalEventListenerProcessor这里获取出来的是二个.   
   String[] postProcessorNames =
         beanFactory.getBeanNamesForType(BeanFactoryPostProcessor.class, true, false);

   // Separate between BeanFactoryPostProcessors that implement PriorityOrdered,
   // Ordered, and the rest.
   List<BeanFactoryPostProcessor> priorityOrderedPostProcessors = new ArrayList<>();
   List<String> orderedPostProcessorNames = new ArrayList<>();
   List<String> nonOrderedPostProcessorNames = new ArrayList<>();
   for (String ppName : postProcessorNames) {
 // 这里是对上面已经处理过了的进行过滤处理.      
      if (processedBeans.contains(ppName)) {
         // skip - already processed in first phase above
      }
       
// 这里分为 PriorityOrdered&Ordered&非前二者,分这三种情况分别放入到三个不同的集合中.
      else if (beanFactory.isTypeMatch(ppName, PriorityOrdered.class)) {
         priorityOrderedPostProcessors.add(beanFactory.getBean(ppName, BeanFactoryPostProcessor.class));
      }
      else if (beanFactory.isTypeMatch(ppName, Ordered.class)) {
         orderedPostProcessorNames.add(ppName);
      }
      else {
         nonOrderedPostProcessorNames.add(ppName);
      }
   }

// 这里是可以看到先是对PriorityOrdered进行处理,再对Ordered处理,最后对非前二者进行处理.    
   // First, invoke the BeanFactoryPostProcessors that implement PriorityOrdered.
   sortPostProcessors(priorityOrderedPostProcessors, beanFactory);
   invokeBeanFactoryPostProcessors(priorityOrderedPostProcessors, beanFactory);

   // Next, invoke the BeanFactoryPostProcessors that implement Ordered.
   List<BeanFactoryPostProcessor> orderedPostProcessors = new ArrayList<>(orderedPostProcessorNames.size());
   for (String postProcessorName : orderedPostProcessorNames) {
 // 注意这里是调用了getBean方法.      
      orderedPostProcessors.add(beanFactory.getBean(postProcessorName, BeanFactoryPostProcessor.class));
   }
// 排序    
   sortPostProcessors(orderedPostProcessors, beanFactory);
   invokeBeanFactoryPostProcessors(orderedPostProcessors, beanFactory);

   // Finally, invoke all other BeanFactoryPostProcessors.
   List<BeanFactoryPostProcessor> nonOrderedPostProcessors = new ArrayList<>(nonOrderedPostProcessorNames.size());
   for (String postProcessorName : nonOrderedPostProcessorNames) {
 // 注意这里也是调用了 getBean 方法的.      
      nonOrderedPostProcessors.add(beanFactory.getBean(postProcessorName, BeanFactoryPostProcessor.class));
   }
// org.springframework.context.event.EventListenerMethodProcessor#postProcessBeanFactory
// 这里由于只有一个EventListenerMethodProcessor处理器,所以对应起来的走到其postProcessBeanFactory方法中来.
// 这里也是调用 postProcessBeanFactory 方法的意思,也就是回调方法.    
   invokeBeanFactoryPostProcessors(nonOrderedPostProcessors, beanFactory);

   // Clear cached merged bean definitions since the post-processors might have
   // modified the original metadata, e.g. replacing placeholders in values...
// org.springframework.beans.factory.support.DefaultListableBeanFactory#clearMetadataCache
// 对 一些集合等进行清除.    
   beanFactory.clearMetadataCache();
}
```

至此就可以看到,该方法主要是对BeanDefinitionRegistryPostProcessor.class和BeanFactoryPostProcessor.class来进行处理.

BeanDefinitionRegistryPostProcessor 又是先处理PriorityOrdered,然后会将处理过的放入processedBeans集合中做一个总的记录，再处理非再processedBeans集合记录中的和是Ordered的,最后用while循环来再确认一遍是不是有还没处理的,这个时候控制条件也是通过 processedBeans来控制是不是处理过了的. 这里注意, 实例化是通过调用 getBean方法来实现的,所以你会发现再调用invokeBeanDefinitionRegistryPostProcessors方法之前,都是会有调用getBean方法的.

BeanFactoryPostProcessor 的处理,这里是一次获取出,然后分为 PriorityOrdered/Ordered/非前二者，分别放入三个集合中进行处理,前提是都没再 processedBeans 集合中. 这里可以看到,如果是PriorityOrdered类型的话，那么在分类的时候就已经调用getBean方法来实例化这个对象了，其他二者都是最后迭代遍历的时候调用getBean方法的. 最后都是sortPostProcessors走下排序，然后调用invokeBeanFactoryPostProcessors方法，这个方法的意思，也就是调用 重写的 postProcessBeanFactory 的方法.

##### registerBeanPostProcessors 方法

该方法传入 beanFactory进来,然后直接借助 PostProcessorRegistrationDelegate 来实现.

```java
protected void registerBeanPostProcessors(ConfigurableListableBeanFactory beanFactory) {
   PostProcessorRegistrationDelegate.registerBeanPostProcessors(beanFactory, this);
}
```

###### registerBeanPostProcessors 方法

从名字上不难理解，注册 Bean的后置处理器进来.

这里传入进来的 beanFactory 是 DefaultListableBeanFactory , applicationContext是AnnotationConfigApplicationContext

```java
public static void registerBeanPostProcessors(
      ConfigurableListableBeanFactory beanFactory, AbstractApplicationContext applicationContext) {

// 获取出 BeanPostProcessor 的名字.
// org.springframework.context.annotation.internalAutowiredAnnotationProcessor
// org.springframework.context.annotation.internalCommonAnnotationProcessor
// 这里获取出来的是二个内部的后置处理器,因为我这里并没有扩展,只是简单的进行说明了下,后面会详细分析。
// 就是这行代码获取的是什么.    
   String[] postProcessorNames = beanFactory.getBeanNamesForType(BeanPostProcessor.class, true, false);

   // Register BeanPostProcessorChecker that logs an info message when
   // a bean is created during BeanPostProcessor instantiation, i.e. when
   // a bean is not eligible for getting processed by all BeanPostProcessors.
 // 6   
   int beanProcessorTargetCount = beanFactory.getBeanPostProcessorCount() + 1 + postProcessorNames.length;
// 传入beanFactory和个数,创建出一个检查bean的后置处理器来.
// org.springframework.context.support.PostProcessorRegistrationDelegate.BeanPostProcessorChecker
// 有兴趣的同学可以看到该后置处理器重写的方法做了什么事情.
// 最后添加到 beanFactory 中来.    
   beanFactory.addBeanPostProcessor(new BeanPostProcessorChecker(beanFactory, beanProcessorTargetCount));

   // Separate between BeanPostProcessors that implement PriorityOrdered,
   // Ordered, and the rest.
   List<BeanPostProcessor> priorityOrderedPostProcessors = new ArrayList<>();
   List<BeanPostProcessor> internalPostProcessors = new ArrayList<>();
   List<String> orderedPostProcessorNames = new ArrayList<>();
   List<String> nonOrderedPostProcessorNames = new ArrayList<>();
    
 // 对后置处理器进行迭代   
   for (String ppName : postProcessorNames) {
      if (beanFactory.isTypeMatch(ppName, PriorityOrdered.class)) {
   // 注意这里调用 getBean 方法是已经实例化这个后置处理起了.
// AutowiredAnnotationBeanPostProcessor
// CommonAnnotationBeanPostProcessor
 // 这里实例化的是Spring内置的二个         
         BeanPostProcessor pp = beanFactory.getBean(ppName, BeanPostProcessor.class);
         priorityOrderedPostProcessors.add(pp);
      // 内部的二个后置处理器都是有实现   MergedBeanDefinitionPostProcessor 的. 
         if (pp instanceof MergedBeanDefinitionPostProcessor) {
            internalPostProcessors.add(pp);
         }
      }
      else if (beanFactory.isTypeMatch(ppName, Ordered.class)) {
         orderedPostProcessorNames.add(ppName);
      }
      else {
         nonOrderedPostProcessorNames.add(ppName);
      }
   }

   // First, register the BeanPostProcessors that implement PriorityOrdered.
// 排序    
   sortPostProcessors(priorityOrderedPostProcessors, beanFactory);
// 添加到 org.springframework.beans.factory.support.AbstractBeanFactory#beanPostProcessors,也就是添加到Spring的BanFactory中来.    
   registerBeanPostProcessors(beanFactory, priorityOrderedPostProcessors);

   // Next, register the BeanPostProcessors that implement Ordered.
// 这里是对实现了 Ordered 类型的处理，很显然我这里是没有的.    
   List<BeanPostProcessor> orderedPostProcessors = new ArrayList<>(orderedPostProcessorNames.size());
   for (String ppName : orderedPostProcessorNames) {
      BeanPostProcessor pp = beanFactory.getBean(ppName, BeanPostProcessor.class);
      orderedPostProcessors.add(pp);
      if (pp instanceof MergedBeanDefinitionPostProcessor) {
         internalPostProcessors.add(pp);
      }
   }
   sortPostProcessors(orderedPostProcessors, beanFactory);
   registerBeanPostProcessors(beanFactory, orderedPostProcessors);

   // Now, register all regular BeanPostProcessors.
// 最后是对非 PriorityOrdered和Ordered的处理，    
   List<BeanPostProcessor> nonOrderedPostProcessors = new ArrayList<>(nonOrderedPostProcessorNames.size());
   for (String ppName : nonOrderedPostProcessorNames) {
      BeanPostProcessor pp = beanFactory.getBean(ppName, BeanPostProcessor.class);
      nonOrderedPostProcessors.add(pp);
      if (pp instanceof MergedBeanDefinitionPostProcessor) {
         internalPostProcessors.add(pp);
      }
   }
   registerBeanPostProcessors(beanFactory, nonOrderedPostProcessors);

   // Finally, re-register all internal BeanPostProcessors.
// 这里可以看到,最后对内部的后置处理器又重新注册了一遍.    
   sortPostProcessors(internalPostProcessors, beanFactory);
   registerBeanPostProcessors(beanFactory, internalPostProcessors);

   // Re-register post-processor for detecting inner beans as ApplicationListeners,
   // moving it to the end of the processor chain (for picking up proxies etc).
// ApplicationListenerDetector 这里也是对  ApplicationListenerDetector 也是重新注册一遍.   
   beanFactory.addBeanPostProcessor(new ApplicationListenerDetector(applicationContext));
}
```

该方法 借助 org.springframework.context.support.PostProcessorRegistrationDelegate#registerBeanPostProcessors(org.springframework.beans.factory.config.ConfigurableListableBeanFactory, org.springframework.context.support.AbstractApplicationContext) 来，获取BeanPostProcessor的后置处理器,也是分为 PriorityOrdered / Ordered/ 前二者都没有，在 PriorityOrdered 分类的时候，就已经调用了 getBean方法来获取出 bean 对象来(这里依然是分为了三个集合来装数据&处理). 然后调用getBean方法后,就调用registerBeanPostProcessors方法，将后置处理器给注册到 Spring 的BeanFactory 中来.

最后还会最内部的 BeanPost后置处理器 & ApplicationListenerDetector 再重新注册一遍.

可能会比较好奇这个后置处理器是干什么用的 ？ 在后面实例化 bean 的时候，就可以看到是有走很多后置处理器的.

所以该方法是对 beanPost的后置处理器进行实例化并且注册到 Spring 的 BeanFactory 中来的.

##### initMessageSource () 方法

初始化 messageSource .

```java
/**
 * Initialize the MessageSource.
 * Use parent's if none defined in this context.
 */
protected void initMessageSource() {
 // 获取出 beanFactory   
   ConfigurableListableBeanFactory beanFactory = getBeanFactory();
// 如果 beanFactory 包含了名字是messageSource的本地bean.    
   if (beanFactory.containsLocalBean(MESSAGE_SOURCE_BEAN_NAME)) {
  // 从 beanFactory 中获取出来.     
      this.messageSource = beanFactory.getBean(MESSAGE_SOURCE_BEAN_NAME, MessageSource.class);
      // Make MessageSource aware of parent MessageSource.
// this.parent不是null并且   messageSource是   HierarchicalMessageSource类型 
      if (this.parent != null && this.messageSource instanceof HierarchicalMessageSource) {
  // 强转,判断  getParentMessageSource 是不是null,如果是null的话,就调用 getInternalParentMessageSource() 将获取出来的值给set进去.     
         HierarchicalMessageSource hms = (HierarchicalMessageSource) this.messageSource;
         if (hms.getParentMessageSource() == null) {
            // Only set parent context as parent MessageSource if no parent MessageSource
            // registered already.
            hms.setParentMessageSource(getInternalParentMessageSource());
         }
      }
      if (logger.isTraceEnabled()) {
         logger.trace("Using MessageSource [" + this.messageSource + "]");
      }
   }
   else {
// 这里是不包含的情况.       
      // Use empty MessageSource to be able to accept getMessage calls.
      DelegatingMessageSource dms = new DelegatingMessageSource();
// getInternalParentMessageSource() 返回的是null       
      dms.setParentMessageSource(getInternalParentMessageSource());
      this.messageSource = dms;
// 注册到 beanFactory 中来       
      beanFactory.registerSingleton(MESSAGE_SOURCE_BEAN_NAME, this.messageSource);
      if (logger.isTraceEnabled()) {
         logger.trace("No '" + MESSAGE_SOURCE_BEAN_NAME + "' bean, using [" + this.messageSource + "]");
      }
   }
}
```

该方法可以看到是对 messageSource 的初始化进行操作.

##### initApplicationEventMulticaster 方法

这里如果了解过 Spring 的Event 机制的话,是可以比较清晰的感觉到,是对 ApplicationEventMulticaster 的初始化.

```java
/**
 * Initialize the ApplicationEventMulticaster.
 * Uses SimpleApplicationEventMulticaster if none defined in the context.
 * @see org.springframework.context.event.SimpleApplicationEventMulticaster
 */
protected void initApplicationEventMulticaster() {
  // 获取出 beanFactory 来.  
   ConfigurableListableBeanFactory beanFactory = getBeanFactory();
// 判断 beanFactory 是否包含  applicationEventMulticaster    
   if (beanFactory.containsLocalBean(APPLICATION_EVENT_MULTICASTER_BEAN_NAME)) {
// 如果包含的话，就直接从beanFactroy中获取出来,并且赋值给  applicationEventMulticaster  
      this.applicationEventMulticaster =
            beanFactory.getBean(APPLICATION_EVENT_MULTICASTER_BEAN_NAME, ApplicationEventMulticaster.class);
      if (logger.isTraceEnabled()) {
         logger.trace("Using ApplicationEventMulticaster [" + this.applicationEventMulticaster + "]");
      }
   }
   else {
 // 如果不包含的话,传入beanFactory接着就是new一个SimpleApplicationEventMulticaster出来      
      this.applicationEventMulticaster = new SimpleApplicationEventMulticaster(beanFactory);
// 然后注册到 beanFactory 中来.      
      beanFactory.registerSingleton(APPLICATION_EVENT_MULTICASTER_BEAN_NAME, this.applicationEventMulticaster);
      if (logger.isTraceEnabled()) {
         logger.trace("No '" + APPLICATION_EVENT_MULTICASTER_BEAN_NAME + "' bean, using " +
               "[" + this.applicationEventMulticaster.getClass().getSimpleName() + "]");
      }
   }
}
```

这里可以看到, 主要是对 applicationEventMulticaster 的初始化.

如果beanFactory有的话，就从其中拿，如果没有就自己new一个,最后注册到beanFactory中来.

##### onRefresh() 方法

这里是没有做任何事情的，如果是SpringBoot的源码的，这里就是启动tomcat的.

```java
/**
 * Template method which can be overridden to add context-specific refresh work.
 * Called on initialization of special beans, before instantiation of singletons.
 * <p>This implementation is empty.
 * @throws BeansException in case of errors
 * @see #refresh()
 */
protected void onRefresh() throws BeansException {
   // For subclasses: do nothing by default.
}
```

##### registerListeners() 方法

从名字来看,这里是注册监听器的意思.

org.springframework.context.event.AbstractApplicationEventMulticaster.ListenerRetriever#applicationListeners 这里是存放监听器的地方。

```java
/**
 * Add beans that implement ApplicationListener as listeners.
 * Doesn't affect other listeners, which can be added without being beans.
 */
protected void registerListeners() {
   // Register statically specified listeners first.
// getApplicationListeners() 获取出来的是空集合.    
   for (ApplicationListener<?> listener : getApplicationListeners()) {
      getApplicationEventMulticaster().addApplicationListener(listener);
   }

   // Do not initialize FactoryBeans here: We need to leave all regular beans
   // uninitialized to let post-processors apply to them!
// 根据ApplicationListener来获取出监听器，这也也是没有的.     
   String[] listenerBeanNames = getBeanNamesForType(ApplicationListener.class, true, false);
   for (String listenerBeanName : listenerBeanNames) {
      getApplicationEventMulticaster().addApplicationListenerBean(listenerBeanName);
   }

   // Publish early application events now that we finally have a multicaster...
// 这里也是获取早初始的 ApplicationEvent.    
   Set<ApplicationEvent> earlyEventsToProcess = this.earlyApplicationEvents;
   this.earlyApplicationEvents = null;
   if (earlyEventsToProcess != null) {
      for (ApplicationEvent earlyEvent : earlyEventsToProcess) {
         getApplicationEventMulticaster().multicastEvent(earlyEvent);
      }
   }
}
```

org.springframework.context.event.SimpleApplicationEventMulticaster#multicastEvent(org.springframework.context.ApplicationEvent, org.springframework.core.ResolvableType) 可以看下这个方法或者后续我们再详细的看，Spring是如何发送event的，以及那些监听器是怎么获取到 event 的.

TODO : 这里后面是有待详细的讲解的.

##### finishBeanFactoryInitialization() 方法

从名字理解上,这里是对 beanFactory的初始化结束.

```java
/**
 * Finish the initialization of this context's bean factory,
 * initializing all remaining singleton beans.
 */
protected void finishBeanFactoryInitialization(ConfigurableListableBeanFactory beanFactory) {
   // Initialize conversion service for this context.
 // 如果beanFactroy包含conversionService并且type是ConversionService.class的话，
   if (beanFactory.containsBean(CONVERSION_SERVICE_BEAN_NAME) &&
         beanFactory.isTypeMatch(CONVERSION_SERVICE_BEAN_NAME, ConversionService.class)) {
// 就会从beanFactory中获取出对象设置到beanFactory的ConversionService来.       
      beanFactory.setConversionService(
            beanFactory.getBean(CONVERSION_SERVICE_BEAN_NAME, ConversionService.class));
   }

   // Register a default embedded value resolver if no bean post-processor
   // (such as a PropertyPlaceholderConfigurer bean) registered any before:
   // at this point, primarily for resolution in annotation attribute values.
   if (!beanFactory.hasEmbeddedValueResolver()) {
//org.springframework.beans.factory.support.AbstractBeanFactory#addEmbeddedValueResolver //添加到org.springframework.beans.factory.support.AbstractBeanFactory#embeddedValueResolvers中来.      
      beanFactory.addEmbeddedValueResolver(strVal -> getEnvironment().resolvePlaceholders(strVal));
   }

   // Initialize LoadTimeWeaverAware beans early to allow for registering their transformers early.
// 根据  LoadTimeWeaverAware.class 来获取信息.   
// 很明显这里我们是没有配置的,所以也就是没有的.    
   String[] weaverAwareNames = beanFactory.getBeanNamesForType(LoadTimeWeaverAware.class, false, false);
   for (String weaverAwareName : weaverAwareNames) {
      getBean(weaverAwareName);
   }

   // Stop using the temporary ClassLoader for type matching.
   beanFactory.setTempClassLoader(null);

   // Allow for caching all bean definition metadata, not expecting further changes.
//org.springframework.beans.factory.support.DefaultListableBeanFactory#freezeConfiguration
// 设置configurationFrozen是true,
// 将beanDefinitionNames集合转哈为String类型的数组. StringUtils.toStringArray(this.beanDefinitionNames);使用这个方法即可.    
   beanFactory.freezeConfiguration();

   // Instantiate all remaining (non-lazy-init) singletons.
   beanFactory.preInstantiateSingletons();
}
```

###### preInstantiateSingletons 方法

这里就是对 单例池 里面的对象进行初始化,可以看到是有 getBean 方法的.

```java
@Override
public void preInstantiateSingletons() throws BeansException {
   if (logger.isTraceEnabled()) {
      logger.trace("Pre-instantiating singletons in " + this);
   }

   // Iterate over a copy to allow for init methods which in turn register new bean definitions.
   // While this may not be part of the regular factory bootstrap, it does otherwise work fine.
// 这里获取出来的 beanNames 是有6个的,其中五个是包含了内部的
//org.springframework.context.annotation.internalConfigurationAnnotationProcessor
//org.springframework.context.annotation.internalAutowiredAnnotationProcessor
//org.springframework.context.annotation.internalCommonAnnotationProcessor
//org.springframework.context.event.internalEventListenerProcessor
//org.springframework.context.event.internalEventListenerFactory
//yangBeanScannerConfig    
   List<String> beanNames = new ArrayList<>(this.beanDefinitionNames);

   // Trigger initialization of all non-lazy singleton beans...
   for (String beanName : beanNames) {
      RootBeanDefinition bd = getMergedLocalBeanDefinition(beanName);
       
  // bd 不是抽象的&是单例的&不是赖加载的     
      if (!bd.isAbstract() && bd.isSingleton() && !bd.isLazyInit()) {
  // 判断是不是 FactroyBean        
         if (isFactoryBean(beanName)) {
            Object bean = getBean(FACTORY_BEAN_PREFIX + beanName);
            if (bean instanceof FactoryBean) {
               final FactoryBean<?> factory = (FactoryBean<?>) bean;
               boolean isEagerInit;
               if (System.getSecurityManager() != null && factory instanceof SmartFactoryBean) {
                  isEagerInit = AccessController.doPrivileged((PrivilegedAction<Boolean>)
                              ((SmartFactoryBean<?>) factory)::isEagerInit,
                        getAccessControlContext());
               }
               else {
                  isEagerInit = (factory instanceof SmartFactoryBean &&
                        ((SmartFactoryBean<?>) factory).isEagerInit());
               }
               if (isEagerInit) {
                  getBean(beanName);
               }
            }
         }
         else {
    // 这里不是 FactoryBean  
// 可以看到当我走到yangBeanScannerConfig,我们定义的类的时候,走完这个方法，就可以看到com.iyang.spring.config.YangBeanScannerConfig#YangBeanScannerConfig中打印的语句了,也就是说走完这里，我们定义的bean就已经被Spring被实例化了.             
            getBean(beanName);
         }
      }
   }

   // Trigger post-initialization callback for all applicable beans...
// 这里再对 beanNames 进行迭代,如果是 SmartInitializingSingleton 的话，就会再调用    afterSingletonsInstantiated 方法.
   for (String beanName : beanNames) {
      Object singletonInstance = getSingleton(beanName);
      if (singletonInstance instanceof SmartInitializingSingleton) {
         final SmartInitializingSingleton smartSingleton = (SmartInitializingSingleton) singletonInstance;
         if (System.getSecurityManager() != null) {
            AccessController.doPrivileged((PrivilegedAction<Object>) () -> {
               smartSingleton.afterSingletonsInstantiated();
               return null;
            }, getAccessControlContext());
         }
         else {
            smartSingleton.afterSingletonsInstantiated();
         }
      }
   }
}
```

可以对我们定义的 bean 进行实例化，最后是调用了 getBean 方法， getBean 方法表面看上去是获取，其实如果没有的话，调用的是createBean方法, 也就是会实例化我们的bean。当然它肯定不会很简单的去调用反射就实例化完一个我们的bean,肯定是有一系列的走Spring内置的或者我们自己定义的后置处理器等操作.

getBean 方法需要后面专门领出来分析，不能简单的过，这里对 Spring 容器进行大致的flow过,所以还是比较轻描淡写的写过去.

##### finishRefresh 方法

中文式的英语 : 结束刷新方法.

显示清除缓存,再是init了LifecycleProcessor,调用其onRefresh()方法,接近就是发送一个ContextRefreshedEvent事件出来.

```java
/**
 * Finish the refresh of this context, invoking the LifecycleProcessor's
 * onRefresh() method and publishing the
 * {@link org.springframework.context.event.ContextRefreshedEvent}.
 */
protected void finishRefresh() {
   // Clear context-level resource caches (such as ASM metadata from scanning).
//对org.springframework.core.io.DefaultResourceLoader#resourceCaches进行清除.    
   clearResourceCaches();

   // Initialize lifecycle processor for this context.
   initLifecycleProcessor();

   // Propagate refresh to lifecycle processor first.
//org.springframework.context.support.DefaultLifecycleProcessor
//org.springframework.context.support.DefaultLifecycleProcessor#startBeans
    
   getLifecycleProcessor().onRefresh();

   // Publish the final event.
// 推送Event,这里的Event是 ContextRefreshedEvent.    
   publishEvent(new ContextRefreshedEvent(this));

   // Participate in LiveBeansView MBean, if active.
//org.springframework.context.support.LiveBeansView#registerApplicationContext
//先根据key:spring.liveBeansView.mbeanDomain获取value,这里获取出来的是null,
// 所以也就是没有下文了.    
   LiveBeansView.registerApplicationContext(this);
}
```

###### initLifecycleProcessor 方法 ()

```
/**
 * Initialize the LifecycleProcessor.
 * Uses DefaultLifecycleProcessor if none defined in the context.
 * @see org.springframework.context.support.DefaultLifecycleProcessor
 */
protected void initLifecycleProcessor() {
  // 获取出 beanFactory 来.  
   ConfigurableListableBeanFactory beanFactory = getBeanFactory();
// 判断beanFactory中是否包含lifecycleProcessor    
   if (beanFactory.containsLocalBean(LIFECYCLE_PROCESSOR_BEAN_NAME)) {
// 包含的话,就会获取出来,指向this.lifecycleProcessor       
      this.lifecycleProcessor =
            beanFactory.getBean(LIFECYCLE_PROCESSOR_BEAN_NAME, LifecycleProcessor.class);
      if (logger.isTraceEnabled()) {
         logger.trace("Using LifecycleProcessor [" + this.lifecycleProcessor + "]");
      }
   }
   else {
   // 如果不包含的话，就自己new一个,然后注册到Spring容器中来.    
      DefaultLifecycleProcessor defaultProcessor = new DefaultLifecycleProcessor();
      defaultProcessor.setBeanFactory(beanFactory);
      this.lifecycleProcessor = defaultProcessor;
      beanFactory.registerSingleton(LIFECYCLE_PROCESSOR_BEAN_NAME, this.lifecycleProcessor);
      if (logger.isTraceEnabled()) {
         logger.trace("No '" + LIFECYCLE_PROCESSOR_BEAN_NAME + "' bean, using " +
               "[" + this.lifecycleProcessor.getClass().getSimpleName() + "]");
      }
   }
}
```

###### publishEvent 方法

```java
/**
 * Publish the given event to all listeners.
 * @param event the event to publish (may be an {@link ApplicationEvent}
 * or a payload object to be turned into a {@link PayloadApplicationEvent})
 * @param eventType the resolved event type, if known
 * @since 4.2
 */
protected void publishEvent(Object event, @Nullable ResolvableType eventType) {
   Assert.notNull(event, "Event must not be null");

   // Decorate event as an ApplicationEvent if necessary
   ApplicationEvent applicationEvent;
    
// 对传入进来的 event 进行类型的判断.    
   if (event instanceof ApplicationEvent) {
      applicationEvent = (ApplicationEvent) event;
   }
   else {
      applicationEvent = new PayloadApplicationEvent<>(this, event);
      if (eventType == null) {
         eventType = ((PayloadApplicationEvent<?>) applicationEvent).getResolvableType();
      }
   }

   // Multicast right now if possible - or lazily once the multicaster is initialized
   if (this.earlyApplicationEvents != null) {
      this.earlyApplicationEvents.add(applicationEvent);
   }
   else {
//org.springframework.context.event.SimpleApplicationEventMulticaster#multicastEvent(org.springframework.context.ApplicationEvent, org.springframework.core.ResolvableType)
//走到了这里来发送event的,       
      getApplicationEventMulticaster().multicastEvent(applicationEvent, eventType);
   }

   // Publish event via parent context as well...
// 这里的 parent是null.    
   if (this.parent != null) {
      if (this.parent instanceof AbstractApplicationContext) {
         ((AbstractApplicationContext) this.parent).publishEvent(event, eventType);
      }
      else {
         this.parent.publishEvent(event);
      }
   }
}
```

这里是发送ContextRefreshedEvent事件出来.

##### resetCommonCaches 方法()

可以看到 finally 代码块中是疯狂的清除各种缓存.

可以大家可以点进去详细的看下，具体就不仔细描述了.

```java
/**
 * Reset Spring's common reflection metadata caches, in particular the
 * {@link ReflectionUtils}, {@link AnnotationUtils}, {@link ResolvableType}
 * and {@link CachedIntrospectionResults} caches.
 * @since 4.2
 * @see ReflectionUtils#clearCache()
 * @see AnnotationUtils#clearCache()
 * @see ResolvableType#clearCache()
 * @see CachedIntrospectionResults#clearClassLoader(ClassLoader)
 */
protected void resetCommonCaches() {
   ReflectionUtils.clearCache();
   AnnotationUtils.clearCache();
   ResolvableType.clearCache();
   CachedIntrospectionResults.clearClassLoader(getClassLoader());
}
```

#### 总结

最后总结下,Spring在加载 bean & 处理内置的一些配置 & 内部处理器的时候,是下了很多的功夫。可以看着这些方法一步一步的分析下去,理解起来，个人感觉这里还不是特别深入的跟进去了代码，只是一个简单的大概描述，更深入的知识需要更加详细的理解等了.

这里只是简单的对这个整个flow来进行描述，还不是特别有详细的那种.
