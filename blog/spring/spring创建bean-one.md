---
title: spring创建bean_one
date: 2021-11-04 00:14:45
tags: 
  - java
  - spring
categories:
  - java
  - spring
---



#### 前提

我们在创建 Spring Bean 的时候，是可以通过很多种方式来创建的. 但是这么多种方式,又是怎么加载的？是不是又有顺序呢？ 所以对 Spring 的 Bean 创建还是很有必要的.

#### 创建方式

我们可以通过自己创建 bd , 然后调用 registerBeanDefinition 方法给注册到 Spring 中来.

那么创建bd的怎么创建的呢？可以看到下面的二种创建方式.

这是通过 bd 来的.

```java
public class BeanDefinitionCreateAndRegister {


    public static void main(String[] args) {

        // 1 : 通过 BeanDefinitionBuilder 来创建 bd
        BeanDefinitionBuilder beanDefinitionBuilder = BeanDefinitionBuilder.genericBeanDefinition(Person.class);
        beanDefinitionBuilder.addPropertyValue("id",9527).addPropertyValue("name","GavinYang");
        BeanDefinition beanDefinition = beanDefinitionBuilder.getBeanDefinition();

        // 2 : 通过 new GenericBeanDefinition 来创建 bd.
        GenericBeanDefinition genericBeanDefinition = new GenericBeanDefinition();
        genericBeanDefinition.setBeanClass(Person.class);
        MutablePropertyValues mutablePropertyValues = new MutablePropertyValues();
        mutablePropertyValues.add("id",1).add("name","Peterwong");
        genericBeanDefinition.setPropertyValues(mutablePropertyValues);

        AnnotationConfigApplicationContext context = new AnnotationConfigApplicationContext();

        // 这里是给 bd 给注册到 Spring 容器里面来.
        // context.registerBeanDefinition("person",beanDefinition);
        context.registerBeanDefinition("peterwong",genericBeanDefinition);

        // 如果这里不调用 refresh 是会有错误的.
        context.refresh();

        Person person = context.getBean(Person.class);
        person.say();
        System.out.println(person.toString());

    }

}
```

通过我们常用的注解

这里主要是 @Import/@Bean/@Component+@ComponentScan 方式来注入对象到 Spring 容器中来.

```java
@Import(ImportBeanConfigMain.ImportConfig.class)
@ComponentScan(basePackages = "com.iyang.bean.bd")
public class ImportBeanConfigMain {
    
	public ImportBeanConfigMain(){
        System.out.println("ImportBeanConfigMain 无参数构造函数");
    }

    
    public static void main(String[] args) {

        AnnotationConfigApplicationContext context = new AnnotationConfigApplicationContext();
        context.register(ImportBeanConfigMain.class);
        context.refresh();

        ImportConfig importConfig = context.getBean(ImportConfig.class);
        Person person = context.getBean(Person.class);
        AnnotConfig annotConfig = context.getBean(AnnotConfig.class);
        ExternalConfig externalConfig = context.getBean(ExternalConfig.class);

        System.out.println(importConfig);
        System.out.println(person);
        System.out.println(annotConfig);
        System.out.println(externalConfig);

    }

    /**
     * 通过 @Import 导入进来.
     */
    public class ImportConfig{

        public void importMe(){
            System.out.println("这是导入自己的方法");
        }

        @Override
        public String toString() {
            return "ImportConfig 的 toString 方法";
        }

        public ImportConfig(){
            System.out.println("ImportConfig无参数构造函数");
        }
        /**
         * 使用 @Bean 注解 注入 Bean 进来.
         * @return
         */
        @Bean
        public Person importPerson(){
            return new Person(9527,"GavinYang");
        }

    }

    @Component
    public static class AnnotConfig{


        public AnnotConfig(){
            System.out.println("AnnotConfig无参数构造函数");
        }

        @Override
        public String toString() {
            return "使用注解来注入bean进来.";
        }
    }

}

@Component
class ExternalConfig {

    public ExternalConfig(){
        System.out.println("externalConfig 无参构造函数");
    }

    @Override
    public String toString() {
        return "externalConfig 打印 toString() 方法";
    }
}


----------------------------------------------
ImportBeanConfigMain 无参数构造函数    
externalConfig 无参构造函数
AnnotConfig无参数构造函数
ImportConfig无参数构造函数
person 有参数构造函数
ImportConfig 的 toString 方法
Person{id=9527, name='GavinYang'}
使用注解来注入bean进来.
externalConfig 打印 toString() 方法
    
// 这里可以看到new出来的对象打印顺序.
```

如果是基于创建 bd 的方式的话，是说明下是可以通过这种方式来将我们自己创建的对象给注入到Spring容器中来.我们主要来分析第二种,是做了什么事情.

#### @Import/@Bean/@Component+@ComponentScan 分析

在分析之前，我们看下我们的 beanClass 是怎么先注册到 Spring中来的,也就是在org.springframework.beans.factory.support.DefaultListableBeanFactory#beanDefinitionMap和org.springframework.beans.factory.support.DefaultListableBeanFactory#beanDefinitionNames中,可以看到一个是Map类型的,一个是集合类型的.

我们把断点打在 org.springframework.beans.factory.support.DefaultListableBeanFactory#registerBeanDefinition 进来的方法上就可以看到,然后看堆栈信息,就可以看到怎么一步一步给添加进来的.

##### 注册 Spring 中来走的方法

这里只用关注我们自己自己定义的，Spring内部的就不需要管了。

**ImportBeanConfigMain**

org.springframework.context.annotation.AnnotatedBeanDefinitionReader#registerBean(java.lang.Class<?>) —-> org.springframework.beans.factory.support.BeanDefinitionReaderUtils#registerBeanDefinition —-> org.springframework.context.support.GenericApplicationContext#registerBeanDefinition

**externalConfig**

org.springframework.context.support.AbstractApplicationContext#invokeBeanFactoryPostProcessors —->

org.springframework.context.support.PostProcessorRegistrationDelegate#invokeBeanDefinitionRegistryPostProcessors —–> org.springframework.context.annotation.ConfigurationClassPostProcessor#processConfigBeanDefinitions —-> org.springframework.context.annotation.ConfigurationClassParser#parse(org.springframework.core.type.AnnotationMetadata, java.lang.String) —> org.springframework.context.annotation.ConfigurationClassParser#doProcessConfigurationClass —->

org.springframework.context.annotation.ClassPathBeanDefinitionScanner#doScan —> org.springframework.context.annotation.ClassPathBeanDefinitionScanner#registerBeanDefinition

**importBeanConfigMain.AnnotConfig**

org.springframework.context.support.AbstractApplicationContext#invokeBeanFactoryPostProcessors —->org.springframework.context.support.PostProcessorRegistrationDelegate#invokeBeanFactoryPostProcessors(org.springframework.beans.factory.config.ConfigurableListableBeanFactory, java.util.List<org.springframework.beans.factory.config.BeanFactoryPostProcessor>) —-> org.springframework.context.annotation.ConfigurationClassPostProcessor#postProcessBeanDefinitionRegistry —-> org.springframework.context.annotation.ConfigurationClassPostProcessor#processConfigBeanDefinitions —> org.springframework.context.annotation.ConfigurationClassParser#parse(org.springframework.core.type.AnnotationMetadata, java.lang.String) —> org.springframework.context.annotation.ConfigurationClassParser#doProcessConfigurationClass —> org.springframework.context.annotation.ClassPathBeanDefinitionScanner#doScan —> org.springframework.context.annotation.ClassPathBeanDefinitionScanner#registerBeanDefinition

