## 				Spring 的 getBean 方法



####  题记

​	调用getBean这个方法,不仅仅是在最后初始化的时候才会被调用到. 在被最后全部调用实例化之前,也是有调用到这个方法的.  这个方法是很重要的,所以弄明白这个方法也是很有必要的.



####  方法

```java
	@Override
	public <T> T getBean(String name, Class<T> requiredType) throws BeansException {
		return doGetBean(name, requiredType, null, false);
	}
```



```java
	@Override
	public Object getBean(String name, Object... args) throws BeansException {
		return doGetBean(name, null, args, false);
	}
```



可以看到最后是走到了 doGetBean 这个方法里面来的. 这么看下来,doGetBean这个方法的代码还是蛮多的,其中有createBean()方法,这个方法从名字上看,就是创建bean的. 我们先看doGetBean这个方法. 

其实该方法从整体上来看,还是比较容易理解的(这里是先抛开了createBean这个方法).

先走 getSingleton方法,根据beanName来获取对象.如果获取出来的对象不为null的话,就会根据是否已经有正在创建了的还是没有,分别打印出来log出来,当然了这里的log级别是trace级别的. 最后走getObjectForBeanInstance方法,该方法不论是这里还是后面,都是有走到的.

然后getSingleton方法获取出来的是null的情况下,会根据 单例 / 多例 / Scope去分别走不同的逻辑,看到if --> else if --> else 就是分别对应的这三种方式.

最后还会检查一遍,判断requiredType不是null并且requiredType.isInstance(bean)返回的是false,也就是不相符的情况下,然后会T convertedBean = getTypeConverter().convertIfNecessary(bean, requiredType);去弄一个bean出来,如果弄出来的bean是null的话,就会抛出异常来,如果不是的话,就返回.

如果最后的检查是不满足的检查的话,就会直接返回这个bean的.

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
		// 先获取出bean的名字
		final String beanName = transformedBeanName(name);
		// 定义一个bean
        Object bean;

		// Eagerly check singleton cache for manually registered singletons.
//org.springframework.beans.factory.support.DefaultSingletonBeanRegistry#getSingleton(java.lang.String, boolean),从DefaultSinglonBeanRegisttry中的singletonObjects根据bean获取出来Object.        
		Object sharedInstance = getSingleton(beanName);
