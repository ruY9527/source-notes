## 		    SpringBoot创建Web环境



####  题记

 		 启动一个SpringBoot项目就相当于启动了一个web项目, 内嵌的tomcat, 那 SpringBoot是怎么启动这个代码的呢?

​        所以还是需要去看下其底层是怎么走的实现的.



####  方法

   org.springframework.boot.web.servlet.context.ServletWebServerApplicationContext#onRefresh

   当走 refresh 方法的时候, 如果只是单纯的Spring的话,那么这里就不会走到上面的子类.

   如果是基于SpringBoot查看的代码,并且也引入了 web环境,那么走 refresh的之后,跟进 onRefresh 方法,

   就会走到这里来.

```java
	@Override
	protected void onRefresh() {
		super.onRefresh();
		try {
            // 该方法主要看这个
			createWebServer();
		}
		catch (Throwable ex) {
			throw new ApplicationContextException("Unable to start web server", ex);
		}
	}
```

  

这里说下: ServletWebServerFactory 其子类是有一个抽象的ServletWebServerFactory,然后其抽象的中有三个子类分别是:  

JettyServletWebServerFactory/UndertowServletWebServerFactory /TomcatServletWebServerFactory

当然我们这里返回的是 tomcatServletWebServerFactory这个.

```java
	private void createWebServer() {
        // this.webServer 是 null
		WebServer webServer = this.webServer;
        // getServletContext返回的也是null
		ServletContext servletContext = getServletContext();
        //上面二个参数都是null,满足进入到if中的条件.
		if (webServer == null && servletContext == null) {
            // 这里返回的是 tomcatServletWebServerFactory,
            // 并且还会调用 doGetBean方法,这里也是有实例化这个 bean 的
			ServletWebServerFactory factory = getWebServerFactory();
 //getSelfInitializer()方法返回的是一个 ServletWebServerApplicationContext$lamdba这个
 //getWebServer() 方法: new一个Tomcat,然和给 basedir 设置上值.
 //接着创建一个Connector,Connector的throwOnFailure字段给设置上false,
 //tomcat.getService.addConnector(connector);添加到tomcat的service中去
 //customizeConnector()方法,先是拿端口号与0进行比较,我们这里默认是8080,也就是8080.
 //serverHeader如有有值的话,就会赋值到connector中去.
 //connector.getProtocolHandler()是AbstractProtocol的话,就会先获取出来,然和走customizeProtocol方法.
//invokeProtocolHandlerCustomizers:从方法名字上理解为,调用ProtocolHandlerCustomizers         //设置编码UTF-8,默认的.
//最后就是迭代 tomcatConnectorCustomizers,可以看到其调用的customize方法,都是进行一些tomcat的设置,比如最大线程数,最小线程数,最大连接等.  具体可以看下面的这种,customize开头的方法
//org.springframework.boot.autoconfigure.web.embedded.TomcatWebServerFactoryCustomizer#customizeXXXXXX       
// prepareContext方法: TODO
//最后返回了一个 TomcatServer对象来,其内部是有一个Tomcat的,tomcat都是一些启动信息的配置.
//            
			this.webServer = factory.getWebServer(getSelfInitializer());
//添加一个WebServerGracefulShutdownLifecycle,name是webServerGracefulShutdown到beanFactory,   //可以发现WebServerGracefulShutdownLifecycle是实现了SmartLifecycle,也就是说后面会回调到这个类的start方法的 
			getBeanFactory().registerSingleton("webServerGracefulShutdown",
					new WebServerGracefulShutdownLifecycle(this.webServer));
//添加一个 webServerStartStop到beanFactory中,WebServerStartStopLifecycle也是实现了SmartLifecycle接口的,也就是后面调用到这个类的start方法的. 
//可以看到其start方法,先是调用了this.webServer.start()方法,再是this.running=true设置为true,     //最后是广播出一个ServletWebServerInitializedEvent事件会相应的监听器.       
			getBeanFactory().registerSingleton("webServerStartStop",
					new WebServerStartStopLifecycle(this, this.webServer));
		}
		else if (servletContext != null) {
			try {
				getSelfInitializer().onStartup(servletContext);
			}
			catch (ServletException ex) {
				throw new ApplicationContextException("Cannot initialize servlet context", ex);
			}
		}
//        
		initPropertySources();
	}
```