**com.iyang.bean.bd.ImportBeanConfigMain$ImportConfig**

org.springframework.context.support.AbstractApplicationContext#invokeBeanFactoryPostProcessors —> org.springframework.context.support.PostProcessorRegistrationDelegate#invokeBeanDefinitionRegistryPostProcessors —> org.springframework.context.annotation.ConfigurationClassPostProcessor#postProcessBeanDefinitionRegistry —-> org.springframework.context.annotation.ConfigurationClassBeanDefinitionReader#loadBeanDefinitions —> org.springframework.context.annotation.ConfigurationClassBeanDefinitionReader#registerBeanDefinitionForImportedConfigurationClass

**importPerson**

org.springframework.context.support.AbstractApplicationContext#invokeBeanFactoryPostProcessors —> org.springframework.context.support.PostProcessorRegistrationDelegate#invokeBeanDefinitionRegistryPostProcessors —> org.springframework.context.annotation.ConfigurationClassPostProcessor#postProcessBeanDefinitionRegistry —> org.springframework.context.annotation.ConfigurationClassBeanDefinitionReader#loadBeanDefinitions —> org.springframework.context.annotation.ConfigurationClassBeanDefinitionReader#loadBeanDefinitionsForBeanMethod

可以看到除了 ImportBeanConfigMain 在扫描的时候就被注册到 spring 容器里面来，后面的都是走的 AbstractApplicationContext#invokeBeanFactoryPostProcessors 方法给注册到 Spring 容器中来了. 是不是应该详细分析下 invokeBeanFactoryPostProcessors 方法到了做了什么或者说用了什么,将我们定义的对象给注册到 Spring 容器中来了呢？

##### invokeBeanFactoryPostProcessors 方法解析

从上面来看，这个方法并不是我们想象中那么简单的.

org.springframework.context.support.PostProcessorRegistrationDelegate#invokeBeanFactoryPostProcessors(org.springframework.beans.factory.config.ConfigurableListableBeanFactory, java.util.List<org.springframework.beans.factory.config.BeanFactoryPostProcessor>) 委托到这里来进行解析的,所以我们直接深度分析这个方法即可.

上面可以看到都是走的 PostProcessorRegistrationDelegate 这个类,但是我们并没有在这个方法中找到这个类.

```java
public static void invokeBeanFactoryPostProcessors(
      ConfigurableListableBeanFactory beanFactory, List<BeanFactoryPostProcessor> beanFactoryPostProcessors) {

   // Invoke BeanDefinitionRegistryPostProcessors first, if any.
   Set<String> processedBeans = new HashSet<>();

   if (beanFactory instanceof BeanDefinitionRegistry) {
      BeanDefinitionRegistry registry = (BeanDefinitionRegistry) beanFactory;
      List<BeanFactoryPostProcessor> regularPostProcessors = new ArrayList<>();
      List<BeanDefinitionRegistryPostProcessor> registryProcessors = new ArrayList<>();

      for (BeanFactoryPostProcessor postProcessor : beanFactoryPostProcessors) {
         if (postProcessor instanceof BeanDefinitionRegistryPostProcessor) {
            BeanDefinitionRegistryPostProcessor registryProcessor =
                  (BeanDefinitionRegistryPostProcessor) postProcessor;
            registryProcessor.postProcessBeanDefinitionRegistry(registry);
            registryProcessors.add(registryProcessor);
         }
         else {
            regularPostProcessors.add(postProcessor);
         }
      }

      // Do not initialize FactoryBeans here: We need to leave all regular beans
      // uninitialized to let the bean factory post-processors apply to them!
      // Separate between BeanDefinitionRegistryPostProcessors that implement
      // PriorityOrdered, Ordered, and the rest.
      List<BeanDefinitionRegistryPostProcessor> currentRegistryProcessors = new ArrayList<>();

      // First, invoke the BeanDefinitionRegistryPostProcessors that implement PriorityOrdered.
      String[] postProcessorNames =
            beanFactory.getBeanNamesForType(BeanDefinitionRegistryPostProcessor.class, true, false);
      for (String ppName : postProcessorNames) {
         if (beanFactory.isTypeMatch(ppName, PriorityOrdered.class)) {
            currentRegistryProcessors.add(beanFactory.getBean(ppName, BeanDefinitionRegistryPostProcessor.class));
            processedBeans.add(ppName);
         }
      }
      sortPostProcessors(currentRegistryProcessors, beanFactory);
      registryProcessors.addAll(currentRegistryProcessors);
// Note : 我们根据 debug 是可以跟进到这里的, 我们直接在这里打上断点,再来仔细看看这个方法做了什么事情.   // currentRegistryProcessors : org.springframework.context.annotation.ConfigurationClassPostProcessor      
// registry :  DefaultableListFactory 
// 走完这个方法,我们的bean信息都注册到 Spring 的 DefaultLitableFactory中来了.      
      invokeBeanDefinitionRegistryPostProcessors(currentRegistryProcessors, registry);
      currentRegistryProcessors.clear();

      // Next, invoke the BeanDefinitionRegistryPostProcessors that implement Ordered.
      postProcessorNames = beanFactory.getBeanNamesForType(BeanDefinitionRegistryPostProcessor.class, true, false);
      for (String ppName : postProcessorNames) {
         if (!processedBeans.contains(ppName) && beanFactory.isTypeMatch(ppName, Ordered.class)) {
            currentRegistryProcessors.add(beanFactory.getBean(ppName, BeanDefinitionRegistryPostProcessor.class));
            processedBeans.add(ppName);
         }
      }
      sortPostProcessors(currentRegistryProcessors, beanFactory);
      registryProcessors.addAll(currentRegistryProcessors);
      invokeBeanDefinitionRegistryPostProcessors(currentRegistryProcessors, registry);
      currentRegistryProcessors.clear();

      // Finally, invoke all other BeanDefinitionRegistryPostProcessors until no further ones appear.
      boolean reiterate = true;
      while (reiterate) {
         reiterate = false;
         postProcessorNames = beanFactory.getBeanNamesForType(BeanDefinitionRegistryPostProcessor.class, true, false);
         for (String ppName : postProcessorNames) {
            if (!processedBeans.contains(ppName)) {
               currentRegistryProcessors.add(beanFactory.getBean(ppName, BeanDefinitionRegistryPostProcessor.class));
               processedBeans.add(ppName);
               reiterate = true;
            }
         }
         sortPostProcessors(currentRegistryProcessors, beanFactory);
         registryProcessors.addAll(currentRegistryProcessors);
         invokeBeanDefinitionRegistryPostProcessors(currentRegistryProcessors, registry);
         currentRegistryProcessors.clear();
      }

      // Now, invoke the postProcessBeanFactory callback of all processors handled so far.
      invokeBeanFactoryPostProcessors(registryProcessors, beanFactory);
      invokeBeanFactoryPostProcessors(regularPostProcessors, beanFactory);
   }

   else {
      // Invoke factory processors registered with the context instance.
      invokeBeanFactoryPostProcessors(beanFactoryPostProcessors, beanFactory);
   }

   // Do not initialize FactoryBeans here: We need to leave all regular beans
   // uninitialized to let the bean factory post-processors apply to them!
   String[] postProcessorNames =
         beanFactory.getBeanNamesForType(BeanFactoryPostProcessor.class, true, false);

   // Separate between BeanFactoryPostProcessors that implement PriorityOrdered,
   // Ordered, and the rest.
   List<BeanFactoryPostProcessor> priorityOrderedPostProcessors = new ArrayList<>();
   List<String> orderedPostProcessorNames = new ArrayList<>();
   List<String> nonOrderedPostProcessorNames = new ArrayList<>();
   for (String ppName : postProcessorNames) {
      if (processedBeans.contains(ppName)) {
         // skip - already processed in first phase above
      }
      else if (beanFactory.isTypeMatch(ppName, PriorityOrdered.class)) {
         priorityOrderedPostProcessors.add(beanFactory.getBean(ppName, BeanFactoryPostProcessor.class));
      }
      else if (beanFactory.isTypeMatch(ppName, Ordered.class)) {
         orderedPostProcessorNames.add(ppName);
      }
      else {
         nonOrderedPostProcessorNames.add(ppName);
      }
   }

   // First, invoke the BeanFactoryPostProcessors that implement PriorityOrdered.
   sortPostProcessors(priorityOrderedPostProcessors, beanFactory);
   invokeBeanFactoryPostProcessors(priorityOrderedPostProcessors, beanFactory);

   // Next, invoke the BeanFactoryPostProcessors that implement Ordered.
   List<BeanFactoryPostProcessor> orderedPostProcessors = new ArrayList<>(orderedPostProcessorNames.size());
   for (String postProcessorName : orderedPostProcessorNames) {
      orderedPostProcessors.add(beanFactory.getBean(postProcessorName, BeanFactoryPostProcessor.class));
   }
   sortPostProcessors(orderedPostProcessors, beanFactory);
   invokeBeanFactoryPostProcessors(orderedPostProcessors, beanFactory);

   // Finally, invoke all other BeanFactoryPostProcessors.
   List<BeanFactoryPostProcessor> nonOrderedPostProcessors = new ArrayList<>(nonOrderedPostProcessorNames.size());
   for (String postProcessorName : nonOrderedPostProcessorNames) {
      nonOrderedPostProcessors.add(beanFactory.getBean(postProcessorName, BeanFactoryPostProcessor.class));
   }
   invokeBeanFactoryPostProcessors(nonOrderedPostProcessors, beanFactory);

   // Clear cached merged bean definitions since the post-processors might have
   // modified the original metadata, e.g. replacing placeholders in values...
   beanFactory.clearMetadataCache();
}
```