// 获取出来的bean不是null,并且传入进来的 args是null的话,就会进入到if逻辑中.        
		if (sharedInstance != null && args == null) {
            // 根据 trace级别的log来进行打印
			if (logger.isTraceEnabled()) {
				if (isSingletonCurrentlyInCreation(beanName)) {
					logger.trace("Returning eagerly cached instance of singleton bean '" + beanName +
							"' that is not fully initialized yet - a consequence of a circular reference");
				}
				else {
					logger.trace("Returning cached instance of singleton bean '" + beanName + "'");
				}
			}
//一: 如果name不是bull并且是&开头的话,满足这个条件,
/** 如果满足上面的条件的话
  1: 如果是 beanInstance(sharedInstance) 是NullBean的话,就会直接返回回去.
  2: 如果1没有return回去的话,判断是不是FactoryBean,如果不是的话,就会抛一个BeanIsNotAFactoryException异常出来.
  3:  1和2都不满足的话,就会判断mbd是不是null,很明显我们这里传入进去的是null,如果不是null的话,
  	  就会 mbd.isFactoryBean = true; 最后返回 beanInstance;
*/                     
//如果不是满足 一 的话,判断不是FactoryBean的话,就会直接返回回去.如果是的哈,就会继续往下走  
//定义一个Object object,如果RootBeanDefinition mbd是null的话,就会getCachedObjectForFactoryBean方法,否则的话,就会mbd.isFactoryBean = true;
//如果object不是null的话,就直接返回.  是null的话,就会先将beanInstance强转为FactoryBean,
//然后看到是null的话,就会调用getObjectFromFactoryBean这个方法,从名字上看,就是从FactoryBean中获取出object.   
// 如果是走了这里的话,就不会走else里面的含有 createBean这个方法的            
			bean = getObjectForBeanInstance(sharedInstance, name, beanName, null);
		}

		else {
			// Fail if we're already creating this bean instance:
			// We're assumably within a circular reference.
// 判断 beanName是不是正在创建,如果是正在创建的话,那么这里就会抛出异常来.
//Object curVal = this.prototypesCurrentlyInCreation.get();使用的是ThreadLocal来存储正在创建的bean信息.这里获取出来了,判断.如果是一样的话,那么就说名字这个bean是正在创建的.            
			if (isPrototypeCurrentlyInCreation(beanName)) {
				throw new BeanCurrentlyInCreationException(beanName);
			}

			// Check if bean definition exists in this factory.
  // 获取 parent BeanFacotry.          
			BeanFactory parentBeanFactory = getParentBeanFactory();
  // 获取出来的parentBeanFactory不是null的话并且beanFactoy中存放bd的集合中没有这个beanName
			if (parentBeanFactory != null && !containsBeanDefinition(beanName)) {
				// Not found -> check parent.
                // 这里也是获取beanName的
				String nameToLookup = originalBeanName(name);
                // 如果parentBeanFactroy是AbstractBeanFactory的话
                // 强转调用doGetBean方法,直接返回的.
				if (parentBeanFactory instanceof AbstractBeanFactory) {
					return ((AbstractBeanFactory) parentBeanFactory).doGetBean(
							nameToLookup, requiredType, args, typeCheckOnly);
				} else if (args != null) {
					// Delegation to parent with explicit args.
                    // 如果parentBeanFactory不是AbstractBeanFactory并且args不是null
                   // 直接调用getBean方法返回. 这里传入进去的是 beanName + args
					return (T) parentBeanFactory.getBean(nameToLookup, args);
				}  else if (requiredType != null) {
					// No args -> delegate to standard getBean method.
                    // 这里调用的getBean方法,传入进去的是 beanName + Class
					return parentBeanFactory.getBean(nameToLookup, requiredType);
				}
				else {
                    // 这里是直接根据beanName或取出来
					return (T) parentBeanFactory.getBean(nameToLookup);
				}
			}
			
            // typeCheckOnly是false才会走进这个if里面
			if (!typeCheckOnly) {
                // 标记这个bean已创建了
				markBeanAsCreated(beanName);
			}

			try {
// 根据 beanName 获取出 bd.
//先从mergedBeanDefinitions中获取出bd,如果bd是有值的话并且bd的stale是false的话,就会直接返回.
//否则的话,就会走return getMergedBeanDefinition(beanName, getBeanDefinition(beanName));
//方法获取.                
				final RootBeanDefinition mbd = getMergedLocalBeanDefinition(beanName);
// 该方法是检查bd的.如果bd是抽象的话,就会抛出异常来.                
				checkMergedBeanDefinition(mbd, beanName, args);

				// Guarantee initialization of beans that the current bean depends on.
// 然后从bd中获取 dependsOn 这个注解                
				String[] dependsOn = mbd.getDependsOn();
// 获取出来的 dependsOn 不是null的话,就会进行迭代操作                
				if (dependsOn != null) {
					for (String dep : dependsOn) {
                        // 如果是自己依赖自己的话,就会抛出异常来.
						if (isDependent(beanName, dep)) {
							throw new BeanCreationException(mbd.getResourceDescription(), beanName,
									"Circular depends-on relationship between '" + beanName + "' and '" + dep + "'");
						}
                       // 注册dependsOn注解的值到 beanFactory中来 
						registerDependentBean(dep, beanName);
						try {
// 然后调用getBean. getBean方法如果没有的话,就会去创建,有的话就会直接返回
							getBean(dep);
						}
						catch (NoSuchBeanDefinitionException ex) {
							throw new BeanCreationException(mbd.getResourceDescription(), beanName,
									"'" + beanName + "' depends on missing bean '" + dep + "'", ex);
						}
					}
				}
// if --> else if --> else 分别判断了是不是单例的,是不是单例的, else也就是既不是单例,也不是多例的
//可以看到不管是进入到那个条件中,都会走 getObjectForBeanInstance 这个方法的                
				// Create bean instance.
				if (mbd.isSingleton()) {
// getSingleton()方法, 该方法也是使用synchronized (this.singletonObjects) { .... }来加锁的
// 从singletonObjects(Map)中根据beanName获取出值来,如果获取出来的值不是null的话,就会直接返回.       // 如果是null的话,显示判断this.singletonsCurrentlyInDestruction是true的话,就会抛出异常.         // 该方法给出的注释解释是:此时BeanFactory处理销毁状态,不许创建bean.(不要在destroy方法实现中从BeanFactory请求bean)
//beforeSingletonCreation()创建bean之前,inCreationCheckExclusions不包含该beanName并且添加到singletonsCurrentlyInCreation中是失败的,就会抛出一个BeanCurrentlyInCreationException异常来.   
//singletonObject = singletonFactory.getObject()中,singletonFactory是从creatBean方法返回回来的.有定义一个变量newSingleton,getObject这步没有任何异常的话,该变量就会设置为true.
//这里是catch了IllegalStateException/BeanCreationException这二种异常,并且后面还会根据相应的判断来决定抛不抛出异常来.如果是BeanCreationException异常的话,就一定会抛出异常来.
//finally模块代码:之前有一个boolean recordSuppressedExceptions = (this.suppressedExceptions == null);也就是根据this.suppressedExceptions是不是null来判断出来的值. 如果是有的话,finally中就又会讲这个集合给重置为null.  再走一个afterSingletonCreation方法,该方法中如果inCreationCheckExclusions不包含这个beanName并且从singletonsCurrentlyInCreation中移除失败的话,就会抛出相应的异常来.
//最后就是根据newSingleton来判断是不是要添加到singletonObjects(Map)集合中去,也就是走的addSingleton方法. return singletonObject出去, 也就是给 sharedInstance 这个变量了.            
					sharedInstance = getSingleton(beanName, () -> {
						try {
                            /isInstance/ 创建bean,其中会走很多beanPostProcessor对这个bean进行扩展.
                            // 当然,你也可以自己定义.
							return createBean(beanName, mbd, args);
						}
						catch (BeansException ex) {
							// Explicitly remove instance from singleton cache: It might have been put there
							// eagerly by the creation process, to allow for circular reference resolution.
							// Also remove any beans that received a temporary reference to the bean.
                            // 创建的时候发生了异常,就会销毁这个单例并且会抛出异常来
							destroySingleton(beanName);
							throw ex;
						}
					});
//最后走的该方法,getObjectForBeanInstance()是在上面中有进行讲解到的.                    
					bean = getObjectForBeanInstance(sharedInstance, name, beanName, mbd);
				}

				else if (mbd.isPrototype()) {
// 这里的if条件是多例的判断条件                  
					// It's a prototype -> create a new instance.
					Object prototypeInstance = null;
					try {
// 创建 bean之前,Object curVal = this.prototypesCurrentlyInCreation.get();
// prototypesCurrentlyInCreation 也是 ThreadLocal,先从中获取出值
/**
  如果是null的话,就给set到ThreadLocal中去.                       
  如果获取出来的值是 String 类型的话,就会new一个Set集合,然后给beanName和curVal值都给添加进去,最后放入到ThreadLocal中去.
  以上二种都不满足的话,那么获取出来的值就是Set集合,然后给beanName给添加进去
*/                        
						beforePrototypeCreation(beanName);
/** createBean这个  */                        
						prototypeInstance = createBean(beanName, mbd, args);
					}
					finally {
//最后就是创建完bean后的逻辑.先从beforeXXX()方法中的ThreadLocal获取出set进去的值
//然后根据是String类型还是Set类型来remove掉ThreadLocal中的值.说明白了,这个地方就是对使用的ThreadLocal数据进行remove处理.
/** 结合before来看的,那么就是before是set值,after就是对set进去的值进行清除. */                    
						afterPrototypeCreation(beanName);
					}
					bean = getObjectForBeanInstance(prototypeInstance, name, beanName, mbd);
				}

				else {
// 该条件里面是对既不是单例,也不是多例的的处理.
//显示获取出scope这个注解的值,根据获取出来的值从 scopes 这个Map集合中获取.                   
					String scopeName = mbd.getScope();
					final Scope scope = this.scopes.get(scopeName);
//如果从map集合中获取出来的值是null的话,那么这里就会抛出一个异常来.                    
					if (scope == null) {
						throw new IllegalStateException("No Scope registered for scope name '" + scopeName + "'");
					}
					try {
                      // TODO get()方法阅读  
						Object scopedInstance = scope.get(beanName, () -> {
// 这里的beforePrototypeCreation/createBean/getObjectForBeanInstance
//可以很明显的看到是和上面的多例的逻辑相似的. 不同的是,这里还多走了一个scope.get方法.
							beforePrototypeCreation(beanName);
							try {
								return createBean(beanName, mbd, args);
							}
							finally {
								afterPrototypeCreation(beanName);
							}
						});
						bean = getObjectForBeanInstance(scopedInstance, name, beanName, mbd);
					}
					catch (IllegalStateException ex) {
						throw new BeanCreationException(beanName,
								"Scope '" + scopeName + "' is not active for the current thread; consider " +
								"defining a scoped proxy for this bean if you intend to refer to it from a singleton"isInstance,
								ex);
					}
				}
			}
			catch (BeansException ex) {
				cleanupAfterBeanCreationFailure(beanName);
				throw ex;
			}
		}

		// Check if required type matches the type of the actual bean instance.
