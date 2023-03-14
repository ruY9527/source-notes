---
title: spring初始化(二)
date: 2021-11-04 00:16:29
tags: 
  - java
  - spring
categories:
  - java
  - spring
---



#### 题记

 昨天记录了this()和 register() 这二个方法, 这二个方法都是为后面的做铺垫,也就是提前初始化了一些环境和读取class文件. refresh() 这个方法才是最重要的,其中包含的内容是非常多的. 所以这里慢慢进行更新其方法的内容.

#### refresh 方法

这里可以看到的是, refresh()该方法里面,基本都是走了很多方法的. 所以挨个看方法,有些方法是留给子类的,也就是进行扩展的. 从synchronized这个关键字来看,这里只容许一次只有一个线程来执行这个方法.

```java
@Override
public void refresh() throws BeansException, IllegalStateException {
   synchronized (this.startupShutdownMonitor) {
      // Prepare this context for refreshing.
      prepareRefresh();

      // Tell the subclass to refresh the internal bean factory.

      ConfigurableListableBeanFactory beanFactory = obtainFreshBeanFactory();

      // Prepare the bean factory for use in this context.
      /**
       * org.springframework.beans.factory.support.DefaultListableBeanFactory
       *
       */
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
         /**
          */
         finishBeanFactoryInitialization(beanFactory);

         // Last step: publish corresponding event.
         finishRefresh();
      } catch (BeansException ex) {
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
      } finally {
         // Reset common introspection caches in Spring's core, since we
         // might not ever need metadata for singleton beans anymore...
         resetCommonCaches();
      }
   }
}
```

#### refresh.prepareRefresh() 方法

prepareRefresh() 方法: 可以看到该方法先是对closed/active参数进行设置,然后对Enviornment进行调用检验方法,接着判断this.earlyApplicationListeners是否有值来操作this.applicationListeners. 最后初始化earlyApplicationEvents这个集合. 这里大概还是进行一些初始化操作.

```java
/**
 * Prepare this context for refreshing, setting its startup date and
 * active flag as well as performing any initialization of property sources.
 */
protected void prepareRefresh() {
   // Switch to active.
   this.startupDate = System.currentTimeMillis();
  // closed设置为false,active设置为true.  
   this.closed.set(false);
   this.active.set(true);

   // 根据log级别来进行输出 
   if (logger.isInfoEnabled()) {
      logger.info("Refreshing " + this);
   }

   // Initialize any placeholder property sources in the context environment.
   // 目前该方法没有调用;目前没有做任何事情. 目测是应该留给子类之类的进行扩展的.
   initPropertySources();

   // Validate that all properties marked as required are resolvable:
   // see ConfigurablePropertyResolver#setRequiredProperties
//先调用getEnvironment()获取this()方法中创建出来的Environment来,然后走validateRequiredProperties方法来进行一些检验,
//org.springframework.core.env.AbstractPropertyResolver#validateRequiredProperties
//最后是走到了这个方法,如果this.requiredProperties中是有值的话,那么这里就会抛出一个异常来    
   getEnvironment().validateRequiredProperties();
    
   // Store pre-refresh ApplicationListeners...
// 这里是对 earlyApplicationListeners 进行判断,如果有值的话,就先会clear掉,然后再addAll
//如果是没有值的话,就会new一个集合,然后赋值给this.earlyApplicationListeners参数   
   if (this.earlyApplicationListeners == null) {
      this.earlyApplicationListeners = new LinkedHashSet<>(this.applicationListeners);
   }
   else {
      // Reset local application listeners to pre-refresh state.
      this.applicationListeners.clear();
      this.applicationListeners.addAll(this.earlyApplicationListeners);
   }

   // Allow for the collection of early ApplicationEvents,
   // to be published once the multicaster is available...
// 最后初始化一下 this.earlyApplicationEvents 这个参数
   this.earlyApplicationEvents = new LinkedHashSet<>();
}
```

#### refresh.obtainFreshBeanFactory()方法

这个方法是有方法一个BeanFactory回去的.

该方法对beanFactory进行SerializationId,然后获取BeanFactory,最后返回这个BeanFactory.