###### org.springframework.context.annotation.ConfigurationClassPostProcessor#processConfigBeanDefinitions 方法

```java
/**
 * Build and validate a configuration model based on the registry of
 * {@link Configuration} classes.
 */
public void processConfigBeanDefinitions(BeanDefinitionRegistry registry) {
   List<BeanDefinitionHolder> configCandidates = new ArrayList<>();
   String[] candidateNames = registry.getBeanDefinitionNames();

   for (String beanName : candidateNames) {
      BeanDefinition beanDef = registry.getBeanDefinition(beanName);
      if (beanDef.getAttribute(ConfigurationClassUtils.CONFIGURATION_CLASS_ATTRIBUTE) != null) {
         if (logger.isDebugEnabled()) {
            logger.debug("Bean definition has already been processed as a configuration class: " + beanDef);
         }
      }
// 对是否满足配置类进行检查, 这里我们的bean是importBeanConfigMain,满足条件的,具体可以看下面该方法的分析.然后会构建一个 bdHolder,添加到集合中来.
      else if (ConfigurationClassUtils.checkConfigurationClassCandidate(beanDef, this.metadataReaderFactory)) {
         configCandidates.add(new BeanDefinitionHolder(beanDef, beanName));
      }
   }

   // Return immediately if no @Configuration classes were found
   if (configCandidates.isEmpty()) {
      return;
   }

   // Sort by previously determined @Order value, if applicable
// 这里会根据 @Order 来进行排序下.
// 从 Integer.compare(i1, i2) 来分析，应该是从小到大的排序,也就是说,越小的话,优先级就约高. 
   configCandidates.sort((bd1, bd2) -> {
      int i1 = ConfigurationClassUtils.getOrder(bd1.getBeanDefinition());
      int i2 = ConfigurationClassUtils.getOrder(bd2.getBeanDefinition());
      return Integer.compare(i1, i2);
   });

   // Detect any custom bean name generation strategy supplied through the enclosing application context
   SingletonBeanRegistry sbr = null;
   if (registry instanceof SingletonBeanRegistry) {
// 满足类型条件强转下.       
      sbr = (SingletonBeanRegistry) registry;
      if (!this.localBeanNameGeneratorSet) {
// 这里不包含,所以返回的就是null.
//org.springframework.beans.factory.support.DefaultSingletonBeanRegistry#getSingleton(java.lang.String, boolean)          
         BeanNameGenerator generator = (BeanNameGenerator) sbr.getSingleton(
               AnnotationConfigUtils.CONFIGURATION_BEAN_NAME_GENERATOR);
         if (generator != null) {
            this.componentScanBeanNameGenerator = generator;
            this.importBeanNameGenerator = generator;
         }
      }
   }
// 确保environment不是null.
   if (this.environment == null) {
      this.environment = new StandardEnvironment();
   }

   // Parse each @Configuration class
// 创建一个解析 @Configuration 的对象.
// 在创建ConfigurationClassParser的这个有参构造函数里面,是可以看到又new了二个对象的,一个是ComponentScanAnnotationParser,一个是ConditionEvaluator.
// ComponentScanAnnotationParser 这个从名字上看,可以理解为@ComponentScan注解的解析.  
   ConfigurationClassParser parser = new ConfigurationClassParser(
         this.metadataReaderFactory, this.problemReporter, this.environment,
         this.resourceLoader, this.componentScanBeanNameGenerator, registry);

   Set<BeanDefinitionHolder> candidates = new LinkedHashSet<>(configCandidates);
   Set<ConfigurationClass> alreadyParsed = new HashSet<>(configCandidates.size());
   do {
// org.springframework.context.annotation.ConfigurationClassParser#processConfigurationClass这里走到这里,主要看这个方法中的doProcessConfigurationClass方法.       
      parser.parse(candidates);
// 这里对我们上面解析出来的bean进行valiate,如果validate失败的话,那么最后是会抛出一个异常来的.	       
      parser.validate();

// 装有我们解析出来的bean信息       
      Set<ConfigurationClass> configClasses = new LinkedHashSet<>(parser.getConfigurationClasses());
// 移除已经解析过了的.       
      configClasses.removeAll(alreadyParsed);

      // Read the model and create bean definitions based on its content
//如果this.reader是null的话,就会new一个ConfigurationClassBeanDefinitionReader出来.       
      if (this.reader == null) {
         this.reader = new ConfigurationClassBeanDefinitionReader(
               registry, this.sourceExtractor, this.resourceLoader, this.environment,
               this.importBeanNameGenerator, parser.getImportRegistry());
      }
 // 这里对我们获取的 bean 再进行一个 load.      
      this.reader.loadBeanDefinitions(configClasses);
// 解析过了的bean放入到 alreadyParsed 中来.       
      alreadyParsed.addAll(configClasses);

      candidates.clear();
// 扫描获取出来的bean个数大于 初始化传入进来的个数.       
      if (registry.getBeanDefinitionCount() > candidateNames.length) {
        // 获取出新扫描的bean信息.  
         String[] newCandidateNames = registry.getBeanDefinitionNames();
        // 旧的bean信息  
         Set<String> oldCandidateNames = new HashSet<>(Arrays.asList(candidateNames));
        // 表示已经注册过了的  
         Set<String> alreadyParsedClasses = new HashSet<>();
       // 将外面的 alreadyParsed 中的元素的 metadata的className给放入到alreadyParsedClasses集合中来.    
         for (ConfigurationClass configurationClass : alreadyParsed) {
            alreadyParsedClasses.add(configurationClass.getMetadata().getClassName());
         }
 // 对new的集合中元素进行迭代         
         for (String candidateName : newCandidateNames) {
       // 老的集合中不包含      
            if (!oldCandidateNames.contains(candidateName)) {
               BeanDefinition bd = registry.getBeanDefinition(candidateName);
                
       // alreadyParsedClasses 中不包含并且检验出需要配置的,比如有一些@Configuration等特殊注解，这个方法在之前是有提到的.         
               if (ConfigurationClassUtils.checkConfigurationClassCandidate(bd, this.metadataReaderFactory) &&
                     !alreadyParsedClasses.contains(bd.getBeanClassName())) {
           // 满足上面这些条件就会放入到candidates集合中来.         
                  candidates.add(new BeanDefinitionHolder(bd, candidateName));
               }
            }
         }
         candidateNames = newCandidateNames;
      }
   }
// candidates 是 empty 就跳出while循环,否则就认为还有bean需要解析.    
   while (!candidates.isEmpty());

   // Register the ImportRegistry as a bean in order to support ImportAware @Configuration classes
// org.springframework.context.annotation.ConfigurationClassPostProcessor.importRegistry sbr不包含importRegistry的话,就会注册一个进去.   
   if (sbr != null && !sbr.containsSingleton(IMPORT_REGISTRY_BEAN_NAME)) {
      sbr.registerSingleton(IMPORT_REGISTRY_BEAN_NAME, parser.getImportRegistry());
   }

   if (this.metadataReaderFactory instanceof CachingMetadataReaderFactory) {
      // Clear cache in externally provided MetadataReaderFactory; this is a no-op
      // for a shared cache since it'll be cleared by the ApplicationContext.
 // 这里是清除缓存,也是清除一些集合.      
      ((CachingMetadataReaderFactory) this.metadataReaderFactory).clearCache();
   }
}
```

