## 		SpringBoot中BeanPostProcessor



####  题记

​	BeanPostProcessor 是在Spring中实例化bean的时候使用到的,也是对bean的一种扩展. 理解好 BeanPostProcessor是对理解好 bean 的初始化是很重要的. 每种BeanPostProcessor都有各自不同的用途.

  看下 BeanPostProcessor 这个接口,是只有 postProcessBeforeInitialization 和 postProcessAfterInitialization 这二种方法的,并且都是用 default来进行修饰,也就是实现这个接口的时候,可以实现其方法,也可以不用实现其方法的,这就是接口上的方法使用 default 来进行修饰的情况.



ApplicationContextAwareProcessor

WebApplicationContextServletContextAwareProcessor

ConfigurationClassPostProcessor.ImportAwareBeanPostProcessor (内部类)

PostProcessorRegistrationDelegate.BeanPostProcessorChecker(内部类)

ConfigurationPropertiesBindingPostProcessor

WebServerFactoryCustomizerBeanPostProcessor

ErrorPageRegistrarBeanPostProcessor

CommonAnnotationBeanPostProcessor

AutowiredAnnotationBeanPostProcessor

ApplicationListenerDetector



如果没有对 SpringBoot 中的beanPostProcessor 进行扩展什么的话, 那么当你创建bean的时候,应该是十个的样子(当然了,这是基于目前的版本的).

如果你看看这十个 beanPostProcessor,其中有的是直接继承 BeanPostProcessor, 有的是 集成其BeanPostProceesor的子类,但是最顶层的话,就是BeanPostProcessor.  需要结合 doCreateBean这个方法一起看了,当其创建一个 bean 的时候, 是怎么使用这些 beanPostProcessor进行扩展的.



####  beanPostProcessor 添加

 AbstractBeanFactory#beanPostProcessors 可以看到beanFactory中的beanPostProcessors属性字段,该字段就是对BeanPostProcessor进行存储的集合.

在 refresh() 方法中进行添加 beanPostProcessor进来的	 可以看到主要添加 beanPostProcessor进来的地方是 registerBeanPostProcessors 方法.  可以看到这里是添加了 十二个.

- ​	走完 prepareBeanFactory方法:  添加了 ApplicationContextAwareProceesor和ApplicationListenerDetector

-  postProcessBeanFactory 走完 : 添加 WebApplicationContextServletContextAwareProceesor

- invokeBeanFactoryPostProcessors 走完: 添加 ConfigurationClassPostProcessor$ImportAwareBeanPostProcessor 进来

-  registerBeanPostProcessors 走完 :  PostProcessorRegisrationDelegate$BeanPostProceesorChecker/ConfigurationPropertiesBindingPostProcessor/AsyncAnnotationBeanPostProcessor/WebServerFactoryCustomizerBeanPostProcessor/ErrorPageRegistrarBeanPostProcessor/CommonAnnotationBeanPostProcessor/ScheduleAnnotationBeanPostProcessor/ApplicationListenerDetector

  

#### ApplicationContextAwareProcessor

 该Processor的针对性还是比较强的,主要就是处理 EnvironmentAware/EmbeddedValueResolverAware/ResourceLoaderAware/ApplicationEventPublisherAware/MessageSourceAware/ApplicationContextAware  这几种情况的

```java
	@Override
	@Nullable
	public Object postProcessBeforeInitialization(Object bean, String beanName) throws BeansException {
// bean 如果不是下面的几种的话,就直接返回. 这也就说明,该processor是只处理下面的
// 是在初始化bean 之前        
		if (!(bean instanceof EnvironmentAware || bean instanceof EmbeddedValueResolverAware ||
				bean instanceof ResourceLoaderAware || bean instanceof ApplicationEventPublisherAware ||
				bean instanceof MessageSourceAware || bean instanceof ApplicationContextAware)){
			return bean;
		}
		AccessControlContext acc = null;
		if (System.getSecurityManager() != null) {
			acc = this.applicationContext.getBeanFactory().getAccessControlContext();
		}
		if (acc != null) {
			AccessController.doPrivileged((PrivilegedAction<Object>) () -> {
				invokeAwareInterfaces(bean);
				return null;
			}, acc);
		}
		else {
 // 该方法对bean进行判断,
 //分别处理:EnvironmentAware/EmbeddedValueResolverAware/ResourceLoaderAware
 // ApplicationEventPublisherAware/MessageSourceAware/ApplicationContextAware
 //这六种情况,可以看到要不就是往bean中设置application,要么就是设置embeddedValueResolver,再不然就是Environment           
			invokeAwareInterfaces(bean);
		}
		return bean;
	}
```



