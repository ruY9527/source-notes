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