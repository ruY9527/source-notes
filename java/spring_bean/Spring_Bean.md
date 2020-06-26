## 					                           sSpring源码阅读记录



####  阅读方式

-   创建一个 Maven项目,引入Spring相关的依赖, 然后写一个启动类,在类上打上debug一层一层的走进去,就可以看到源码是怎么走的,怎么加载的.
-   从github上git Spring到自己本来,然后安装gradle,build 一下项目就可以了,这是基于Spring源码去跑的,可以直接在代码里面打印对应的输出语句,对于代码的走向是更加熟悉的.
-  目前比较流行的是SpringBoot,也可以直接启动一个SpringBoot项目,然后在run方法上打上断点,跟着源码一步一步的走，最后每个方法都走一遍会很有效的理解.



####  源码阅读

这里我们写一个读取从包位置扫描的类.  其实这个注解,你也可以加入到你启动类上面去扫描,效果也是一样的.这样的话,YangConfig就会当作为一个bean。如果你写在你的启动类上的话,那么你的启动类就会当作为一个bean.

```java
package com.yang.config;

import org.springframework.context.annotation.ComponentScan;

/**
 * @Author: Mu_Yi
 * @Date: 2020/1/5 21:45
 * @Version 1.0
 * @qq: 1411091515
 */


@ComponentScan("com.yang")
public class YangConfig {


}
```



启动类, 可以看到对于启动类,还是做了不少实验,但是这肯定是不够的,启动还是有很多的内容没有完全的写入进去的.  在这里打算断点就可以去跟着源码走。等等，这里是不是少了一个很明显的bean。

```java
package com.yang;

import com.yang.config.LwfConfig;
import com.yang.config.YangConfig;
import org.springframework.context.annotation.AnnotationConfigApplicationContext;

/**
 * @Author: Mu_Yi
 * @Date: 2020/1/5 21:45
 * @Version 1.0
 * @qq: 1411091515
 */
public class YangMain {

   public static void main(String[] args) {

      AnnotationConfigApplicationContext configApplicationContext =
            new AnnotationConfigApplicationContext(YangConfig.class/*, LwfConfig.class*/);

      //  构造方法中有调用这二个
      // configApplicationContext.register(YangConfig.class);
      // configApplicationContext.refresh();

      // System.out.println(configApplicationContext.getBean("one"));
   }

}
```



####  Spring 开始的地方

​    这里我们打上debug，跟着代码一步一步的走进去，看看是如何执行的.  想看想法是怎么走的话,就可以仔细看堆栈的信息。 然后我们跟着开始的方法,一步一步的跟着走进去.



   org.springframework.context.annotation.AnnotationConfigApplicationContext :  

```
public AnnotationConfigApplicationContext(Class<?>... annotatedClasses) {
   /**
    *  先走父类的方法;再去走子类的方法
    *
    *  1 Step : 走无参构成方法 this() 然后会继续往上调用父类的无参构造函数
    *  2 Step :
    *  3 Step :
    */
   this();

   register(annotatedClasses);

   refresh();
}

public AnnotationConfigApplicationContext() {
		/**
		 *  创建一个读取注解的bean定义读取器
		 *  什么是bean  ??  BeanDefinition ??  被注解的BeanDefinition
		 */
		// 初始化一个 AnnotatedBeanDefinitionReader
		this.reader = new AnnotatedBeanDefinitionReader(this);

		// 可以用来扫描包或者类;继而转换为pd ; 但是实际不是用scanner 这个对象
		// 初始化一个 ClassPathBeanDefinitionScanner
		this.scanner = new ClassPathBeanDefinitionScanner(this);
}
```

  这里我们跟着 this() 这个构造方法一步一步的走.



new AnnotatedBeanDefinitionReader(this)    走到下面的地方

org.springframework.context.annotation.AnnotatedBeanDefinitionReader#AnnotatedBeanDefinitionReader(org.springframework.beans.factory.support.BeanDefinitionRegistry)



this.reader = new AnnotatedBeanDefinitionReader(this) 的调用链分析,这里给我的感觉，就是对系统的一些数据，进行创建beanDefinition，然后放入到BeanFactory中去.

```java
/**
 * Create a new {@code AnnotatedBeanDefinitionReader} for the given registry.
 * If the registry is {@link EnvironmentCapable}, e.g. is an {@code ApplicationContext},
 * the {@link Environment} will be inherited, otherwise a new
 * {@link StandardEnvironment} will be created and used.
 * @param registry the {@code BeanFactory} to load bean definitions into,
 * in the form of a {@code BeanDefinitionRegistry}
 * @see #AnnotatedBeanDefinitionReader(BeanDefinitionRegistry, Environment)
 * @see #setEnvironment(Environment)
   创建一个 AnnotatedBeanDefinitionReader 给注册表. 
   最后走 AnnotatedBeanDefinitionReader,下面继续分析
 */
public AnnotatedBeanDefinitionReader(BeanDefinitionRegistry registry) {
   this(registry, getOrCreateEnvironment(registry));
}

	/**
	 * Get the Environment from the given registry if possible, otherwise return a new
	 * StandardEnvironment.
	  这里传入进来的 registry : org.springframework.context.annotation.AnnotationConfigApplicationContext@511baa65: startup date [Thu Jan 01 08:00:00 CST 1970]; root of context hierarchy.
	  可以看出 AnnotationConfigApplicationContext 是满足if条件的. 然后级会走到 AbstractApplicationContext 中的 getEnvironment() 方法,也是创建了一个 StandardEnvironment,不同的是,这个对象是 AbstractApplicationContext 中的变量.
	 */
private static Environment getOrCreateEnvironment(BeanDefinitionRegistry registry) {
		Assert.notNull(registry, "BeanDefinitionRegistry must not be null");
		if (registry instanceof EnvironmentCapable) {
			return ((EnvironmentCapable) registry).getEnvironment();
		}
		return new StandardEnvironment();
}


	/**	
	 * Create a new {@code AnnotatedBeanDefinitionReader} for the given registry and using
	 * the given {@link Environment}.
	 * @param registry the {@code BeanFactory} to load bean definitions into,
	 * in the form of a {@code BeanDefinitionRegistry}
	 * @param environment the {@code Environment} to use when evaluating bean definition
	 * profiles.
	 * @since 3.1
	 
	 执行参数代码: private BeanNameGenerator beanNameGenerator = new AnnotationBeanNameGenerator();
	 private ScopeMetadataResolver scopeMetadataResolver = new AnnotationScopeMetadataResolver();
	 这里可以看到的是执行了二个对象操作,在全局变量中.
	 */
	public AnnotatedBeanDefinitionReader(BeanDefinitionRegistry registry, Environment environment) {
        // 对 registry 和 environment 进行不为null的判断.	
		Assert.notNull(registry, "BeanDefinitionRegistry must not be null");
		Assert.notNull(environment, "Environment must not be null");
		this.registry = registry
        // 分割线一是对 new ConditionEvaluator的阅读;可以看到这个方放主要对一些registry,beanFactory等资源判断
		this.conditionEvaluator = new ConditionEvaluator(registry, environment, null);
        // 分割线一以后的就是对对应的进行分析
		AnnotationConfigUtils.registerAnnotationConfigProcessors(this.registry);
	}

-----------------------------------
    // 分割线一
    // org.springframework.context.annotation.ConditionEvaluator
	/**
	 * Create a new {@link ConditionEvaluator} instance.
	 这里可以看到将传入进来的参数,调用一个内部类的构造方放
	 */
	public ConditionEvaluator(@Nullable BeanDefinitionRegistry registry,
			@Nullable Environment environment, @Nullable ResourceLoader resourceLoader) {

		this.context = new ConditionContextImpl(registry, environment, resourceLoader);
	}

// 内部类 ConditionContextImpl 
		public ConditionContextImpl(@Nullable BeanDefinitionRegistry registry,
				@Nullable Environment environment, @Nullable ResourceLoader resourceLoader) {

			this.registry = registry;
            // 推断beanFactory;这里返回的beanFactory是DefaultListableBeanFactory
            // 可以看到是推断出了 beanFactory是 DefaultListableBeanFactory
			this.beanFactory = deduceBeanFactory(registry);
            // 如果environment是null的话,那么这里就会像beanFactory一样
            // Spring 自己进行推断下,但是从之前的构造函数来看,这个地方是正常情况是不会为null的
            // 所以不是很清楚什么情况下为null. 可能是从其他地方走进来 ?
			this.environment = (environment != null ? environment : deduceEnvironment(registry));
            // resourceLoader我们传入进来的是null,所以这里走了推断ResourceLoader方放.
            // 最后返回的是AnnotationConfigApplicationContext,也就是我们在启动Class里面使用的对象
			this.resourceLoader = (resourceLoader != null ? resourceLoader : deduceResourceLoader(registry));
            // 这里的classLoader是从 beanFacotry中获取出来的.
			this.classLoader = deduceClassLoader(resourceLoader, this.beanFactory);
		}
------------------

// org.springframework.context.annotation.AnnotationConfigUtils    
    
	/**
	 * Register all relevant annotation post processors in the given registry.
	 * @param registry the registry to operate on
	 翻译 : 在给定的注册表中注册所有相关的注释后处理器。
	 这里个人认为是对一些加了注解的类等信息的读取。
	 */
	public static void registerAnnotationConfigProcessors(BeanDefinitionRegistry registry) {
		registerAnnotationConfigProcessors(registry, null);
	}    
    

	/**
	 * Register all relevant annotation post processors in the given registry.
	 * @param registry the registry to operate on
	 * @param source the configuration source element (already extracted)
	 * that this registration was triggered from. May be {@code null}.
	 * @return a Set of BeanDefinitionHolders, containing all bean definitions
	 * that have actually been registered by this call
	 这里就是总结,就是将将一些类,创建对应的BeanDefinition,然后根据beanName注册到BeanFactory中去,也就是方法一个Map中,key是beanName,value就是对应的BeanDefintion对象.
     正常的情况下,这里是一共有六个的.
     分别是 : org.springframework.context.annotation.internalConfigurationAnnotationProcessor
     org.springframework.context.annotation.internalAutowiredAnnotationProcessor
     org.springframework.context.annotation.internalRequiredAnnotationProcessor
     org.springframework.context.annotation.internalCommonAnnotationProcessor
     org.springframework.context.event.internalEventListenerProcessor
     org.springframework.context.event.internalEventListenerFactory
     根据 Processor 后缀可以大致猜测到,是对什么进行大致的处理.
     然后还有一个EventListenerFacotry的
	 */
	public static Set<BeanDefinitionHolder> registerAnnotationConfigProcessors(
			BeanDefinitionRegistry registry, @Nullable Object source) {
       // 根据 registry 获取出beanFactory,也就是获取出了 DefaultListableBeanFactory这个beanFactory. 
		DefaultListableBeanFactory beanFactory = unwrapDefaultListableBeanFactory(registry);
		if (beanFactory != null) {
			// beanFactory.getDependencyComparator() 返回的是null,所以条件成立.
            // 传入 AnnotationAwareOrderComparator,走的 DefaultListableBeanFactory 的 setDependencyComparator,也就是将 AnnotationAwareOrderComparator 赋值给 this.dependencyComparator(DefaultListableBeanFactory全局变量)
			if (!(beanFactory.getDependencyComparator() instanceof AnnotationAwareOrderComparator)) {
				beanFactory.setDependencyComparator(AnnotationAwareOrderComparator.INSTANCE);
			}
            // beanFactory.getAutowireCandidateResolver() 返回的是 SimpleAutowireCandidateResolver这个,满足条件, 走 DefaultListableBeanFactory的setAutowireCandidateResolver方放,
			if (!(beanFactory.getAutowireCandidateResolver() instanceof ContextAnnotationAutowireCandidateResolver)) {
                // 下面有 setAutowireCandidateResolver 方放的阅读
				beanFactory.setAutowireCandidateResolver(new ContextAnnotationAutowireCandidateResolver());
			}
		}

		// Map 存储操作;方便传递参数
		Set<BeanDefinitionHolder> beanDefs = new LinkedHashSet<>(8);

		// 如果 registry 没有包含 CONFIGURATION_ANNOTATION_PROCESSOR_BEAN_NAME,就会进入。
        // 这里是没有包含的,所以是进入的
		if (!registry.containsBeanDefinition(CONFIGURATION_ANNOTATION_PROCESSOR_BEAN_NAME)) {
            // 这里走了RootBeanDefiniion的构造函数,然后调用super方放,于是就走到了AbstractBeanDefintion中来.这个二个BeanDefiniton里面是有很多全局参数的初始化的.最后返回一个bd.bd的beanClass也就是传入进去的 ConfigurationClassPostProcessor.class
			RootBeanDefinition def = new RootBeanDefinition(ConfigurationClassPostProcessor.class);
			def.setSource(source);
            // registerPostProcessor 方放, 给bd设置Role,值是2,
			beanDefs.add(registerPostProcessor(registry, def, CONFIGURATION_ANNOTATION_PROCESSOR_BEAN_NAME));
		}

        // 与 这里可以看到和上面的CONFIGURATION_ANNOTATION_PROCESSOR_BEAN_NAME处理逻辑是一样的 
		if (!registry.containsBeanDefinition(AUTOWIRED_ANNOTATION_PROCESSOR_BEAN_NAME)) {
			RootBeanDefinition def = new RootBeanDefinition(AutowiredAnnotationBeanPostProcessor.class);
			def.setSource(source);
            // registerPostProcessor() 方法是将 bd注册到 beanFactory中去,从代码中看,根据beanName存储到Map中,然后放入到一个List集合中.
			beanDefs.add(registerPostProcessor(registry, def, AUTOWIRED_ANNOTATION_PROCESSOR_BEAN_NAME));
		}

        // 如果 registry 不包含 REQUIRED_ANNOTATION_PROCESSOR_BEAN_NAME,	这里可以看到和上面的CONFIGURATION_ANNOTATION_PROCESSOR_BEAN_NAME处理逻辑是一样的
		if (!registry.containsBeanDefinition(REQUIRED_ANNOTATION_PROCESSOR_BEAN_NAME)) {
			RootBeanDefinition def = new RootBeanDefinition(RequiredAnnotationBeanPostProcessor.class);
			def.setSource(source);
			beanDefs.add(registerPostProcessor(registry, def, REQUIRED_ANNOTATION_PROCESSOR_BEAN_NAME));
		}

		// Check for JSR-250 support, and if present add the CommonAnnotationBeanPostProcessor.
        // 这里与上面是一样得，区别在于 判断条件多了一个jsr250Present的参数判断.
		if (jsr250Present && !registry.containsBeanDefinition(COMMON_ANNOTATION_PROCESSOR_BEAN_NAME)) {
			RootBeanDefinition def = new RootBeanDefinition(CommonAnnotationBeanPostProcessor.class);
			def.setSource(source);
			beanDefs.add(registerPostProcessor(registry, def, COMMON_ANNOTATION_PROCESSOR_BEAN_NAME));
		}

		// Check for JPA support, and if present add the PersistenceAnnotationBeanPostProcessor.
      // 这里没有进入.
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

        // 处理与上面类似.
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


// DefaultListableBeanFactory类中的方放,
public void setAutowireCandidateResolver(final AutowireCandidateResolver autowireCandidateResolver) {
		Assert.notNull(autowireCandidateResolver, "AutowireCandidateResolver must not be null");
    // 如果传入进来的 autowireCandidateResolver 是 BeanFactoryAware或者BeanFactoryAware的子类，就会满足条件进入.
		if (autowireCandidateResolver instanceof BeanFactoryAware) {
            // System.getSecurityManager() 方放返回的null,所以这里会走到else中
			if (System.getSecurityManager() != null) {
				AccessController.doPrivileged((PrivilegedAction<Object>) () -> {
					((BeanFactoryAware) autowireCandidateResolver).setBeanFactory(DefaultListableBeanFactory.this);
					return null;
				}, getAccessControlContext());
			}
			else {
  // org.springframework.beans.factory.support.GenericTypeAwareAutowireCandidateResolver
                // 这里会走到GenericTypeAwareAutowireCandidateResolver中,然后将DefaultListableBeanFactory赋值给其定义的beanFactory变量
				((BeanFactoryAware) autowireCandidateResolver).setBeanFactory(this);
			}
		}
    // 变量赋值
		this.autowireCandidateResolver = autowireCandidateResolver;
	}


	//---------------------------------------------------------------------
	// Implementation of BeanDefinitionRegistry interface
	//---------------------------------------------------------------------

	@Override
	public void registerBeanDefinition(String beanName, BeanDefinition beanDefinition)
			throws BeanDefinitionStoreException {
		// 对传入进来的参数进行检验.可以看到Spring还是蛮严格的
		Assert.hasText(beanName, "Bean name must not be empty");
		Assert.notNull(beanDefinition, "BeanDefinition must not be null");

		if (beanDefinition instanceof AbstractBeanDefinition) {
			try {
                // 走到 AbstractBeanDefinition 进行 validate,也就是检验.
                // validate中判断是否重写的方放和工厂方法放一起,否则就会报错.工厂方法必须创建具体的bean使用.  this.beanClass instanceof Class 判断 beanClass是不是Class,进入到 prepareMethodOverrides方法,判断是否有重写的放,如果有的话,就会进行相应的处理. 
				((AbstractBeanDefinition) beanDefinition).validate();
			}
			catch (BeanDefinitionValidationException ex) {
				throw new BeanDefinitionStoreException(beanDefinition.getResourceDescription(), beanName,
						"Validation of bean definition failed", ex);
			}
		}

        // 从 beanDefinitionMap中获取db,根据beanName来获取. 这里获取出来的是null,所以先走到else方法中看看是怎么走的,
		BeanDefinition existingDefinition = this.beanDefinitionMap.get(beanName);
		if (existingDefinition != null) {
			if (!isAllowBeanDefinitionOverriding()) {
				throw new BeanDefinitionStoreException(beanDefinition.getResourceDescription(), beanName,
						"Cannot register bean definition [" + beanDefinition + "] for bean '" + beanName +
						"': There is already [" + existingDefinition + "] bound.");
			}
			else if (existingDefinition.getRole() < beanDefinition.getRole()) {
				// e.g. was ROLE_APPLICATION, now overriding with ROLE_SUPPORT or ROLE_INFRASTRUCTURE
				if (logger.isWarnEnabled()) {
					logger.warn("Overriding user-defined bean definition for bean '" + beanName +
							"' with a framework-generated bean definition: replacing [" +
							existingDefinition + "] with [" + beanDefinition + "]");
				}
			}
			else if (!beanDefinition.equals(existingDefinition)) {
				if (logger.isInfoEnabled()) {
					logger.info("Overriding bean definition for bean '" + beanName +
							"' with a different definition: replacing [" + existingDefinition +
							"] with [" + beanDefinition + "]");
				}
			}
			else {
				if (logger.isDebugEnabled()) {
					logger.debug("Overriding bean definition for bean '" + beanName +
							"' with an equivalent definition: replacing [" + existingDefinition +
							"] with [" + beanDefinition + "]");
				}
			}
			this.beanDefinitionMap.put(beanName, beanDefinition);
		}
		else {
            // 检查beanFactory创建阶段是否启动,同时是否有bean被标记创建.这里返回的是false,我们继续往下来看else里面的逻辑
			if (hasBeanCreationStarted()) {
				// Cannot modify startup-time collection elements anymore (for stable iteration)
				synchronized (this.beanDefinitionMap) {
					this.beanDefinitionMap.put(beanName, beanDefinition);
					List<String> updatedDefinitions = new ArrayList<>(this.beanDefinitionNames.size() + 1);
					updatedDefinitions.addAll(this.beanDefinitionNames);
					updatedDefinitions.add(beanName);
					this.beanDefinitionNames = updatedDefinitions;
					if (this.manualSingletonNames.contains(beanName)) {
						Set<String> updatedSingletons = new LinkedHashSet<>(this.manualSingletonNames);
						updatedSingletons.remove(beanName);
						this.manualSingletonNames = updatedSingletons;
					}
				}
			}
			else {
				// Still in startup registration phase.  任然在解析阶段,并没有在创建bean阶段.
				// 将beanDefinition根据beanName存放在Map中,然后添加到beanDefinitionNames的List集合中。从 manualSingletonNames Set集合中 remove出去.
                this.beanDefinitionMap.put(beanName, beanDefinition);
				this.beanDefinitionNames.add(beanName);
				this.manualSingletonNames.remove(beanName);
			}
			this.frozenBeanDefinitionNames = null;
		}

        // existingDefinition 是null,没有进入到这个方法中. 目测这是一个重置beanDefintion的方法，就好比有个beanDefintion已经在了,但是有些值什么是又修改的,然后可能要重新放入一遍的逻辑.
		if (existingDefinition != null || containsSingleton(beanName)) {
			resetBeanDefinition(beanName);
		}
	}

// AnnotationConfigUtils类中,主要看registry.registerBeanDefinitio()方放,看下是怎么注册bd到BeanFacotry中去的.
private static BeanDefinitionHolder registerPostProcessor(
			BeanDefinitionRegistry registry, RootBeanDefinition definition, String beanName) {
       
		definition.setRole(BeanDefinition.ROLE_INFRASTRUCTURE);
    // 上面有对 registerBeanDefinition 注册 bd 到 beanFactory中去的逻辑.
		registry.registerBeanDefinition(beanName, definition);
    // 然后根据 bd, beanName 创建一个  BeanDefinitionHolder返回
		return new BeanDefinitionHolder(definition, beanName);
	}
```

 