#### WebApplicationContextServletContextAwareProcessor

 该类继承了org.springframework.web.context.support.ServletContextAwareProcessor,先看其父类重写PostProcessor的方法.

 可以看到这个 Processor 主要就是处理 web 环境的.  也就是在有web环境的情况下, 对 bean 是 ServletContextAware和ServletConfigAware的进行处理.

```java
	@Override
	public Object postProcessBeforeInitialization(Object bean, String beanName) throws BeansException {
        //getServletContext()方法,先从servletContext中拿,没有从servletConfig中拿,如果都没有的话,那返回的就应该是null了.
 // bean是   ServletContextAware 或者 ServletConfigAware 才会进行处理.    
 //如果bean是ServletContextAware的话,就将servletContext设置到ServletContextAware中去       
		if (getServletContext() != null && bean instanceof ServletContextAware) {
			((ServletContextAware) bean).setServletContext(getServletContext());
		}
// 如果 bean 是servletConfig的话,就会将this.servletConfig给设置到 ServletConfigAware中去       
		if (getServletConfig() != null && bean instanceof ServletConfigAware) {
			((ServletConfigAware) bean).setServletConfig(getServletConfig());
		}
		return bean;
	}

// 没有对 bean 进行处理,直接返回了.
	@Override
	public Object postProcessAfterInitialization(Object bean, String beanName) {
		return bean;
	}
```



#### ImportAwareBeanPostProcessor



ImportAwareBeanPostProcessor  --> InstantiationAwareBeanPostProcessorAdapter  --> SmartInstantiationAwareBeanPostProcessor ---> SmartInstantiationAwareBeanPostProcessor --> InstantiationAwareBeanPostProcessor ---> BeanPostProcessor

 可以看到, 该 BeanPostProcessor 其上面的接口和类还是蛮多的.  从该 postProcessor的名字上看,其要做的功能还是很好晓得的,那就是做关于 @Import 这些相关的.

TODO : 后续 debug 进行跟进看

```java
		@Override
		public PropertyValues postProcessProperties(@Nullable PropertyValues pvs, Object bean, String beanName) {
			// Inject the BeanFactory before AutowiredAnnotationBeanPostProcessor's
			// postProcessProperties method attempts to autowire other configuration beans.
			if (bean instanceof EnhancedConfiguration) {
				((EnhancedConfiguration) bean).setBeanFactory(this.beanFactory);
			}
			return pvs;
		}

		@Override
		public Object postProcessBeforeInitialization(Object bean, String beanName) {
			if (bean instanceof ImportAware) {
				ImportRegistry ir = this.beanFactory.getBean(IMPORT_REGISTRY_BEAN_NAME, ImportRegistry.class);
				AnnotationMetadata importingClass = ir.getImportingClassFor(ClassUtils.getUserClass(bean).getName());
				if (importingClass != null) {
					((ImportAware) bean).setImportMetadata(importingClass);
				}
			}
			return bean;
		}
	}
```



#### BeanPostProcessorChecker

  该 PostProcessor 是直接继承 BeanPostProcessor 的,  所以看这二个重写的方法即可.

  可以看到该 BeanPostProcessor是对初始化完了后进行检查,如果满足条件的话,就会打印一句log出来. log里面的主要内容就是,不符合自动代理的条件.

