## 	               SpringBoot构造函数



​          SpringBoot可以说说目前Java人员都在使用的框架. 但是如果是仅仅停留在使用程度的话,那么还是比较可惜的.可以适当的阅读一下其底层代码是怎么实现的.  就其单Spring框架自身,阅读起来或者说是对其执行代码起来,还是需要大量的时间去理解的.  但是这不妨碍我们可以多阅读几遍,对其加强理解.



####  构造方法

 这是简单的启动一个 SpringBoot 项目. 这里先不看run方法,我们就先看这个 new SpringApplication 里面是怎么走的.

```java
    public static void main(String[] args) {

        SpringApplication application = new SpringApplication(BootSourceLearnApplication.class);
        ConfigurableApplicationContext applicationContext = application.run(args);

        // SpringApplication.run(BootSourceLearnApplication.class, args);

        // DispatcherServlet

    }
```



// 构造方法

```java
	/**
	 * Create a new {@link SpringApplication} instance. The application context will load
	 * beans from the specified primary sources (see {@link SpringApplication class-level}
	 * documentation for details. The instance can be customized before calling
	 * {@link #run(String...)}.
	 * @param primarySources the primary bean sources
	 * @see #run(Class, String[])
	 * @see #SpringApplication(ResourceLoader, Class...)
	 * @see #setSources(Set)
	 */
	public SpringApplication(Class<?>... primarySources) {
		this(null, primarySources);
	}

	/**
	 * Create a new {@link SpringApplication} instance. The application context will load
	 * beans from the specified primary sources (see {@link SpringApplication class-level}
	 * documentation for details. The instance can be customized before calling
	 * {@link #run(String...)}.
	 * @param resourceLoader the resource loader to use
	 * @param primarySources the primary bean sources
	 * @see #run(Class, String[])
	 * @see #setSources(Set)
	 传入进来的参数 : 
	 可以传入进来的 resourceLoader的值是null,
	 primarySources :  BootSourceLearnApplication.class 
	 */
	@SuppressWarnings({ "unchecked", "rawtypes" })
	public SpringApplication(ResourceLoader resourceLoader, Class<?>... primarySources) {
        // this.resourceLoader的值在这里目前也是 null.
		this.resourceLoader = resourceLoader;
        // 对传入进来的 primarySources参数进行检验,如果是null的话,这里是会有异常抛出来的,当然了,有异常的话,那么程序在这里自然也就会终止了.
		Assert.notNull(primarySources, "PrimarySources must not be null");
        // 将primarySources传入LinkedHashSet的集合中,并且赋值给this.primarySources.
		this.primarySources = new LinkedHashSet<>(Arrays.asList(primarySources));
        // org.springframework.boot.WebApplicationType , 枚举类, 这里返回的是 SERVLET
		this.webApplicationType = WebApplicationType.deduceFromClasspath();
        // 返回回来的 instances 集合 赋值给 this.initializers 参数
		setInitializers((Collection) getSpringFactoriesInstances(ApplicationContextInitializer.class));
        // 这个与上面的 getSpringFactoriesInstances(ApplicationContextInitializer.class) 是一样的,只是去根据条件传入的参数值不一样,自然其获取出来的值也是不一样的,只不过的是,这步我们是从cache中获取出来的,也就是说,其实在上一步调用这个方法的时候,就已经将这次的值也给获取出来了,并且放入到了cache的缓存Map中,所以这次获取是直接从cache中获取出来的.  然后赋值给 this.listeners 参数
		setListeners((Collection) getSpringFactoriesInstances(ApplicationListener.class));
 // 这里根据 "main".equals(stackTraceElement.getMethodName())进行判断获取 MainApplicationClass. 这里我们就已经将启动类的构造函数给看完了.
		this.mainApplicationClass = deduceMainApplicationClass();
	}
```



setInitializers((Collection) getSpringFactoriesInstances(ApplicationContextInitizlier.class)) 方法

该方法先走 getSpringFactoriesInstances()方法,

