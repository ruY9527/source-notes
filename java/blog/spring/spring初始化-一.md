---
title: spring初始化(一)
date: 2021-11-04 00:16:21
tags: 
  - java
  - spring
categories:
  - java
  - spring
---



#### 阅读方法

最简单的阅读方法,就是创建一个maven项目,让引入Spring的依赖. 然后写上一个main方法,来读取包下的内容,然后写一个bean,即可. 这个bean要在你扫描的包下. 于是我们直接在new的地方打上断点跟进去即可.

```java
<dependencies>

    <dependency>
        <groupId>org.springframework</groupId>
        <artifactId>spring-context</artifactId>
        <version>5.2.0.RELEASE</version>
    </dependency>

</dependencies>
public class SpringStartMain {
    public static void main(String[] args) {
        AnnotationConfigApplicationContext context = new AnnotationConfigApplicationContext("com.iyang.spring");
        YangBeanOne yangBeanOne = context.getBean(YangBeanOne.class);
        System.out.println(yangBeanOne.getClass().toString());
    }
}
```

还有一种就是你去github上clone一个Spring的源码,然后倒入idea,当然你需要gradle环境来构建.然后成功的build一下, 如果成功了的话,就在源码的目录创建一个模块(x项目),然后像上面一样。这样做的好处是,你可以随便修改源码的代码, 你觉得它的哪个地方的代码写到不够好的话,也是可以去修改的.

#### Debug阅读

开始debug进行代码的阅读 :

debug就会进入到这个构造函数中, 这里我们先对 this() 和 scan(basePackages) 这二个方法进行阅读, refresh()里面涉及到内容比较多(BeanPostprocess,Aware,event等),不是一下子就能看明白的,是需要大量的时间去仔细阅读的.

```java
/**
 * Create a new AnnotationConfigApplicationContext, scanning for components
 * in the given packages, registering bean definitions for those components,
 * and automatically refreshing the context.
 * @param basePackages the packages to scan for component classes
 */
public AnnotationConfigApplicationContext(String... basePackages) {
   this();
   scan(basePackages);
   refresh();
}
```

this () 方法

可以看到this方法,基本是在做一些对环境初始化的操作.

