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