**走完这个方法,如果是debug模式的话,就可以在 registry(也就是DefaultListableBeanFactory)的 beanDefintionMap和beanDefinitionNames这二个集合中是可以看到我们的bean名字已经bean对应的class信息的.**

###### org.springframework.context.annotation.ConfigurationClassParser#doProcessConfigurationClass方法

可以看到这个方法就是对 configuration 类进行处理的.

```java
/**
 * Apply processing and build a complete {@link ConfigurationClass} by reading the
 * annotations, members and methods from the source class. This method can be called
 * multiple times as relevant sources are discovered.
 * @param configClass the configuration class being build
 * @param sourceClass a source class
 * @return the superclass, or {@code null} if none found or previously processed
 */
@Nullable
protected final SourceClass doProcessConfigurationClass(ConfigurationClass configClass, SourceClass sourceClass)
      throws IOException {

// 判断是不是有 @Component 注解.  
   if (configClass.getMetadata().isAnnotated(Component.class.getName())) {
      // Recursively process any member (nested) classes first
      processMemberClasses(configClass, sourceClass);
   }

   // Process any @PropertySource annotations
// 接着再处理 @PropertySources 注解. 可以看到这个注解貌似是和 Environment 有关系.   
   for (AnnotationAttributes propertySource : AnnotationConfigUtils.attributesForRepeatable(
         sourceClass.getMetadata(), PropertySources.class,
         org.springframework.context.annotation.PropertySource.class)) {
      if (this.environment instanceof ConfigurableEnvironment) {
         processPropertySource(propertySource);
      }
      else {
         logger.info("Ignoring @PropertySource annotation on [" + sourceClass.getMetadata().getClassName() +
               "]. Reason: Environment must implement ConfigurableEnvironment");
      }
   }

   // Process any @ComponentScan annotations
// 获取@ComponentScan 注解,我们这里是有的.    
   Set<AnnotationAttributes> componentScans = AnnotationConfigUtils.attributesForRepeatable(
         sourceClass.getMetadata(), ComponentScans.class, ComponentScan.class);
   if (!componentScans.isEmpty() &&
         !this.conditionEvaluator.shouldSkip(sourceClass.getMetadata(), ConfigurationPhase.REGISTER_BEAN)) {
      for (AnnotationAttributes componentScan : componentScans) {
         // The config class is annotated with @ComponentScan -> perform the scan immediately
          
// org.springframework.context.annotation.ComponentScanAnnotationParser#parse
// parse 方法内部是使用 ClassPathBeanDefinitionScanner 扫描器的,对resourcePattern/includeFilters/excludeFilters/lazyInit 是否有进行处理.
// 获取注解上的属性 basePackages/basePackageClasses的值,添加一个AbstractTypeHierarchyTraversingFilter,这个是ExcludeFilter
//最后来org.springframework.context.annotation.ClassPathBeanDefinitionScanner#doScan做扫描操作.
//doScan做了什么事情呢? 显示通过传入进来的包,调用findCandidateComponents获取出bd的集合来,ScopeMetadata设置也是默认的,用beanNameGenerator生成bean对应的beanName
//如果bd是AbstractBeanDefinition,再走一下postProcessBeanDefinition方法
//如果bd是AnnotatedBeanDefinition,会走AnnotationConfigUtils.processCommonDefinitionAnnotations()方法,也是对一些注解的属性进行设置值操作. 走个checkCandidat检查方法,确保bd再registry中不存在的,如果存在的话,那就说明是已经注册过了的.     //如果是不存在的话,就会new一个BeanDefinitionHolder来,然后走registerBeanDefinition给注册到Spring容器中来. 最后返回扫描获取到的bdHolder集合来.     
         Set<BeanDefinitionHolder> scannedBeanDefinitions =
               this.componentScanParser.parse(componentScan, sourceClass.getMetadata().getClassName());
         // Check the set of scanned definitions for any further config classes and parse recursively if needed
         for (BeanDefinitionHolder holder : scannedBeanDefinitions) {
            BeanDefinition bdCand = holder.getBeanDefinition().getOriginatingBeanDefinition();
            if (bdCand == null) {
               bdCand = holder.getBeanDefinition();
            }
// 可以看到这里, 我们在最初进入到processConfigBeanDefinitions来的时候,其实就已经是调用了这个方法,那么我们这里扫描获取的bean在此调用这个方法. 也就是确保,扫描获取的bean,也是有一些配置的注解并且也是需要解析的.           
            if (ConfigurationClassUtils.checkConfigurationClassCandidate(bdCand, this.metadataReaderFactory)) {
// org.springframework.context.annotation.ConfigurationClassParser#processConfigurationClass这里最后也是走到这里了.
// 最初我们是从parse.parse() 进来的,也是走的ConfigurationClassParser#processConfigurationClas,这里又走到了该方法.
// 也就说我们是调用这个方法,只要满足条件的话,就会一直调用这个方法,直到不满足条件为止.                
               parse(bdCand.getBeanClassName(), holder.getBeanName());
            }
         }
      }
   }

   // Process any @Import annotations
// 这里是对 @Import 注解进行处理. 该方法是有利用 importStack 来控制,
// 其内部又分为 @ImportSelector/@ImportBeanDefinitionRegistrar/无注解这三种情况.
// 获取完 bean 信息后,就又走到了org.springframework.context.annotation.ConfigurationClassParser#processConfigurationClass方法来.
// 最后importStack 调用 pop 给数据给弹出来.    
   processImports(configClass, sourceClass, getImports(sourceClass), true);

   // Process any @ImportResource annotations
// 对@ImportResource是否有进行判断.    
   AnnotationAttributes importResource =
         AnnotationConfigUtils.attributesFor(sourceClass.getMetadata(), ImportResource.class);
   if (importResource != null) {
      String[] resources = importResource.getStringArray("locations");
      Class<? extends BeanDefinitionReader> readerClass = importResource.getClass("reader");
      for (String resource : resources) {
         String resolvedResource = this.environment.resolveRequiredPlaceholders(resource);
         configClass.addImportedResource(resolvedResource, readerClass);
      }
   }

   // Process individual @Bean methods
// @Bean 注解处理.
//org.springframework.context.annotation.ConfigurationClassParser#retrieveBeanMethodMetadata , 
// 这里对于主入口类进来,是没有这个配置的.    
   Set<MethodMetadata> beanMethods = retrieveBeanMethodMetadata(sourceClass);
   for (MethodMetadata methodMetadata : beanMethods) {
      configClass.addBeanMethod(new BeanMethod(methodMetadata, configClass));
   }

   // Process default methods on interfaces
// 对接口的进行处理. 这里目前也是没有的.    
   processInterfaces(configClass, sourceClass);

   // Process superclass, if any
// 先是判断是不是有父类.    
   if (sourceClass.getMetadata().hasSuperClass()) {
// 获取出父类信息       
      String superclass = sourceClass.getMetadata().getSuperClassName();
// 父类不是null,不是java开头并且knownSuperclasses中不存在,就满满足条件.       
      if (superclass != null && !superclass.startsWith("java") &&
            !this.knownSuperclasses.containsKey(superclass)) {
         this.knownSuperclasses.put(superclass, configClass);
         // Superclass found, return its annotation metadata and recurse
         return sourceClass.getSuperClass();
      }
   }

   // No superclass -> processing is complete
   return null;
}
```

