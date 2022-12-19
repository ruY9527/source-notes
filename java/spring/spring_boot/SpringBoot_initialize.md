## 		SpringBoot 中  Initializer



####  题记

​		最近看 SpringBoot 源码,看源码这个这个东西是真的要细心, 当你看到觉得重要的东西的时候,就一定要仔细去看,代码的走向以及走到了那个类中.  只有掌握这些,接下来才会更好理解.  

​      然后我今天在看的时候, org.springframework.boot.SpringApplication#prepareContext  --->  org.springframework.boot.SpringApplication#applyInitializers   当debug到这里的时候,就会看到 getInitializers() 方法返回的是一个集合,其中都是以Initializers 结尾的,并且都调用了相应的 initialize 方法. 所以就看下这个地方是要做写什么操作.

DelegatingApplicationContextInitializer

SharedMetadataReaderFactoryContextInitializer

ContextIdApplicationContextInitializer

ConfigurationWarningsApplicationContextInitializer

RSocketPortInfoApplicationContextInitializer

ServerPortInfoApplicationContextInitializer

ConditionEvaluationReportLoggingListener



如果我们没有进行扩展的话,这里就是默认的七个. 

其中有五个是在 SpringBoot源码下的 META-INF/spring.factories 下的 

org.springframework.context.ApplicationListener.

还有二个应该是在之前给添加进来的.   执行顺序是按照上面: 一次从下执行.



#### DelegatingApplicationContextInitializer

 

该方法就是获取 environment 中的 context.initializer.classes 指定的class信息

class信息也是要实现ApplicationContextInitializer接口的,然后实现完了,就会调用 initializer 方法.

也就是说该类,就是实例化配置  context.initializer.classes 中的子类,并且调用其 initializer 方法. 

```java
	@Override
	public void initialize(ConfigurableApplicationContext context) {
        // 获取 Environment
		ConfigurableEnvironment environment = context.getEnvironment();
        // context.initializer.classes,从evn中获取 classNames集合信息.
        // 获取出来的classNames是有值的话,就会迭代,
        //挨个调用Class.forName这个方法获取Class信息,最后返回集合回来
		List<Class<?>> initializerClasses = getInitializerClasses(environment);
		if (!initializerClasses.isEmpty()) {
         // 获取出来的classNames不是empty的话,就会走这里.
         // 最后调用BeanUtils.instantiateClass(initializerClass)实例化
         //这里实例化的对象,是要实现ApplicationContextInitializer接口的
  //最后可以看到这个方法,DelegatingApplicationContextInitializer#applyInitializers   
      // 可以看到该方法也是先排序,然后调用initialize方法.      
			applyInitializerClasses(context, initializerClasses);
		}
	}
```



####  SharedMetadataReaderFactoryContextInitializer

 添加一个  CachingMetadataReaderFactoryPostProcessor 到 ApplicationContext 中去.

 添加进去的 PostProcessor是其内部类,并且是私有的

```java
	@Override
	public void initialize(ConfigurableApplicationContext applicationContext) {
 // 添加一个 CachingMetadataReaderFactoryPostProcessor 到 applicationContext中去       
		applicationContext.addBeanFactoryPostProcessor(new CachingMetadataReaderFactoryPostProcessor());
	}
```



#### ContextIdApplicationContextInitializer

 可以看到该 Initializer 就是对 spring.application.name 进行获取,获取不到的话,就使用application默认值给设置到context中, 同时将 ContextId 也给注册到 beanFactory中去.

```java
	@Override
	public void initialize(ConfigurableApplicationContext applicationContext) {
        // ContextId 中的 id 字段的值,就是spring.application.name 这个字段对应的值
        // 如果没有的话,那么就是对用的值就是application
		ContextId contextId = getContextId(applicationContext);
        // 将id给设置到 applicationContext中去
		applicationContext.setId(contextId.getId());
        // 将contextId 注册到 beanFactory 中去.
		applicationContext.getBeanFactory().registerSingleton(ContextId.class.getName(), contextId);
	}
```



#### ConfigurationWarningsApplicationContextInitializer

 该Initializer 也是添加一个 PostProcessor 到 context中去.

```java
	@Override
	public void initialize(ConfigurableApplicationContext context) {
  // getCheck返回的一个ChWebServerInitializedEventeck数组,其只有一个ComponentScanPackageCheck类.
  // 然后在new一个PostProcessor给添加到 context 中去      
		context.addBeanFactoryPostProcessor(new ConfigurationWarningsPostProcessor(getChecks()));
	}
```





#### RSocketPortInfoApplicationContextInitializer

该方法主要是添加一个 Listener 到ApplicationContext 中去,其监听的event是 RSocketServerInitializedEvent