```java
	 // 实例化之前是没任何特殊的处理,直接返回	
        @Override
		public Object postProcessBeforeInitialization(Object bean, String beanName) {
			return bean;
		}

		@Override
		public Object postProcessAfterInitialization(Object bean, String beanName) {
 // bean 不是 BeanPostProcessor 并且根据beanFactory中包含这个beanName,从beanFactory中获取出bd,并且判断bd的 role 级别是不是 2,如果是的话,isInfrastructureBean返回的就是true，否则就返回false.
//最后beanFactory的 beanPostProcessor是小于beanPostProcessorTargetCount的话,就会打印log       
			if (!(bean instanceof BeanPostProcessor) && !isInfrastructureBean(beanName) &&
					this.beanFactory.getBeanPostProcessorCount() < this.beanPostProcessorTargetCount) {
				if (logger.isInfoEnabled()) {
					logger.info("Bean '" + beanName + "' of type [" + bean.getClass().getName() +
							"] is not eligible for getting processed by all BeanPostProcessors " +
							"(for example: not eligible for auto-proxying)");
				}
			}
			return bean;
		}
```



#### ConfigurationPropertiesBindingPostProcessor

 

 该PostProcessor是直接实现了BeanPostProcessor 接口的,  但是该类也实现了ApplicationContextAware和InitializingBean这二个方法的.  ApplicationContextAware 是提供application的,  InitializingBean 方法是在初始完该bean后,调用afterPropertiesSet进行回调的



```java
	//只重写了postProcessBeforeInitialization方法
	@Override
	public Object postProcessBeforeInitialization(Object bean, String beanName) throws BeansException {
 // bind方法:ConfigurationPropertiesBinder#bind,
 // TODO : bind方法的用途       
		bind(ConfigurationPropertiesBean.get(this.applicationContext, bean, beanName));
		return bean;
	}

---------------------------------
// ConfigurationPropertiesBean 类    
	public static ConfigurationPropertiesBean get(ApplicationContext applicationContext, Object bean, String beanName) {
       // 获取 Method
		Method factoryMethod = findFactoryMethod(applicationContext, beanName);
// create方法: 先找 ConfigurationProperties 注解,如果是null的话,就直接返回.
// 如果不是null的话,就继续找Validated这个注解的,
//根据Validated是否有这个注解分为:{ annotation, validated }/{ annotation }这二种数组
//如果factoryMethod不是null的话,就直接获取其返回值.
//否则就是bean.getClass获取出ResolvableType来    
 //最后new一个ConfigurationPropertiesBean出来,直接return出去.   
		return create(beanName, bean, bean.getClass(), factoryMethod);
	}    


	private static Method findFactoryMethod(ApplicationContext applicationContext, String beanName) {
  // 先对 applicationContext的类型进行判断      
		if (applicationContext instanceof ConfigurableApplicationContext) {
			return findFactoryMethod((ConfigurableApplicationContext) applicationContext, beanName);
		}
		return null;
	}


	private static Method findFactoryMethod(ConfigurableListableBeanFactory beanFactory, String beanName) {
        // beanFactory中如果包含这个beanName
		if (beanFactory.containsBeanDefinition(beanName)) {
  // 从 beanFactory 中根据beanName获取出bd来.          
			BeanDefinition beanDefinition = beanFactory.getMergedBeanDefinition(beanName);
        // 如果bd是 RootBeanDefinition    
			if (beanDefinition instanceof RootBeanDefinition) {
           // 调用 bd 获取出Method 对应的 object     
				Method resolvedFactoryMethod = ((RootBeanDefinition) beanDefinition).getResolvedFactoryMethod();
                // 获取出来的方法如果不是null的话,就直接返回
				if (resolvedFactoryMethod != null) {
					return resolvedFactoryMethod;
				}
			}
    // 从方法的名字上看就是:通过反射获取出方法        
			return findFactoryMethodUsingReflection(beanFactory, beanDefinition);
		}
		return null;
	}



	private static Method findFactoryMethodUsingReflection(ConfigurableListableBeanFactory beanFactory,
			BeanDefinition beanDefinition) {
      // 获取方法名字  
		String factoryMethodName = beanDefinition.getFactoryMethodName();
      // 获取bean名字  
		String factoryBeanName = beanDefinition.getFactoryBeanName();
      // 如果二者都是null的话,就直接返回null 
		if (factoryMethodName == null || factoryBeanName == null) {
			return null;
		}
        // 根据 factoryBeanName 从beanFactory中获取出Class来
		Class<?> factoryType = beanFactory.getType(factoryBeanName);
        //如果class的名字是包含$$的话,就调用super来获取其父类的
		if (factoryType.getName().contains(ClassUtils.CGLIB_CLASS_SEPARATOR)) {
			factoryType = factoryType.getSuperclass();
		}
		AtomicReference<Method> factoryMethod = new AtomicReference<>();
		ReflectionUtils.doWithMethods(factoryType, (method) -> {
            // 如果method的名字和 factoryMethodName的值是一样的话,就添加到factoryMethod中
			if (method.getName().equals(factoryMethodName)) {
				factoryMethod.set(method);
			}
		});
        // 从factoryMethod中获取出来
		return factoryMethod.get();
	}
```