```java
/**
 * Tell the subclass to refresh the internal bean factory.
 *  告诉子类刷新内部Bean工厂
 * @return the fresh BeanFactory instance
 * @see #refreshBeanFactory()
 * @see #getBeanFactory()
 */
protected ConfigurableListableBeanFactory obtainFreshBeanFactory() {
//this.refreshed.compareAndSet(false, true)该方法如果返回的是false的话,就会有异常给抛出来
//不是false的话,接着就是对beanFactory设置SerializationId    
   refreshBeanFactory();
// org.springframework.context.support.GenericApplicationContext#getBeanFactory
//该方法直接返回DefaultListableBeanFactory    
   ConfigurableListableBeanFactory beanFactory = getBeanFactory();
   if (logger.isDebugEnabled()) {
      logger.debug("Bean factory for " + getDisplayName() + ": " + beanFactory);
   }
//返回获取的beanFactory.    
   return beanFactory;
}
```

#### refresh.prepareBeanFactory() 方法

从这个方法来看,是对BeanFactory的准备.

该方法可以先是对classLoader,expressionResolver,propertyEditorRegistrar添加到beanFactory中去. 然后添加ApplicationContextAwareProcessor(BeanPostProcessor)到BeanFactory,然后忽略到一些接口的注入到beanFactory中去.

设置 BeanFactory , ResourceLoader , ApplicationEventPublisher, ApplicationContext等bean到BeanFactory中去.

最后就是一些environment,systemProperties,systemEnvironment等注入到BeanFactory中去.

```java
/**
 *
 * Configure the factory's standard context characteristics,
 * such as the context's ClassLoader and post-processors.
 * @param beanFactory the BeanFactory to configure
 */
protected void prepareBeanFactory(ConfigurableListableBeanFactory beanFactory) {
   // Tell the internal bean factory to use the context's class loader etc.
//给beanFactory设置classLoader(加载bean) 
   beanFactory.setBeanClassLoader(getClassLoader());
//这里根据classLoader来获取解析器,然后set到BeanFactory中去.(解析bean定义的表达式)
   beanFactory.setBeanExpressionResolver(new StandardBeanExpressionResolver(beanFactory.getBeanClassLoader()));
//属性编辑注册器,set到BeanFactory中
   beanFactory.addPropertyEditorRegistrar(new ResourceEditorRegistrar(this, getEnvironment()));

   // Configure the bean factory with context callbacks.
//添加ApplicationContextAwareProcessor到BeanFactory中.该类是有实现BeanPostProcessor的
//BeanPostProcessor是在bean初始化完后,调用BeanPostProcessor进行扩展.
   beanFactory.addBeanPostProcessor(new ApplicationContextAwareProcessor(this));
//忽略掉EnvironmentAware/EmbeddedValueResolverAware....ApplicationContextAware
//这六个接口的注入(依赖). 因为ApplicationContextAwareProcessor中有做了这些事
   beanFactory.ignoreDependencyInterface(EnvironmentAware.class);
   beanFactory.ignoreDependencyInterface(EmbeddedValueResolverAware.class);
   beanFactory.ignoreDependencyInterface(ResourceLoaderAware.class);
   beanFactory.ignoreDependencyInterface(ApplicationEventPublisherAware.class);
   beanFactory.ignoreDependencyInterface(MessageSourceAware.class);
   beanFactory.ignoreDependencyInterface(ApplicationContextAware.class);

   // BeanFactory interface not registered as resolvable type in a plain factory.
   // MessageSource registered (and found for autowiring) as a bean.
// BeanFactory,ResourceLoader,ApplicationEventPublisher,ApplicationContext这四个接口
//对应的bean都set到beanFactory中去.    
   beanFactory.registerResolvableDependency(BeanFactory.class, beanFactory);
   beanFactory.registerResolvableDependency(ResourceLoader.class, this);
   beanFactory.registerResolvableDependency(ApplicationEventPublisher.class, this);
   beanFactory.registerResolvableDependency(ApplicationContext.class, this);

   // Register early post-processor for detecting inner beans as ApplicationListeners.
//添加ApplicationListenerDetector(BeanPostProcessor)到beanFactory中去.
   beanFactory.addBeanPostProcessor(new ApplicationListenerDetector(this));

   // Detect a LoadTimeWeaver and prepare for weaving, if found.
   if (beanFactory.containsBean(LOAD_TIME_WEAVER_BEAN_NAME)) {
      beanFactory.addBeanPostProcessor(new LoadTimeWeaverAwareProcessor(beanFactory));
      // Set a temporary ClassLoader for type matching.
      beanFactory.setTempClassLoader(new ContextTypeMatchClassLoader(beanFactory.getBeanClassLoader()));
   }

   // Register default environment beans.
//如果beanFactory中没有ENVIRONMENT_BEAN_NAME这个bean的话,就注入一个进去
   if (!beanFactory.containsLocalBean(ENVIRONMENT_BEAN_NAME)) {
      beanFactory.registerSingleton(ENVIRONMENT_BEAN_NAME, getEnvironment());
   }
// SYSTEM_PROPERTIES_BEAN_NAME也是一样,注入到beanFactory中去
   if (!beanFactory.containsLocalBean(SYSTEM_PROPERTIES_BEAN_NAME)) {
      beanFactory.registerSingleton(SYSTEM_PROPERTIES_BEAN_NAME, getEnvironment().getSystemProperties());
   }
//SYSTEM_ENVIRONMENT_BEAN_NAME同上    
   if (!beanFactory.containsLocalBean(SYSTEM_ENVIRONMENT_BEAN_NAME)) {
      beanFactory.registerSingleton(SYSTEM_ENVIRONMENT_BEAN_NAME, getEnvironment().getSystemEnvironment());
   }
}
```

