## 				SpringBoot 之 run 方法启动



####  题记

   SpringBoot 无配置式启动,大大的减轻了以前需要配置很多xml中的bean/aop/事物等. 只需要使用@SpringBootApplication 和 SpringApplication.run() 方法就可以轻松的跑起来了.  想要看怎么这么神奇,就需要看其run() 方法的执行操作.

​	run() 方法又包含了之前分析的  refresh 方法,但是这里的refresh 方法是要比之前的 单独分析 Spring 的 refresh方法的内容要多得多. 

​    单Spring阅读refresh[方法](http://www.lwfby.cn/2020/06/28/spring/Spring_Refresh/)  , 点击链接可以阅读之前的记录.

​    SpringBoot [启动构造方法](https://github.com/baoyang23/source-notes/blob/master/java/spring_boot/SpringBoot_%E6%9E%84%E9%80%A0%E6%96%B9%E6%B3%95%E9%98%85%E8%AF%BB.md) , 目前可以先点击这个链接进行阅读.

####  run 方法整体

 我们先看下 run 方法整体的流程.  其实也不难看出来, 也是new对象,调用方法. 但是人家可不仅仅是这二种就轻松搞定了的. 而且里面采用了大量的设计模式等知识.

从run 方法整体来看, 先是启动 StopWatch,然后获取出SpringApplicationRunListener对应的Listener,最后封装到SpringApplicationRunListeners这个Object类中,  接着调用这个类的 starting 方法,也就是启动方法.

再往下就是创建 DefaultApplicationArguments,准备环境,然后往System.setProperty给key为"spring.beaninfo.ignore" 设置ignore.toString() 方法进去.  打印Banner(也就是我们看到的SpringBoot，用很多杠杆给拼接起来的)

创建一个AnnotationConfigApplicationContext的Context(我个人觉得context是对beanFactory的一种扩展吧).

接着在 获取 SpringBootExceptionReporter 对应的信息(从META-INF/spring.factiories中获取),返回的是一个集合对象.

再就是为context进行准备.

接着就是调用refresh 方法,这个方法会加载beanPostProcssor，初始化bean等操作.

afterRefresh 就是创建完容器之后执行一些额外的操作

stopWatch.stop 就是打印启动计时等信息

再就是执行 listeners.started() 方法,  org.springframework.boot.context.event.EventPublishingRunListener#started,也就是new一个ApplicationStartedEvent给传播出去,然后监听器拿到这个事件后,执行相应的逻辑处理关系.

callRunners 获取出 ApplicationRunner和CommandLineRunner,从beanFactory中获取出来,然后调用其run方法

接着就是执行 listeners.running()方法:

org.springframework.boot.context.event.EventPublishingRunListener#running,其内部就是new一个ApplicationReadyEvent事件给传播出去,然后相应的监听器拿到这个事件,就会去执行其内部的逻辑代码.

return 一个 context回去，也就是run方法已经走完了.

```java
	/**
	 * Run the Spring application, creating and refreshing a new
	 * {@link ApplicationContext}.
	 * @param args the application arguments (usually passed from a Java main method)
	 * @return a running {@link ApplicationContext}
	 */
	public ConfigurableApplicationContext run(String... args) {
// 先写一个任务Watch , 可以看到启动时候调用了 start方法, afterRefresh之后又调用了stop方法.
// 这个时候不难想到,我们启动完程序后,就可以看到SpringBoot帮我们打印了一个启动的用时时间,然后想下是不是就可以联想到start和stop这二个方法与之相关.        
		StopWatch stopWatch = new StopWatch();
		stopWatch.start();
//先定义一个Context.        
		ConfigurableApplicationContext context = null;
//new一个装SpringBootExceptionReporter对象的集合.然后可以看到这个集合的使用地方,
//都是在catch里面.走的handleRunFailure 方法.	        
		Collection<SpringBootExceptionReporter> exceptionReporters = new ArrayList<>();
		configureHeadlessProperty();
//如果我们没有在META-INF的spring.factories进行什么扩展的定义的话,只会获取下面的一个.
//SpringFactoriesLoader.loadFactoryNames(type, classLoader),该方法是从META-INF/spring.factories中进行读取相应的配置信息等.        
//org.springframework.boot.context.event.EventPublishingRunListener
//最后获取出来的进行createSpringFactoriesInstances方法,也就是实例化.
//最后new一个SpringApplicationRunListeners,其内部封装了log和SpringApplicationRunListener的集合
		SpringApplicationRunListeners listeners = getRunListeners(args);
//上一步返回的listeners,这部先迭代,然后将this.application和this.args封装成ApplicationStartingEvent这个对象,然后传播给对应的listeners.
//监听器拿到了这里广播出去的event后,也就会走相应的 onApplicationEvent 的方法逻辑,不同的监听器其走的方法也是不同的,具体可以看到其监听器里面走的逻辑. 这里具体的方法,多少的监听器方法被执行,可自行debug进行查看 
		listeners.starting();
		try {
// new 一个启动参数的持有对象,也就是该对象其内部封装了args这个参数.         
			ApplicationArguments applicationArguments = new DefaultApplicationArguments(args);
//准备一下环境
			ConfigurableEnvironment environment = prepareEnvironment(listeners, applicationArguments);
//根据System.getProperty()方法获取spring.beaninfo.ignore对用的值,然后有根据spring.beaninfo.ignore给调用到System.setProperty中去.            
			configureIgnoreBeanInfo(environment);
// 打印 banner , 比如我们看到 的 SpringBoot 那个用很多杠杆给拼成的样子,就是在这里走完之后打印的.
			Banner printedBanner = printBanner(environment);
//这里创建ApplicatioContext,这里创建的是默认的:
//org.springframework.context.annotation.AnnotationConfigApplicationContext,使用Class.forName来后去class信息,然后走BeanUtils.instantiateClass(contextClass);创建
//如果看过之前阅读单个Spring的话,不难看出来,我当时启动的总入口类就是这个AnnotationConfigApplicationContext这个类.            
			context = createApplicationContext();
//仔细发现,getRunListeners中也是走的getSpringFactoriesInstances(SpringApplicationRunListener.class, types, this, args),只是这里我们传入的参数不同,也就是重载了.也是返回一个SpringBootExceptionReporter的集合对象.
			exceptionReporters = getSpringFactoriesInstances(SpringBootExceptionReporter.class,
					new Class[] { ConfigurableApplicationContext.class }, context);
//准备Context。            
			prepareContext(context, environment, listeners, applicationArguments, printedBanner);
// 调用 refresh 方法.            
			refreshContext(context);
// 创建完容器之后的一些额外操作.            
			afterRefresh(context, applicationArguments);
			stopWatch.stop();
// 根据logStartupInfo是否为true/false，来判断接下来是否打印.
// log 是info级别的打印.            
			if (this.logStartupInfo) {
				new StartupInfoLogger(this.mainApplicationClass).logStarted(getApplicationLog(), stopWatch);
			}
//org.springframework.boot.context.event.EventPublishingRunListener#started
//可以看到该方法内部new了一个ApplicationStartedEvent,然后广播出去给相应的监听者执执行相应的逻辑代码.
			listeners.started(context);
//从context中获取出ApplicationRunner和CommandLineRunner,调用其values方法,其值给添加到runners中   
//org.springframework.boot.SpringApplication#callRunner(org.springframework.boot.ApplicationRunner, org.springframework.boot.ApplicationArguments),该方法可以执行相应对象的run方法.
			callRunners(context, applicationArguments);
		}
		catch (Throwable ex) {
			handleRunFailure(context, ex, exceptionReporters, listeners);
			throw new IllegalStateException(ex);
		}

		try {
// org.springframework.boot.context.event.EventPublishingRunListener#running
//其new了一个ApplicationReadyEvent，然后广播出去给相应的监听器进行获取，然后监听器拿到了相应的事件就会执行相应的业务逻辑代码            
			listeners.running(context);
		}
		catch (Throwable ex) {
			handleRunFailure(context, ex, exceptionReporters, null);
			throw new IllegalStateException(ex);
		}
// 返回context出去.        
		return context;
	}
```



#### run 中 configureHeadlessProperty() 方法

 最后是给 java.awt.headless 设置了默认值 headless = true, 所以也就是给 SYSTEM_PROPERTY_JAVA_AWT_HEADLESS 在System中设置上了true.  所以这个方法也没有特别重要的地方讲解

  ```java
	private void configureHeadlessProperty() {
		System.setProperty(SYSTEM_PROPERTY_JAVA_AWT_HEADLESS,
				System.getProperty(SYSTEM_PROPERTY_JAVA_AWT_HEADLESS, Boolean.toString(this.headless)));
	}
  ```



####  run 中 getRunListeners() 方法

  方法依次往下执行的.    可以看出这个方法, 根据 SpringApplicationRunListener.class 从 META-INF/spring.factories 中获取并且实例化获取出来的结果. 然后放入到  SpringApplicationRunListeners 这个对象中.  从 META-INF/spring.factories中获取出来的数据,是有一个cache缓存的,也就是使用的Map. 

```java
	private SpringApplicationRunListeners getRunListeners(String[] args) {
//构造出一个数组,放入了SpringApplication.class和String[].class
//主要看 getSpringFactoriesInstances() 这个方法       
		Class<?>[] types = new Class<?>[] { SpringApplication.class, String[].class };
// 这里根据getSpringFactoriesInstances返回回来的listeners集合,去new一个SpringApplicationRunListeners,也就是将listeners放入到SpringApplicationRunListeners中的属性.  
		return new SpringApplicationRunListeners(logger,
				getSpringFactoriesInstances(SpringApplicationRunListener.class, types, this, args));
	}


	private <T> Collection<T> getSpringFactoriesInstances(Class<T> type, Class<?>[] parameterTypes, Object... args) {
 // 获取 class加载器       
		ClassLoader classLoader = getClassLoader();
 //主要看 SpringFactoriesLoader.loadFactoryNames() 方法，因为该方法是从 META-INF/spring.factories中读取相应的信息. 如果我们没有进行扩展的话,这里就是默认只有一个.
// 当然了,我们是可以在自己项目中创建一个META-INF/spring.factories进行扩展的        
//# Run Listeners
//org.springframework.boot.SpringApplicationRunListener=\
//org.springframework.boot.context.event.EventPublishingRunListener        
// Use names and ensure unique to protect against duplicates
		Set<String> names = new LinkedHashSet<>(SpringFactoriesLoader.loadFactoryNames(type, classLoader));
 // 这里要说明的的一点是,instanceClass.getDeclaredConstructor(parameterTypes)走的不是无参数构造函数,而是走的有参数函数,最后是使用的 BeanUtils.instantiateClass(constructor, args) 来初始化这个bean的,最后存放到集合中并且返回回来.       
		List<T> instances = createSpringFactoriesInstances(type, parameterTypes, classLoader, args, names);
// 排序下，返回.        
		AnnotationAwareOrderComparator.sort(instances);
		return instances;
	}


// 根据 classLoader 来获取相应的相应的信息. 这里就是使用了一个 cache（Map） 来当做一个简单缓存操作.
// 也就是先从map中获取,获取出来有结果就返回,没有结果的话,就看classLoader.getResources/getSystemResource方法从META-INF/spring.factories中获取.然后在return之前就放入到cache这个Map中缓存一下
	private static Map<String, List<String>> loadSpringFactories(@Nullable ClassLoader classLoader) {
		MultiValueMap<String, String> result = cache.get(classLoader);
		if (result != null) {
			return result;
		}

		try {
			Enumeration<URL> urls = (classLoader != null ?
					classLoader.getResources(FACTORIES_RESOURCE_LOCATION) :
					ClassLoader.getSystemResources(FACTORIES_RESOURCE_LOCATION));
			result = new LinkedMultiValueMap<>();
			while (urls.hasMoreElements()) {
				URL url = urls.nextElement();
				UrlResource resource = new UrlResource(url);
				Properties properties = PropertiesLoaderUtils.loadProperties(resource);
				for (Map.Entry<?, ?> entry : properties.entrySet()) {
					String factoryTypeName = ((String) entry.getKey()).trim();
					for (String factoryImplementationName : StringUtils.commaDelimitedListToStringArray((String) entry.getValue())) {
						result.add(factoryTypeName, factoryImplementationName.trim());
					}
				}
			}
			cache.put(classLoader, result);
			return result;
		}
		catch (IOException ex) {
			throw new IllegalArgumentException("Unable to load factories from location [" +
					FACTORIES_RESOURCE_LOCATION + "]", ex);
		}
	}
```

​     

实战一把:  参考 org.springframework.boot.context.event.EventPublishingRunListener 

 先写一个类 :

```java
public class GavinYangEventPublishingRunListener implements SpringApplicationRunListener, Ordered {

    private Logger LOGGER = LoggerFactory.getLogger(GavinYangEventPublishingRunListener.class);

    private SpringApplication application;
    private String[] args;

    public GavinYangEventPublishingRunListener() {
    }

    public GavinYangEventPublishingRunListener(SpringApplication application, String[] args) {
        this.application = application;
        this.args = args;
        System.out.println("调用到了 private final String[] args; 有参数构造方法");
    }

    @Override
    public int getOrder() {
        return 0;
    }

    /**
     * org.springframework.boot.SpringApplication#run(java.lang.String...).
     * listeners.starting(); 当走到这个方法的时候,就会调用到.
     *
     */
    @Override
    public void starting() {
        LOGGER.info("GavinYangEventPublishingRunListener 调用 starting 方法成功");
    }
    
    @Override
    public void started(ConfigurableApplicationContext context) {

        LOGGER.info("GavinYangEventPublishingRunListener 调用到了 started方法");
    }

    @Override
    public void running(ConfigurableApplicationContext context) {

        LOGGER.info("GavinYangEventPublishingRunListener 调用 running 方法成功");
    }
}
```



然后在META-INF/spring.factories中配置下:

```java
# Run Listenersorg.springframework.boot.SpringApplicationRunListener=\com.iyang.bootsourceread.listener.GavinYangEventPublishingRunListener
```



控制台的log输出顺序:  可以看到打印的参数顺序, 也就是先反射调用实例化, 然后接着调用 starting 方法,接着就是started 方法, 最后就是 running方法.  可以看到执行的一次顺序.

调用到了 private final String[] args; 有参数构造方法
15:47:56.498 [main] INFO com.iyang.bootsourceread.listener.GavinYangEventPublishingRunListener - GavinYangEventPublishingRunListener 调用 starting 方法成功

2020-07-02 15:47:57.069  INFO 4063 --- [           main] .b.l.GavinYangEventPublishingRunListener : GavinYangEventPublishingRunListener 调用到了 started方法
2020-07-02 15:47:57.070  INFO 4063 --- [           main] .b.l.GavinYangEventPublishingRunListener : GavinYangEventPublishingRunListener 调用 running 方法成功



具体的执行,可自行debug进去看,是怎么具体走到哪步的.  与EventPublishingRunListener不同的是, 我们这里是没有new什么事件丢给监听器的. 就是简单的打印了几句log.



####  run 中 starting() 方法

org.springframework.boot.SpringApplicationRunListeners#starting

该方法就是直接走 SpringApplicationRunListeners中的starting方法.  getRunListeners方法最后返回的是SpringApplicationRunListeners,该类中是包装了 我们SpringApplicationRunListener.class对应的Listener的.

然后这里就会迭代每个 listener 并且会调用到 starting 放.  这个结果在上面的方法小实战中,是可以很明显的体会到的.

  ```java
	void starting() {
		for (SpringApplicationRunListener listener : this.listeners) {
			listener.starting();
		}
	}
  ```



####  run 中 prepareEnvironment() 方法

 可以看到这该方法最后处理的都是和 Environment有关的. 

```java
private ConfigurableEnvironment prepareEnvironment(SpringApplicationRunListeners listeners, ApplicationArguments applicationArguments) {
		// Create and configure the environment
//如果没有获取到就创建,获取到就返回. 最后返回的是: StandraEnvironment这个    
		ConfigurableEnvironment environment = getOrCreateEnvironment();
// applicationArguments就是获取new DefaultApplicationArguments(args)中的args.
//先new一个ApplicationConversionService,最后赋值到org.springframework.core.env.AbstractPropertyResolver#setConversionService这个中.   
//接着就是配置property来源 和 profiles.    
		configureEnvironment(environment, applicationArguments.getSourceArgs());
// 显示检验下ConfigurableEnvironment,是不是符合要求的.是的话,就会走getPropertySources()方法,sources这里返回的是null,所以就走到了new一个ConfigurationPropertySourcesPropertySource,然后添加到sources 中去.    
		ConfigurationPropertySources.attach(environment);
// 如果看明白了之前的 starting()方法的话,那么这里就可以理解到很明白.
//这里就是抛出了 ApplicationEnvironmentPreparedEvent 这个事件出去,然后相应的监听器获取到这个事件,就会执行相应的代码逻辑.    
		listeners.environmentPrepared(environment);
//    
		bindToSpringApplication(environment);
// this.isCustomerEnvironment 是 false,    
		if (!this.isCustomEnvironment) {
// new一个EnvironmentConverter(也就是传入进去的classLoader给赋值到其属性), 然后赋值给environment. 
			environment = new EnvironmentConverter(getClassLoader()).convertEnvironmentIfNecessary(environment,
					deduceEnvironmentClass());
		}
		ConfigurationPropertySources.attach(environment);
		return environment;
	}
```



####  run 中 createApplicationContext() 方法

  创建 ApplicationCntext,  该方法可以看到 根据 this.webApplicationType来创建 ApplicationContext的class的,然后使用BeanUtils.instantiateClass() 方法来实例化这个bean.  这里还是很好理解的,就是创建一个 ApplicationContext. 最后返回这个 context给赋值到 context 这个参数.

```java
	/**
	 * Strategy method used to create the {@link ApplicationContext}. By default this
	 * method will respect any explicitly set application context or application context
	 * class before falling back to a suitable default.
	 * @return the application context (not yet refreshed)
	 * @see #setApplicationContextClass(Class)
这里我们看到 定义的三个参数	 
DEFAULT_SERVLET_WEB_CONTEXT_CLASS:org.springframework.boot.web.servlet.context.AnnotationConfigServletWebServerApplicationContext
DEFAULT_REACTIVE_WEB_CONTEXT_CLASS:org.springframework.boot.web.reactive.context.AnnotationConfigReactiveWebServerApplicationContext
DEFAULT_CONTEXT_CLASS:org.springframework.context.annotation.AnnotationConfigApplicationContext
	 
	 */
	protected ConfigurableApplicationContext createApplicationContext() {
        // contextClass 是 null,所以就走入到下面的switch中. 这里是走到了默认default中去了.
		Class<?> contextClass = this.applicationContextClass;
		if (contextClass == null) {
			try {
				switch (this.webApplicationType) {
				case SERVLET:
					contextClass = Class.forName(DEFAULT_SERVLET_WEB_CONTEXT_CLASS);
					break;
				case REACTIVE:
					contextClass = Class.forName(DEFAULT_REACTIVE_WEB_CONTEXT_CLASS);
					break;
				default:
                   // AnnotationConfigApplicationContext     
					contextClass = Class.forName(DEFAULT_CONTEXT_CLASS);
				}
			}
			catch (ClassNotFoundException ex) {
				throw new IllegalStateException(
						"Unable create a default ApplicationContext, please specify an ApplicationContextClass", ex);
			}
		}
// 所以这里实例化的也是 AnnotationConfigApplicationContext 这个 Context.        
		return (ConfigurableApplicationContext) BeanUtils.instantiateClass(contextClass);
	}
```



####  run 中 getSpringFactoriesInstances(SpringBootExceptionReporter.class...) 方法

 之前阅读到的 getRunListeners方法,其内部也是走了 getSpringFactoriesInstances 这个方法,然后这里也是根据SpringBootExceptionReporter.class来获取出相应的集合数据.

所以这里直接说,返回的集合中,如果没有进行扩展的话,那么这里就只有 FailureAnalyzers这一个.

org.springframework.boot.diagnostics.FailureAnalyzers 

如果是有异常的话,就会放入到 SpringBootExceptionReporter 这个里,由其子类给打印出来.  Reporter这个意思还是很好理解的.

```java
	private <T> Collection<T> getSpringFactoriesInstances(Class<T> type, Class<?>[] parameterTypes, Object... args) {
		ClassLoader classLoader = getClassLoader();
		// Use names and ensure unique to protect against duplicates
		Set<String> names = new LinkedHashSet<>(SpringFactoriesLoader.loadFactoryNames(type, classLoader));
		List<T> instances = createSpringFactoriesInstances(type, parameterTypes, classLoader, args, names);
		AnnotationAwareOrderComparator.sort(instances);
		return instances;
	}
```



####  run 中 prepareContext() 方法

可以看到这个方法基本都是一直在操作 context,先是给context设置environment.

然后判断internalConfigurationBeanNameGenerator要不要注册到 beanFactory中去. 如果this.resourceLoader不是null的话,就会分别设置ResourceLoader/ClassLoader(看具体的值),给ConversionService  set 到beanFactory中去.

调用 ApplicationContextInitializer 的 initialize 方法.

listeners.contextPrepared(context) :  广播一个 ApplicationContextInitializedEvent 出去

注册一个springApplicationArguments到 beanFactory中去. printedBanner 不是null的话,也注册到beanFactory中去. 如果beanFactory是DefaultListableBeanFactory的话,就this.allowBeanDefinitionOverriding赋值为false

如果是有lazyInitialization,就会添加一个LazyInitializationBeanFactoryPostProcessor到context中去.

getAllSources() 这里获取出来的就是只有我们的启动类,对获取出来的集合进行非空判断.

最后广播一个 ApplicationPreparedEvent 出去.  广播出去之前会有对listener都添加到 context中,如果是ApplicationContextAware的话,就会再调用一个 setApplicationContext 方法.

```java
// 这里传入的参数分别是 :  context : AnnotationConfigApplicationContext
// environment : StandardEnvironment
// listeners : SpringApplicationRunListeners
// applicationArguments : DefaultApplicationArguments
// printedBanner : SpringApplicationBannerPrinter$PrintedBanner
private void prepareContext(ConfigurableApplicationContext context, ConfigurableEnvironment environment,
			SpringApplicationRunListeners listeners, ApplicationArguments applicationArguments, Banner printedBanner) {
 // 给 environment设置到context中去   
		context.setEnvironment(environment);
 // this.beanNameGenerator 不是null的话,就会往beanFactory中注册org.springframework.context.annotation.internalConfigurationBeanNameGenerator
// this.resourceLoader 不是null的话,判断是GenericApplicationContext/DefaultResourceLoader
// 会分别走不同的set方法.    
// this.addConversionService是true的话,就会给ApplicationConversionService.getSharedInstance() set 到beanFactroy中去.  
//org.springframework.beans.factory.support.AbstractBeanFactory#setConversionService    
		postProcessApplicationContext(context);
// getInitializers() 获取出 ApplicationContextInitializer的集合,然后满足条件的就会调用其 initialize() 方法    
		applyInitializers(context);
// 看到 listeners.contextPrepared 方法,是不是又能想起之前的 listeners.starting();也是一样的逻辑.
//然后这里new一个ApplicationContextInitializedEvent事件给广播出去,然后相应的监听器监听到事件就会走相应的逻辑代码.    
    	listeners.contextPrepared(context);
// this.logStartupInfo 就是判断的二个方法打不打印log
		if (this.logStartupInfo) {
// 打印 启动相关的信息, PID, 编译后的class路径, 项目路径等信息.            
			logStartupInfo(context.getParent() == null);
// 打印 profile,也就是配置文件等信息,这里打印的是 默认的.            
			logStartupProfileInfo(context);
		}
		// Add boot specific singleton beans
// 获取出 beanFactory来    
		ConfigurableListableBeanFactory beanFactory = context.getBeanFactory();
//给beanName是springApplicationArguments,然后Object是applicationArguments注册到beanFactory中去. 最后也就是走到了下面的这个方法,调用集合添加进去.
//org.springframework.beans.factory.support.DefaultSingletonBeanRegistry#addSingleton    
		beanFactory.registerSingleton("springApplicationArguments", applicationArguments);
//打印的banner如果不是null的话,也会注册到beanFactory中去.    
		if (printedBanner != null) {
			beanFactory.registerSingleton("springBootBanner", printedBanner);
		}
// 如果 beanFactory 是 DefaultListableBeanFactory的话,强转然后调用setAllowBeanDefinitionOverriding方法,传入的参数的值是false.
		if (beanFactory instanceof DefaultListableBeanFactory) {
			((DefaultListableBeanFactory) beanFactory)
					.setAllowBeanDefinitionOverriding(this.allowBeanDefinitionOverriding);
		}
// this.lazyInitialization是true的话,就会添加一个 LazyInitializationBeanFactoryPostProcessor 到context中去.
		if (this.lazyInitialization) {
			context.addBeanFactoryPostProcessor(new LazyInitializationBeanFactoryPostProcessor());
		}
		// Load the sources
// 加载资源. 分别从this.primarySources/this.sources这二个集合中添加进去.
// 该集合中只有一个启动类的全路径名字    
		Set<Object> sources = getAllSources();
// sources集合不能为空.    
		Assert.notEmpty(sources, "Sources must not be empty");
// new 一个 BeanDefinitionLoader,然后调用其load方法.    
		load(context, sources.toArray(new Object[0]));
// 看到 listeners调用方法,是不是又很熟悉了.
//但是这个方法,比起之前的几个,这里多做了个事,那就是,先从application中获取Listeners,然后挨个迭代,如果是ApplicationContextAware的话,就走listener(这里会强转)的setApplicationContext方法,给context设置进去. 然后所有的listeners都会添加到context中去.
// 最后new一个ApplicationPreparedEvent事件出来,然后广播给相应的监听器,监听器拿到了相应的event,就会去执行对应的逻辑代码.    
//org.springframework.boot.context.event.EventPublishingRunListener#contextLoaded    
		listeners.contextLoaded(context);
	}
```



#### run.refreshContext() 方法



 最后是走到了 org.springframework.context.support.AbstractApplicationContext#refresh 这里,也就是走到refresh方法.



####  run.afterRefresh() 方法

 TODO



####  run -> listeners.started(context) 方法

这里可以看到是广播了一个 ApplicationStartedEvent 事件出去.

于是后面又广播了一个 AvailabilityChangeEvent 事件出去.

```java
	void started(ConfigurableApplicationContext context) {
		for (SpringApplicationRunListener listener : this.listeners) {
			listener.started(context);
		}
	}

----------------------
org.springframework.boot.context.event.EventPublishingRunListener#started    
    
	@Override
	public void started(ConfigurableApplicationContext context) {
		context.publishEvent(new ApplicationStartedEvent(this.application, this.args, context));
		AvailabilityChangeEvent.publish(context, LivenessState.CORRECT);
	}
```



####   run.callRunners()  方法

   该方法可以看到是, 分别获取出 ApplicationRunner 和 CommandLineRunner, 然后调用callRunner方法,该方法其内部也是去调用的run方法.

```java
	private void callRunners(ApplicationContext context, ApplicationArguments args) {
		List<Object> runners = new ArrayList<>();
// 从 context中获取出来 	ApplicationRunner.class / CommandLineRunner.class的Object,
// 然后都添加到 runners集合中        
		runners.addAll(context.getBeansOfType(ApplicationRunner.class).values());
		runners.addAll(context.getBeansOfType(CommandLineRunner.class).values());
// 排序        
		AnnotationAwareOrderComparator.sort(runners);
  // 迭代, 如果是 ApplicationRunner/CommandLineRunner,就分别强转为ApplicationRunner/CommandLineRunner
 //然后调用callRunner方法       
		for (Object runner : new LinkedHashSet<>(runners)) {
			if (runner instanceof ApplicationRunner) {
				callRunner((ApplicationRunner) runner, args);
			}
			if (runner instanceof CommandLineRunner) {
				callRunner((CommandLineRunner) runner, args);
			}
		}
	}
```



####  run  -> listeners.running(context) 方法

 可以看到 running是分别广播了二个事件出去.   然后相应的监听器分别获取到这个event,并且进行相应的逻辑处理.

 走完该方法,如果是没有出现任何异常的话,就会返回一个context,所以该run方法也就是走到这里就算走完了.

```java
	void running(ConfigurableApplicationContext context) {
		for (SpringApplicationRunListener listener : this.listeners) {
			listener.running(context);
		}
	}
	
	
	@Override
	public void running(ConfigurableApplicationContext context) {
// 广播一个  ApplicationReadyEvent 出去.	
		context.publishEvent(new ApplicationReadyEvent(this.application, this.args, context));
 // 广播一个 AvailabilityChangeEvent 出去.       
		AvailabilityChangeEvent.publish(context, ReadinessState.ACCEPTING_TRAFFIC);
	}
```