#### WebServerFactoryCustomizerBeanPostProcessor

  

  该 PostProcessor 是有实现	BeanFactoryAware 的,实现该接口是可以获取到 beanFactory的. 然后 赋值给其自身的参数. 也就是说该类是有一个 beanFactory的.

​    可以看到该 postProcessor 主要处理 bean 是 WebServerFactory的

```java
	@Override
	public Object postProcessBeforeInitialization(Object bean, String beanName) throws BeansException {
       // 只处理 bean 是 WebServerFactory  
		if (bean instanceof WebServerFactory) {
            // TODO
			postProcessBeforeInitialization((WebServerFactory) bean);
		}
		return bean;
	}

	@Override
	public Object postProcessAfterInitialization(Object bean, String beanName) throws BeansException {
		return bean;
	}
```





#### ErrorPageRegistrarBeanPostProcessor

 该 PostProcessor 也是实现了 BeanFactoryAware 接口的,所以其内部也是有一个 ListableBeanFactory 的.

 可以看到该 PostProcessor 主要就是 设置 ErrorPage 的.	

```java
	@Override
	public Object postProcessBeforeInitialization(Object bean, String beanName) throws BeansException {
        // bean 是 ErrorPageRegistry就处理 
		if (bean instanceof ErrorPageRegistry) {
// 该类内部维护了List<ErrorPageRegistrar> registrars
// 该方法先判断 registrars 是不是有值,如果没有的话,就从beanFactory中获取,
// 根据 ErrorPageRegistrar.class 来获取, 排序 ,最后赋值给 自己定义的 registrars 
// 然后迭代 registrars 这个集合并且调用其registerErrorPages方法,传入进去的是registry 
 /**  ErrorPageRegistrar 的 子类就是:ErrorPageCustomizer(ErrorMvcAutoConfiguration.ErrorPageCustomizer),可以看到这个类的registerErrorPages方法就是new了一个ErrorPage,然后给添加到ErrorPageRegistry中去,
 类:ErrorPageCustomizer也是在 ErrorMvcAutoConfiguration 
    这个类通过 @Bean 注解注入到Spring中.
 */           
			postProcessBeforeInitialization((ErrorPageRegistry) bean);
		}
		return bean;
	}

	@Override
	public Object postProcessAfterInitialization(Object bean, String beanName) throws BeansException {
		return bean;
	}
```



#### CommonAnnotationBeanPostProcessor

​	 该类继承了 InitDestroyAnnotationBeanPostProcessor , 实现了InstantiationAwareBeanPostProcessor/BeanFactoryAware 接口, 

​    实现了 BeanFactoryAware 接口,就是相当于获取到了  beanFactory,可以看到下面的setBeanFactory方法.

​	该PostProcessor 主要是处理一些 @Resource注解,其父类处理@PostConstruct和@PreDestroy注解修饰的方法.