#### refresh.postProcessBeanFactory() 方法

该方法目前在单个 Spring中是没有做任何事情的。 等到看SpringBoot源码的时候,这里就会有代码走进来,是进行根据包来扫描来获取class等信息的. 满足条件的class,就会当为bd给注册到beanFactory中去.

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

#### refresh.invokeBeanFactoryPostProcessors() 方法

可以看到这个方法,借助PostProcessorRegistrationDelegate来对PostProcessor进行处理。

先是对BeanDefinitionRegistryPostProcessor进行从beanFactory中获取出相应的名字数组,然后迭代这个数组,然后处理PriorityOrdered—>Ordered—> 没有,这个顺序,最后还有一个while循环迭代来检查BeanDefinitionRegistryPostProcessor是否都处理完了.

再接着就是处理BeanFactoryPostProcessor,处理方式是和BeanDefinitionRegistryPostProcessor一样的,顺序也是一样的.

最后就是调用beanFactory.clearMetadataCache()清除.

当然,这个里面有些上面 PostProcessor等待阅读SpringBoot的时候给补上来,因为到时候SpringBoot这里会有很多PostProcessor,这里目前是没有的.

```java
/**
 * Instantiate and invoke all registered BeanFactoryPostProcessor beans,
 * respecting explicit order if given.
 * <p>Must be called before singleton instantiation.
BeanFactoryPostProcessor: 用来修改Spring容器中已经存在的bean定义.
BeanDefinitionRegistryPostProcessor: 是BeanFactoryPostProcessor的子类,作用和父类是一样的,不同的是,该使用的是BeanDefinitionRegistry对bean进行处理
 */
protected void invokeBeanFactoryPostProcessors(ConfigurableListableBeanFactory beanFactory) {
//org.springframework.context.support.AbstractApplicationContext#getBeanFactoryPostProcessors,由于这里只是启动了单个Spring,返回的集合是没有值的.
   List<BeanFactoryPostProcessor> postProcessorsList = getBeanFactoryPostProcessors();
   //System.out.println("postProcessorsList value ---> " + postProcessorsList);
   // System.out.println("beanFactory  value 111111 ---> " + beanFactory);
//借助PostProcessorRegistrationDelegate来处理PostProcessors.
//对传入postProcessorsList进行迭代,如果PostProcessor是BeanDefinitionRegistryPostProcessor的话,就会强转然后调用postProcessBeanDefinitionRegistry方法(传入参数是beanFacotry),添加到registryProcessors集合中.如果不是的话,就会添加到regularPostProcessors集合中.
//根据BeanDefinitionRegistryPostProcessor,从beanFactory中获取postProcessorNames,
//进行迭代,如果是有PriorityOrdered接口的子类的话,就会从beanFactory中根据bean名字,类.class来获取BeanDefinitionRegistryPostProcessor,并且添加到currentRegistryProcessors集合中,ppName(名字的值)也会添加到processedBeans该集合中
//对currentRegistryProcessors进行排序,全部添加到registryProcessors集合中,invokeBeanDefinitionRegistryPostProcessors()该方法是调用BeanDefinitionRegistryPostProcessors的,调用完了然后清空currentRegistryProcessors这个集合.
//同样方法获取postProcessorNames,processedBeans集合中不包含并且是Ordered的子类,然后添加到currentRegistryProcessors集合中,ppName也会添加到processedBeans集合中,同样的排序方式,添加到registryProcessors中,再调用invokeBeanDefinitionRegistryPostProcessors()方法,currentRegistryProcessors清空该集合.
// 也就是到这里,可以看出来,处理的顺序,先是处理PriorityOrdered,再处理Ordered.
// 然后使用一个while循环,继续获取BeanDefinitionRegistryPostProcessor对应的postProcessorNames,这个地方是为了防止有些没有调用到的,并且是processedBeans集合中不包含的,然后就会放入到currentRegistryProcessors这个集合中,排序currentRegistryProcessors集合,全部添加到registryProcessors中,调用invokeBeanDefinitionRegistryPostProcessors,也就是调用具体的PostProcessors.
//invokeBeanFactoryPostProcessors(registryProcessors, beanFactory);
//invokeBeanFactoryPostProcessors(regularPostProcessors, beanFactory);
// 之前的二个集合,registryProcessors和regularPostProcessors,在这里还是会继续调用.
//然后根据BeanFactoryPostProcessor.class获取postProcessorNames数组,与上面的也是同样的方法,
//对postProcessorNames进行迭代,如果是processedBeans(上面装的名字)如果包含了,就会跳过.
/** 如果ppName,也就是迭代的值,是有PriorityOrdered的子类的话,就会从走beanFactory.getBean(ppName, BeanFactoryPostProcessor.class)获取出BeanFactoryPostProcessor放入到priorityOrderedPostProcessors集合中.  如果是Ordered的子类,就将名字放入到orderedPostProcessorNames集合中,如果上面三种都不满足的话,就会放入到nonOrderedPostProcessorNames集合中.
然后先排序priorityOrderedPostProcessors,再走invokeBeanFactoryPostProcessors(priorityOrderedPostProcessors, beanFactory);
接着迭代orderedPostProcessorNames集合,然后从beanFactory中获取BeanFactoryPostProcessor,再就做与priorityOrderedPostProcessors一样的操作.
最后在做nonOrderedPostProcessors这个集合的,操作是与orderedPostProcessorNames一摸一样的.

最后在调用一个beanFactory的clearMetadataCache方法.
可以看到这个方法是先对BeanDefinitionRegistryPostProcessor.class进行处理,然后根据顺序PriorityOrdered-->Ordered--->没有, 这样的顺序执行的.
然后再处理BeanFactoryPostProcessor.class,处理方式是和BeanDefinitionRegistryPostProcessor.class也是一样的,根据顺序来进行处理.
*/    
   PostProcessorRegistrationDelegate.invokeBeanFactoryPostProcessors(beanFactory, postProcessorsList);

   // Detect a LoadTimeWeaver and prepare for weaving, if found in the meantime
   // (e.g. through an @Bean method registered by ConfigurationClassPostProcessor)
// 获取beanFactory的tempClassLoader加载,并且beanFactory是包含了loadTimeWeaver这个bean的,
//就会走if方法,可以看到是添加LoadTimeWeaverAwareProcessor到beanFactory的postProcessor中,
//然后添加一个ClassLoader到beanFactory中   
   if (beanFactory.getTempClassLoader() == null && beanFactory.containsBean(LOAD_TIME_WEAVER_BEAN_NAME)) {
      beanFactory.addBeanPostProcessor(new LoadTimeWeaverAwareProcessor(beanFactory));
      beanFactory.setTempClassLoader(new ContextTypeMatchClassLoader(beanFactory.getBeanClassLoader()));
   }
}
```