**这里可以看到 doProcessConfigurationClass方法,是传入进来主类入口进行解析, 然后没满足一个条件的bean,都会在走一遍解析的方法,直到都走到没满足条件的.**

###### org.springframework.context.annotation.ConfigurationClassUtils#checkConfigurationClassCandidate方法

```java
/**
 * Check whether the given bean definition is a candidate for a configuration class
 * (or a nested component class declared within a configuration/component class,
 * to be auto-registered as well), and mark it accordingly.
 * @param beanDef the bean definition to check
 * @param metadataReaderFactory the current factory in use by the caller
 * @return whether the candidate qualifies as (any kind of) configuration class
 */
public static boolean checkConfigurationClassCandidate(
      BeanDefinition beanDef, MetadataReaderFactory metadataReaderFactory) {
// 先获取 beanName 出来
   String className = beanDef.getBeanClassName();
   if (className == null || beanDef.getFactoryMethodName() != null) {
      return false;
   }

   AnnotationMetadata metadata;
// 判断 bd 是不是AnnotatedBeanDefinition 并且 确认 beanName是不是与前面获取出来的classsName是一样的.    
   if (beanDef instanceof AnnotatedBeanDefinition &&
         className.equals(((AnnotatedBeanDefinition) beanDef).getMetadata().getClassName())) {
      // Can reuse the pre-parsed metadata from the given BeanDefinition...
// 获取类上的注解.我们这里获取出来的是 @Import 和 @ComponentScan       
      metadata = ((AnnotatedBeanDefinition) beanDef).getMetadata();
   }
   else if (beanDef instanceof AbstractBeanDefinition && ((AbstractBeanDefinition) beanDef).hasBeanClass()) {
      // Check already loaded Class if present...
      // since we possibly can't even load the class file for this Class.
      Class<?> beanClass = ((AbstractBeanDefinition) beanDef).getBeanClass();
      if (BeanFactoryPostProcessor.class.isAssignableFrom(beanClass) ||
            BeanPostProcessor.class.isAssignableFrom(beanClass) ||
            AopInfrastructureBean.class.isAssignableFrom(beanClass) ||
            EventListenerFactory.class.isAssignableFrom(beanClass)) {
         return false;
      }
      metadata = AnnotationMetadata.introspect(beanClass);
   }
   else {
      try {
         MetadataReader metadataReader = metadataReaderFactory.getMetadataReader(className);
         metadata = metadataReader.getAnnotationMetadata();
      }
      catch (IOException ex) {
         if (logger.isDebugEnabled()) {
            logger.debug("Could not find class file for introspecting configuration annotations: " +
                  className, ex);
         }
         return false;
      }
   }

 // 获取@Configuration,我们这里没有,所以获取出来的null.   
   Map<String, Object> config = metadata.getAnnotationAttributes(Configuration.class.getName());
   if (config != null && !Boolean.FALSE.equals(config.get("proxyBeanMethods"))) {
      beanDef.setAttribute(CONFIGURATION_CLASS_ATTRIBUTE, CONFIGURATION_CLASS_FULL);
   }
// 注意这里的 isConfigurationCandidate方法,org.springframework.context.annotation.ConfigurationClassUtils#isConfigurationCandidate
// @Component/@ComponentScan/@Import/@ImportResource,只要有其中的一种的话，那么返回的就是true. 
   else if (config != null || isConfigurationCandidate(metadata)) {
// CONFIGURATION_CLASS_ATTRIBUTE 对应的值是org.springframework.context.annotation.ConfigurationClassPostProcessor.configurationClass       
      beanDef.setAttribute(CONFIGURATION_CLASS_ATTRIBUTE, CONFIGURATION_CLASS_LITE);
   }
   else {
      return false;
   }

   // It's a full or lite configuration candidate... Let's determine the order value, if any.
// 获取 order,如果有的话,就会set进去.    
   Integer order = getOrder(metadata);
   if (order != null) {
      beanDef.setAttribute(ORDER_ATTRIBUTE, order);
   }

   return true;
}
```

**可以看到这个方法最主的就是对一些类上是否有注解进行判断, 如果满足 @Configuration/@Component/@ComponentScan/@Import/@ImportResource,那么返回的就是会true,同时也会set一个CONFIGURATION_CLASS_ATTRIBUTE属性到bd里面来.**