```java
/**
 * Create a new AnnotationConfigApplicationContext that needs to be populated
 * through {@link #register} calls and then manually {@linkplain #refresh refreshed}.
 同时还会走到 : org.springframework.context.support.GenericApplicationContext#GenericApplicationContext()这个方法里面来.  this.beanFactory = new DefaultListableBeanFactory(); 可以看到这里是new了一个beanFactory的,也就是我们后面的refresh()方法,可以看到DefaultListableBeanFactroy这个类.
 再往父类走 : org.springframework.context.support.AbstractApplicationContext#AbstractApplicationContext()就会走到这个类的这个方法来, this.resourcePatternResolver = getResourcePatternResolver(); 这里可以看到是初始化了 resourcePatternResolver.当然了,肯定还有一些new的全局变量的初始化也会进行初始化的.
 
 
 */
public AnnotationConfigApplicationContext() {
   this.reader = new AnnotatedBeanDefinitionReader(this);
//这个方法对registry,environment和resourceLoader进行赋值,然后根据filter是true,添加了三个filter过滤器.可以看到这个方法虽然带了scanner名字,但是看每个走的方法,好像是没有扫描任何东西,都是对全局参数进行赋值等操作.
   this.scanner = new ClassPathBeanDefinitionScanner(this);
}

---------------------------------

	/**
	 * Create a new {@code AnnotatedBeanDefinitionReader} for the given registry.
	 * <p>If the registry is {@link EnvironmentCapable}, e.g. is an {@code ApplicationContext},
	 * the {@link Environment} will be inherited, otherwise a new
	 * {@link StandardEnvironment} will be created and used.
	 * @param registry the {@code BeanFactory} to load bean definitions into,
	 * in the form of a {@code BeanDefinitionRegistry}
	 * @see #AnnotatedBeanDefinitionReader(BeanDefinitionRegistry, Environment)
	 * @see #setEnvironment(Environment)
这里可以看到传入进来的registry是 this,也就是传入了AnnotationConfigApplicationContext它自己. 

可以看到这个方法主要做的事情是,初始化Environment,然后new一个ConditionEvaluator对象,其保存了五个信息. 最后就分别添加五个 Processor到beanFactroy的beanDefinitionMap中来.
	 */
	public AnnotatedBeanDefinitionReader(BeanDefinitionRegistry registry) {
        // getOrCreateEnvironment()方法,先对registry进行非null的判断,如果是Null的话,就会抛出对应的异常.最后是new StandardEnvironment()了一个对象返回来. registry是满足EnvironmentCapable
// this()方法:先对传入进来的registry和environemnt进行非null的判断.this.registry = registry; 紧着new了一个ConditionEvaluator对象,其构造函数中,初始化了registry,beanFactory,environment,resourceLoader和classLoader这五个参数,是在内部类ConditionContextImpl中. 最后往beanFactory的beanDefinitionMap中添加了五个值,分别是:
//org.springframework.context.annotation.internalConfigurationAnnotationProcessor
//org.springframework.context.annotation.internalAutowiredAnnotationProcessor
//org.springframework.context.annotation.internalCommonAnnotationProcessor
//org.springframework.context.event.internalEventListenerProcessor
//org.springframework.context.event.internalEventListenerFactory  
//添加完,new AnnotatedBeanDefinitionReader()这个方法就走完了.        
		this(registry, getOrCreateEnvironment(registry));
	}

----------------------------------
	/**
	 * Create a new {@code ClassPathBeanDefinitionScanner} for the given bean factory.
	 * @param registry the {@code BeanFactory} to load bean definitions into, in the form
	 * of a {@code BeanDefinitionRegistry}
	 */
	public ClassPathBeanDefinitionScanner(BeanDefinitionRegistry registry) {
		this(registry, true);
	}

// 
	public ClassPathBeanDefinitionScanner(BeanDefinitionRegistry registry, boolean useDefaultFilters) {
//这里也有getOrCreateEnvironment()方法来获取环境,在上一步已经做了,所以这步是直接获取上一步的结果即可.      
		this(registry, useDefaultFilters, getOrCreateEnvironment(registry));
	}

// 先对传入进来的 registry 进行非null的判断,
	public ClassPathBeanDefinitionScanner(BeanDefinitionRegistry registry, boolean useDefaultFilters,
			Environment environment, @Nullable ResourceLoader resourceLoader) {

		Assert.notNull(registry, "BeanDefinitionRegistry must not be null");
		this.registry = registry;
		// 这里传入的是ture,也就是会走到这个if里面来.
		if (useDefaultFilters) {
//org.springframework.context.annotation.ClassPathScanningCandidateComponentProvider#registerDefaultFilters, 往includeFilters 集合中添加Filter,这些添加的filter,点进去看即可.            
			registerDefaultFilters();
		}
// this.environment赋上传入进来的environment值.        
		setEnvironment(environment);
// org.springframework.core.io.support.ResourcePatternUtils#getResourcePatternResolver进行判断,这里由于是ResourcePatternResolver,所以在第一个if就返回了.
//接着new一个CachingMetadataReaderFactory,传入进去resourceLoader,new这个类的内部也是可以看,就是对参数进行赋值,并没有做其他的什么事情了.      
//this.componentsIndex = CandidateComponentsIndexLoader.loadIndex(this.resourcePatternResolver.getClassLoader());获取出来的值Null.        
		setResourceLoader(resourceLoader);
	}
```

scan(basePackages) 方法