#### refresh.registerBeanPostProcessors() 方法

仔细看中这个方法,其实和上一个方法走的逻辑好像是有点类似的. 也是借助PostProcessorRegistrationDelegate来完成其逻辑的.

先是从BeanFactory中获取BeanPostProcessor对用的postProcessorNames数组。

然后分为 PriorityOrdered –> Ordered –> 既不是PriorityOrdered ,也不是Ordered –> MergedBeanDefinitionPostProcessor子类, 这样的先后顺序,走registerBeanPostProcessors,这个是将PostProcessros注册到Spring的beanFactory中(Spring容器).

```java
/**
 * Instantiate and register all BeanPostProcessor beans,
 * respecting explicit order if given.
 * <p>Must be called before any instantiation of application beans.
 */
protected void registerBeanPostProcessors(ConfigurableListableBeanFactory beanFactory) {
   PostProcessorRegistrationDelegate.registerBeanPostProcessors(beanFactory, this);
}

-------------------
	public static void registerBeanPostProcessors(
			ConfigurableListableBeanFactory beanFactory, AbstractApplicationContext applicationContext) {

// 先是根据BeanPostProcessor获取出postProcessorNames数组,这个根据和上面的方法很相似.    
		String[] postProcessorNames = beanFactory.getBeanNamesForType(BeanPostProcessor.class,
				true, false);

		// Register BeanPostProcessorChecker that logs an info message when
		// a bean is created during BeanPostProcessor instantiation, i.e. when
		// a bean is not eligible for getting processed by all BeanPostProcessors.
//然后从beanFactory中获取出个数 + postProcessorNames数组长度再加上一个1.     
		int beanProcessorTargetCount = beanFactory.getBeanPostProcessorCount() + 1 + postProcessorNames.length;
//添加一个BeanPostProcessorChecker到beanFactory中.从名字上来,这个PostProcessor应该是进行检查的操作.
		beanFactory.addBeanPostProcessor(new BeanPostProcessorChecker(beanFactory, beanProcessorTargetCount));

		// Separate between BeanPostProcessors that implement PriorityOrdered,
		// Ordered, and the rest.
		List<BeanPostProcessor> priorityOrderedPostProcessors = new ArrayList<>();
		List<BeanPostProcessor> internalPostProcessors = new ArrayList<>();
		List<String> orderedPostProcessorNames = new ArrayList<>();
		List<String> nonOrderedPostProcessorNames = new ArrayList<>();

		// 对 postProcessorNames 进行遍历;同时使用不同类型的集合来存储数据
//主要是根据是否是PriorityOrdered的子类,是的话就会放入到priorityOrderedPostProcessors集合中,接着在判断是否是MergedBeanDefinitionPostProcessor,如果是的话,就会放入到internalPostProcessors集合中
//是不是orderd的子类,是的话,就会放入到orderedPostProcessorNames集合中,
//如果上面二者都不的话,就会放入到nonOrderedPostProcessorNames集合中  
		for (String ppName : postProcessorNames) {
			if (beanFactory.isTypeMatch(ppName, PriorityOrdered.class)) {
				BeanPostProcessor pp = beanFactory.getBean(ppName, BeanPostProcessor.class);
				priorityOrderedPostProcessors.add(pp);
				if (pp instanceof MergedBeanDefinitionPostProcessor) {
					internalPostProcessors.add(pp);
				}
			} else if (beanFactory.isTypeMatch(ppName, Ordered.class)) {
				orderedPostProcessorNames.add(ppName);
			} else {
				nonOrderedPostProcessorNames.add(ppName);
			}
		}

		// First, register the BeanPostProcessors that implement PriorityOrdered.
//先处理priorityOrderedPostProcessors这个集合中的数据.先排序,然后调用registerBeanPostPtocessors方法.
		sortPostProcessors(priorityOrderedPostProcessors, beanFactory);
		registerBeanPostProcessors(beanFactory, priorityOrderedPostProcessors);

		// Next, register the BeanPostProcessors that implement Ordered.
//在处理orderedPostProcessorNames集合中的数据,发现如果也是MergedBeanDefinitionPostProcessor或者其子类的话,也就放入到internalPostProcessors集合中,也就是这里先不处理.
		List<BeanPostProcessor> orderedPostProcessors = new ArrayList<>();
		for (String ppName : orderedPostProcessorNames) {
			BeanPostProcessor pp = beanFactory.getBean(ppName, BeanPostProcessor.class);
			orderedPostProcessors.add(pp);
			if (pp instanceof MergedBeanDefinitionPostProcessor) {
				internalPostProcessors.add(pp);
			}
		}
//排序,处理上面不是MergedBeanDefinitionPostProcessor的或其子类,并且是 orderedPostProcessorNames集合中的数据
		sortPostProcessors(orderedPostProcessors, beanFactory);
		registerBeanPostProcessors(beanFactory, orderedPostProcessors);

		// Now, register all regular BeanPostProcessors.
//最后就处理既不是PriorityOrdered,也不是Ordered的,如果也是MergedBeanDefinitionPostProcessor或者其子类的话,这里也会放入到internalPostProcessors集合中 
		List<BeanPostProcessor> nonOrderedPostProcessors = new ArrayList<>();
		for (String ppName : nonOrderedPostProcessorNames) {
			BeanPostProcessor pp = beanFactory.getBean(ppName, BeanPostProcessor.class);
			nonOrderedPostProcessors.add(pp);
			if (pp instanceof MergedBeanDefinitionPostProcessor) {
				internalPostProcessors.add(pp);
			}
		}
//这里先处理nonOrderedPostProcessorNames中的数据并且不是 MergedBeanDefinitionPostProcessor的子类.
		registerBeanPostProcessors(beanFactory, nonOrderedPostProcessors);

		// Finally, re-register all internal BeanPostProcessors.
//最后排序下 MergedBeanDefinitionPostProcessor子类的集合,调用registerBeanPostProcessors方法,注册到BeanFactory中去.   
		sortPostProcessors(internalPostProcessors, beanFactory);
		registerBeanPostProcessors(beanFactory, internalPostProcessors);

		// Re-register post-processor for detecting inner beans as ApplicationListeners,
		// moving it to the end of the processor chain (for picking up proxies etc).
//最后添加一个ApplicationListenerDetector到beanFactory中去,并且ApplicationListenerDetector是有实现MergedBeanDefinitionPostProcessor接口的.
		beanFactory.addBeanPostProcessor(new ApplicationListenerDetector(applicationContext));
	}
```