this.scanner = new ClassPathBeanDefinitionScanner(this); 调用链分析.

org.springframework.context.annotation.ClassPathBeanDefinitionScanner

```java
/**
 * Create a new {@code ClassPathBeanDefinitionScanner} for the given bean factory.
 * @param registry the {@code BeanFactory} to load bean definitions into, in the form
 * of a {@code BeanDefinitionRegistry}
 */
public ClassPathBeanDefinitionScanner(BeanDefinitionRegistry registry) {
   this(registry, true);
}

public ClassPathBeanDefinitionScanner(BeanDefinitionRegistry registry, boolean useDefaultFilters) {
		this(registry, useDefaultFilters, getOrCreateEnvironment(registry));
	}
	
// 这里走到了if里面,是满足条件的
private static Environment getOrCreateEnvironment(BeanDefinitionRegistry registry) {
		Assert.notNull(registry, "BeanDefinitionRegistry must not be null");
		if (registry instanceof EnvironmentCapable) {
			return ((EnvironmentCapable) registry).getEnvironment();
		}
		return new StandardEnvironment();
}	

// 
public ClassPathBeanDefinitionScanner(BeanDefinitionRegistry registry, boolean useDefaultFilters,
			Environment environment) {

		this(registry, useDefaultFilters, environment,
				(registry instanceof ResourceLoader ? (ResourceLoader) registry : null));
	}


public ClassPathBeanDefinitionScanner(BeanDefinitionRegistry registry, boolean useDefaultFilters,
			Environment environment, @Nullable ResourceLoader resourceLoader) {

		Assert.notNull(registry, "BeanDefinitionRegistry must not be null");
		this.registry = registry;
		// 使用默认的 filters
		if (useDefaultFilters) {
            // 注册默认的filters.
			registerDefaultFilters();
		}
    //  这里主要调用父类的方法,然后对一些参数进行赋值
		setEnvironment(environment);
    //  这个方法,也是走到父类中, 对 resourcePatternResolver / metadataReaderFactory / componentsIndex 进行调用相应的方法进行处理.
		setResourceLoader(resourceLoader);
	}


org.springframework.context.annotation.ClassPathScanningCandidateComponentProvider

/**
	 * Set the {@link ResourceLoader} to use for resource locations.
	 * This will typically be a {@link ResourcePatternResolver} implementation.
	 * <p>Default is a {@code PathMatchingResourcePatternResolver}, also capable of
	 * resource pattern resolving through the {@code ResourcePatternResolver} interface.
	 * @see org.springframework.core.io.support.ResourcePatternResolver
	 * @see org.springframework.core.io.support.PathMatchingResourcePatternResolver
	 */
	@Override
public void setResourceLoader(@Nullable ResourceLoader resourceLoader) {
		this.resourcePatternResolver = ResourcePatternUtils.getResourcePatternResolver(resourceLoader);
		this.metadataReaderFactory = new CachingMetadataReaderFactory(resourceLoader);
		this.componentsIndex = CandidateComponentsIndexLoader.loadIndex(this.resourcePatternResolver.getClassLoader());
	}

// 这里对类型进行判断,如果是满条件的话就进行进行转化,如果不满足并且不是Null,就是进入到 else if 中,最后都不满足的话,就会走入到else中
public static ResourcePatternResolver getResourcePatternResolver(@Nullable ResourceLoader resourceLoader) {
		if (resourceLoader instanceof ResourcePatternResolver) {
			return (ResourcePatternResolver) resourceLoader;
		}
		else if (resourceLoader != null) {
			return new PathMatchingResourcePatternResolver(resourceLoader);
		}
		else {
			return new PathMatchingResourcePatternResolver();
		}
	}


// 从这个类的名字上来,给我饿感觉就是做缓存的,然后缓存的应该是metadata reader的,就是读取出来的metadata数据
org.springframework.core.type.classreading.CachingMetadataReaderFactory
    
    	public CachingMetadataReaderFactory(@Nullable ResourceLoader resourceLoader) {
		super(resourceLoader);
    // 如果resouceLoader是 DefaultResourceLoader,满祝条件，调用DefaultResourceLoader 的 getResourceCache 方法,返回回来的是空的集合.
		if (resourceLoader instanceof DefaultResourceLoader) {
			this.metadataReaderCache =
					((DefaultResourceLoader) resourceLoader).getResourceCache(MetadataReader.class);
		}
		else {
			setCacheLimit(DEFAULT_CACHE_LIMIT);
		}
	}



```



####  register 方法

 走完了 this() 方法就会走register方法, 从名字上可以看出意思,注册。那么 这个地方到底是注册什么呢？ 跟着代码继续往下看,到底是在读取些什么.