// requiredType不是null,判断调用class.isInstance()方法判断这个class是不是和这个bean相符合         
		if (requiredType != null && !requiredType.isInstance(bean)) {
			try {
//满足的话,可以看到这行代码是在做创建bean的操作.  TODO: 具体的阅读需要看其底层的代码走向          
				T convertedBean = getTypeConverter().convertIfNecessary(bean, requiredType);
// 如果获取出来的 bean是null的话,就抛出一个异常来.                
				if (convertedBean == null) {
					throw new BeanNotOfRequiredTypeException(name, requiredType, bean.getClass());
				}
//如果不是null的话,这里就返回.                
				return convertedBean;
			}
			catch (TypeMismatchException ex) {
				if (logger.isTraceEnabled()) {
					logger.trace("Failed to convert bean '" + name + "' to required type '" +
							ClassUtils.getQualifiedName(requiredType) + "'", ex);
				}
				throw new BeanNotOfRequiredTypeException(name, requiredType, bean.getClass());
			}
		}
// 返回bean        
		return (T) bean;
	}
```





createBean()方法



```java
	//---------------------------------------------------------------------
	// Implementation of relevant AbstractBeanFactory template methods
	//---------------------------------------------------------------------
	/**
	 * Central method of this class: creates a bean instance,
	 * populates the bean instance, applies post-processors, etc.
	 * @see #doCreateBean
	 */
	@Override
	protected Object createBean(String beanName, RootBeanDefinition mbd, @Nullable Object[] args)
			throws BeanCreationException {

		if (logger.isTraceEnabled()) {
			logger.trace("Creating instance of bean '" + beanName + "'");
		}
// 将传入进来的bd给赋值给mbdToUse.      
		RootBeanDefinition mbdToUse = mbd;
		// Make sure bean class is actually resolved at this point, and
		// clone the bean definition in case of a dynamically resolved Class
		// which cannot be stored in the shared merged bean definition.
// 这里获取mbd的class返回回来        
		Class<?> resolvedClass = resolveBeanClass(mbd, beanName);
//如果resolvedClass不是null,mbd的hasBeanClass是false(也就是没有beanClass),mbd调用的beanClassName不是null的情况,就会走到下面的这个方法中        
		if (resolvedClass != null && !mbd.hasBeanClass() && mbd.getBeanClassName() != null) {
            // new 一个bd出来
			mbdToUse = new RootBeanDefinition(mbd);
            // 给bd设置上 resolvedClass
			mbdToUse.setBeanClass(resolvedClass);
		}
		// Prepare method overrides.
		try {
        // 重写的方法    
			mbdToUse.prepareMethodOverrides();
		}
		catch (BeanDefinitionValidationException ex) {
			throw new BeanDefinitionStoreException(mbdToUse.getResourceDescription(),
					beanName, "Validation of method overrides failed", ex);
		}
		try {
			// Give BeanPostProcessors a chance to return a proxy instead of the target bean instance.
// mbd.beforeInstantiationResolved是true就会满足条件,代码继续往下走.还有判断条件都好理解.
//主要看applyBeanPostProcessorsBeforeInstantiation方法,该方法先获取出全部的 beanPostProcessors,然后迭代集合,如果是InstantiationAwareBeanPostProcessor接口的子类的话,就会强转走postProcessBeforeInstantiation方法. 最后返回一个bean,该bean是有可能是null的. 
//如果是null的话,就不会走到applyBeanPostProcessorsAfterInitialization方法
//如果不是null,救会走这个方法.所以我们接着看这个方法.
// applyBeanPostProcessorsAfterInitialization方法:获取出全部的BeanPostProcessors,然后迭代,挨个调用其postProcessAfterInitialization方法,最后返回bean回去            
			Object bean = resolveBeforeInstantiation(beanName, mbdToUse);
            // 如果bean不是null的话,就直接返回掉.
			if (bean != null) {
				return bean;
			}
		}
		catch (Throwable ex) {
			throw new BeanCreationException(mbdToUse.getResourceDescription(), beanName,
					"BeanPostProcessor before instantiation of bean failed", ex);
		}
		try {
 // 调用 doCreateBean() 返回一个bean,最后给这个bean返回回去(如果没出任何异常的情况下).           
			Object beanInstance = doCreateBean(beanName, mbdToUse, args);
			if (logger.isTraceEnabled()) {
				logger.trace("Finished creating instance of bean '" + beanName + "'");
			}
			return beanInstance;
		}
		catch (BeanCreationException | ImplicitlyAppearedSingletonException ex) {
			// A previously detected exception with proper bean creation context already,
			// or illegal singleton state to be communicated up to DefaultSingletonBeanRegistry.
			throw ex;
		}
		catch (Throwable ex) {
			throw new BeanCreationException(
					mbdToUse.getResourceDescription(), beanName, "Unexpected exception during bean creation", ex);
		}
	}