#### refersh.initMessageSource() 方法

这个方法主要是对 MESSAGE_SOURCE_BEAN_NAME 是否在beanFactory中进行判断.如果已经在了的话,就会判断是不是HierarchicalMessageSource类型,继续判断其ParentMessageSource是不是null,如果是null的话,就会getInternalParentMessageSource调用初始化获取一些值给赋值进去.

如果beanFactory中没有的话,就会先new一个,然后也会setParentMessageSource值进去,最后注册到beanFactory中去.

```java
/**
 * Initialize the MessageSource.
 * Use parent's if none defined in this context.
 */
protected void initMessageSource() {
  //先获取BeanFactory.  
   ConfigurableListableBeanFactory beanFactory = getBeanFactory();
// beanFactory中包含MESSAGE_SOURCE_BEAN_NAME
   if (beanFactory.containsLocalBean(MESSAGE_SOURCE_BEAN_NAME)) {
 //获取出出来的bean赋值给this.messageSource      
      this.messageSource = beanFactory.getBean(MESSAGE_SOURCE_BEAN_NAME, MessageSource.class);
      // Make MessageSource aware of parent MessageSource.
//this.parent不是null并且bean是HierarchicalMessageSource
      if (this.parent != null && this.messageSource instanceof HierarchicalMessageSource) {
        //强转  
         HierarchicalMessageSource hms = (HierarchicalMessageSource) this.messageSource;
  // hms获取出来的parentMessageSource是null情况下,getInternalParentMessageSource()返回的值赋值给hms的ParentMessageSource属性  
         if (hms.getParentMessageSource() == null) {
            // Only set parent context as parent MessageSource if no parent MessageSource
            // registered already.
            hms.setParentMessageSource(getInternalParentMessageSource());
         }
      }
      if (logger.isDebugEnabled()) {
         logger.debug("Using MessageSource [" + this.messageSource + "]");
      }
   }
// beanFactory中不包含MESSAGE_SOURCE_BEAN_NAME    
   else {
      // Use empty MessageSource to be able to accept getMessage calls.
//自己new一个DelegatingMessageSource,dms    
      DelegatingMessageSource dms = new DelegatingMessageSource();
//调用getInternalParentMessageSource()方法的返回值给set进去.  
      dms.setParentMessageSource(getInternalParentMessageSource());
      this.messageSource = dms;
// 注入到 beanFactroy中去       
      beanFactory.registerSingleton(MESSAGE_SOURCE_BEAN_NAME, this.messageSource);
// 根据log的级别来打印.       
      if (logger.isDebugEnabled()) {
         logger.debug("Unable to locate MessageSource with name '" + MESSAGE_SOURCE_BEAN_NAME +
               "': using default [" + this.messageSource + "]");
      }
   }
}
```