```java
@Override
public void register(Class<?>... annotatedClasses) {
   Assert.notEmpty(annotatedClasses, "At least one annotated class must be specified");
   this.reader.register(annotatedClasses);
}


org.springframework.context.annotation.AnnotatedBeanDefinitionReader
	/**
	 * Register one or more annotated classes to be processed.
	 * <p>Calls to {@code register} are idempotent; adding the same
	 * annotated class more than once has no additional effect.
	 * @param annotatedClasses one or more annotated classes,
	 * e.g. {@link Configuration @Configuration} classes
	 处理一个或者耕读的注解类。
	 这里我们注册的是  YangConfig这个类.
	 */
	public void register(Class<?>... annotatedClasses) {
		for (Class<?> annotatedClass : annotatedClasses) {
			// 登记Bean
			registerBean(annotatedClass);
		}
	}

     // 往下继续走到 doRegisterBean 方法
	public void registerBean(Class<?> annotatedClass) {
		doRegisterBean(annotatedClass, null, null, null);
	}


/**
	 * Register a bean from the given bean class, deriving its metadata from
	 * class-declared annotations.
	 * @param annotatedClass the class of the bean
	 * @param instanceSupplier a callback for creating an instance of the bean
	 * (may be {@code null})
	 * @param name an explicit name for the bean
	 * @param qualifiers specific qualifier annotations to consider, if any,
	 * in addition to qualifiers at the bean class level
	 * @param definitionCustomizers one or more callbacks for customizing the
	 * factory's {@link BeanDefinition}, e.g. setting a lazy-init or primary flag
	 * @since 5.0
	 从给定的Bean类注册Bean,从类声明的注释派生它的元数据.
	 */
	<T> void doRegisterBean(Class<T> annotatedClass, @Nullable Supplier<T> instanceSupplier, @Nullable String name,
			@Nullable Class<? extends Annotation>[] qualifiers, BeanDefinitionCustomizer... definitionCustomizers) {

		/**
		*  根据传入进来的class来生成一个 BeanDefinition.
		 */
		AnnotatedGenericBeanDefinition abd = new AnnotatedGenericBeanDefinition(annotatedClass);
		System.out.println("annotatedClass ---> " + annotatedClass);
		// System.out.println("abd.getMetadata()  --> " + abd.getMetadata());

		// 先是获取 bd 的元数据,然后走到 org.springframework.context.annotation.ConditionEvaluator中,来判断是不是要跳过,这里返回的是false,也就是说不跳过得意思.
		boolean isCondition = this.conditionEvaluator.shouldSkip(abd.getMetadata());
		System.out.println("isCondition ---> " + isCondition);
		if (isCondition) {
			return;
		}

        // 给bd这是属性,不过这里是null.
		abd.setInstanceSupplier(instanceSupplier);
        // org.springframework.context.annotation.AnnotationScopeMetadataResolver
        //  这里返回的ScopeMeatdata里面有 scopeName的值是singleton,scopedProxyMode中返回的name:NO , ordinal : 1   等信息.
		ScopeMetadata scopeMetadata = this.scopeMetadataResolver.resolveScopeMetadata(abd);
        // bd 设置scope是singleton
		abd.setScope(scopeMetadata.getScopeName());

		//  传递进来的 YangConfig 判断是否需要类名 转化为首字符小写
		String beanName = (name != null ? name : this.beanNameGenerator.generateBeanName(abd, this.registry));
		// System.out.println("name ---> " + name);
		// System.out.println("beanName ---> " + beanName);

		/**
		 * 处理通用的注解
		 *  Lazy , DependOn , Primary Role等注解
		 */
		AnnotationConfigUtils.processCommonDefinitionAnnotations(abd);

		// 单个是传递空的
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

        // 这里也是没有迭代的,
		for (BeanDefinitionCustomizer customizer : definitionCustomizers) {
			customizer.customize(abd);
		}
		/**
		 * 对象 BeanDefinitionHolder  可以理解为一个存放数据的结构  类似于 User 存放 userName age 等属性. 这里是将我们的 yangConfig 和 YangConfig对用的bd给传入进去,然后构造出一个 BeanDefinitionHolder来.
		 *
		 */
		BeanDefinitionHolder definitionHolder = new BeanDefinitionHolder(abd, beanName);

		/**
		 * ScopedProxyMode  代理模型;  org.springframework.context.annotation.AnnotationConfigUtils 会走到这个类中来.
		 传入进入的是,metadata,bd也就是yangConfig,registry是AnnotationConfigApplicationContext这个.
		 *
		 */
		definitionHolder = AnnotationConfigUtils.applyScopedProxyMode(scopeMetadata, definitionHolder, this.registry);

		/**
		 *  上面的数据结构注册；对象注册给 registry
		 	这个方法就是将 beanDefinition(YangConfig)给添加到 BeanFactory中去.
		 	这里的将 bd给添加到 BeanFacotry中是在this()构造函数中有说明的,因为在构造函数里面,有五个也是这个一样的，使用的同样代码,走的逻辑都是一摸一样的.
		 	org.springframework.beans.factory.support.DefaultListableBeanFactory#registerBeanDefinition            还是会走到 DefaultListableBeanFactory 这个类中的 registerBeanDefinition 方法来.其实也就是根据beanName,bd 根据key是beanname,value是bd给添加到map集合中即可.
		 */
		BeanDefinitionReaderUtils.registerBeanDefinition(definitionHolder, this.registry);
	}



org.springframework.context.annotation.AnnotationScopeMetadataResolver
    
   
	@Override
	public ScopeMetadata resolveScopeMetadata(BeanDefinition definition) {
        // 先new一个需要返回的对象.
		ScopeMetadata metadata = new ScopeMetadata();
		if (definition instanceof AnnotatedBeanDefinition) {
            // 满足条件,进行强转.
			AnnotatedBeanDefinition annDef = (AnnotatedBeanDefinition) definition;
            // AnnotationConfigUtils这个类,应该是判断这个类上的注解,如果有的话,就会返回封装的对应的AnnotationAttributes,由于这里返回的是null,所以就没有进入到if条件里面去. 于是就返回了一个new ScopeMetadata();
			AnnotationAttributes attributes = AnnotationConfigUtils.attributesFor(
					annDef.getMetadata(), this.scopeAnnotationType);
			if (attributes != null) {
				metadata.setScopeName(attributes.getString("value"));
				ScopedProxyMode proxyMode = attributes.getEnum("proxyMode");
				if (proxyMode == ScopedProxyMode.DEFAULT) {
					proxyMode = this.defaultProxyMode;
				}
				metadata.setScopedProxyMode(proxyMode);
			}
		}
		return metadata;
	}    



	static void processCommonDefinitionAnnotations(AnnotatedBeanDefinition abd, AnnotatedTypeMetadata metadata) {
        //  根据bd的metadata来判断是不是又Lazy这个注解,这里返回的是null,也就是没有
		AnnotationAttributes lazy = attributesFor(metadata, Lazy.class);
		if (lazy != null) {
			abd.setLazyInit(lazy.getBoolean("value"));
		}
        // else if 中是相等,也就是没有走进去.
		else if (abd.getMetadata() != metadata) {
			lazy = attributesFor(abd.getMetadata(), Lazy.class);
			if (lazy != null) {
				abd.setLazyInit(lazy.getBoolean("value"));
			}
		}

        // 判断是不是有 Primary 这个注解,如果有的话,db对应的primary设置就设置为true.
		if (metadata.isAnnotated(Primary.class.getName())) {
			abd.setPrimary(true);
		}
        
        // 这里dependsOn也是null.
		AnnotationAttributes dependsOn = attributesFor(metadata, DependsOn.class);
		if (dependsOn != null) {
			abd.setDependsOn(dependsOn.getStringArray("value"));
		}

        // bd是 AbstractBeanDefinition的子类.
		if (abd instanceof AbstractBeanDefinition) {
			AbstractBeanDefinition absBd = (AbstractBeanDefinition) abd;
            // 这里对应的 Role 和 Description 注解也是没有的.
			AnnotationAttributes role = attributesFor(metadata, Role.class);
			if (role != null) {
				absBd.setRole(role.getNumber("value").intValue());
			}
			AnnotationAttributes description = attributesFor(metadata, Description.class);
			if (description != null) {
				absBd.setDescription(description.getString("value"));
			}
		}
	}
```





####  refresh() 方法

​    refresh() 方法是最主要的方法，这里我们只是使用了 Spring, 到SpringBoot 的源码中, 还是有调用这个refresh 这个方法.

可以看到 refresh 方法里面还是走了蛮多的方法. 有一些方法是留给扩展的,比如 onRefresh() 这个方法,当你启动SpringBoot的话，这个方法就会走到去 new Tomcat的逻辑.

  sychronized 关键字，可以看到进入执行下面的代码，一次只容许一个线程进来操作.

```java
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
         // 这个方法在当前版本的 Spring 是没有任何代码
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





prepareRefresh ()  :

org.springframework.context.support.AbstractApplicationContext

```java
/**
 * Prepare this context for refreshing, setting its startup date and
 * active flag as well as performing any initialization of property sources.
 */
protected void prepareRefresh() {
   // Switch to active.
   this.startupDate = System.currentTimeMillis
   //  对closed设置false,active设置为true. closed 和 active 都是AtomicBoolean,这个是线程安全的.
   this.closed.set(false);
   this.active.set(true);

   if (logger.isInfoEnabled()) {
      logger.info("Refreshing " + this);
   }

   // Initialize any placeholder property sources in the context environment.
   // 目前该方法没有调用;目前没有做任何事情. 留给子类去实现的方法.
   initPropertySources();

   // Validate that all properties marked as required are resolvable:
   // see ConfigurablePropertyResolver#setRequiredProperties
    // 先走getEnvironment方法,返回的是this.environment,也就是StandardEnvironment,
    //  org.springframework.core.env.AbstractEnvironment里面的validateRequiredProperties方法,先new一个MissingRequiredPropertiesException,如果this.requeiredProperties中检验有问题的话,就会放入MissingRequiredPropertiesException中属性集合中,然后判断如果集合不是empty的话,就说明是有值的,然后就抛出异常来. 我们这里检验是没有问题的.
   getEnvironment().validateRequiredProperties();

   System.out.println("this.earlyApplicationListeners value is  - - - ->" + this.earlyApplicationListeners);
   // Store pre-refresh ApplicationListeners...
    // 如果earlyApplicationListeners是null的话,就初始化一个.
   if (this.earlyApplicationListeners == null) {
       // 这里的 applicationListeners 也是空集合.
      this.earlyApplicationListeners = new LinkedHashSet<>(this.applicationListeners);
   }  else {
      // Reset local application listeners to pre-refresh state.
       // 如果不为空集合的话,就先清空,然后将 earlyApplicationListeners添加进去.
      this.applicationListeners.clear();
      this.applicationListeners.addAll(this.earlyApplicationListeners);
   }

   // Allow for the collection of early ApplicationEvents,
   // to be published once the multicaster is available...
   this.earlyApplicationEvents = new LinkedHashSet<>();
}
```

可以看到 prepareRefresh  显示对closed和active参数值设置,然后检验一下配置参数,然后是有问题的话,就会抛出异常来。 然后对 earlyApplicationListeners进行判断或者初始化,初始化 earlyApplicationEvents 集合.



obtainFreshBeanFactory() 方法 :

```java
/**
 * Tell the subclass to refresh the internal bean factory.
 * @return the fresh BeanFactory instance
 * @see #refreshBeanFactory()
 * @see #getBeanFactory()
 */
protected ConfigurableListableBeanFactory obtainFreshBeanFactory() {
    // org.springframework.context.support.GenericApplicationContext
   refreshBeanFactory();
    // org.springframework.context.support.GenericApplicationContext,
    // 这里是走的GenericApplicationContext 返回的beanFactory是 DefaultListableBeanFactory,
    // 然后将 DefaultListableBeanFactory给返回去.
   ConfigurableListableBeanFactory beanFactory = getBeanFactory();
   if (logger.isDebugEnabled()) {
      logger.debug("Bean factory for " + getDisplayName() + ": " + beanFactory);
   }
   return beanFactory;
}

// 这里有一个 compareAndSet --> CAS,主要是防止没有被更新,如果有的话,就说明有个线程在同时操作,这个地方就抛出异常来
protected final void refreshBeanFactory() throws IllegalStateException {
		if (!this.refreshed.compareAndSet(false, true)) {
			throw new IllegalStateException(
					"GenericApplicationContext does not support multiple refresh attempts: just call 'refresh' once");
		}
    /**
    setSerializationId 方法走到了 DefaultListableBeanFactory里面,也就是将获取出来的getId()给赋值给serializationId这个属性，还有一个存放在Map里面的逻辑.private static final Map<String, Reference<DefaultListableBeanFactory>> = new ConcurrentHashMap<>(8); 
    org.springframework.beans.factory.support.DefaultListableBeanFactory
    */
		this.beanFactory.setSerializationId(getId());
	}
```



prepareBeanFactory(beanFactory) 方法阅读:

```java
/**
 *
 * Configure the factory's standard context characteristics,
 * such as the context's ClassLoader and post-processors.
 * @param beanFactory the BeanFactory to configure
 */
protected void prepareBeanFactory(ConfigurableListableBeanFactory beanFactory) {
   // Tell the internal bean factory to use the context's class loader etc.
   //  然后将返回的classLoader 赋值给 this.beanClassLoader.
   beanFactory.setBeanClassLoader(getClassLoader());
    // beanFactory.getBeanClassLoader() 这个应该是刚刚上面set进去的方法,然后new 一个StandardBeanExpressionResolver 对象,  org.springframework.expression.spel.SpelParserConfiguration#SpelParserConfiguration(org.springframework.expression.spel.SpelCompilerMode, java.lang.ClassLoader, boolean, boolean, int) 里面都是参数的设置. this.beanExpressionResolver = resolver;最后new出来的StandardBeanExpressionResolve赋值给beanExpressionResolver.
   beanFactory.setBeanExpressionResolver(new StandardBeanExpressionResolver(beanFactory.getBeanClassLoader()));
   
    // org.springframework.beans.support.ResourceEditorRegistrar#ResourceEditorRegistrar
    // 先是get出来的Environmentde,然后走到ResourceEditorRegistrar#ResourceEditorRegistrar,
    // private final Set<PropertyEditorRegistrar> propertyEditorRegistrars = new LinkedHashSet<>(4); 然后addPropertyEditorRegistrar方法也是往 propertyEditorRegistrars里面添加
   beanFactory.addPropertyEditorRegistrar(new ResourceEditorRegistrar(this, getEnvironment()));

   // Configure the bean factory with context callbacks.
//org.springframework.context.support.ApplicationContextAwareProcessor#ApplicationContextAwareProcessor,这里的this就是AnnotationConfigApplicationContext,然后传入到构造函数中,
//addBeanPostProcessor添加的ApplicationContextAwareProcessor这个,
   beanFactory.addBeanPostProcessor(new ApplicationContextAwareProcessor(this));

// private final Set<Class<?>> ignoredDependencyInterfaces = new HashSet<>();
  //   ignoreDependencyInterface 都是往这个集合中添加这些类,也就是添加了  EnvironmentAware / EmbeddedValueResolverAware / ResourceLoaderAware / ApplicationEventPublisherAware/ MessageSourceAware/ ApplicationContextAware 等这些类.
   beanFactory.ignoreDependencyInterface(EnvironmentAware.class);
   beanFactory.ignoreDependencyInterface(EmbeddedValueResolverAware.class);
   beanFactory.ignoreDependencyInterface(ResourceLoaderAware.class);
   beanFactory.ignoreDependencyInterface(ApplicationEventPublisherAware.class);
   beanFactory.ignoreDependencyInterface(MessageSourceAware.class);
   beanFactory.ignoreDependencyInterface(ApplicationContextAware.class);

   // BeanFactory interface not registered as resolvable type in a plain factory.
   // MessageSource registered (and found for autowiring) as a bean.
// registerResolvableDependency方法,对传入进来的第一个参数进行检验,不能为null.
// private final Map<Class<?>, Object> resolvableDependencies = new ConcurrentHashMap<>(16);
// 然后根据BeanFactory.class为key,beanFactory为value,去放入到resolvableDependencies(Map)中
   beanFactory.registerResolvableDependency(BeanFactory.class, beanFactory);
   beanFactory.registerResolvableDependency(ResourceLoader.class, this);
   beanFactory.registerResolvableDependency(ApplicationEventPublisher.class, this);
   beanFactory.registerResolvableDependency(ApplicationContext.class, this);

   // Register early post-processor for detecting inner beans as ApplicationListeners.
// new ApplicationListenerDetector(),也是传入进去的 AnnotationConfigApplicationContext这个,然后this.application = application, 赋值给 ApplicationListenerDetector 中的application参数.
// addBeanPostProcessor 下面也是有对这个方法进行阅读的. 但是这个参数满足 DestructionAwareBeanPostProcessor 条件,于是就有了 this.hasDestructionAwareBeanPostProcessors这个参数是true的. 最后也是添加到 beanPostProcessors 这个集合中    
   beanFactory.addBeanPostProcessor(new ApplicationListenerDetector(this));

   // Detect a LoadTimeWeaver and prepare for weaving, if found.
    // 不满足条件,没有进入来
   if (beanFactory.containsBean(LOAD_TIME_WEAVER_BEAN_NAME)) {
      beanFactory.addBeanPostProcessor(new LoadTimeWeaverAwareProcessor(beanFactory));
      // Set a temporary ClassLoader for type matching.
      beanFactory.setTempClassLoader(new ContextTypeMatchClassLoader(beanFactory.getBeanClassLoader()));
   }

   // Register default environment beans.
   if (!beanFactory.containsLocalBean(ENVIRONMENT_BEAN_NAME)) {
       // 这里将获取出来的 Environment对象,作为单例给注册到beanFactory中去,目前也是添加到集合中
       // 这里没有放入beanDefinitionMap中,而是添加到了manualSingletonName这个集合中
      beanFactory.registerSingleton(ENVIRONMENT_BEAN_NAME, getEnvironment());
   }
   if (!beanFactory.containsLocalBean(SYSTEM_PROPERTIES_BEAN_NAME)) {
       // 这里与 Register default environment beans. 逻辑是一样的
      beanFactory.registerSingleton(SYSTEM_PROPERTIES_BEAN_NAME, getEnvironment().getSystemProperties());
   }
   if (!beanFactory.containsLocalBean(SYSTEM_ENVIRONMENT_BEAN_NAME)) {
       // 这里与上面的逻辑也是一样的
      beanFactory.registerSingleton(SYSTEM_ENVIRONMENT_BEAN_NAME, getEnvironment().getSystemEnvironment());
   }
}