#### getBean方法分析

 getBean 不仅仅是获取bean的效果,更是创建bean的，可以看到getBean最后走到了createBean方法来.

 org.springframework.beans.factory.support.DefaultListableBeanFactory#preInstantiateSingletons : 这里我们直接定位到这个方法,来看下是怎么调用的,调用之前/实例化bean等过程,又做了什么事情？

##### preInstantiateSingletons 方法

```java
@Override
public void preInstantiateSingletons() throws BeansException {
   if (logger.isTraceEnabled()) {
      logger.trace("Pre-instantiating singletons in " + this);
   }

   // Iterate over a copy to allow for init methods which in turn register new bean definitions.
   // While this may not be part of the regular factory bootstrap, it does otherwise work fine.
// 从 beanDefinitionNames 中获取出 beanName的集合.
// 这里获取出来的 beanNameList 不仅仅有Spring内部的,还有我们自己的.    
   List<String> beanNames = new ArrayList<>(this.beanDefinitionNames);

   // Trigger initialization of all non-lazy singleton beans...
   for (String beanName : beanNames) {
      RootBeanDefinition bd = getMergedLocalBeanDefinition(beanName);
// bd不是抽象的,是单列的,不是赖加载的,就进入到这里来.       
      if (!bd.isAbstract() && bd.isSingleton() && !bd.isLazyInit()) {
    // 判断是不是 FactoryBean      
         if (isFactoryBean(beanName)) {
            Object bean = getBean(FACTORY_BEAN_PREFIX + beanName);
            if (bean instanceof FactoryBean) {
               final FactoryBean<?> factory = (FactoryBean<?>) bean;
               boolean isEagerInit;
               if (System.getSecurityManager() != null && factory instanceof SmartFactoryBean) {
                  isEagerInit = AccessController.doPrivileged((PrivilegedAction<Boolean>)
                              ((SmartFactoryBean<?>) factory)::isEagerInit,
                        getAccessControlContext());
               }
               else {
                  isEagerInit = (factory instanceof SmartFactoryBean &&
                        ((SmartFactoryBean<?>) factory).isEagerInit());
               }
               if (isEagerInit) {
                  getBean(beanName);
               }
            }
         }
         else {
      // 如果不是 FactroyBean的话,就直接走 getBean方法.       
            getBean(beanName);
         }
      }
   }

   // Trigger post-initialization callback for all applicable beans...
// 根据 beanNames 来进行迭代.    
   for (String beanName : beanNames) {
   // 根据 beanName 来获取对象.    
// org.springframework.beans.factory.support.DefaultSingletonBeanRegistry#getSingleton(java.lang.String, boolean)       
      Object singletonInstance = getSingleton(beanName);
  // 满足是 SmartInitializingSingleton 接口的子类. 最后就都会调用 afterSingletonsInstantiated 方法, 这个也算是bean自身实现SmartInitializingSingleton接口来做的一种扩展.  
      if (singletonInstance instanceof SmartInitializingSingleton) {
         final SmartInitializingSingleton smartSingleton = (SmartInitializingSingleton) singletonInstance;
         if (System.getSecurityManager() != null) {
            AccessController.doPrivileged((PrivilegedAction<Object>) () -> {
               smartSingleton.afterSingletonsInstantiated();
               return null;
            }, getAccessControlContext());
         }
         else {
            smartSingleton.afterSingletonsInstantiated();
         }
      }
   }
}
```

可以看到 preInstanitateSingletons方法，根据beanDefinitionNames中注册过的beanName集合,调用getBean方法来创建这个bean. 当创建完所有的bean后,判断是不是有实现 SmartInitializingSingleton 接口的bean,如果有的话, 就会调用这个bean 的afterSingletonsInstantiated方法.