#### refresh.initApplicationEventMulticaster() 方法

该方法可以看到也是对APPLICATION_EVENT_MULTICASTER_BEAN_NAME是否在bean的判断，如果有的话,就会get出来,没有的话,就会new一个出来,然后注册到beanFactory中去.

```java
/**
 * Initialize the ApplicationEventMulticaster.
 * Uses SimpleApplicationEventMulticaster if none defined in the context.
 * @see org.springframework.context.event.SimpleApplicationEventMulticaster
 */
protected void initApplicationEventMulticaster() {
 // 先获取beanFactory   
   ConfigurableListableBeanFactory beanFactory = getBeanFactory();
 //判断beanFactory是不是有APPLICATION_EVENT_MULTICASTER_BEAN_NAME这个bean,
 //如果是有的话,就会获取出来.然后进行log的级别,判断要不要打印
   if (beanFactory.containsLocalBean(APPLICATION_EVENT_MULTICASTER_BEAN_NAME)) {
      this.applicationEventMulticaster =
            beanFactory.getBean(APPLICATION_EVENT_MULTICASTER_BEAN_NAME, ApplicationEventMulticaster.class);
      if (logger.isDebugEnabled()) {
         logger.debug("Using ApplicationEventMulticaster [" + this.applicationEventMulticaster + "]");
      }
   }
   else {
 //如果beanFactory是不包含的话,那么久new一个SimpleApplicationEventMulticaster出来,
 //然后注册到beanFactory中去,最后根据log的级别来判断打印
  
      this.applicationEventMulticaster = new SimpleApplicationEventMulticaster(beanFactory);
      beanFactory.registerSingleton(APPLICATION_EVENT_MULTICASTER_BEAN_NAME, this.applicationEventMulticaster);
      if (logger.isDebugEnabled()) {
         logger.debug("Unable to locate ApplicationEventMulticaster with name '" +
               APPLICATION_EVENT_MULTICASTER_BEAN_NAME +
               "': using default [" + this.applicationEventMulticaster + "]");
      }
   }
}
```

