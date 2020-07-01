## 				      Spring扩展



####  题记

   前面讲到了这么多的什么BeanPostProcessor,事件什么的. 如果不写几下代码这里怕是很难弄清楚是个怎么回事. 所以只有看到代码跑,就大致可以看到其效果还是很明显的.



####  BeanFactoryPostProcessor

  我们这里实现一下 BeanFactoryPostProcessor 来看一下效果.

  我们就写一个简单的类, 然后实现下接口   BeanFactoryPostProcessor, 我们这里就获取下 beanFactory中的所有beanDefinitionNames的数组,然后给打印出来看效果. 可以看下下面打印的接口. 然后我们看下源码怎么执行的.

```java
@Component
public class GavinYangBeanFactoryPostProcessor implements BeanFactoryPostProcessor {

    public void postProcessBeanFactory(ConfigurableListableBeanFactory beanFactory) throws BeansException {
        String[] beanDefinitionNames = beanFactory.getBeanDefinitionNames();
        System.out.println(Arrays.toString(beanDefinitionNames));
    }
}

//[org.springframework.context.annotation.internalConfigurationAnnotationProcessor, org.springframework.context.annotation.internalAutowiredAnnotationProcessor, org.springframework.context.annotation.internalCommonAnnotationProcessor, org.springframework.context.event.internalEventListenerProcessor, org.springframework.context.event.internalEventListenerFactory, yangBeanOne, gavinYangBeanFactoryPostProcessor, yangBeanPostProcessor, gavinYangLifeImpl]

```



直接看这个类的这个方法，我这里只截取了一部分代码,也就是和  BeanFactoryPostProcessor 有关的代码. 和它没关系的代码,这里就没有去截取了.

org.springframework.context.support.PostProcessorRegistrationDelegate#invokeBeanFactoryPostProcessors(org.springframework.beans.factory.config.ConfigurableListableBeanFactory, java.util.List<org.springframework.beans.factory.config.BeanFactoryPostProcessor>)

看源码看是如何调用到这个方法的,还是比较好理解。先是根据 BeanFactoryPostProcessor.class获取出beanName的集合,然后老规矩进行一些特定的排序,当然我这里什么都没做,也就是最后处理哦。

然后跟到invokeBeanFactoryPostProcessors(nonOrderedPostProcessors, beanFactory);这个方法里面,可以看到它迭代这个集合的元素,当然了,我们只需要关注我们自己定义的哪个就可以了,然后就会走其postProcessBeanFactory方法,也就是走到了我们定义的类的这个方法上来了.

OK啦。大致流程就是这个样子的,还是比较好理解的.

```java
// Do not initialize FactoryBeans here: We need to leave all regular beans
// uninitialized to let the bean factory post-processors apply to them!
// 这个地方获取出来的数组里面的值,就有我们想看到的.
//org.springframework.context.annotation.internalConfigurationAnnotationProcessor
//org.springframework.context.event.internalEventListenerProcessor
//gavinYangBeanFactoryPostProcessor
//当看到第三个是不是非常的熟悉.没错,这就是我们自己定义的.
String[] postProcessorNames =
      beanFactory.getBeanNamesForType(BeanFactoryPostProcessor.class, true, false);

// Separate between BeanFactoryPostProcessors that implement PriorityOrdered,
// Ordered, and the rest.
List<BeanFactoryPostProcessor> priorityOrderedPostProcessors = new ArrayList<>();
List<String> orderedPostProcessorNames = new ArrayList<>();
List<String> nonOrderedPostProcessorNames = new ArrayList<>();
// 然后先经过一轮排序,就可以看到 我们自己定义的就放入到了nonOrderedPostProcessorNames这个集合中,
//
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
// 然后我们直接看到处理nonOrderedPostProcessors这个集合的方法,
//因为这个方法也会走到我们自己定义的类中去
//方法里面对nonOrderedPostProcessors进行迭代,然后一次调用其postProcessBeanFactory方法,同时也传入了beanFactory到里面去.
invokeBeanFactoryPostProcessors(nonOrderedPostProcessors, beanFactory);
```





####  BeanPostProcessor 



 我们先写一个 Bean. 然后可以里面写一个属性,方便标识.

```java
@Service
public class YangBeanOne {

    private String name;

    /**
     * 无参构造函数
     */
    public YangBeanOne(){

        System.out.println("YangBeanOne无参数构造函数");

    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }
}
```



然后我们自定义一个BeanPostProcessor,其实现了BeanPostProcessor接口.

可以看到的是,我们在if中做了beanName的判断,如果是的话,那么我们就会强转,然后给name字段赋值上GavinYang的值.