/**
  this.resourceLoader是null, customClassLoader 是false.
*/
@Override
@Nullable
public ClassLoader getClassLoader() {
		if (this.resourceLoader != null && !this.customClassLoader) {
			return this.resourceLoader.getClassLoader();
		}
		return super.getClassLoader();
}


/**
* Create a new ApplicationContextAwareProcessor for the given context.
  传入进来的 applicationContext 赋值给 this.applicationContext,
*/
public ApplicationContextAwareProcessor(ConfigurableApplicationContext applicationContext) {
		this.applicationContext = applicationContext;
		this.embeddedValueResolver = new EmbeddedValueResolver(applicationContext.getBeanFactory());
	}

// org.springframework.beans.factory.config.EmbeddedValueResolver#EmbeddedValueResolver,
//这里继续往下去new 对象,
public EmbeddedValueResolver(ConfigurableBeanFactory beanFactory) {
	this.exprContext = new BeanExpressionContext(beanFactory, null);
	this.exprResolver = beanFactory.getBeanExpressionResolver();
}

// org.springframework.beans.factory.support.AbstractBeanFactory
	@Override
	public void addBeanPostProcessor(BeanPostProcessor beanPostProcessor) {
        // 显示对传入进来的 beanPostProcessor进行不为null的判断.
		Assert.notNull(beanPostProcessor, "BeanPostProcessor must not be null");
		// Remove from old position, if any
        // private final List<BeanPostProcessor> beanPostProcessors = new CopyOnWriteArrayList<>();
        // 从beanPostProcessors中移除.
		this.beanPostProcessors.remove(beanPostProcessor);
		// Track whether it is instantiation/destruction aware
        // 这里由于传入进来的不满足条件,因此下面的二个都不会走.
        // 如果是 InstantiationAwareBeanPostProcessor,对应的参数就会设置为ture
		if (beanPostProcessor instanceof InstantiationAwareBeanPostProcessor) {
			this.hasInstantiationAwareBeanPostProcessors = true;
		}
		if (beanPostProcessor instanceof DestructionAwareBeanPostProcessor) {
			this.hasDestructionAwareBeanPostProcessors = true;
		}
		// Add to end of list
        // 然后又往 beanPostProcessors中添加传入进来的beanPostPorcessor.
		this.beanPostProcessors.add(beanPostProcessor);
	}

// org.springframework.beans.factory.support.DefaultListableBeanFactory#registerSingleton
// 这个方法在上面也是进行阅读的,就是在this()方法里面,对一些代码的饿
	@Override
	public void registerSingleton(String beanName, Object singletonObject) throws IllegalStateException {
		super.registerSingleton(beanName, singletonObject);

		if (hasBeanCreationStarted()) {
			// Cannot modify startup-time collection elements anymore (for stable iteration)
			synchronized (this.beanDefinitionMap) {
				if (!this.beanDefinitionMap.containsKey(beanName)) {
					Set<String> updatedSingletons = new LinkedHashSet<>(this.manualSingletonNames.size() + 1);
					updatedSingletons.addAll(this.manualSingletonNames);
					updatedSingletons.add(beanName);
					this.manualSingletonNames = updatedSingletons;
				}
			}
		}
		else {
			// Still in startup registration phase
			if (!this.beanDefinitionMap.containsKey(beanName)) {
				this.manualSingletonNames.add(beanName);
			}
		}

		clearByTypeCache();
	}
```



postProcessBeanFactory(beanFactory) : 

// 可以看到这个方法,是走到下面的方法,是没有做任何代码. 应该是留到子类进行实现走自己的逻辑

```
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



invokeBeanFactoryPostProcessors(beanFactory) 方法:

 