```java
	@Override
	public void initialize(ConfigurableApplicationContext applicationContext) {
        // new Listener中Listener是其内部类:
        // 可以看到 Listener 是有继承 ApplicationListener,
        // 并且监听的是 RSocketServerInitializedEvent 这个Event
        // 然后就将 listener给添加到 applicationContext 中去
		applicationContext.addApplicationListener(new Listener(applicationContext));
	}
```





#### ServerPortInfoApplicationContextInitializer

该类不仅仅是一个 Initializer,而且还是一个 Listener监听器.   主要是用来监听 WebServerInitializedEvent 的

```java
// 该类实现了ApplicationContextInitializer和ApplicationListener二个接口	
public class ServerPortInfoApplicationContextInitializer implements
		ApplicationContextInitializer<ConfigurableApplicationContext>, ApplicationListener<WebServerInitializedEvent> {
		
		}
	
	@Override
	public void initialize(ConfigurableApplicationContext applicationContext) {
  // 自己是监听器,监听WebServerInitializedEvent的event. 于是就将自己给添加到applicationContext中去.      
		applicationContext.addApplicationListener(this);
	}
```



#### ConditionEvaluationReportLoggingListener

 该 LoggingListener 虽然也是一个 Initializer, 但是其名字是没有包含任何Initializer的意思,反倒是作为监听器的,而且接受Event并不是其自身,而是内部类来接受,然后调用自己方法来处理Event来.

```java
	@Override
	public void initialize(ConfigurableApplicationContext applicationContext) {
        // 赋值给该类定义的变量 applicationContext
		this.applicationContext = applicationContext;
   // 然后new一个ConditionEvaluationReportListener的监听器,添加到applicationContext中去.
 // 而且看到这个该类的匿名类监听器:该监听器是监听所有的event. 
 //实测是ConditionEvaluationReportListener在获取event,真实是 ConditionEvaluationReportLoggingListener 在处理event.      
		applicationContext.addApplicationListener(new ConditionEvaluationReportListener());
 // 如果 application是 GenericApplicationContext或其子类的话,就会先从application中获取出beanFactory来
 //ConditionEvaluationReport.get():判断传入进来的beanFactory中是否包含:autoConfigurationReport  //如果是包含的话,就从其中获取. 如果不包含的话,就自己new一个,然后给注册到beanFactory中去.
// locateParent(): 从beanFactory中获取parentBeanFactory来,如果parentBeanFactory不是null并且包含  autoConfigurationReport 的话,就赋给 report.parent       
		if (applicationContext instanceof GenericApplicationContext) {
			// Get the report early in case the context fails to load
			this.report = ConditionEvaluationReport.get(this.applicationContext.getBeanFactory());
		}
	}

-------------------  
 // 匿名内部监听器: 直接调用类ConditionEvaluationReportLoggingListener的方法   
		@Override
		public void onApplicationEvent(ApplicationEvent event) {
			ConditionEvaluationReportLoggingListener.this.onApplicationEvent(event);
		}    
```



####  小站一把(自定义)

​	 我们先自己写一个类实现 ApplicationContextInitializer 这个接口. 当然,这个initialize 中可以做的事件还是有点多的,我这里就选择注册一个bean 到 Spring的 BeanFactory 中去吧.

```java
public class GavinYangSelfInializer implements ApplicationContextInitializer<ConfigurableApplicationContext>, Ordered {

    /**
     * 注册监听器
     * 注册bean到BeanFactory中去.
     * @param applicationContext
     */
    @Override
    public void initialize(ConfigurableApplicationContext applicationContext) {
        applicationContext.getBeanFactory().registerSingleton("gavinYangInit",new InitServiceImpl());
    }

    @Override
    public int getOrder() {
        return 0;
    }
}
```

​		

写一个实体类:  可以看到这个类是没什么其他的操作,就是一个方法.

```java
public class InitServiceImpl {
    public void say(){
        System.out.println("GavinYang万年帅");
    }
}
```



最后我们在启动完成了之后,从 applicationContext 中获取出这个bean来,并且调用这个方法.

```
        ConfigurableApplicationContext context = application.run(args);
        InitServiceImpl contextBean =(InitServiceImpl) context.getBean("gavinYangInit");
        contextBean.say();
```



最后就可以在控制台看到打印的: GavinYang万年帅

没错,我就是万年帅.  

到这里, 自己定义一个就完成了.

除了这种定义方式外,还可以看到 DelegatingApplicationContextInitializer 做的事情,也就是获取配置中context.initializer.classes的信息,然后实例化,在调用 initialize 方法.



####  总结

   可以看到, SpringBoot 中 在初始化 initialize这步的时候, 很多都是添加 postProcessor 和 listener 到 Spring 中去.  然后我们接着自己定义 initialize , 也就是添加一个对象到 beanFactory 中去. 最后获取出这个bean,然后调用其方法都是ok的.

