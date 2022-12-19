## 				       SpringCloud中Eureka_Server端阅读



####  题记 

​		公司的注册中心一直使用的是Eureka,其实在就应该写一篇记录来记录一下或者专门来阅读一下Eureka的源码.  SpringCloud全家桶中的组件,如果时间是充足的话,其中的源码阅读下,还是很不错的.  其中是可以学习到很多知识的.

​    构建项目 :  [地址https://github.com/baoyang23/boot-case-self/tree/master/txlcninit](https://github.com/baoyang23/boot-case-self/tree/master/txlcninit)	, 这里只用看txlcn-server模块的依赖和代码即可,仅仅只有依赖和启动类,并无其他的东西了.



####  Code

​    项目构建完了,就先启动看下有没有问题,至少保证搭建是ok的. 如果启动没问题的话,那么我们就可以肆无忌惮的去阅读其源码了.



在配置文件中加上打印log的级别和包,这样可以更好的看到源码里面打印的更多的log.

```java
logging:  
	level:    
		com.netflix: DEBUG
```



初次启动,就可以看下log的输出,定位下是那些类打印的,然后我们可以对那些类进行debug阅读. 这里我们可以看到AbstractInstanceRegistry 这个注册类的输出log

```java
2020-06-27 14:25:55.030  INFO 29855 --- [           main] c.n.e.registry.AbstractInstanceRegistry  : Finished initializing remote region registries. All known remote regions: []
2020-06-27 14:25:55.031  INFO 29855 --- [           main] c.n.eureka.DefaultEurekaServerContext    : Initialized
2020-06-27 14:25:55.040  INFO 29855 --- [           main] o.s.b.a.e.web.EndpointLinksResolver      : Exposing 2 endpoint(s) beneath base path '/actuator'
2020-06-27 14:25:55.090  INFO 29855 --- [           main] o.s.c.n.e.s.EurekaServiceRegistry        : Registering application YANG-EUREKA-SERVER with eureka with status UP

```



启动

 我们在启动类加上 @EnableEurekaServer 这个注解,然后在application.yml中也好配置信息,启动即可. 那么这个注解有这么神奇,就可以直接加载出 Eureka 中的全部内容 ? 

```java
@SpringBootApplication
@EnableEurekaServer
public class TxLcnEurekaServerApplication {
    public static void main(String[] args) {
        SpringApplication.run(TxLcnEurekaServerApplication.class,args);
    }
}

// 这里看 @Import这个注解,EurekaServerMarkerConfiguration这个类
@Target(ElementType.TYPE)
@Retention(RetentionPolicy.RUNTIME)
@Documented
@Import(EurekaServerMarkerConfiguration.class)
public @interface EnableEurekaServer {
}

// 这个使用一个配置的注解,然后注入一个marker的bean. 好像也没看到这个bean做了啥事情啊? 咋就能启动Eureka Server端的内容了呢? 真是让人百思不得姐.
@Configuration(proxyBeanMethods = false)
public class EurekaServerMarkerConfiguration {
	@Bean
	public Marker eurekaServerMarkerBean() {
		return new Marker();
	}
	class Marker {
	}
}
```

再来看一个东西, spring-cloud-netflix-eureka-server:2.2.1.RELEASE 这个maven的依赖. 2.2.1是引入的版本号.

然后看到 META-INF下spring.factories 这个文件. Spring在启动的时候,会读取这个地方的该文件.所以也就是会读取 org.springframework.cloud.netflix.eureka.server.EurekaServerAutoConfiguration 这个内容. 从名字上看,就是eureka的server端自动配置. 



EurekaServerAutoConfiguration

```java
// 先来看下这个类头上的注解是些什么意思.
@Configuration(proxyBeanMethods = false)
// 这个@Import注解,在出启动的注解中都是有说明使用到的.
@Import(EurekaServerInitializerConfiguration.class)
//有EurekaServerMarkerConfiguration.Marker.class这个bean的条件,该bean才会继续初始化到Spring容器中. 所以也就是说,如果我们没有加上@EnableEurekaServer注解的,也就不会有Marker这个bean了,所以这里也就不会有了.
@ConditionalOnBean(EurekaServerMarkerConfiguration.Marker.class)
//二个读取制定前缀的配置文件的类
@EnableConfigurationProperties({ EurekaDashboardProperties.class,
		InstanceRegistryProperties.class })
// 读取特定文件下的内容
@PropertySource("classpath:/eureka/server.properties")
public class EurekaServerAutoConfiguration implements WebMvcConfigurer {

}

// 然后注入一些bean进来.
	@Autowired
	private ApplicationInfoManager applicationInfoManager;

	/// 注入进来的EurekaServerConfig,可以点进去看到其子类:org.springframework.cloud.netflix.eureka.server.EurekaServerConfigBean,读取eureka.server前缀来头的配置	
	@Autowired
	private EurekaServerConfig eurekaServerConfig;
//类:org.springframework.cloud.netflix.eureka.EurekaClientConfigBean,这里是读取eureka.client开头的配置信息. 
	@Autowired
	private EurekaClientConfig eurekaClientConfig;

	@Autowired
	private EurekaClient eurekaClient;

// 注册一些实例的信息.读取的eureka.instance.registry开头的配置信息.
	@Autowired
	private InstanceRegistryProperties instanceRegistryProperties;


然后就是注入一些bean到Spring容器中来.
//  注入 PeerAwareInstanceRegistry到Spring容器中.    
	@Bean
	public PeerAwareInstanceRegistry peerAwareInstanceRegistry(
			ServerCodecs serverCodecs) {
		this.eurekaClient.getApplications(); // force initialization
  // new InstanceRegistry() 方法     
		return new InstanceRegistry(this.eurekaServerConfig, this.eurekaClientConfig,
				serverCodecs, this.eurekaClient,
				this.instanceRegistryProperties.getExpectedNumberOfClientsSendingRenews(),
				this.instanceRegistryProperties.getDefaultOpenForTrafficCount());
	}   


	/**
	 * Register the Jersey filter.
	 * @param eurekaJerseyApp an {@link Application} for the filter to be registered
	 * @return a jersey {@link FilterRegistrationBean}
注入FilterRegistrationBean到Spring容器中. 所有的/eureka/*的请求都要经过这个filter,其他的处理就会走ServletContainer.	 
	 */
	@Bean
	public FilterRegistrationBean<?> jerseyFilterRegistration(
			javax.ws.rs.core.Application eurekaJerseyApp) {
		FilterRegistrationBean<Filter> bean = new FilterRegistrationBean<Filter>();
		bean.setFilter(new ServletContainer(eurekaJerseyApp));
		bean.setOrder(Ordered.LOWEST_PRECEDENCE);
		bean.setUrlPatterns(
				Collections.singletonList(EurekaConstants.DEFAULT_PREFIX + "/*"));

		return bean;
	}

// 此处省略了详细代码. 添加了 @Path 和 @Provider 二个注解的filter.
// 然后添加 /eureka/(font/images/css/js)/*下面的文件信息. 最后注册到Spring容器中.
	@Bean
	public javax.ws.rs.core.Application jerseyApplication(Environment environment,
			ResourceLoader resourceLoader) {....}
```





org.springframework.cloud.netflix.eureka.server.EurekaServerInitializerConfiguration#start 该方法是如何被调用的?   可以看到这个方法是对 eurekaServerBootstrap进行初始化操作. 并且也有对应的event给发送出去. 在SpringBoot源码中是是可以看到有也有类似的event给publish出去.

```
	@Override
	public void start() {
		new Thread(() -> {
			try {
				// TODO: is this class even needed now?
				eurekaServerBootstrap.contextInitialized(
						EurekaServerInitializerConfiguration.this.servletContext);
				log.info("Started Eureka Server");

				publish(new EurekaRegistryAvailableEvent(getEurekaServerConfig()));
				EurekaServerInitializerConfiguration.this.running = true;
				publish(new EurekaServerStartedEvent(getEurekaServerConfig()));
			}
			catch (Exception ex) {
				// Help!
				log.error("Could not initialize Eureka servlet context", ex);
			}
		}).start();
	}
```