###### doGetBean() 方法

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
// 获取beanName
   final String beanName = transformedBeanName(name);
   Object bean;

   // Eagerly check singleton cache for manually registered singletons.
 //   这里是判断是不是手动给添加到单例池里面去的.
   Object sharedInstance = getSingleton(beanName);
   if (sharedInstance != null && args == null) {
      if (logger.isTraceEnabled()) {
         if (isSingletonCurrentlyInCreation(beanName)) {
            logger.trace("Returning eagerly cached instance of singleton bean '" + beanName +
                  "' that is not fully initialized yet - a consequence of a circular reference");
         }
         else {
            logger.trace("Returning cached instance of singleton bean '" + beanName + "'");
         }
      }
// 如果是从单例池里面获取出来的,就走这个方法.    
      bean = getObjectForBeanInstance(sharedInstance, name, beanName, null);
   }

   else {
      // Fail if we're already creating this bean instance:
      // We're assumably within a circular reference.
  // 判断这个bean当前是不是已经在注册了,如果是的话,就会抛出异常来.  
//org.springframework.beans.factory.support.AbstractBeanFactory#prototypesCurrentlyInCreation,利用ThreadLocal来记录值,如果beanName是相同的话就会返回ture,否则就返回flase,这里返回的是false.       
      if (isPrototypeCurrentlyInCreation(beanName)) {
         throw new BeanCurrentlyInCreationException(beanName);
      }

      // Check if bean definition exists in this factory.
 //  org.springframework.beans.factory.support.AbstractBeanFactory#getParentBeanFactory获取父工厂,这里返回的是null,也就是说是没有的.所以下面的if条件也就不会进去.     
      BeanFactory parentBeanFactory = getParentBeanFactory();
      if (parentBeanFactory != null && !containsBeanDefinition(beanName)) {
         // Not found -> check parent.
         String nameToLookup = originalBeanName(name);
         if (parentBeanFactory instanceof AbstractBeanFactory) {
            return ((AbstractBeanFactory) parentBeanFactory).doGetBean(
                  nameToLookup, requiredType, args, typeCheckOnly);
         }
         else if (args != null) {
            // Delegation to parent with explicit args.
            return (T) parentBeanFactory.getBean(nameToLookup, args);
         }
         else if (requiredType != null) {
            // No args -> delegate to standard getBean method.
            return parentBeanFactory.getBean(nameToLookup, requiredType);
         }
         else {
            return (T) parentBeanFactory.getBean(nameToLookup);
         }
      }

// typeCheckOnly 在此处的值是 false.
//org.springframework.beans.factory.support.AbstractBeanFactory#alreadyCreated,利用Set集合来标记是否创建,可以看到往alreadyCreated中添加元素进去的时候,还使用了synchronized来加锁判断并且使用了双重if,可以看到我们在接触单例模式的时候，也是有使用  synchronized + 双重if的.      
      if (!typeCheckOnly) {
         markBeanAsCreated(beanName);
      }

      try {
// 获取出 bd 来,org.springframework.beans.factory.support.AbstractBeanFactory#mergedBeanDefinitions,从这个ConcurrentHashMap中获取出来,也就是说这个mergedBeanDefinitions Map 中,key就是beanName,value就是对应的bd.          
         final RootBeanDefinition mbd = getMergedLocalBeanDefinition(beanName);
          
// 对 bd 进行检查,如果是抽象的话,就会抛出异常来.          
         checkMergedBeanDefinition(mbd, beanName, args);

         // Guarantee initialization of beans that the current bean depends on.
 // 获取 @DependsOn 注解.并且对 @Depends进行处理.         
         String[] dependsOn = mbd.getDependsOn();
         if (dependsOn != null) {
            for (String dep : dependsOn) {
               if (isDependent(beanName, dep)) {
                  throw new BeanCreationException(mbd.getResourceDescription(), beanName,
                        "Circular depends-on relationship between '" + beanName + "' and '" + dep + "'");
               }
               registerDependentBean(dep, beanName);
               try {
                  getBean(dep);
               }
               catch (NoSuchBeanDefinitionException ex) {
                  throw new BeanCreationException(mbd.getResourceDescription(), beanName,
                        "'" + beanName + "' depends on missing bean '" + dep + "'", ex);
               }
            }
         }

         // Create bean instance.
 // 确保 bd 是单例的.     
         if (mbd.isSingleton()) {
            sharedInstance = getSingleton(beanName, () -> {
               try {
                  return createBean(beanName, mbd, args);
               }
               catch (BeansException ex) {
                  // Explicitly remove instance from singleton cache: It might have been put there
                  // eagerly by the creation process, to allow for circular reference resolution.
                  // Also remove any beans that received a temporary reference to the bean.
                  destroySingleton(beanName);
                  throw ex;
               }
            });
             
// 获取bean实例             
            bean = getObjectForBeanInstance(sharedInstance, name, beanName, mbd);
         }
// 这里是实例化一个 多列的 bean
         else if (mbd.isPrototype()) {
            // It's a prototype -> create a new instance.
            Object prototypeInstance = null;
            try {
               beforePrototypeCreation(beanName);
               prototypeInstance = createBean(beanName, mbd, args);
            }
            finally {
               afterPrototypeCreation(beanName);
            }
            bean = getObjectForBeanInstance(prototypeInstance, name, beanName, mbd);
         }

         else {
// 这里操作的,不仅单列也不是多列.
            String scopeName = mbd.getScope();
            final Scope scope = this.scopes.get(scopeName);
            if (scope == null) {
               throw new IllegalStateException("No Scope registered for scope name '" + scopeName + "'");
            }
            try {
               Object scopedInstance = scope.get(beanName, () -> {
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
                     "defining a scoped proxy for this bean if you intend to refer to it from a singleton",
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
 // 不满足条件,所以没进入到这里.   
   if (requiredType != null && !requiredType.isInstance(bean)) {
      try {
         T convertedBean = getTypeConverter().convertIfNecessary(bean, requiredType);
         if (convertedBean == null) {
            throw new BeanNotOfRequiredTypeException(name, requiredType, bean.getClass());
         }
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

// 直接返回了 bean 信息.    
   return (T) bean;
}
```

doGetBean方法 : 可以看到该方法主要是对 bean 分为三种类型来进行初始化 , 分别是 mbd.isSingleton/mbd.isPrototype()/非前二者 这三种情况. 在分这三种情况之前,还对@DependsOn 注解来进行分析,也就说当你初始化这个bean的时候,如果它依赖了一个宁外的bean,就会先去初始化宁外一个bean,也就是调用了 getBean 方法, 而getBean方法就是走的 doGetBean() —> createBean() 也就是走到了自身这里,是一种递归调用.

然后我们这里是单例的,自然就往下走了 createBean 方法.

###### createBean() 方法

从名字来看,还是可以很很闲的感受到,是创建bean的方法.

```java
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
   RootBeanDefinition mbdToUse = mbd;

   // Make sure bean class is actually resolved at this point, and
   // clone the bean definition in case of a dynamically resolved Class
   // which cannot be stored in the shared merged bean definition.
// 确定bean的class, 如果bd有beanClass的信息,就会直接返回.    
   Class<?> resolvedClass = resolveBeanClass(mbd, beanName);
//如果这里从bd获取出来的class是有值的,然后bd是没有beanCalss,获取出来的beanClassName也是null的话,那么这里就会重新来构建出一个bd,并且设置上 beanClass信息.    
   if (resolvedClass != null && !mbd.hasBeanClass() && mbd.getBeanClassName() != null) {
      mbdToUse = new RootBeanDefinition(mbd);
      mbdToUse.setBeanClass(resolvedClass);
   }

   // Prepare method overrides.
// 准备重写的方法信息,先判断是不是有重写的方法,    
   try {
      mbdToUse.prepareMethodOverrides();
   }
   catch (BeanDefinitionValidationException ex) {
      throw new BeanDefinitionStoreException(mbdToUse.getResourceDescription(),
            beanName, "Validation of method overrides failed", ex);
   }

   try {
// 这是 Spring 系统默认的后置处理器,是有六个的.       
// ApplicationContextAwareProcessor ,  ConfigurationClassPostProcessor$ImportAwareBeanPostProcessor , PostProcessorRegistrationDelegate$BeanPostProcessorCheck , CommonAnnotationBeanPostProcessor ,  AutowiredAnnotationBeanPostProcessor ,  ApplicationListenerDetector ,        
       
      // Give BeanPostProcessors a chance to return a proxy instead of the target bean instance.
// Apply before-instantiation post-processors, resolving whether there is a before-instantiation shortcut for the specified bean. 可以看到这里有个应用实例化前的处理器,
//org.springframework.beans.factory.support.AbstractAutowireCapableBeanFactory#resolveBeforeInstantiation,可以看到这个方法里面,满足条件的话,会调用applyBeanPostProcessorsBeforeInstantiation() / applyBeanPostProcessorsAfterInitialization() 这二个方法的.
// 走完 applyBeanPostProcessorsBeforeInstantiation 方法,如果前置处理器能够返回bean回来并且不是null的话,就会继续走applyBeanPostProcessorsAfterInitialization方法.
// 我们这里返回的 bean 是null,如果不是null的话,就会直接返回的.       
      Object bean = resolveBeforeInstantiation(beanName, mbdToUse);
      if (bean != null) {
         return bean;
      }
   }
   catch (Throwable ex) {
      throw new BeanCreationException(mbdToUse.getResourceDescription(), beanName,
            "BeanPostProcessor before instantiation of bean failed", ex);
   }

// 上面的前置处理器applyBeanPostProcessorsBeforeInstantiation返回的bean是null的话,就会接着这个下面继续往下走.  于是就有了走 doCreateBean 方法.   
   try {
      Object beanInstance = doCreateBean(beanName, mbdToUse, args);
      if (logger.isTraceEnabled()) {
         logger.trace("Finished creating instance of bean '" + beanName + "'");
      }
 // 返回 bean 对象回去.      
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

createBean 方法 : 可以看到createBean在创建之前走了前置处理器,如果前置处理器返回的bean不是null,那么也就没有下面的doCreateBean什么事情了. 如果返回的bean是null的话,那么就会走到下面的doCreateBean方法,可以理解为这个方法才是真正调用反射去获取 bean 对象实例的方法 , 并且其返回值 beanInstance 是直接返回返回去了,也没有做什么其他的处理.

###### doCreateBean() 方法

可以感觉到 doCreateBean 就是真正实例化bean的方法, 是不是Spring 加上了 do 开头的方法,才是真正干活的.

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
   BeanWrapper instanceWrapper = null;
// 确定是单例,    
   if (mbd.isSingleton()) {
// 从org.springframework.beans.factory.support.AbstractAutowireCapableBeanFactory#factoryBeanInstanceCache缓存中remove掉.       
      instanceWrapper = this.factoryBeanInstanceCache.remove(beanName);
   }
   if (instanceWrapper == null) {
 // 创建 bean 的实例对象.
 // 先根据 bd 获取出 beanClass,根据beanClass获取出如果是null并且不是public并且无参数构造函数不是public的话,就会抛出一个BeanCreationException异常来. 
// 从bd获取出实例提供者信息,这里获取出来的是Null,所以也就不会往下走.
// 获取 mbd.getFactoryMethodName() 操作
// 用变量resolved/autowireNecessary布尔类型的来控制一些流程,  用传入进来的args参数来决定是走无参构造函数还是在有参构造函数,如果args是null的话,就走无参数构造函数.
// org.springframework.beans.factory.support.AbstractAutowireCapableBeanFactory#determineConstructorsFromBeanPostProcessors, 该方法是获取出全部的 后置处理器,如果后置处理器是继承了SmartInstantiationAwareBeanPostProcessor的话,就会走到后置处理器的determineCandidateConstructors方法来,  根据 Constructor<?>[] ctors = ibp.determineCandidateConstructors(beanClass, beanName) 可以看到,最后返回的是一个构造方法,可以看到org.springframework.beans.factory.annotation.AutowiredAnnotationBeanPostProcessor#determineCandidateConstructors这个地方来. 这里目测是对@Autowired注解注入的对象进行操作.
//最后,看到这个方法:org.springframework.beans.factory.support.AbstractAutowireCapableBeanFactory#instantiateBean   ---->   org.springframework.beans.factory.support.SimpleInstantiationStrategy#instantiate(org.springframework.beans.factory.support.RootBeanDefinition, java.lang.String, org.springframework.beans.factory.BeanFactory) 走到这里, 先判断没有重写的方法,接着判断如果是接口的话,就会抛出异常来,用constructorToUse = clazz.getDeclaredConstructor();获取出构造方法,最后用BeanUtils.instantiateClass(constructorToUse)来实例化对象,可以看到这行代码走完,我们在无参构造函数中的输出语句就可以打印出来了.  将我们实例化出来的对象beanInstance用BeanWrapperImpl包装下,所以这里最后返回的就是   BeanWrapperImpl , 是对我们的目标对象进行一层包装过了的.     
      instanceWrapper = createBeanInstance(beanName, mbd, args);
   }
    
// 从包装了beanInstance的BeanWrapperImpl中获取出来bean和beanType来,    
   final Object bean = instanceWrapper.getWrappedInstance();
   Class<?> beanType = instanceWrapper.getWrappedClass();
    
// 赋值beanType给mbd.resolvedTargetType    
   if (beanType != NullBean.class) {
      mbd.resolvedTargetType = beanType;
   }

   // Allow post-processors to modify the merged bean definition.
   synchronized (mbd.postProcessingLock) {
      if (!mbd.postProcessed) {
         try {
 // 这里后走了一个调用后置处理器的方法,是MergedBeanDefinitionPostProcessor接口的子类,就会调用到后置处理器的postProcessMergedBeanDefinition方法.从名字上看,是对bd进行合并的处理操作.	            
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
//  bd是单例的并且是循环引用的并且单例是创建的,就满足这个条件,这里是处理循环依赖问题?还是用于实现BeanFactoryAware这种来避免循环依赖?    
   boolean earlySingletonExposure = (mbd.isSingleton() && this.allowCircularReferences &&
         isSingletonCurrentlyInCreation(beanName));
   if (earlySingletonExposure) {
      if (logger.isTraceEnabled()) {
         logger.trace("Eagerly caching bean '" + beanName +
               "' to allow for resolving potential circular references");
      }
//  添加到 org.springframework.beans.factory.support.DefaultSingletonBeanRegistry#registeredSingletons 中来.       
      addSingletonFactory(beanName, () -> getEarlyBeanReference(beanName, mbd, bean));
   }

   // Initialize the bean instance.
   Object exposedObject = bean;
   try {
// 构建bean,这里走了 InstantiationAwareBeanPostProcessor 接口的实现类的后置处理器,如果满足条件就会走处理器的postProcessAfterInstantiation方法,该方法会返回一个布尔类型的值,如果是false的话,就会跳出循环来的.
// 下面还会走一个InstantiationAwareBeanPostProcessor接口的子类的后置处理器,满足条件就会走后置处理器的postProcessProperties方法,如果获取出来的PropertyValues pvsToUse是null的话,会继续走后置处理器的postProcessPropertyValues方法.       
      populateBean(beanName, mbd, instanceWrapper);
//  这里调用每个后置处理器的 postProcessBeforeInitialization 方法,
// org.springframework.beans.factory.support.AbstractAutowireCapableBeanFactory#invokeInitMethods 该方法可以看到(InitializingBean) bean).afterPropertiesSet();对于afterPropertiesSet方法还是有点熟悉的.
//  接着就是调用每个后置处理器的postProcessAfterInitialization方法,       
      exposedObject = initializeBean(beanName, exposedObject, mbd);
       
// 可以看到这二个方法都是在调用后置处理器来进行扩展.       
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

 //  earlySingletonExposure is true.  
   if (earlySingletonExposure) {
// 从单例池中根据 beanName 来获取对象.       
      Object earlySingletonReference = getSingleton(beanName, false);
       
// 获取出来的对象不是null的话,就会进入到这里来.       
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
                     "'getBeanNamesOfType' with the 'allowEagerInit' flag turned off, for example.");
            }
         }
      }
   }

   // Register bean as disposable.
   try {
 // 如果有必要的话,注册任意bean信息.      
      registerDisposableBeanIfNecessary(beanName, bean, mbd);
   }
   catch (BeanDefinitionValidationException ex) {
      throw new BeanCreationException(
            mbd.getResourceDescription(), beanName, "Invalid destruction signature", ex);
   }

   return exposedObject;
}
```

doCreateBean() 方法 : 该方法才是正在去走反射来实例化bean的. 并且在实例化这个bean之前和之后,都是有调用许多后置处理器的,也就是这个bean进行一些增强或者其他的处理. 从现在来看,都是Spring内置的处理器.我们后面可以跟着Spring里面的写法,来做相同的扩展处理.

#### 总结

 其实可以看到,我们通过这种方式给我们定义的 bean 给注入到 Spring 容器中, 先是通过我们定义的 @ComponentScan(basePackages = “com.iyang.bean.bd”) 来扫描，然后将扫描得到的信息给添加到Spring的信息池里面,也就是添加到集合中来了. 最后在getBean 方法中, 通过扫描获取到的beanNames集合进行迭代，然后挨个调用getBean()方法来实例化bean, getBean() 方法中又走了 doGetBean () —-> createBean() —> doCreateBean() 方法， 然后每个方法有各自要做的事情，并且也会走相应的后置处理器.

 最后，这是一个比较详细的getBean分析，但是还有更深入的 , 比如 : @Autowired / @DependsOn / 循环依赖等注入，需要扩展来讲.