```java
	private <T> Collection<T> getSpringFactoriesInstances(Class<T> type) {
		return getSpringFactoriesInstances(type, new Class<?>[] {});
	}

	private <T> Collection<T> getSpringFactoriesInstances(Class<T> type, Class<?>[] parameterTypes, Object... args) {
        // 返回的是ClassUtils.getDefaultClassLoader():也就是默认的类加载器
		ClassLoader classLoader = getClassLoader();
		// Use names and ensure unique to protect against duplicates
//org.springframework.boot.context.ConfigurationWarningsApplicationContextInitializer
//org.springframework.boot.context.ContextIdApplicationContextInitializer
//org.springframework.boot.context.config.DelegatingApplicationContextInitializer
//org.springframework.boot.rsocket.context.RSocketPortInfoApplicationContextInitializer
//org.springframework.boot.web.context.ServerPortInfoApplicationContextInitializer
//org.springframework.boot.autoconfigure.SharedMetadataReaderFactoryContextInitializer
//org.springframework.boot.autoconfigure.logging.ConditionEvaluationReportLoggingListener //这里从META-INF/spring.factories里面读取出来的内容,其names对应的值就是上面这么多.       
		Set<String> names = new LinkedHashSet<>(SpringFactoriesLoader.loadFactoryNames(type, classLoader));
// createSpringFactoriesInstances : 从方法名字上看,是要创建spring.factories里面的实例.       
		List<T> instances = createSpringFactoriesInstances(type, parameterTypes, classLoader, args, names);
 // 然后将返回回来的instances排序下       
		AnnotationAwareOrderComparator.sort(instances);
		return instances;
	}


	/**
	 * Load the fully qualified class names of factory implementations of the
	 * given type from {@value #FACTORIES_RESOURCE_LOCATION}, using the given
	 * class loader.
	 * @param factoryType the interface or abstract class representing the factory
	 * @param classLoader the ClassLoader to use for loading resources; can be
	 * {@code null} to use the default
	 * @throws IllegalArgumentException if an error occurs while loading factory names
	 * @see #loadFactories
	 */
	public static List<String> loadFactoryNames(Class<?> factoryType, @Nullable ClassLoader classLoader) {
        // factoryTypeName : org.springframework.context.ApplicationContextInitializer
        // 
		String factoryTypeName = factoryType.getName();
        // loadSpringFactories(classLoader) 获取 META-INF/spring.factories下的一些配置信息,然后读取的内容将其封装成一个集合, getOrDefault方法,如果获取出来,有的话,就是用有的,没有的话,就返回一个空的集合.
		return loadSpringFactories(classLoader).getOrDefault(factoryTypeName, Collections.emptyList());
	}

//创建上面从spring.factroies中读取出来的内容. classLoader是在之前有获取的,是默认的.

	@SuppressWarnings("unchecked")
	private <T> List<T> createSpringFactoriesInstances(Class<T> type, Class<?>[] parameterTypes,
			ClassLoader classLoader, Object[] args, Set<String> names) {
		List<T> instances = new ArrayList<>(names.size());
		for (String name : names) {
			try {
                // 根据name,调用ClassUtils.forName来实例化,也就是通过反射的方法 
				Class<?> instanceClass = ClassUtils.forName(name, classLoader);
				Assert.isAssignable(type, instanceClass);
                // 获取起无参数构造函数
				Constructor<?> constructor = instanceClass.getDeclaredConstructor(parameterTypes);
                // 这里才是真正的实例化了这个对象,根据构造函数
				T instance = (T) BeanUtils.instantiateClass(constructor, args);
                // 然后放入一个集合中
				instances.add(instance);
			}
			catch (Throwable ex) {
				throw new IllegalArgumentException("Cannot instantiate " + type + " : " + name, ex);
			}
		}
		return instances;
	}
```



#### 添加 ApplicationContextInitializer 子类 

 来手动添加一个 ApplicationContextInitializer 的子类,

```java
package com.yang.bootsourcelearn.init;

import org.springframework.context.ApplicationContextInitializer;
import org.springframework.context.ConfigurableApplicationContext;

/***********************************************************************
 *<PRE>
 *
 *  File Name       : 
 *
 *  Creation Date   : 20-6-25
 *
 *  Author          : Gavin
 *
 *  Purpose         : 
 *
 *  History         : 
 *
 *</PRE>
 ***************************************************************************/
public class GavinYangApplicationContextInitializer implements ApplicationContextInitializer {
    public GavinYangApplicationContextInitializer(){
        System.out.println("GavinYang Init Bean");
    }

    @Override
    public void initialize(ConfigurableApplicationContext applicationContext) {
    }
}

```



然后在 resources 目录下面创建一个  META-INF 目录 , 再在 META-INF目录下创建一个 spring.factories 文件, 然后文件里面的内容我们就仿照SpringBoot里面的. 也给他加上一行

```java
# Application Context Initializersorg.springframework.context.ApplicationContextInitializer=\com.yang.bootsourcelearn.init.GavinYangApplicationContextInitializer
```



然后将判断给打到  setInitializers() 这个方法,根据去,  跟到断点: org.springframework.core.io.support.SpringFactoriesLoader#loadSpringFactories 到这里, 然后看 result 中,

org.springframework.context.ApplicationContextInitializer -> {LinkedList@1641} size = 8 , 这个 LinkedList中就有我们自定义的  com.yang.bootsourcelearn.init.GavinYangApplicationContextInitializer 的方法,

紧接着走完 createSpringFactoriesInstances 方法, 就可以看到我们无参构造函数中打印的 GavinYang Init Bean . 所以自顶一个还是很简单的. 由于我们不需要特别加什么,所以就没有对 重写的 initialize 进行什么添加. 



同样的 ApplicationListener.class , 我们也可以使用这样的方法进行自定义.



####  总结 :

 SpringApplication 构造函数方法,还是很好理解的, 代码阅读起来也很明白.

 1 :  对参数的检验和判断不是null,然后转化为集合,赋值给其属性.

 2 :  判断一些 WebApplicationType的类型.  SERVLET. 当然Spring5好像引入了一个 REACTIVE这个,可能很早之前就有了,因为我个人也是看Spring5的新特性才看到的这个.

3 :  根据 ApplicationContextInitializer.class 和  ApplicationListener.class , 从 META-INF/spring.factories 文件里面读取出对应的内容(这里的内容也就是一些类的全限定名字,然后分好类的),并且对其进行实例化.

4 : 最后获取一下启动类的class值,将其赋值给其内部的变量 mainApplicationClass .