```java
/**
 * Instantiate and invoke all registered BeanFactoryPostProcessor beans,
 * respecting explicit order if given.
 * <p>Must be called before singleton instantiation.
 */
protected void invokeBeanFactoryPostProcessors(ConfigurableListableBeanFactory beanFactory) {

   //  getBeanFactoryPostProcessors()  这个方法直接获取一个list;这个list在 AnnotationConfigApplicationContext 定义的. 这里的getBeanFactoryPostProcessors()直接写在invokeBeanFactoryPostProcessors这个里面,编译了源码,于是就抽取出来了.
    // 这里目前抽取出来的集合是空集合,没有值的.
   List<BeanFactoryPostProcessor> postProcessorsList = getBeanFactoryPostProcessors();
   //System.out.println("postProcessorsList value ---> " + postProcessorsList);
   // System.out.println("beanFactory  value 111111 ---> " + beanFactory);

   //  自定义就是自己写的
   PostProcessorRegistrationDelegate.invokeBeanFactoryPostProcessors(beanFactory, postProcessorsList);

   // Detect a LoadTimeWeaver and prepare for weaving, if found in the meantime
   // (e.g. through an @Bean method registered by ConfigurationClassPostProcessor)
   if (beanFactory.getTempClassLoader() == null && beanFactory.containsBean(LOAD_TIME_WEAVER_BEAN_NAME)) {
      beanFactory.addBeanPostProcessor(new LoadTimeWeaverAwareProcessor(beanFactory));
      beanFactory.setTempClassLoader(new ContextTypeMatchClassLoader(beanFactory.getBeanClassLoader()));
   }
}



// org.springframework.context.support.PostProcessorRegistrationDelegate,从这个方法的名字上看,调用 BeanFactroyPostProcessors. 传入进来的集合是空集合,beanFactoy是DefaultListableBeanFactory.
	public static void invokeBeanFactoryPostProcessors(
			ConfigurableListableBeanFactory beanFactory, List<BeanFactoryPostProcessor> beanFactoryPostProcessors) {

		// Invoke BeanDefinitionRegistryPostProcessors first, if any.
		Set<String> processedBeans = new HashSet<>();
		
        // 这里是满足条件的.
		if (beanFactory instanceof BeanDefinitionRegistry) {
			/**
			 * 如果beanFactory 是 BeanDefinitionRegistry;强转
			 */
			BeanDefinitionRegistry registry = (BeanDefinitionRegistry) beanFactory;
			List<BeanFactoryPostProcessor> regularPostProcessors = new ArrayList<>();
			List<BeanDefinitionRegistryPostProcessor> registryProcessors = new ArrayList<>();
			
            // 由于传入进来的集合是空集合,所以这里也就是上面可以迭代的.
			for (BeanFactoryPostProcessor postProcessor : beanFactoryPostProcessors) {
				// 如果是 BeanDefinitionRegistryPostProcessor
				if (postProcessor instanceof BeanDefinitionRegistryPostProcessor) {
					BeanDefinitionRegistryPostProcessor registryProcessor =
							(BeanDefinitionRegistryPostProcessor) postProcessor;
					//  赋值进 beanFactory
					registryProcessor.postProcessBeanDefinitionRegistry(registry);
					// 添加进入集合中
					registryProcessors.add(registryProcessor);
				} else {
					//  否则就添加到宁外一个 registry的集合中
					regularPostProcessors.add(postProcessor);
				}
			}

			// Do not initialize FactoryBeans here: We need to leave all regular beans
			// uninitialized to let the bean factory post-processors apply to them!
			// Separate between BeanDefinitionRegistryPostProcessors that implement
			// PriorityOrdered, Ordered, and the rest.
			List<BeanDefinitionRegistryPostProcessor> currentRegistryProcessors = new ArrayList<>();

			// First, invoke the BeanDefinitionRegistryPostProcessors that implement PriorityOrdered.
// 这里调用beanFactory的getBeanNamesForType,获取出来的数组里面只有一个 org.springframework.context.annotation.internalConfigurationAnnotationProcessor
			String[] postProcessorNames = beanFactory.getBeanNamesForType(BeanDefinitionRegistryPostProcessor.class,
							true, false);

			for (String ppName : postProcessorNames) {
// ppName : org.springframework.context.annotation.internalConfigurationAnnotationProcessor
//  beanFactory.isTypeMatch返回的是true,也就是代码继续往下走                
				if (beanFactory.isTypeMatch(ppName, PriorityOrdered.class)) {
// org.springframework.beans.factory.support.AbstractBeanFactory#doGetBean,这个方法是很重要的,                    
					currentRegistryProcessors.add(beanFactory.getBean(ppName, BeanDefinitionRegistryPostProcessor.class));
					processedBeans.add(ppName);
				}
			}

			sortPostProcessors(currentRegistryProcessors, beanFactory);
			registryProcessors.addAll(currentRegistryProcessors);

			//  这步执行完,BeanFactory 中的 beanDefinitionMap 中的个数 从 7 到 12. 说明Bean在这步是有执行操作的
			invokeBeanDefinitionRegistryPostProcessors(currentRegistryProcessors, registry);
			currentRegistryProcessors.clear();

			// Next, invoke the BeanDefinitionRegistryPostProcessors that implement Ordered.
			postProcessorNames = beanFactory.getBeanNamesForType(BeanDefinitionRegistryPostProcessor.class, true, false);
			for (String ppName : postProcessorNames) {
				if (!processedBeans.contains(ppName) && beanFactory.isTypeMatch(ppName, Ordered.class)) {
					currentRegistryProcessors.add(beanFactory.getBean(ppName, BeanDefinitionRegistryPostProcessor.class));
					processedBeans.add(ppName);
				}
			}
			sortPostProcessors(currentRegistryProcessors, beanFactory);
			registryProcessors.addAll(currentRegistryProcessors);
			invokeBeanDefinitionRegistryPostProcessors(currentRegistryProcessors, registry);
			currentRegistryProcessors.clear();

			// Finally, invoke all other BeanDefinitionRegistryPostProcessors until no further ones appear.
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
			//  这步是有执行到的,可以 debug 进去看详细的执行流程操作
			invokeBeanFactoryPostProcessors(registryProcessors, beanFactory);
			invokeBeanFactoryPostProcessors(regularPostProcessors, beanFactory);
		}

		else {
			// Invoke factory processors registered with the context instance.
			invokeBeanFactoryPostProcessors(beanFactoryPostProcessors, beanFactory);
		}

		// Do not initialize FactoryBeans here: We need to leave all regular beans
		// uninitialized to let the bean factory post-processors apply to them!
		String[] postProcessorNames =
				beanFactory.getBeanNamesForType(BeanFactoryPostProcessor.class, true, false);

		// Separate between BeanFactoryPostProcessors that implement PriorityOrdered,
		// Ordered, and the rest.
		List<BeanFactoryPostProcessor> priorityOrderedPostProcessors = new ArrayList<>();
		List<String> orderedPostProcessorNames = new ArrayList<>();
		List<String> nonOrderedPostProcessorNames = new ArrayList<>();
		for (String ppName : postProcessorNames) {
			if (processedBeans.contains(ppName)) {
				// skip - already processed in first phase above
			}
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

		// First, invoke the BeanFactoryPostProcessors that implement PriorityOrdered.
		sortPostProcessors(priorityOrderedPostProcessors, beanFactory);
		invokeBeanFactoryPostProcessors(priorityOrderedPostProcessors, beanFactory);

		// Next, invoke the BeanFactoryPostProcessors that implement Ordered.
		List<BeanFactoryPostProcessor> orderedPostProcessors = new ArrayList<>();
		for (String postProcessorName : orderedPostProcessorNames) {
			orderedPostProcessors.add(beanFactory.getBean(postProcessorName, BeanFactoryPostProcessor.class));
		}
		sortPostProcessors(orderedPostProcessors, beanFactory);
		invokeBeanFactoryPostProcessors(orderedPostProcessors, beanFactory);

		// Finally, invoke all other BeanFactoryPostProcessors.
		List<BeanFactoryPostProcessor> nonOrderedPostProcessors = new ArrayList<>();
		for (String postProcessorName : nonOrderedPostProcessorNames) {
			nonOrderedPostProcessors.add(beanFactory.getBean(postProcessorName, BeanFactoryPostProcessor.class));
		}
		invokeBeanFactoryPostProcessors(nonOrderedPostProcessors, beanFactory);

		// Clear cached merged bean definitions since the post-processors might have
		// modified the original metadata, e.g. replacing placeholders in values...
		beanFactory.clearMetadataCache();
	}

-------------------
// org.springframework.core.ResolvableType
	/**
	 * Return a {@link ResolvableType} for the specified {@link Class},
	 * doing assignability checks against the raw class only (analogous to
	 * {@link Class#isAssignableFrom}, which this serves as a wrapper for.
	 * For example: {@code ResolvableType.forRawClass(List.class)}.
	 * @param clazz the class to introspect ({@code null} is semantically
	 * equivalent to {@code Object.class} for typical use cases here)
	 * @return a {@link ResolvableType} for the specified class
	 * @since 4.2
	 * @see #forClass(Class)
	 * @see #getRawClass()
	 
	 clazz : org.springframework.core.PriorityOrdered
	 返回的对象 : clazz属性的值是 传入进来的clazz的值,这里可以debug进去.
	 */
	public static ResolvableType forRawClass(@Nullable Class<?> clazz) {
		return new ResolvableType(clazz) {
			@Override
			public ResolvableType[] getGenerics() {
				return EMPTY_TYPES_ARRAY;
			}
			@Override
			public boolean isAssignableFrom(Class<?> other) {
				return (clazz == null || ClassUtils.isAssignable(clazz, other));
			}
			@Override
			public boolean isAssignableFrom(ResolvableType other) {
				Class<?> otherClass = other.resolve();
				return (otherClass != null && (clazz == null || ClassUtils.isAssignable(clazz, otherClass)));
			}
		};
	}    

--------------------
// org.springframework.beans.factory.support.AbstractBeanFactory
//    
	@Override
	public boolean isTypeMatch(String name, ResolvableType typeToMatch) throws NoSuchBeanDefinitionException {
    // org.springframework.beans.factory.BeanFactoryUtils.transformedBeanName(),这个方法如果是以&开头的话,然后就进行截取.
// org.springframework.core.SimpleAliasRegistry.canonicalName() 这个方法是判断是否有别名    
		String beanName = transformedBeanName(name);

		// Check manually registered singletons.
// org.springframework.beans.factory.support.DefaultSingletonBeanRegistry.getSingleton()走的这个方法.这里返回的是beanInstance是null,
		Object beanInstance = getSingleton(beanName, false);
    // 返回的null,于是就没有进入到if里面
		if (beanInstance != null && beanInstance.getClass() != NullBean.class) {
			if (beanInstance instanceof FactoryBean) {
				if (!BeanFactoryUtils.isFactoryDereference(name)) {
					Class<?> type = getTypeForFactoryBean((FactoryBean<?>) beanInstance);
					return (type != null && typeToMatch.isAssignableFrom(type));
				}
				else {
					return typeToMatch.isInstance(beanInstance);
				}
			}
			else if (!BeanFactoryUtils.isFactoryDereference(name)) {
				if (typeToMatch.isInstance(beanInstance)) {
					// Direct match for exposed instance?
					return true;
				}
				else if (typeToMatch.hasGenerics() && containsBeanDefinition(beanName)) {
					// Generics potentially only match on the target class, not on the proxy...
					RootBeanDefinition mbd = getMergedLocalBeanDefinition(beanName);
					Class<?> targetType = mbd.getTargetType();
					if (targetType != null && targetType != ClassUtils.getUserClass(beanInstance)) {
						// Check raw class match as well, making sure it's exposed on the proxy.
						Class<?> classToMatch = typeToMatch.resolve();
						if (classToMatch != null && !classToMatch.isInstance(beanInstance)) {
							return false;
						}
						if (typeToMatch.isAssignableFrom(targetType)) {
							return true;
						}
					}
					ResolvableType resolvableType = mbd.targetType;
					if (resolvableType == null) {
						resolvableType = mbd.factoryMethodReturnType;
					}
					return (resolvableType != null && typeToMatch.isAssignableFrom(resolvableType));
				}
			}
			return false;
		}
// 上面返回的null,else if的条件也不满足. 
		else if (containsSingleton(beanName) && !containsBeanDefinition(beanName)) {
			// null instance registered
			return false;
		}

		// No singleton instance found -> check bean definition.
    // 这里返回的是null,所以下面的if方法也不会进去.
		BeanFactory parentBeanFactory = getParentBeanFactory();
		if (parentBeanFactory != null && !containsBeanDefinition(beanName)) {
			// No bean definition found in this factory -> delegate to parent.
			return parentBeanFactory.isTypeMatch(originalBeanName(name), typeToMatch);
		}

		// Retrieve corresponding bean definition.
    //getMergedLocalBeanDefinition方法返回的mbd,beanClass:org.springframework.context.annotation.ConfigurationClassPostProcessor
		RootBeanDefinition mbd = getMergedLocalBeanDefinition(beanName);

		Class<?> classToMatch = typeToMatch.resolve();
		if (classToMatch == null) {
			classToMatch = FactoryBean.class;
		}
    // 这里的 FactoryBean.class == classToMatch 是false,所以这个数组中就有二个值,分别是Factory和PriorityOrdered.
		Class<?>[] typesToMatch = (FactoryBean.class == classToMatch ?
				new Class<?>[] {classToMatch} : new Class<?>[] {FactoryBean.class, classToMatch});

		// Check decorated bean definition, if any: We assume it'll be easier
		// to determine the decorated bean's type than the proxy's type.
        // 这里的dbd返回的是Null,由于是Null所以下面的if条件也不会进入
		BeanDefinitionHolder dbd = mbd.getDecoratedDefinition();
    
		if (dbd != null && !BeanFactoryUtils.isFactoryDereference(name)) {
			RootBeanDefinition tbd = getMergedBeanDefinition(dbd.getBeanName(), dbd.getBeanDefinition(), mbd);
			Class<?> targetClass = predictBeanType(dbd.getBeanName(), tbd, typesToMatch);
			if (targetClass != null && !FactoryBean.class.isAssignableFrom(targetClass)) {
				return typeToMatch.isAssignableFrom(targetClass);
			}
		}

    // 这里传入的 beanName,mdb,typesToMatch数组,都是在上面有提到的,是一步一步走下来的.这里返回的是class org.springframework.context.annotation.ConfigurationClassPostProcessor,所以下面的if是不会进入的
		Class<?> beanType = predictBeanType(beanName, mbd, typesToMatch);
		if (beanType == null) {
			return false;
		}

		// Check bean class whether we're dealing with a FactoryBean.
    // 是否在处理FactoryBean
		if (FactoryBean.class.isAssignableFrom(beanType)) {
			if (!BeanFactoryUtils.isFactoryDereference(name) && beanInstance == null) {
				// If it's a FactoryBean, we want to look at what it creates, not the factory class.
				beanType = getTypeForFactoryBean(beanName, mbd);
				if (beanType == null) {
					return false;
				}
			}
		}
    // name 不是null,并且是&开头的.这里是不满足条件的,所以就返回false,也不会进入到下面的代码去处理对应的逻辑.
		else if (BeanFactoryUtils.isFactoryDereference(name)) {
			// Special case: A SmartInstantiationAwareBeanPostProcessor returned a non-FactoryBean
			// type but we nevertheless are being asked to dereference a FactoryBean...
			// Let's check the original bean class and proceed with it if it is a FactoryBean.
			beanType = predictBeanType(beanName, mbd, FactoryBean.class);
			if (beanType == null || !FactoryBean.class.isAssignableFrom(beanType)) {
				return false;
			}
		}

    // resolvableType 这里的值是null
		ResolvableType resolvableType = mbd.targetType;
		if (resolvableType == null) {
            // 这里还是返回的还是null
			resolvableType = mbd.factoryMethodReturnType;
		}
    //  resolvableType的值是null,所以就不会进入到这里.
		if (resolvableType != null && resolvableType.resolve() == beanType) {
			return typeToMatch.isAssignableFrom(resolvableType);
		}
// org.springframework.util.ClassUtils#isAssignable , 这里返回的true    
		return typeToMatch.isAssignableFrom(beanType);
	}    


---------
// org.springframework.beans.factory.support.AbstractAutowireCapableBeanFactory    
	@Override
	@Nullable
	protected Class<?> predictBeanType(String beanName, RootBeanDefinition mbd, Class<?>... typesToMatch) {
		Class<?> targetType = determineTargetType(beanName, mbd, typesToMatch);
		// Apply SmartInstantiationAwareBeanPostProcessors to predict the
		// eventual type after a before-instantiation shortcut.
// mdb.isSynthetic()是否是综合的,这里返回的是false.
//hasInstantiationAwareBeanPostProcessors(),是否已经注册了任何实体化InstantiationAwareBeanPostProcessors,返回的是false,所以就不满足条件进入到if里面    
		if (targetType != null && !mbd.isSynthetic() && hasInstantiationAwareBeanPostProcessors()) {
			for (BeanPostProcessor bp : getBeanPostProcessors()) {
				if (bp instanceof SmartInstantiationAwareBeanPostProcessor) {
					SmartInstantiationAwareBeanPostProcessor ibp = (SmartInstantiationAwareBeanPostProcessor) bp;
					Class<?> predicted = ibp.predictBeanType(targetType, beanName);
					if (predicted != null && (typesToMatch.length != 1 || FactoryBean.class != typesToMatch[0] ||
							FactoryBean.class.isAssignableFrom(predicted))) {
						return predicted;
					}
				}
			}
		}
		return targetType;
	}    

/**
	 * Determine the target type for the given bean definition.
	 * @param beanName the name of the bean (for error handling purposes)
	 * @param mbd the merged bean definition for the bean
	 * @param typesToMatch the types to match in case of internal type matching purposes
	 * (also signals that the returned {@code Class} will never be exposed to application code)
	 * @return the type for the bean if determinable, or {@code null} otherwise
	 
	 */
	@Nullable
	protected Class<?> determineTargetType(String beanName, RootBeanDefinition mbd, Class<?>... typesToMatch) {
        // targetType的值是 org.springframework.context.annotation.ConfigurationClassPostProcessor,target不是null,于是就直接返回了.
		Class<?> targetType = mbd.getTargetType();
		if (targetType == null) {
			targetType = (mbd.getFactoryMethodName() != null ?
					getTypeForFactoryMethod(beanName, mbd, typesToMatch) :
					resolveBeanClass(mbd, beanName, typesToMatch));
			if (ObjectUtils.isEmpty(typesToMatch) || getTempClassLoader() == null) {
				mbd.resolvedTargetType = targetType;
			}
		}
		return targetType;
	}

----------------------------
doGetBean 还是真正的获取Bean方法,这里我们继续往下看.    
	/**
	 * Return an instance, which may be shared or independent, of the specified bean.
	 * @param name the name of the bean to retrieve
	 * @param requiredType the required type of the bean to retrieve
	 * @param args arguments to use when creating a bean instance using explicit arguments
	 * (only applied when creating a new instance as opposed to retrieving an existing one)
	 * @param typeCheckOnly whether the instance is obtained for a type check,
	 * not for actual use
	 * @return an instance of the bean
	 * @throws BeansException if the bean could not be created
	 */
	@SuppressWarnings("unchecked")
	protected <T> T doGetBean(final String name, @Nullable final Class<T> requiredType,
			@Nullable final Object[] args, boolean typeCheckOnly) throws BeansException {

       // 这里是对beanName进行处理,判断是不是有别名
		final String beanName = transformedBeanName(name);
		Object bean;

		// Eagerly check singleton cache for manually registered singletons.
    // 这里返回的 sharedInstance是null.
		Object sharedInstance = getSingleton(beanName);
		if (sharedInstance != null && args == null) {
			/*if (logger.isDebugEnabled()) {
				if (isSingletonCurrentlyInCreation(beanName)) {
					logger.debug("Returning eagerly cached instance of singleton bean '" + beanName +
							"' that is not fully initialized yet - a consequence of a circular reference");
				} else {
					logger.debug("Returning cached instance of singleton bean '" + beanName + "'");
				}
			}*/
			bean = getObjectForBeanInstance(sharedInstance, name, beanName, null);
		} else {
			// Fail if we're already creating this bean instance:
			// We're assumably within a circular reference.
			if (isPrototypeCurrentlyInCreation(beanName)) {
				throw new BeanCurrentlyInCreationException(beanName);
			}

			// Check if bean definition exists in this factory.
            // 这里获取出来的 parentBeanFactory 是null
			BeanFactory parentBeanFactory = getParentBeanFactory();
			if (parentBeanFactory != null && !containsBeanDefinition(beanName)) {
				// Not found -> check parent.
				String nameToLookup = originalBeanName(name);
				if (parentBeanFactory instanceof AbstractBeanFactory) {
					return ((AbstractBeanFactory) parentBeanFactory).doGetBean(
							nameToLookup, requiredType, args, typeCheckOnly);
				} else if (args != null) {
					// Delegation to parent with explicit args.
					return (T) parentBeanFactory.getBean(nameToLookup, args);
				} else {
					// No args -> delegate to standard getBean method.
					return parentBeanFactory.getBean(nameToLookup, requiredType);
				}
			}

            // typeCheckOnly 是false,也就进入了if里面
			if (!typeCheckOnly) {
                // 标记一个标记,后面应该是有用到.
				markBeanAsCreated(beanName);
			}

			try {
				final RootBeanDefinition mbd = getMergedLocalBeanDefinition(beanName);
                // 检查mdb,也就是判断mbd是否是抽象类,如果是抽象类的话,就会抛出异常.	
				checkMergedBeanDefinition(mbd, beanName, args);

				// Guarantee initialization of beans that the current bean depends on.
                // mbd获取的dependsOn,这里是没有这个注解的.
				String[] dependsOn = mbd.getDependsOn();
				if (dependsOn != null) {
					for (String dep : dependsOn) {
						if (isDependent(beanName, dep)) {
							throw new BeanCreationException(mbd.getResourceDescription(), beanName,
									"Circular depends-on relationship between '" + beanName + "' and '" + dep + "'");
						}
						registerDependentBean(dep, beanName);
						try {
							getBean(dep);
						} catch (NoSuchBeanDefinitionException ex) {
							throw new BeanCreationException(mbd.getResourceDescription(), beanName,
									"'" + beanName + "' depends on missing bean '" + dep + "'", ex);
						}
					}
				}

                
				// Create bean instance. 这里是单例的,然后进入到 createBean这个方法中来
				if (mbd.isSingleton()) {
					sharedInstance = getSingleton(beanName, () -> {
						try {
							return createBean(beanName, mbd, args);
						}
						catch (BeansException ex) {
							// Explicitly remove instance from singleton cache: It might have been put there
							// eagerly by the creation process, to allow for circular reference resolution.
							// Also remove any beans that received a temporary reference to the bean.
							destroySingleton(beanName);
							throw ex;
						}
					});
					bean = getObjectForBeanInstance(sharedInstance, name, beanName, mbd);
				} else if (mbd.isPrototype()) {
					// It's a prototype -> create a new instance.
					Object prototypeInstance = null;
					try {
						beforePrototypeCreation(beanName);
						prototypeInstance = createBean(beanName, mbd, args);
					}
					finally {
						afterPrototypeCreation(beanName);
					}
					bean = getObjectForBeanInstance(prototypeInstance, name, beanName, mbd);
				} else {
					String scopeName = mbd.getScope();
					final Scope scope = this.scopes.get(scopeName);
					if (scope == null) {
						throw new IllegalStateException("No Scope registered for scope name '" + scopeName + "'");
					}
					try {
						Object scopedInstance = scope.get(beanName, () -> {
							beforePrototypeCreation(beanName);
							try {
								return createBean(beanName, mbd, args);
							}
							finally {
								afterPrototypeCreation(beanName);
							}
						});
						bean = getObjectForBeanInstance(scopedInstance, name, beanName, mbd);
					} catch (IllegalStateException ex) {
						throw new BeanCreationException(beanName,
								"Scope '" + scopeName + "' is not active for the current thread; consider " +
								"defining a scoped proxy for this bean if you intend to refer to it from a singleton",
								ex);
					}
				}
			} catch (BeansException ex) {
				cleanupAfterBeanCreationFailure(beanName);
				throw ex;
			}
		}

		// Check if required type matches the type of the actual bean instance.
		if (requiredType != null && !requiredType.isInstance(bean)) {
			try {
				T convertedBean = getTypeConverter().convertIfNecessary(bean, requiredType);
				if (convertedBean == null) {
					throw new BeanNotOfRequiredTypeException(name, requiredType, bean.getClass());
				}
				return convertedBean;
			}
			catch (TypeMismatchException ex) {
				if (logger.isDebugEnabled()) {
					logger.debug("Failed to convert bean '" + name + "' to required type '" +
							ClassUtils.getQualifiedName(requiredType) + "'", ex);
				}
				throw new BeanNotOfRequiredTypeException(name, requiredType, bean.getClass());
			}
		}
		return (T) bean;
	}


	/**
	 * Return the (raw) singleton object registered under the given name.
	 * <p>Checks already instantiated singletons and also allows for an early
	 * reference to a currently created singleton (resolving a circular reference).
	 * @param beanName the name of the bean to look for
	 * @param allowEarlyReference whether early references should be created or not
	 * @return the registered singleton object, or {@code null} if none found
	 */
	@Nullable
	protected Object getSingleton(String beanName, boolean allowEarlyReference) {
		Object singletonObject = this.singletonObjects.get(beanName);
		if (singletonObject == null && isSingletonCurrentlyInCreation(beanName)) {
			synchronized (this.singletonObjects) {
				singletonObject = this.earlySingletonObjects.get(beanName);
				if (singletonObject == null && allowEarlyReference) {
					ObjectFactory<?> singletonFactory = this.singletonFactories.get(beanName);
					if (singletonFactory != null) {
						singletonObject = singletonFactory.getObject();
						this.earlySingletonObjects.put(beanName, singletonObject);
						this.singletonFactories.remove(beanName);
					}
				}
			}
		}
		return singletonObject;
	}

	/**
	 * Mark the specified bean as already created (or about to be created).
	 * <p>This allows the bean factory to optimize its caching for repeated
	 * creation of the specified bean.
	 * @param beanName the name of the bean
	 这里将org.springframework.context.annotation.internalConfigurationAnnotationProcessor添加到alreadyCreated集合中
	 */
	protected void markBeanAsCreated(String beanName) {
		if (!this.alreadyCreated.contains(beanName)) {
			synchronized (this.mergedBeanDefinitions) {
				if (!this.alreadyCreated.contains(beanName)) {
					// Let the bean definition get re-merged now that we're actually creating
					// the bean... just in case some of its metadata changed in the meantime.
					clearMergedBeanDefinition(beanName);
					this.alreadyCreated.add(beanName);
				}
			}
		}
	}



	/**
	 * Return a RootBeanDefinition for the given bean, by merging with the
	 * parent if the given bean's definition is a child bean definition.
	 * @param beanName the name of the bean definition
	 * @param bd the original bean definition (Root/ChildBeanDefinition)
	 * @param containingBd the containing bean definition in case of inner bean,
	 * or {@code null} in case of a top-level bean
	 * @return a (potentially merged) RootBeanDefinition for the given bean
	 * @throws BeanDefinitionStoreException in case of an invalid bean definition
	 */
	protected RootBeanDefinition getMergedBeanDefinition(
			String beanName, BeanDefinition bd, @Nullable BeanDefinition containingBd)
			throws BeanDefinitionStoreException {

		synchronized (this.mergedBeanDefinitions) {
			RootBeanDefinition mbd = null;

			// Check with full lock now in order to enforce the same merged instance.
			if (containingBd == null) {
				mbd = this.mergedBeanDefinitions.get(beanName);
			}

			if (mbd == null) {
				if (bd.getParentName() == null) {
					// Use copy of given root bean definition.
					if (bd instanceof RootBeanDefinition) {
						mbd = ((RootBeanDefinition) bd).cloneBeanDefinition();
					}
					else {
						mbd = new RootBeanDefinition(bd);
					}
				}
				else {
					// Child bean definition: needs to be merged with parent.
					BeanDefinition pbd;
					try {
						String parentBeanName = transformedBeanName(bd.getParentName());
						if (!beanName.equals(parentBeanName)) {
							pbd = getMergedBeanDefinition(parentBeanName);
						}
						else {
							BeanFactory parent = getParentBeanFactory();
							if (parent instanceof ConfigurableBeanFactory) {
								pbd = ((ConfigurableBeanFactory) parent).getMergedBeanDefinition(parentBeanName);
							}
							else {
								throw new NoSuchBeanDefinitionException(parentBeanName,
										"Parent name '" + parentBeanName + "' is equal to bean name '" + beanName +
										"': cannot be resolved without an AbstractBeanFactory parent");
							}
						}
					}
					catch (NoSuchBeanDefinitionException ex) {
						throw new BeanDefinitionStoreException(bd.getResourceDescription(), beanName,
								"Could not resolve parent bean definition '" + bd.getParentName() + "'", ex);
					}
					// Deep copy with overridden values.
					mbd = new RootBeanDefinition(pbd);
					mbd.overrideFrom(bd);
				}

				// Set default singleton scope, if not configured before.
				if (!StringUtils.hasLength(mbd.getScope())) {
					mbd.setScope(RootBeanDefinition.SCOPE_SINGLETON);
				}

				// A bean contained in a non-singleton bean cannot be a singleton itself.
				// Let's correct this on the fly here, since this might be the result of
				// parent-child merging for the outer bean, in which case the original inner bean
				// definition will not have inherited the merged outer bean's singleton status.
				if (containingBd != null && !containingBd.isSingleton() && mbd.isSingleton()) {
					mbd.setScope(containingBd.getScope());
				}

				// Cache the merged bean definition for the time being
				// (it might still get re-merged later on in order to pick up metadata changes)
// 这里将传入进来的值,放入到mergedBeanDefinitions Map中                
				if (containingBd == null && isCacheBeanMetadata()) {
					this.mergedBeanDefinitions.put(beanName, mbd);
				}
			}

			return mbd;
		}
	}

-----------------------------
createBean     

	/**
	 * Actually create the specified bean. Pre-creation processing has already happened
	 * at this point, e.g. checking {@code postProcessBeforeInstantiation} callbacks.
	 * <p>Differentiates between default bean instantiation, use of a
	 * factory method, and autowiring a constructor.
	 * @param beanName the name of the bean
	 * @param mbd the merged bean definition for the bean
	 * @param args explicit arguments to use for constructor or factory method invocation
	 * @return a new instance of the bean
	 * @throws BeanCreationException if the bean could not be created
	 * @see #instantiateBean
	 * @see #instantiateUsingFactoryMethod
	 * @see #autowireConstructor
	 */
	protected Object doCreateBean(final String beanName, final RootBeanDefinition mbd, final @Nullable Object[] args)
			throws BeanCreationException {

		// Instantiate the bean.
		BeanWrapper instanceWrapper = null;
		if (mbd.isSingleton()) {
			instanceWrapper = this.factoryBeanInstanceCache.remove(beanName);
		}
		if (instanceWrapper == null) {
			/**
			 *
			 */
			instanceWrapper = createBeanInstance(beanName, mbd, args);
		}
		final Object bean = instanceWrapper.getWrappedInstance();
		Class<?> beanType = instanceWrapper.getWrappedClass();
		if (beanType != NullBean.class) {
			mbd.resolvedTargetType = beanType;
		}

		// Allow post-processors to modify the merged bean definition.
		synchronized (mbd.postProcessingLock) {
			if (!mbd.postProcessed) {
				try {
					// TODO 第三次调用后置处理器调用
					applyMergedBeanDefinitionPostProcessors(mbd, beanType, beanName);
				} catch (Throwable ex) {
					throw new BeanCreationException(mbd.getResourceDescription(), beanName,
							"Post-processing of merged bean definition failed", ex);
				}
				mbd.postProcessed = true;
			}
		}

		// Eagerly cache singletons to be able to resolve circular references
		// even when triggered by lifecycle interfaces like BeanFactoryAware.
		boolean earlySingletonExposure = (mbd.isSingleton() && this.allowCircularReferences &&
				isSingletonCurrentlyInCreation(beanName));
		if (earlySingletonExposure) {
			if (logger.isDebugEnabled()) {
				logger.debug("Eagerly caching bean '" + beanName +
						"' to allow for resolving potential circular references");
			}
			// TODO 第四次调用后置处理器
			addSingletonFactory(beanName, () -> getEarlyBeanReference(beanName, mbd, bean));
		}

		// Initialize the bean instance.
		Object exposedObject = bean;
		try {
			// TODO 第五次调用后置处理器 ; 第六次.  后置处理器调用了二个
			populateBean(beanName, mbd, instanceWrapper);

			// TODO 第七次后置处理器执行 ; 和 第八次. 后置处理器调用了二个
			exposedObject = initializeBean(beanName, exposedObject, mbd);
		} catch (Throwable ex) {
			if (ex instanceof BeanCreationException && beanName.equals(((BeanCreationException) ex).getBeanName())) {
				throw (BeanCreationException) ex;
			}
			else {
				throw new BeanCreationException(mbd.getResourceDescription(), beanName, "Initialization of bean failed", ex);
			}
		}

		if (earlySingletonExposure) {
			Object earlySingletonReference = getSingleton(beanName, false);
			if (earlySingletonReference != null) {
				if (exposedObject == bean) {
					exposedObject = earlySingletonReference;
				} else if (!this.allowRawInjectionDespiteWrapping && hasDependentBean(beanName)) {
					String[] dependentBeans = getDependentBeans(beanName);
					Set<String> actualDependentBeans = new LinkedHashSet<>(dependentBeans.length);
					for (String dependentBean : dependentBeans) {
						if (!removeSingletonIfCreatedForTypeCheckOnly(dependentBean)) {
							actualDependentBeans.add(dependentBean);
						}
					}
					if (!actualDependentBeans.isEmpty()) {
						throw new BeanCurrentlyInCreationException(beanName,
								"Bean with name '" + beanName + "' has been injected into other beans [" +
								StringUtils.collectionToCommaDelimitedString(actualDependentBeans) +
								"] in its raw version as part of a circular reference, but has eventually been " +
								"wrapped. This means that said other beans do not use the final version of the " +
								"bean. This is often the result of over-eager type matching - consider using " +
								"'getBeanNamesOfType' with the 'allowEagerInit' flag turned off, for example.");
					}
				}
			}
		}

		// Register bean as disposable.
		try {
			registerDisposableBeanIfNecessary(beanName, bean, mbd);
		} catch (BeanDefinitionValidationException ex) {
			throw new BeanCreationException(mbd.getResourceDescription(), beanName, "Invalid destruction signature", ex);
		}
		return exposedObject;
	}
```