我们给断点打到 if这里，然后看进来的堆栈信息,发现其是在初始化bean中,然后调用beanPostProcessor的postProcessAfterInitialization的方法才会走到这里,也就是在doCreateBean这个方法里面.

然后这个 YangBeanPostProcessor 是什么时候给添加到 beanFactory中去的呢？

org.springframework.context.support.PostProcessorRegistrationDelegate#registerBeanPostProcessors(org.springframework.beans.factory.config.ConfigurableListableBeanFactory, org.springframework.context.support.AbstractApplicationContext)在这个方法打上断点,然后你会发现其get出来的postProcessorNames数组,就有我们的这个YangBeanPostProcessor，然后走registerBeanPostProcessors方法的时候,就会给添加到beanFactory中去.

```java
@Component
public class YangBeanPostProcessor implements BeanPostProcessor {

    public Object postProcessBeforeInitialization(Object bean, String beanName) throws BeansException {
        return bean;
    }

    public Object postProcessAfterInitialization(Object bean, String beanName) throws BeansException {
        if("yangBeanOne".equalsIgnoreCase(beanName)){
            ((YangBeanOne) bean).setName("GavinYang");
        }
        return bean;
    }
}
```



启动类 :

然后我们这里用一个启动类.

这就打印出来的结果就可以看到的是GavinYang,也就是说我们初始化这个bean之后,然后给其name属性赋值上了GavinYang这个值.

```java
public class SpringStartMain {
    public static void main(String[] args) {
        AnnotationConfigApplicationContext context = new AnnotationConfigApplicationContext("com.iyang.spring");
        YangBeanOne yangBeanOne = context.getBean(YangBeanOne.class);
        System.out.println(yangBeanOne.getName());
    }
}
```





####  Lifecycle 扩展

 Lifecycle 扩展要比起 BeanPostProcessor要好理解得多,因为你只用去实现这个接口(SmartLifecycle),然后在org.springframework.context.support.AbstractApplicationContext#finishRefresh到这个方法的时候,就会去调用实现这个接口的对用的方法.

这里我们自己写一个类,然后实现  SmartLifecycle 接口即可。

可以看到下面的打印参数.还是很清楚的明白.

```java
@Component
public class GavinYangLifeImpl implements SmartLifecycle {

    public int getPhase() {
        return Integer.MAX_VALUE;
    }

    public void start() {
        System.out.println("调用到了GavinYangLifeImpl.start()方法");
    }

    public void stop() {

    }

    public boolean isRunning() {
        return false;
    }
}

//YangBeanOne无参数构造函数
//调用到了GavinYangLifeImpl.start()方法
//GavinYang
```



然后我们再看下源码,为什么要实现  SmartLifecycle 这个接口呢？

org.springframework.context.support.DefaultLifecycleProcessor

这里我们先看到 phases ,也就是最底下的代码, 这个集合是有值的情况下先排序,然后再迭代,然后调用到 start()方法, 这个start方法是不是在我们的实现类中可以看到,是不是非常的熟悉感觉.

然后我们在看下,怎么样让这个集合能有值呢？

phases.put(phase, group);  可以看到 put方法这里, autoStartupOnly 是false 或者bean是SmartLifecycle的子类,并且其isAutoStartup方法的是true. 点到SmartLifecycle源码中去看,可以发现这个方法默认是返回的true.

接着在调用getPhase方法, 该方法也就是判断.最最关键的phases集合来了,先从里面get出数据,然后判断数据是不是null,如果是null的话,就先new一个Group出来,然后调用phases的put方法,也就是放入到这个集合中去了

所以这里就是我们为什么要实现   SmartLifecycle  这个接口,就会有启动的效果了的原因.

```java
// Internal helpers
// 传入进来的  autoStartupOnly 参数是true.
private void startBeans(boolean autoStartupOnly) {
   Map<String, Lifecycle> lifecycleBeans = getLifecycleBeans();
   Map<Integer, LifecycleGroup> phases = new HashMap<>();
   lifecycleBeans.forEach((beanName, bean) -> {
      if (!autoStartupOnly || (bean instanceof SmartLifecycle && ((SmartLifecycle) bean).isAutoStartup())) {
         int phase = getPhase(bean);
         LifecycleGroup group = phases.get(phase);
         if (group == null) {
            group = new LifecycleGroup(phase, this.timeoutPerShutdownPhase, lifecycleBeans, autoStartupOnly);
            phases.put(phase, group);
         }
         group.add(beanName, bean);
      }
   });
   if (!phases.isEmpty()) {
      List<Integer> keys = new ArrayList<>(phases.keySet());
      Collections.sort(keys);
      for (Integer key : keys) {
         phases.get(key).start();
      }
   }
}
```