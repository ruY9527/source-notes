## 				      Spring扩展



####  题记

   前面讲到了这么多的什么BeanPostProcessor,事件什么的. 如果不写几下代码这里怕是很难弄清楚是个怎么回事. 所以只有看到代码跑,就大致可以看到其效果还是很明显的.



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