```





doCreateBean() 方法, 该方法就是真正创建bean的方法.



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
// bean包装		
		BeanWrapper instanceWrapper = null;
// bd如果是单例的话,就从factoryBeanInstanceCache(Map集合)中remove出去        
		if (mbd.isSingleton()) {
			instanceWrapper = this.factoryBeanInstanceCache.remove(beanName);
		}
// instanceWrapper是null的话,就创建一个BeanWrapper出来.
// 调用createBeanInstance方法来创建          
		if (instanceWrapper == null) {
/** 先获取出bd的class信息,如果获取出来的class不是null并且beanClass.getModifiers()不是public并且
	mbd.isNonPublicAccessAllowed()是false的话,就会抛出一个异常来.
	获取bd的instanceSupplier,如果instanceSupplier不是null的话,就会走obtainFromSupplier(instanceSupplier, beanName);并且直接return掉. 从方法上来看,是从Supplier中获取.	obtainFromSupplier方法:从currentlyCreatedBean中获取,可以看到也是存储在ThreadLocal中,只不过这里Spring自己写了一个NamedThreadLocal是集成ThreadLocal,也就是换了一个马甲. 从Supplier的get方法获取出Obejct.  finally中,根据进来从ThreadLocal中get出来的值,如果获取出来的值不是null的话,这里就会又set进去. 如果获取是null,就给remove掉.  Supplier.get() 返回的是null的话,就会创建一个instance = new NullBean();  接着new一个BeanWrapper bw = new BeanWrapperImpl(instance)出来,再走initBeanWrapper方法,然后就return掉了.
initBeanWrapper()方法: 给bw(BeanWrapper) 先是获取出 ConversionService,然后赋值给bw. 然后调用
registerCustomEditors()方法,也就是注册Customer修改 TODO后面阅读				
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
					applyMergedBeanDefinitionPostProcessors(mbd, beanType, beanName);
				}
				catch (Throwable ex) {
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
			if (logger.isTraceEnabled()) {
				logger.trace("Eagerly caching bean '" + beanName +
						"' to allow for resolving potential circular references");
			}
			addSingletonFactory(beanName, () -> getEarlyBeanReference(beanName, mbd, bean));
		}

		// Initialize the bean instance.
		Object exposedObject = bean;
		try {
			populateBean(beanName, mbd, instanceWrapper);
			exposedObject = initializeBean(beanName, exposedObject, mbd);
		}
		catch (Throwable ex) {
			if (ex instanceof BeanCreationException && beanName.equals(((BeanCreationException) ex).getBeanName())) {
				throw (BeanCreationException) ex;
			}
			else {
				throw new BeanCreationException(
						mbd.getResourceDescription(), beanName, "Initialization of bean failed", ex);
			}
		}

		if (earlySingletonExposure) {
			Object earlySingletonReference = getSingleton(beanName, false);
			if (earlySingletonReference != null) {
				if (exposedObject == bean) {
					exposedObject = earlySingletonReference;
				}
				else if (!this.allowRawInjectionDespiteWrapping && hasDependentBean(beanName)) {
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
								"'getBeanNamesForType' with the 'allowEagerInit' flag turned off, for example.");
					}
				}
			}
		}

		// Register bean as disposable.
		try {
			registerDisposableBeanIfNecessary(beanName, bean, mbd);
		}
		catch (BeanDefinitionValidationException ex) {
			throw new BeanCreationException(
					mbd.getResourceDescription(), beanName, "Invalid destruction signature", ex);
		}

		return exposedObject;
	}
```