```java
	@Override
	public void setBeanFactory(BeanFactory beanFactory) {
        // 也是对 beanFactory进行了不为null的判断
		Assert.notNull(beanFactory, "BeanFactory must not be null");
        // 赋值给 beanFactory
		this.beanFactory = beanFactory;
        // 如果 resourceFactory 是 null的话,就给beanFactory 赋值给他
		if (this.resourceFactory == null) {
			this.resourceFactory = beanFactory;
		}
        // beanFactory是ConfigurableBeanFactory的话,就new一个EmbeddedValueResolver
        // 然后new出来的给赋值给embeddedValueResolver
		if (beanFactory instanceof ConfigurableBeanFactory) {
			this.embeddedValueResolver = new EmbeddedValueResolver((ConfigurableBeanFactory) beanFactory);
		}
	}		

-----------------------------------

	@Override
	public void postProcessMergedBeanDefinition(RootBeanDefinition beanDefinition, Class<?> beanType, String beanName) {
       // 调用父类的方法,也就是InitDestroyAnnotationBeanPostProcessor
	  //  父类的该方法: 找出有被@PostConstruct和@PreDestroy注解修饰的方法	    
		super.postProcessMergedBeanDefinition(beanDefinition, beanType, beanName);
    // 这里也是找被@Resource注解修饰的
		InjectionMetadata metadata = findResourceMetadata(beanName, beanType, null);
		metadata.checkConfigMembers(beanDefinition);
	}


-------------------------------------------
// 处理 @Resource 注解的    
	@Override
	public PropertyValues postProcessProperties(PropertyValues pvs, Object bean, String beanName) {
    // 找到bean中有被@Resource修饰的属性和方法.
		InjectionMetadata metadata = findResourceMetadata(beanName, bean.getClass(), pvs);
		try {
            // 有的话,就注入到 bean 中来.
			metadata.inject(bean, beanName, pvs);
		}
		catch (Throwable ex) {
			throw new BeanCreationException(beanName, "Injection of resource dependencies failed", ex);
		}
		return pvs;
	}
```



 其父类 InitDestroyAnnotationBeanPostProcessor



```java
	// 该方法是直接实现了 BeanPostProcessor 中的方法
	@Override
	public Object postProcessBeforeInitialization(Object bean, String beanName) throws BeansException {
		LifecycleMetadata metadata = findLifecycleMetadata(bean.getClass());
		try {
            // 可以看到 invoke init methods 方法,也就是直接init方法.
            // 被@PostConstruct注解修饰的方法
			metadata.invokeInitMethods(bean, beanName);
		}
		catch (InvocationTargetException ex) {
			throw new BeanCreationException(beanName, "Invocation of init method failed", ex.getTargetException());
		}
		catch (Throwable ex) {
			throw new BeanCreationException(beanName, "Failed to invoke init method", ex);
		}
		return bean;
	}
	
	// 该方法是重写了接口DestructionAwareBeanPostProcessor的,也就是销毁之前调用
	@Override
	public void postProcessBeforeDestruction(Object bean, String beanName) throws BeansException {
		LifecycleMetadata metadata = findLifecycleMetadata(bean.getClass());
		try {
            // invoke destroy methods : 执行destroy方法
			metadata.invokeDestroyMethods(bean, beanName);
		}
		catch (InvocationTargetException ex) {
			String msg = "Destroy method on bean with name '" + beanName + "' threw an exception";
			if (logger.isDebugEnabled()) {
				logger.warn(msg, ex.getTargetException());
			}
			else {
				logger.warn(msg + ": " + ex.getTargetException());
			}
		}
		catch (Throwable ex) {
			logger.warn("Failed to invoke destroy method on bean with name '" + beanName + "'", ex);
		}
	}	
```



#### AutowiredAnnotationBeanPostProcessor