#### refresh.onRefresh() 方法

该方法时留给子类的。 如果是SpringBoot启动的话,这里就会去new Tomcat,然后启动web相应的环境.

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

#### refresh.registerListeners() 方法

该方法是先获取 ApplicationListeners,如果是有值的话,就会添加到AbstractApplicationEventMulticaster的ListenerRetriever的applicationListeners集合中去.

根据ApplicationListener.class获取对应的bean信息,然后迭代,最后会添加到AbstractApplicationEventMulticaster的ListenerRetriever的applicationListenerBeans属性中去

最后是对this.earlyApplicationEvents中的事件进行发布

```java
/**
 * Add beans that implement ApplicationListener as listeners.
 * Doesn't affect other listeners, which can be added without being beans.
 */
protected void registerListeners() {
   // Register statically specified listeners first.
//getApplicationListeners()获取AbstractApplicationContext中的applicationListeners
//getApplicationEventMulticaster()方法获取的applicationEventMulticaster,是在
//initApplicationEventMulticaster方法中有初始化的.    
//org.springframework.context.event.AbstractApplicationEventMulticaster#addApplicationListener,最后是走到了这里, 
//this.defaultRetriever.applicationListeners.add(listener);最后listener是添加到
//其内部内ListenerRetriever的applicationListeners参数中去了.    
   for (ApplicationListener<?> listener : getApplicationListeners()) {
      getApplicationEventMulticaster().addApplicationListener(listener);
   }

   // Do not initialize FactoryBeans here: We need to leave all regular beans
   // uninitialized to let post-processors apply to them!
//根据ApplicationListener获取相应的beanNames数组,这里可以看到和之前获取PostProcessor是一样的
   String[] listenerBeanNames = getBeanNamesForType(ApplicationListener.class, true, false);
//然后迭代, getApplicationListenerBean是走到了
//org.springframework.context.event.AbstractApplicationEventMulticaster#addApplicationListenerBean,也就是添加到了其内部类ListenerRetriever的applicationListenerBeans属性里面    
   for (String listenerBeanName : listenerBeanNames) {
      getApplicationEventMulticaster().addApplicationListenerBean(listenerBeanName);
   }

   // Publish early application events now that we finally have a multicaster...
//使用this.earlyApplicationEvents的集合的值,赋值给变量earlyEventsToProcess,
//然后给this.earlyApplicationEvents重置为null   
   Set<ApplicationEvent> earlyEventsToProcess = this.earlyApplicationEvents;
   this.earlyApplicationEvents = null;
 //集合不是null并且是有值的话,   
   if (earlyEventsToProcess != null) {
      for (ApplicationEvent earlyEvent : earlyEventsToProcess) {
  //org.springframework.context.event.SimpleApplicationEventMulticaster#invokeListener,这里是走到了这里,可以看到是对这个事件进行发布.
 // 然后会根据ApplicationListener去走onApplicationEvent方法         
         getApplicationEventMulticaster().multicastEvent(earlyEvent);
      }
   }
}
```

#### refresh.finishBeanFactoryInitialization() 方法

该方法从名字上来,就是结束beanFactory的初始化,也就是我们前面准备的bd,postProcessor等信息,在这里都会使用到的.

可以看到该方法就是真正的实例化bean的方法。 大致就是getBean往下走,getBean如果是没有的话,就会走createBean,也就是没有就去创建嘛，就是这个意思。然后其创建的条件,是走各种beanPostProcessors来进行扩展bean.

beanFactory.preInstantiateSingletons() 是需要去阅读很多遍的. 不是一遍或者简单的几遍就ok了的.