registerBeanPostProcessors(beanFactory) 方法 :   从名字上看,是对BeanPostProcessors进行注册. 

可以总体看到 registerBeanPostProcessors 这个方法,根据BeanPostProcessor获取出postProcessorNames,然后对 postProcessorNames 进行迭代, 进行分类处理,分别装入不同的集合中.对 不同的集合进行先后迭代处理,排序，添加到beanFactory中去.  这里多了 BeanPostProcessorChecker 和 ApplicationListenerDetector这二个，是在这儿给添加进去的.

```java
/**
 * Instantiate and register all BeanPostProcessor beans,
 * respecting explicit order if given.
 * <p>Must be called before any instantiation of application beans.
 这里使用 PostProcessorRegistrationDelegate 这个类来完成.
 */
protected void registerBeanPostProcessors(ConfigurableListableBeanFactory beanFactory) {
   PostProcessorRegistrationDelegate.registerBeanPostProcessors(beanFactory, this);
}

--------------------------
// org.springframework.context.support.PostProcessorRegistrationDelegate#registerBeanPostProcessors(org.springframework.beans.factory.config.ConfigurableListableBeanFactory, org.springframework.context.support.AbstractApplicationContext)
// 传入进来的beanFactory是DefaultListableBeanFactory,applicationContext:AnnotationConfigApplicationContext.    
	public static void registerBeanPostProcessors(
			ConfigurableListableBeanFactory beanFactory, AbstractApplicationContext applicationContext) {

// 这里获取出来了  //org.springframework.context.annotation.internalAutowiredAnnotationProcessor
//org.springframework.context.annotation.internalRequiredAnnotationProcessor
//org.springframework.context.annotation.internalCommonAnnotationProcessor
//yangBeanPostProcessor 这个是我自己写的类,实现了BeanPostProcessor这个接口,并且重写了其方法    
		String[] postProcessorNames = beanFactory.getBeanNamesForType(BeanPostProcessor.class,
				true, false);

		// Register BeanPostProcessorChecker that logs an info message when
		// a bean is created during BeanPostProcessor instantiation, i.e. when
		// a bean is not eligible for getting processed by all BeanPostProcessors.
// 3 + 1 + 4 = 8    
		int beanProcessorTargetCount = beanFactory.getBeanPostProcessorCount() + 1 + postProcessorNames.length;
// new 一个BeanPostProcessorChecker,传入beanFactory和上面的beanProcessorTargetCount值是8,然后又添加到beanFactory中去.    
		beanFactory.addBeanPostProcessor(new BeanPostProcessorChecker(beanFactory, beanProcessorTargetCount));

		// Separate between BeanPostProcessors that implement PriorityOrdered,
		// Ordered, and the rest.
		List<BeanPostProcessor> priorityOrderedPostProcessors = new ArrayList<>();
		List<BeanPostProcessor> internalPostProcessors = new ArrayList<>();
		List<String> orderedPostProcessorNames = new ArrayList<>();
		List<String> nonOrderedPostProcessorNames = new ArrayList<>();

		// 对 postProcessorNames 进行遍历;同时使用不同类型的集合来存储数据
//这里对上面的 postProcessorNames 进行迭代,根据不同的条件放入到不同的集合中.我自定义的yangBeanPostProcessor就放入到nonOrderedPostProcessorNames这个集合中,其他三个都分别放入到了priorityOrderedPostProcessors和internalPostProcessors这二个集合中.
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
 //如果beanFactory是DefaultListableBeanFactory的话,就调用其getDependencyComparator()方法,然后对传入进来的priorityOrderedPostProcessors根据getDependencyComparator()返回的方法进行排序.
		sortPostProcessors(priorityOrderedPostProcessors, beanFactory);
 //对priorityOrderedPostProcessors集合中的值,添加到beanFactory中去---->beanFactory.addBeanPostProcessor(postProcessor); 也就是走的这个方法
		registerBeanPostProcessors(beanFactory, priorityOrderedPostProcessors);

		// Next, register the BeanPostProcessors that implement Ordered.
    // orderedPostProcessorNames 这边是一个空的集合,也就是没有值.
		List<BeanPostProcessor> orderedPostProcessors = new ArrayList<>();
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
// nonOrderedPostProcessorNames 里面就是我们自定义的 YangBeanPostProcessor.
		List<BeanPostProcessor> nonOrderedPostProcessors = new ArrayList<>();
		for (String ppName : nonOrderedPostProcessorNames) {
			BeanPostProcessor pp = beanFactory.getBean(ppName, BeanPostProcessor.class);
			nonOrderedPostProcessors.add(pp);
            // 没有实现这个接口，所以也就不会走到这个方法来
			if (pp instanceof MergedBeanDefinitionPostProcessor) {
				internalPostProcessors.add(pp);
			}
		}
    
// 添加到 beanFactoryy中去    
		registerBeanPostProcessors(beanFactory, nonOrderedPostProcessors);

		// Finally, re-register all internal BeanPostProcessors.
       // 排序,然后添加到beanFactoruy中去.
		sortPostProcessors(internalPostProcessors, beanFactory);
		registerBeanPostProcessors(beanFactory, internalPostProcessors);

		// Re-register post-processor for detecting inner beans as ApplicationListeners,
		// moving it to the end of the processor chain (for picking up proxies etc).
//将AnnotationConfigApplication传入ApplicationListenerDetector,new 一个 ApplicationListenerDetector,然后添加到beanFactory中去. 
		beanFactory.addBeanPostProcessor(new ApplicationListenerDetector(applicationContext));
	}
```



initMessageSource() 方法 ：

这个方法,如果beanFactory中是有 MESSAGE_SOURCE_BEAN_NAME 的话,就会进行判断, 都满足条件的话,就会走到hms.setParentMessageSource(getInternalParentMessageSource());这个方法。

如果不包含的话,就会去new一个DelegatingMessageSource,然后添加到beanFactory中的bdMap中去.