```java
// 对传入进来的参数进行一个校验.
//scanner也是上面那步this.scanner = new ClassPathBeanDefinitionScanner(this)给new出来的.
public void scan(String... basePackages) {
   Assert.notEmpty(basePackages, "At least one base package must be specified");
   this.scanner.scan(basePackages);
}

/**
* Perform a scan within the specified base packages.
* @param basePackages the packages to check for annotated classes
* @return number of beans registered
*/
public int scan(String... basePackages) {
// org.springframework.beans.factory.support.DefaultListableBeanFactory#getBeanDefinitionCount 走到这步来获取个数,还记得new AnnotatedBeanDefinitionReader(this)这个方法里面添加了五个processor吗?所以这里获取出来的beanCountAtScanStart大小就是5(默认对初始化做任何改动的情况下).
	int beanCountAtScanStart = this.registry.getBeanDefinitionCount();
//从名字上看,这个方法是真正的做扫描的.其实Spring中,scan都算不做事的,doScan才是真的做事的。到后面还有getBean不是做事的,doGetBean才是做事的,createBean也是的. 
//doScan做的事情可以看到,读取包下的类,然后根据filter条件来过滤,满足条件的话,就会封装成ScannedGenericBeanDefinition,最后是一个集合包装的该包下全部满足条件的. 然后就是接着对 sbd进行注解的处理,比如有些打入了Lazy等注解的,都要读取出来,存入bd的信息中.最后再检查一遍db,如果没问题的话,就会根据beanName和bd,new一个BeanDefinitionHolder出来,最后注册到beanFactory中去,也就是放入BeanFactory的beanDeifitionMap中去.    
	doScan(basePackages);
	// Register annotation config processors, if necessary.
	if (this.includeAnnotationConfig) {
// 先获取出beanFactory,先调用beanFactory的getDependencyComparator和getAutowireCandidateResolver方法,如果满足条件的话,就会有对应的set方法.然后紧接着就是判断beanFactory中是否包含一些bd,如果是不包含的话,这里就会添加进去. 这里判断的值,再最初new reader()的时候已经有添加到BeanFactory的beanDifitionMap中去.        
		AnnotationConfigUtils.registerAnnotationConfigProcessors(this.registry);
	}
    // 这里返回int参数,但是 this.scanner.scan(basePackages); 好像并没有使用到返回值.
	return (this.registry.getBeanDefinitionCount() - beanCountAtScanStart);
}

/**
* Perform a scan within the specified base packages,
* returning the registered bean definitions.
* <p>This method does <i>not</i> register an annotation config processor
* but rather leaves this up to the caller.
* @param basePackages the packages to check for annotated classes
* @return set of beans registered if any for tooling registration purposes (never {@code null})
	 */
protected Set<BeanDefinitionHolder> doScan(String... basePackages) {
    // 先是对传入进来的参数进行检验.
	Assert.notEmpty(basePackages, "At least one base package must be specified");
    // 存BeanDefinitionHolder的集合,也是最后要返回的.
	Set<BeanDefinitionHolder> beanDefinitions = new LinkedHashSet<>();
	for (String basePackage : basePackages) {
//根据传入进去的包名字,读取出包名字下的所有文件,然后迭代这些文件,这些文件要有能读的权限,再走isCandidateComponent(metadataReader)这个方法,其中就有使用 excludeFilters和includeFilters,这二个filter来过滤进行一些判断操作. 返回ture,就会往下走,new一个ScannedGenericBeanDefinition,其中beanClass就是这个类的全限定名字.比如这里(com.iyang.spring.bean.YangBeanOne),我们的是这个.
//这就是这个方法,扫描,然后根据特定filter,如果是满足条件的话,就会new一个sbd,然后放入Set集合中,返回. 
		Set<BeanDefinition> candidates = findCandidateComponents(basePackage);
        
		for (BeanDefinition candidate : candidates) {
//org.springframework.context.annotation.AnnotationScopeMetadataResolver#resolveScopeMetadata,走的这个方法,因AnnotationConfigUtils.attributesFor(...)方法返回的是null,所以这个里面就仅仅只是new了一个ScopeMetadata对象返回了           
			ScopeMetadata scopeMetadata = this.scopeMetadataResolver.resolveScopeMetadata(candidate);
//scope的值是singletone.这不就是我们熟悉的单例嘛.            
			candidate.setScope(scopeMetadata.getScopeName());
//获取出这个bean的名字            
			String beanName = this.beanNameGenerator.generateBeanName(candidate, this.registry);
// db是 AbstractBeanDefinition的话,这里肯定是,从AbstractBeanDefinition这个名字上看,是一个抽象的，也就是应该是父类.            
			if (candidate instanceof AbstractBeanDefinition) {
//beanDefinition.applyDefaults(this.beanDefinitionDefaults)该方法是对一些参数进行赋值操作. 
//                
				postProcessBeanDefinition((AbstractBeanDefinition) candidate, beanName);
			}
// bd是AnnotatedBeanDefinition或者其子类.            
			if (candidate instanceof AnnotatedBeanDefinition) {
// 该方是对bd的Lazy.calss,Primary.class,DependsOn.class,Role.class,Description.class这些注解进行获取,如果有的话,就会调用bd对应的set方法给值set进去. 当然我们这里的bean没有这些属性.这里可自行加入一些注入,然后debug到这个地方进行看.
                AnnotationConfigUtils.processCommonDefinitionAnnotations((AnnotatedBeanDefinition) candidate);
				}
// 检查registry中是否含有这个beanName,如果没包含的话,就直接返回ture.            
			if (checkCandidate(beanName, candidate)) {
// 传入bean和beanName, new一个bean的Holder出来,也就是bean的持有者的意思.其实个人觉得这里是对bean进行一层封装,Holder更抽象地理解点.                
				BeanDefinitionHolder definitionHolder = new BeanDefinitionHolder(candidate, beanName);
//scopeMetadata中获取出getScopedProxyMode,如果是No的话,就直接返回definitionHolder         
				definitionHolder =
							AnnotationConfigUtils.applyScopedProxyMode(scopeMetadata, definitionHolder, this.registry);
// 添加到最外层的集合中                
				beanDefinitions.add(definitionHolder);
//org.springframework.beans.factory.support.DefaultListableBeanFactory#registerBeanDefinition,最后走到了这里,该方法会先对传入进来的参数进行非null的判断,如果bd是AbstractBeanDefinition的话,就会强转调用其validate()方法,进行检验. 在从this.beanDefinitionMap中获取,根据beanName,第一次肯定是获取不到的,走到else.else中在判断hasBeanCreationStarted(),这里返回的是flase,也就是走到了else的else中去了,根据beanName和bean存入到this.beanDefinitionMap中,然后beanName添加到beanDefinitionNames集合中.  这就是这步根据beanName和bean放入beanFactory的beanDefinitionMap集合中.               
				registerBeanDefinition(definitionHolder, this.registry);
			}
		}
	}
	return beanDefinitions;
}
```

#### 总结

- this() 方法 : 该方法中主要是初始化了 this.reader 和 this.scanner这个参数,当然了,其中还有一些环境等信息 的初始化. this.reader的时候,是有往beanFactroy中添加五个默认要添加的bd,也就是添加到了 BeanFactory的BeanDefitionMap中. this.scanner 也是对一些环境等信息初始化 , 然后下接来的方法就是使用 this.scanner来进扫描 class,然后满足条件的,就封装成bd,注册到beanFactory中去.
- register() 方法里面调用 this.reader.register(componentClasses); 该方法就是读取包下的class信息,然后满足条件的就封装成bd,同时还会对注解@Lazy等也会读取,如果是有这些注解的话,就会调用bd对应的set方法,给赋值进去,最后将bd给注册到BeanFactory的beanDefitionMap中去即可.

可以看到 this() 方法 和 register()方法,主要是对环境的初始化和根据传入进来的包名来进行扫描获取class信息,满足条件的class信息就会转化为bd,然后注册到beanFactory中去.