```java
/**
 * Finish the initialization of this context's bean factory,
 * initializing all remaining singleton beans.
 */
protected void finishBeanFactoryInitialization(ConfigurableListableBeanFactory beanFactory) {
   // Initialize conversion service for this context.
//如果beanFactory包含CONVERSION_SERVICE_BEAN_NAME,并且该CONVERSION_SERVICE_BEAN_NAME是
//ConversionService的子类的话,久满足条件,然后先从beanFactory中获取出bean,set给beanFactory中的conversionService属性    
   if (beanFactory.containsBean(CONVERSION_SERVICE_BEAN_NAME) &&
         beanFactory.isTypeMatch(CONVERSION_SERVICE_BEAN_NAME, ConversionService.class)) {
      beanFactory.setConversionService(
            beanFactory.getBean(CONVERSION_SERVICE_BEAN_NAME, ConversionService.class));
   }

   // Register a default embedded value resolver if no bean post-processor
   // (such as a PropertyPlaceholderConfigurer bean) registered any before:
   // at this point, primarily for resolution in annotation attribute values.
// beanFactory中没有EmbeddedValueResolver,也就是该方法返回的是false,然后就从environment中获取出来一个给add到beanFactory中去.    
   if (!beanFactory.hasEmbeddedValueResolver()) {
      beanFactory.addEmbeddedValueResolver(strVal -> getEnvironment().resolvePlaceholders(strVal));
   }

   // Initialize LoadTimeWeaverAware beans early to allow for registering their transformers early.
//根据LoadTimeWeaverAware获取出对用的names数组
   String[] weaverAwareNames = beanFactory.getBeanNamesForType(LoadTimeWeaverAware.class,
         false, false);

//然后迭代上面获取出来的数组,挨个调用getBean方法    
   for (String weaverAwareName : weaverAwareNames) {      
      getBean(weaverAwareName);
   }

   // Stop using the temporary ClassLoader for type matching.
// tempClassLoader,temp的ClassLoader设置为null    
   beanFactory.setTempClassLoader(null);

   // Allow for caching all bean definition metadata, not expecting further changes.
//org.springframework.beans.factory.support.DefaultListableBeanFactory#freezeConfiguration,该方法时走的这里. 其中可以看到是给configurationFrozen设置为true,然后beanName的集合转化为数组,并且赋值给this.frozenBeanDefinitionNames这个数组    
   beanFactory.freezeConfiguration();

   // Instantiate all remaining (non-lazy-init) singletons.
//这里面初始化bean,简单说一下逻辑. org.springframework.beans.factory.support.AbstractBeanFactory#getBean(java.lang.String)
//getBean() ---> doGetBean() --->   createBean() --->  doCreateBean() 
//然后再createBean和doCreateBean()方法之中,会根据条件上面的,获取BeanPostProcessors,然后判断走哦不走其各种BeanPostProceesors提供的方法.满足条件就会走,不满足也就自然不会走了.
//当然了这个方法的复杂程度是比较高的，是需要好好理解的。不是这个简简单单的几句话,还需要自己去读.
//起大致打代码走向就是这样,然后其中会走很多调用bean扩展的BeanPostProcessors，还有实现Init...接口后提供的afterS...等方法.    
   beanFactory.preInstantiateSingletons();
}
```

#### 

#### refresh.finishRefresh() 方法

可以看到这个方法是清除了资源缓存, 然后 实现Lifecycle接口的子类,这里就会启动其start方法

发送一个ContextRefreshedEvent事件出去

最后将当前的 AbstractApplicationContext 添加到 LiveBeansView的applicationContexts集合中来

```java
/**
 * Finish the refresh of this context, invoking the LifecycleProcessor's
 * onRefresh() method and publishing the
 * {@link org.springframework.context.event.ContextRefreshedEvent}.
 */
protected void finishRefresh() {
   // Clear context-level resource caches (such as ASM metadata from scanning).
  //清除资源缓存  
   clearResourceCaches();

   // Initialize lifecycle processor for this context.
// 这个方法就会调用实现了 Lifecycle 接口的子类,并且执行其start方法    
   initLifecycleProcessor();

   // Propagate refresh to lifecycle processor first.
   getLifecycleProcessor().onRefresh();

   // Publish the final event.
 //发送一个刷新上下文的Event出去   
   publishEvent(new ContextRefreshedEvent(this));

   // Participate in LiveBeansView MBean, if active.
//org.springframework.context.support.LiveBeansView#applicationContexts
//将AbstractApplicationContext添加到liveBean的applicationContexts集合中    
   LiveBeansView.registerApplicationContext(this);
}
```

#### refresh.resetCommonCaches()

可以看到这个方法才是真正的清除各种集合缓存啥的操作. 是在finally代码快中,也就是说是必须要执行的代码

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