```java
/**
 * Initialize the MessageSource.
 * Use parent's if none defined in this context.
 */
protected void initMessageSource() {
//获取出beanFactory是DefaultListableBeanFactory这个类,    
   ConfigurableListableBeanFactory beanFactory = getBeanFactory();
   // beanFactory 里面是没有包含 MESSAGE_SOURCE_BEAN_NAME 这个bean的,走到else中   
   if (beanFactory.containsLocalBean(MESSAGE_SOURCE_BEAN_NAME)) {
      this.messageSource = beanFactory.getBean(MESSAGE_SOURCE_BEAN_NAME, MessageSource.class);
      // Make MessageSource aware of parent MessageSource.
      if (this.parent != null && this.messageSource instanceof HierarchicalMessageSource) {
         HierarchicalMessageSource hms = (HierarchicalMessageSource) this.messageSource;
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
   else {
      // Use empty MessageSource to be able to accept getMessage calls.
      DelegatingMessageSource dms = new DelegatingMessageSource();
      // getInternalParentMessageSource 方法返回的是null
      dms.setParentMessageSource(getInternalParentMessageSource()); 
      this.messageSource = dms;
// 然后使用MESSAGE_SOURCE_BEAN_NAME,value是this.messageSource,添加到bdMap中去.        
      beanFactory.registerSingleton(MESSAGE_SOURCE_BEAN_NAME, this.messageSource);
      if (logger.isDebugEnabled()) {
         logger.debug("Unable to locate MessageSource with name '" + MESSAGE_SOURCE_BEAN_NAME +
               "': using default [" + this.messageSource + "]");
      }
   }
}
```



initApplicationEventMulticaster() 方法 :

```java
/**
 * Initialize the ApplicationEventMulticaster.
 * Uses SimpleApplicationEventMulticaster if none defined in the context.
 * @see org.springframework.context.event.SimpleApplicationEventMulticaster
 */
protected void initApplicationEventMulticaster() {
// 获取 beanFactory:DefaultListableBeanFactory    
   ConfigurableListableBeanFactory beanFactory = getBeanFactory();
//如果beanFactory中包含APPLICATION_EVENT_MULTICASTER_BEAN_NAME,    
   if (beanFactory.containsLocalBean(APPLICATION_EVENT_MULTICASTER_BEAN_NAME)) {
 //从beanFactory中获取出bean,赋值给this.applicationEventMulticaster      
      this.applicationEventMulticaster =
            beanFactory.getBean(APPLICATION_EVENT_MULTICASTER_BEAN_NAME, ApplicationEventMulticaster.class);
// log 是 debug级别的话,就对进行log输出       
      if (logger.isDebugEnabled()) {
         logger.debug("Using ApplicationEventMulticaster [" + this.applicationEventMulticaster + "]");
      }
   }
   else {
// 如果beanFactory中不包含的话,就new 一个SimpleApplicationEventMulticaster,并且赋值给this.applicationEventMulticaster这个属性        
      this.applicationEventMulticaster = new SimpleApplicationEventMulticaster(beanFactory);
 //将上面new出来的,注册到beanFactory中去,也是主要放入bdMao中,还有一些beanName的List中.      
      beanFactory.registerSingleton(APPLICATION_EVENT_MULTICASTER_BEAN_NAME, this.applicationEventMulticaster);
 // 如果是debug级别的话,这里就会打印出来.      
      if (logger.isDebugEnabled()) {
         logger.debug("Unable to locate ApplicationEventMulticaster with name '" +
               APPLICATION_EVENT_MULTICASTER_BEAN_NAME +
               "': using default [" + this.applicationEventMulticaster + "]");
      }
   }
}
```





onRefresh(): 留给子类扩展的. 比如SpringBoot中,这里就会初始化一些SpringMvc的信息,然后new Tomcat()等.



regeisterListeners() 方法:

这个方法,目前在单纯的Spring中跑起来上面都没有,但是从名字上看的话,目测是对 Listeners进行注册到 beanFactory中去.

```java
/**
 * Add beans that implement ApplicationListener as listeners.
 * Doesn't affect other listeners, which can be added without being beans.
 */
protected void registerListeners() {
   // Register statically specified listeners first.
//     getApplicationListeners 方法返回的是空集合.
   for (ApplicationListener<?> listener : getApplicationListeners()) {
      getApplicationEventMulticaster().addApplicationListener(listener);
   }

   // Do not initialize FactoryBeans here: We need to leave all regular beans
   // uninitialized to let post-processors apply to them!
//  listenerBeanNames 返回的也是空数组
   String[] listenerBeanNames = getBeanNamesForType(ApplicationListener.class, true, false);
   for (String listenerBeanName : listenerBeanNames) {
      getApplicationEventMulticaster().addApplicationListenerBean(listenerBeanName);
   }

   // Publish early application events now that we finally have a multicaster...
   // 空的集合.这 
   Set<ApplicationEvent> earlyEventsToProcess = this.earlyApplicationEvents;
   this.earlyApplicationEvents = null;
   if (earlyEventsToProcess != null) {
      for (ApplicationEvent earlyEvent : earlyEventsToProcess) {
         getApplicationEventMulticaster().multicastEvent(earlyEvent);
      }
   }
}
```





finishBeanFactoryInitializarion() 方法 :

```java
/**
 * Finish the initialization of this context's bean factory,
 * initializing all remaining singleton beans.
 */
protected void finishBeanFactoryInitialization(ConfigurableListableBeanFactory beanFactory) {
   // Initialize conversion service for this context.
// 不包含的,也就不会走入到这个方法中.    
   if (beanFactory.containsBean(CONVERSION_SERVICE_BEAN_NAME) &&
         beanFactory.isTypeMatch(CONVERSION_SERVICE_BEAN_NAME, ConversionService.class)) {
      beanFactory.setConversionService(
            beanFactory.getBean(CONVERSION_SERVICE_BEAN_NAME, ConversionService.class));
   }

   // Register a default embedded value resolver if no bean post-processor
   // (such as a PropertyPlaceholderConfigurer bean) registered any before:
   // at this point, primarily for resolution in annotation attribute values.
   if (!beanFactory.hasEmbeddedValueResolver()) {
      beanFactory.addEmbeddedValueResolver(strVal -> getEnvironment().resolvePlaceholders(strVal));
   }

   // Initialize LoadTimeWeaverAware beans early to allow for registering their transformers early.
// 这里获取出来的 数组是空数组,所以下面的迭代自然也不会进去    
   String[] weaverAwareNames = beanFactory.getBeanNamesForType(LoadTimeWeaverAware.class,
         false, false);

   for (String weaverAwareName : weaverAwareNames) {
      getBean(weaverAwareName);
   }

   // Stop using the temporary ClassLoader for type matching.
   beanFactory.setTempClassLoader(null);

   // Allow for caching all bean definition metadata, not expecting further changes.
//这里面对一个参数设置为true,然后将beanName的集合转化为数组    
   beanFactory.freezeConfiguration();

   // Instantiate all remaining (non-lazy-init) singletons.
   beanFactory.preInstantiateSingletons();
}



// 这个方法是对bean进行实例化的.
	@Override
	public void preInstantiateSingletons() throws BeansException {
   // debug级别才会打印的log     
		if (logger.isDebugEnabled()) {
			logger.debug("Pre-instantiating singletons in " + this);
		}
		// Iterate over a copy to allow for init methods which in turn register new bean definitions.
		// While this may not be part of the regular factory bootstrap, it does otherwise work fine.
// 	相等于copy了一份beanDefinitionNames List,将数据全部放入到beanNames这个集合中   
		List<String> beanNames = new ArrayList<>(this.beanDefinitionNames);
//对上面的beanNames集合进行迭代.        
		// Trigger initialization of all non-lazy singleton beans...
		for (String beanName : beanNames) {
// org.springframework.beans.factory.support.AbstractBeanFactory 中mergedBeanDefinitions的Map是否已经有beanName了,Map<String, RootBeanDefinition> mergedBeanDefinitions,有的话这里就会返回bd回来.            
			RootBeanDefinition bd = getMergedLocalBeanDefinition(beanName);
// bd不是抽象的,是单例的,不是赖加载(赖加载是需要使用时才会去走的逻辑).            
			if (!bd.isAbstract() && bd.isSingleton() && !bd.isLazyInit()) {
				//  判断你这bd是不是实现了FactoryBean这个接口.这里我们定义的bean是没有实现这个接口的,所以也就不会走到这个if中来.
				if (isFactoryBean(beanName)) {

					Object bean = getBean(FACTORY_BEAN_PREFIX + beanName);
					if (bean instanceof FactoryBean) {
						final FactoryBean<?> factory = (FactoryBean<?>) bean;
						boolean isEagerInit;
						if (System.getSecurityManager() != null && factory instanceof SmartFactoryBean) {
							isEagerInit = AccessController.doPrivileged((PrivilegedAction<Boolean>)
											((SmartFactoryBean<?>) factory)::isEagerInit,
									getAccessControlContext());
						} else {
							isEagerInit = (factory instanceof SmartFactoryBean &&
									((SmartFactoryBean<?>) factory).isEagerInit());
						}if (isEagerInit) {
							getBean(beanName);
						}
					}
				} else {
                    // 获取bean,也就是创建bean的,需要一步一步往下走才可以看到很明白.
					getBean(beanName);
				}
			}
		}

		// Trigger post-initialization callback for all applicable beans...
// 迭代beanNames这个集合,        
		for (String beanName : beanNames) {
         // 根据beanName获取出一个单例实例.   
			Object singletonInstance = getSingleton(beanName);
          //如果单例实例是有是实现SmartInitializingSingleton这个接口的话,不管下面是if还是else,都会走到调用  afterSingletonsInstantiated 这个方法的逻辑代码,这里就走完了 preInstantiateSingletons 方法.  
			if (singletonInstance instanceof SmartInitializingSingleton) {
				final SmartInitializingSingleton smartSingleton = (SmartInitializingSingleton) singletonInstance;
				if (System.getSecurityManager() != null) {
					AccessController.doPrivileged((PrivilegedAction<Object>) () -> {
						smartSingleton.afterSingletonsInstantiated();
						return null;
					}, getAccessControlContext());
				} else {
					smartSingleton.afterSingletonsInstantiated();
				}
			}

		}

	}
```



doGetBean() 方法,do开头才是真正做事的方法.

走完这个方法,基本一个bean的创建就走完了.可以看出来,这其中的逻辑还是很复杂的.做了各种BeanPostPrcoessor进行扩展,中间还走了一个Aware的接口判断,估摸着也是进行扩展的逻辑.

```java
/**
 * Return an instance, which may be shared or independent, of the specified bean.
 * @param name the name of the bean to retrieve
 * @param requiredType the required type of the bean to retrieve
 * @param args arguments to use when creating a bean instance using explicit arguments
 * (only applied when creating a new instance as opposed to retrieving an existing one)
 * @param typeCheckOnly whether the instance is obtained for a type check,
 * not for actual use
 * @return an instance of the bean
 * @throws BeansException if the bean could not be created
 */
@SuppressWarnings("unchecked")
protected <T> T doGetBean(final String name, @Nullable final Class<T> requiredType,
      @Nullable final Object[] args, boolean typeCheckOnly) throws BeansException {

   // 先对beanName进行处理,比如有别名或者首字母大写转小写	 
   final String beanName = transformedBeanName(name);
   Object bean;

   // Eagerly check singleton cache for manually registered singletons.
// 这里根据beanName从 org.springframework.beans.factory.support.DefaultSingletonBeanRegistry 中获取Object,在之前初始化的时候,是有注册到这个类的 singletonObjects(Map)中来    
   Object sharedInstance = getSingleton(beanName);
   if (sharedInstance != null && args == null) {
      /*if (logger.isDebugEnabled()) {
         if (isSingletonCurrentlyInCreation(beanName)) {
            logger.debug("Returning eagerly cached instance of singleton bean '" + beanName +
                  "' that is not fully initialized yet - a consequence of a circular reference");
         } else {
            logger.debug("Returning cached instance of singleton bean '" + beanName + "'");
         }
      }*/
// 这个方放,由于bean没有实现FactoryBean这个接口,所以这里就直接返回了sharedInstance这个Object回来.       
      bean = getObjectForBeanInstance(sharedInstance, name, beanName, null);
   } else {
      // Fail if we're already creating this bean instance:
      // We're assumably within a circular reference.
      if (isPrototypeCurrentlyInCreation(beanName)) {
         throw new BeanCurrentlyInCreationException(beanName);
      }

      // Check if bean definition exists in this factory.
  // 返回的值是null.所以下面的if自然也不会进入的     
      BeanFactory parentBeanFactory = getParentBeanFactory();
      if (parentBeanFactory != null && !containsBeanDefinition(beanName)) {
         // Not found -> check parent.
         String nameToLookup = originalBeanName(name);
         if (parentBeanFactory instanceof AbstractBeanFactory) {
            return ((AbstractBeanFactory) parentBeanFactory).doGetBean(
                  nameToLookup, requiredType, args, typeCheckOnly);
         } else if (args != null) {
            // Delegation to parent with explicit args.
            return (T) parentBeanFactory.getBean(nameToLookup, args);
         } else {
            // No args -> delegate to standard getBean method.
            return parentBeanFactory.getBean(nameToLookup, requiredType);
         }
      }

      if (!typeCheckOnly) {
          // 堆bean进行一个mark标记
         markBeanAsCreated(beanName);
      }

      try {
// 从DefaultListableBeanFactory中的beanDefinitionMap中根据beanName获取出bd.          
         final RootBeanDefinition mbd = getMergedLocalBeanDefinition(beanName);
// 对bd进行检查,如果是抽象类的话,这里就会抛出异常来.          
         checkMergedBeanDefinition(mbd, beanName, args);

         // Guarantee initialization of beans that the current bean depends on.
    // 没有使用dependsOn这个注解,所以这里的值也就自然是null了      
         String[] dependsOn = mbd.getDependsOn();
         if (dependsOn != null) {
            for (String dep : dependsOn) {
               if (isDependent(beanName, dep)) {
                  throw new BeanCreationException(mbd.getResourceDescription(), beanName,
                        "Circular depends-on relationship between '" + beanName + "' and '" + dep + "'");
               }
               registerDependentBean(dep, beanName);
               try {
                  getBean(dep);
               } catch (NoSuchBeanDefinitionException ex) {
                  throw new BeanCreationException(mbd.getResourceDescription(), beanName,
                        "'" + beanName + "' depends on missing bean '" + dep + "'", ex);
               }
            }
         }

         // Create bean instance. 是单例就进来if中来
         if (mbd.isSingleton()) {
// 走完 createBean方法,就会走getSingleton方法,会对传入进来的beanName进行非null的判断.然后利用this.singletonObjects来进行加锁,Object singletonObject = this.singletonObjects.get(beanName);中获取出来Object(也就是bean对象),beforeSingletonCreation会进行检验,如果inCreationCheckExclusions是包含这个beanName或者singletonsCurrentlyInCreation停驾失败了的,就会抛出一个BeanCurrentlyInCreationException异常来.从singletonFactory也就是传入进来的参数中,调用getObject方法,返回Object. afterSingletonCreation()方法会继续检验下.addSingleton()方法将bean的信息给添加到 this.singletonObjects,this.registeredSingletons,前者Map,后者list的集合中去.最后返回  singletonFactory.getObject()方法的Object即可.   
            sharedInstance = getSingleton(beanName, () -> {
               try {
                  return createBean(beanName, mbd, args);
               }
               catch (BeansException ex) {
                  // Explicitly remove instance from singleton cache: It might have been put there
                  // eagerly by the creation process, to allow for circular reference resolution.
                  // Also remove any beans that received a temporary reference to the bean.
                  destroySingleton(beanName);
                  throw ex;
               }
            });
// 从private final NamedThreadLocal<String> currentlyCreatedBean = new NamedThreadLocal<>("Currently created bean");中获取当前bean,NamedThreadLocal是有继承ThreadLocal,ThreadLocal是与当前线程有关得一个存储的,是线程安全的,每个线程都可以使用一个或者多个ThreadLocal来进行存储数据.最后返回的bean赋值给bean。         
            bean = getObjectForBeanInstance(sharedInstance, name, beanName, mbd);
         } else if (mbd.isPrototype()) {
             //这个是多列的
            // It's a prototype -> create a new instance.
            Object prototypeInstance = null;
            try {
               beforePrototypeCreation(beanName);
               prototypeInstance = createBean(beanName, mbd, args);
            }
            finally {
               afterPrototypeCreation(beanName);
            }
            bean = getObjectForBeanInstance(prototypeInstance, name, beanName, mbd);
         } else {
             // 既不是单例也不是多例的
            String scopeName = mbd.getScope();
            final Scope scope = this.scopes.get(scopeName);
            if (scope == null) {
               throw new IllegalStateException("No Scope registered for scope name '" + scopeName + "'");
            }
            try {
               Object scopedInstance = scope.get(beanName, () -> {
                  beforePrototypeCreation(beanName);
                  try {
                     return createBean(beanName, mbd, args);
                  }
                  finally {
                     afterPrototypeCreation(beanName);
                  }
               });
               bean = getObjectForBeanInstance(scopedInstance, name, beanName, mbd);
            } catch (IllegalStateException ex) {
               throw new BeanCreationException(beanName,
                     "Scope '" + scopeName + "' is not active for the current thread; consider " +
                     "defining a scoped proxy for this bean if you intend to refer to it from a singleton",
                     ex);
            }
         }
      } catch (BeansException ex) {
         cleanupAfterBeanCreationFailure(beanName);
         throw ex;
      }
   }

   // Check if required type matches the type of the actual bean instance.
// 这里由于 requiredType 是null,所以就不会进入到代码中  
   if (requiredType != null && !requiredType.isInstance(bean)) {
      try {
         T convertedBean = getTypeConverter().convertIfNecessary(bean, requiredType);
         if (convertedBean == null) {
            throw new BeanNotOfRequiredTypeException(name, requiredType, bean.getClass());
         }
         return convertedBean;
      }
      catch (TypeMismatchException ex) {
         if (logger.isDebugEnabled()) {
            logger.debug("Failed to convert bean '" + name + "' to required type '" +
                  ClassUtils.getQualifiedName(requiredType) + "'", ex);
         }
         throw new BeanNotOfRequiredTypeException(name, requiredType, bean.getClass());
      }
   }
    // 最后返回这个bean
   return (T) bean;
}
```