```java
	@Override
	public PropertyValues postProcessProperties(PropertyValues pvs, Object bean, String beanName) {
        // 找到@Autowird/@Value/@Inject注解修饰的方法和字段
		InjectionMetadata metadata = findAutowiringMetadata(beanName, bean.getClass(), pvs);
		try {
            // 注入到该bean中来.
			metadata.inject(bean, beanName, pvs);
		}
		catch (BeanCreationException ex) {
			throw ex;
		}
		catch (Throwable ex) {
			throw new BeanCreationException(beanName, "Injection of autowired dependencies failed", ex);
		}
		return pvs;
	}



--------------------
    // @Autowird 是可以使用在构造方法上,不一定只是字段嘛.所以这个构造方法是处理注解修饰在方法上的
	@Override
	@Nullable
	public Constructor<?>[] determineCandidateConstructors(Class<?> beanClass, final String beanName)
			throws BeanCreationException {
    
    ..................
    		Constructor<?>[] candidateConstructors = this.candidateConstructorsCache.get(beanClass);
		if (candidateConstructors == null) {
			// Fully synchronized resolution now...
			synchronized (this.candidateConstructorsCache) {
				candidateConstructors = this.candidateConstructorsCache.get(beanClass);
				if (candidateConstructors == null) {
					Constructor<?>[] rawCandidates;
					try {
                        // 获取出该类的全部的构造方法
						rawCandidates = beanClass.getDeclaredConstructors();
					}
					catch (Throwable ex) {
						throw new BeanCreationException(beanName,
								"Resolution of declared constructors on bean Class [" + beanClass.getName() +
								"] from ClassLoader [" + beanClass.getClassLoader() + "] failed", ex);
					}
					List<Constructor<?>> candidates = new ArrayList<>(rawCandidates.length);
					Constructor<?> requiredConstructor = null;
					Constructor<?> defaultConstructor = null;
					Constructor<?> primaryConstructor = BeanUtils.findPrimaryConstructor(beanClass);
					int nonSyntheticConstructors = 0;
                    // 对全部的构造方法进行迭代,获取出被@Autowird注解修饰的
					for (Constructor<?> candidate : rawCandidates) {}
                    // 找到了 @Autowird 修饰的就使用
     					if (!candidates.isEmpty()) {
........
					else {
                        // 没有找到的话,就使用默认的
						candidateConstructors = new Constructor<?>[0];
					}               
    
}    
```



#### ApplicationListenerDetector

  可以看到该类自己内部维护了一个 application 和 singletonNames(集合) 的.

  该BeanPostProcess 可以看到初始完后调用的回调方法,根据beanName获取出true的哈,就往application中添加ApplicationListener进来.

  销毁之前,也是对application中ApplicationListener进行remove

```java
	// 实例化完 bean 后调用的方法
	@Override
	public Object postProcessAfterInitialization(Object bean, String beanName) {
        // bean 是 ApplicationListener才会走到这里来的
		if (bean instanceof ApplicationListener) {
			// potentially not detected as a listener by getBeanNamesForType retrieval
            // 从自己维护的集合中根据beanName获取出来值
			Boolean flag = this.singletonNames.get(beanName);
            // 如果是true的话,就往 applicationContext 中添加一个 listener
			if (Boolean.TRUE.equals(flag)) {
				// singleton bean (top-level or inner): register on the fly
				this.applicationContext.addApplicationListener((ApplicationListener<?>) bean);
			} else if (Boolean.FALSE.equals(flag)) {
             // 如果是false的话,判断log级别和application是不是包含这个beanName,如果不包含的话,就会点出warn级别的log来   
				if (logger.isWarnEnabled() && !this.applicationContext.containsBean(beanName)) {
					// inner bean with other scope - can't reliably process events
					logger.warn("Inner bean '" + beanName + "' implements ApplicationListener interface " +
							"but is not reachable for event multicasting by its containing ApplicationContext " +
							"because it does not have singleton scope. Only top-level listener beans are allowed " +
							"to be of non-singleton scope.");
				}
                // 从自己维护的 集合中remove走
				this.singletonNames.remove(beanName);
			}
		}
		return bean;
	}

	// 在调用销毁之前执行,
	@Override
	public void postProcessBeforeDestruction(Object bean, String beanName) {
		if (bean instanceof ApplicationListener) {
			try {
        // 从application中获取出 ApplicationEventMulticaster来        
				ApplicationEventMulticaster multicaster = this.applicationContext.getApplicationEventMulticaster();
       // ApplicationEventMulticaster中移除ApplicationListener
       // 并且移除 beanName         
				multicaster.removeApplicationListener((ApplicationListener<?>) bean);
				multicaster.removeApplicationListenerBean(beanName);
			}
			catch (IllegalStateException ex) {
				// ApplicationEventMulticaster not initialized yet - no need to remove a listener
			}
		}
	}
```





####  总结

 		除了SpringBoot中没有做任何配置中有的这些之外,肯定是还有很多其他的.

​		 当你在debug的时候,你会发现,有一些 processor 在初始化之前的名字 : 比如:org.springframework.context.annotation.internalAutowiredAnnotationProcessor ,其实它就是一个AutowiredAnnotationProcessor才是正确的,但是该名字前面却是有 internal 这个单词的,也就是内部的意思. 所以从名字上看,还是可以通过名字进行初始化区分的.  