doCreateBean() 方法:

可以看到这个是真正的create bean的方法.

```java
/**
 * Actually create the specified bean. Pre-creation processing has already happened
 * at this point, e.g. checking {@code postProcessBeforeInstantiation} callbacks.
 * <p>Differentiates between default bean instantiation, use of a
 * factory method, and autowiring a constructor.
 * @param beanName the name of the bean
 * @param mbd the merged bean definition for the bean
 * @param args explicit arguments to use for constructor or factory method invocation
 * @return a new instance of the bean
 * @throws BeanCreationException if the bean could not be created
 * @see #instantiateBean
 * @see #instantiateUsingFactoryMethod
 * @see #autowireConstructor
 */
protected Object doCreateBean(final String beanName, final RootBeanDefinition mbd, final @Nullable Object[] args)
      throws BeanCreationException {

   // Instantiate the bean.
   BeanWrapper instanceWrapper = null;
  // 再次判断mdb是不是单例的,是单例的化,就从factoryBeanInstanceCache(Map)中remove走.	  
   if (mbd.isSingleton()) {
      instanceWrapper = this.factoryBeanInstanceCache.remove(beanName);
   }
   if (instanceWrapper == null) {
      /**
       * 创建一个bean实例. 最后创建了一个bean的包装类回来.
       */
      instanceWrapper = createBeanInstance(beanName, mbd, args);
   }
   // 从上面的 instanceWrapper调用getWrappedClass()方法返回bean
   final Object bean = instanceWrapper.getWrappedInstance();
   // 返回bean的type,其实也就是bean的类信息 
   Class<?> beanType = instanceWrapper.getWrappedClass();
   if (beanType != NullBean.class) {
      // 满足条件将上面的beanType赋值给resolvedTargetType的值 = beanType 
      mbd.resolvedTargetType = beanType;
   }

   // Allow post-processors to modify the merged bean definition.
  // 利用 mbd的postProcessingLock 参数来进行加锁.
   synchronized (mbd.postProcessingLock) {
      if (!mbd.postProcessed) {
         try {
            // TODO 第三次调用后置处理器调用
            // 这个方法apply开头的,可以看到是对什么东西进行应用.
//点进去,org.springframework.beans.factory.support.AbstractBeanFactory中获取beanPostProcessors集合的值,也就是beanPostProcessors的集合值,迭代,如果是有实现 MergedBeanDefinitionPostProcessor 这个接口的化,就会进行强转,然后调用postProcessMergedBeanDefinition方法,这也是这个接口提供的方法.         
            applyMergedBeanDefinitionPostProcessors(mbd, beanType, beanName);
         } catch (Throwable ex) {
            throw new BeanCreationException(mbd.getResourceDescription(), beanName,
                  "Post-processing of merged bean definition failed", ex);
         }
         mbd.postProcessed = true;
      }
   }

   // Eagerly cache singletons to be able to resolve circular references
   // even when triggered by lifecycle interfaces like BeanFactoryAware.
// earlySingletonExposure是ture,也就是说是单例的    
   boolean earlySingletonExposure = (mbd.isSingleton() && this.allowCircularReferences &&
         isSingletonCurrentlyInCreation(beanName));
   if (earlySingletonExposure) {
      if (logger.isDebugEnabled()) {
         logger.debug("Eagerly caching bean '" + beanName +
               "' to allow for resolving potential circular references");
      }
      // TODO 第四次调用后置处理器
// getEarlyBeanReference() 方法,也是调用getBeanPostProcessors()方法,获取返回的beanPostProcessor集合,迭代这个集合,如何是SmartInstantiationAwareBeanPostProcessor,就会进行强转,然后调用getEarlyBeanReference,如果是实现SmartInstantiationAwareBeanPostProcessor这个接口的话,是可以实现这个方法的,也是可以不是实现这个方法,因为有default来修饰
      addSingletonFactory(beanName, () -> getEarlyBeanReference(beanName, mbd, bean));
   }

   // Initialize the bean instance.
   Object exposedObject = bean;
   try {
      // TODO 第五次调用后置处理器 ; 第六次.  后置处理器调用了二个
// 构建bean,内部也是调用getBeanPostProcessors方法,获取出一个BeanPostProcessors的集合,然后迭代这个集合,如果是InstantiationAwareBeanPostProcessor,也就是说有实现这个接口,就会调用postProcessAfterInstantiation方法,当然这个方法也是不一定要重写的,因为方法是有default来修饰的,默认时返回的true.如何返回的是false的话,就会直接跳出这个方法.       
//如果是有Init方法,其内部的hasInstAwareBpps就是true,这个时候就会继续调用getBeanProcessores方法,迭代其集合,如果beanPostProcessor是InstantiationAwareBeanPostProcessor的话,就会进行强转,调用postProcessPropertyValues方法,如果返回的null的话,就会跳出这个方法.这个方法在接口中也是有默认值的,不是强制要一定实现的.   
      populateBean(beanName, mbd, instanceWrapper);

      // TODO 第七次后置处理器执行 ; 和 第八次. 后置处理器调用了二个
// 这个方法从名字上看,是实例化bean. invokeAwareMethods()方法中,如果bean是Aware接口的子类.然后判断是不是BeanNameAware这个接口,如果是这个接口的子类的话,就会强转调用setBeanName方法.如果是BeanClassLoaderAware子类的话,会先调用当前类的getBeanClassLoader方法,然后调用bean的setBeanClassLoader方法,传入bcl,也就是getBeanClassLoader获取出来的ClassLoader.如果是BeanFactoryAware的话,强转调用setBeanFactory方法,传入AbstractAutowireCapableBeanFactory.this    //接着会走applyBeanPostProcessorsBeforeInitialization方法,这就是调用beanPostProcessor方法。先获取出getBeanProcessors()方法,获取出beanProcessors的集合,然后迭代,每个都会调用postProcessBeforeInitialization()方法,返回回来的Object,如果object的值是null的话,就会直接return。如果不是null的话,就会返回最后一个处理的结果. 
//再走invokeInitMethods方法,如果bean是有实现InitializingBean的话,就会强转调用afterPropertiesSet()方法.       
//继续走applyBeanPostProcessorsAfterInitialization()方法,获取出来的beanPostProcessors进行迭代,直接调用BeanPostProcessor的postProcessAfterInitialization方法,如何返回的值是null的话,就return掉这个方法,否则就是返回最后一个.最后返回的值,也就是 exposedObject 了.       
      exposedObject = initializeBean(beanName, exposedObject, mbd);
   } catch (Throwable ex) {
      if (ex instanceof BeanCreationException && beanName.equals(((BeanCreationException) ex).getBeanName())) {
         throw (BeanCreationException) ex;
      }
      else {
         throw new BeanCreationException(mbd.getResourceDescription(), beanName, "Initialization of bean failed", ex);
      }
   }

// earlySingletonExposure 的值是true,     
   if (earlySingletonExposure) {
     //earlySingletonReference的值是null,所以也就不会走下面的if中去.
      Object earlySingletonReference = getSingleton(beanName, false);
      if (earlySingletonReference != null) {
         if (exposedObject == bean) {
            exposedObject = earlySingletonReference;
         } else if (!this.allowRawInjectionDespiteWrapping && hasDependentBean(beanName)) {
            String[] dependentBeans = getDependentBeans(beanName);
            Set<String> actualDependentBeans = new LinkedHashSet<>(dependentBeans.length);
            for (String dependentBean : dependentBeans) {
               if (!removeSingletonIfCreatedForTypeCheckOnly(dependentBean)) {
                  actualDependentBeans.add(dependentBean);
               }
            }
            if (!actualDependentBeans.isEmpty()) {
               throw new BeanCurrentlyInCreationException(beanName,
                     "Bean with name '" + beanName + "' has been injected into other beans [" +
                     StringUtils.collectionToCommaDelimitedString(actualDependentBeans) +
                     "] in its raw version as part of a circular reference, but has eventually been " +
                     "wrapped. This means that said other beans do not use the final version of the " +
                     "bean. This is often the result of over-eager type matching - consider using " +
                     "'getBeanNamesOfType' with the 'allowEagerInit' flag turned off, for example.");
            }
         }
      }
   }

   // Register bean as disposable.
   try {
//从这个名字上看,如果有必要的话,就会注销到这个bean.       
      registerDisposableBeanIfNecessary(beanName, bean, mbd);
   } catch (BeanDefinitionValidationException ex) {
      throw new BeanCreationException(mbd.getResourceDescription(), beanName, "Invalid destruction signature", ex);
   }
  // 走到这里,这个方法就已经走完了.  
   return exposedObject;
}
```





finishRefresh()  : 从这个名字上看,是结束后刷新.

```java
/**
 * Finish the refresh of this context, invoking the LifecycleProcessor's
 * onRefresh() method and publishing the
 * {@link org.springframework.context.event.ContextRefreshedEvent}.
 */
protected void finishRefresh() {
   // Clear context-level resource caches (such as ASM metadata from scanning).
//清除Reource缓存.org.springframework.core.io.DefaultResourceLoader#clearResourceCaches,也就是走到了这个类里面的这个方法进行清除.    
   clearResourceCaches();

   // Initialize lifecycle processor for this context.
// org.springframework.context.support.AbstractApplicationContext#initLifecycleProcessor,先获取出BeanFactory,如果beanFactory中包含LIFECYCLE_PROCESSOR_BEAN_NAME,就根据LIFECYCLE_PROCESSOR_BEAN_NAME和LifecycleProcessor.class获取出这个bean,并且赋值给this.lifecycleProcessor.  如果beanFactory中是不包含的话,就会new DefaultLifecycleProcessor一个出来,然后调用setBeanFactory方法,给beanFactory赋值进去,this.lifecycleProcessor = defaultProcessor;最后在调用beanFactory.registerSingleton来将这个bean给注册进去.    
   initLifecycleProcessor();

   // Propagate refresh to lifecycle processor first.
//获取出 initLifecycleProcessor 这步骤的lifecycleProcessor,然后调用其 onRefresh 方法.
// onRefresh()方法,startBeans(true)中的集合都是空集合,所以并没有做什么具体的事情.this.running = true;    
   getLifecycleProcessor().onRefresh();

   // Publish the final event.
// 先new一个ContextRefreshedEvent事件出来,可以发现的是,构造函数中是调用了super(source)方法,也就是一直调用到了ApplicationEvent这个类中.
// publishEvent方法:先对传入进入的event进行非空的判断.然后判断是不是 ApplicationEvent,如果是的话,就强转为ApplicationEvent,否则就会new一个PayloadApplicationEvent出来,eventTyp是null的话,就会调用getResolvableType()方法获取eventType. this.earlyApplicationEvents 是null,然后就使用this.applicationEventMulticaster.再接着走 multicastEvent 方法,由于这个里面是没什么listners的,所以是没有具体做什么事情的.    
   publishEvent(new ContextRefreshedEvent(this));

   // Participate in LiveBeansView MBean, if active.
// String mbeanDomain = applicationContext.getEnvironment().getProperty(MBEAN_DOMAIN_PROPERTY_NAME);返回的mbeanDomain如果不是null的话,才会往里面走.是null的话,也就不会往里面走了.    
   LiveBeansView.registerApplicationContext(this);
}
```





resetCommonCaches() 方法:

这个方法可以看大是对一个工具类使用的集合进行clear.如果不清除的话,其中有些是再初始化后用不上的,就会浪费内存.

```
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