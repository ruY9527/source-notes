## 					  Spring源码阅读记录



####  阅读方式

-   创建一个 Maven项目,引入Spring相关的依赖, 然后写一个启动类,在类上打上debug一层一层的走进去,就可以看到源码是怎么走的,怎么加载的.
-   从github上git Spring到自己本来,然后安装gradle,build 一下项目就可以了,这是基于Spring源码去跑的,可以直接在代码里面打印对应的输出语句,对于代码的走向是更加熟悉的.
-  目前比较流行的是SpringBoot,也可以直接启动一个SpringBoot项目,然后在run方法上打上断点,跟着源码一步一步的走，最后每个方法都走一遍会很有效的理解.



####  源码阅读

这里我们写一个读取从包位置扫描的类.  其实这个注解,你也可以加入到你启动类上面去扫描,效果也是一样的.这样的话,YangConfig就会当作为一个bean。如果你写在你的启动类上的话,那么你的启动类就会当作为一个bean.

```java
package com.yang.config;

import org.springframework.context.annotation.ComponentScan;

/**
 * @Author: Mu_Yi
 * @Date: 2020/1/5 21:45
 * @Version 1.0
 * @qq: 1411091515
 */


@ComponentScan("com.yang")
public class YangConfig {


}
```



启动类, 可以看到对于启动类,还是做了不少实验,但是这肯定是不够的,启动还是有很多的内容没有完全的写入进去的.  在这里打算断点就可以去跟着源码走。等等，这里是不是少了一个很明显的bean。

```java
package com.yang;

import com.yang.config.LwfConfig;
import com.yang.config.YangConfig;
import org.springframework.context.annotation.AnnotationConfigApplicationContext;

/**
 * @Author: Mu_Yi
 * @Date: 2020/1/5 21:45
 * @Version 1.0
 * @qq: 1411091515
 */
public class YangMain {

   public static void main(String[] args) {

      AnnotationConfigApplicationContext configApplicationContext =
            new AnnotationConfigApplicationContext(YangConfig.class/*, LwfConfig.class*/);

      //  构造方法中有调用这二个
      // configApplicationContext.register(YangConfig.class);
      // configApplicationContext.refresh();

      // System.out.println(configApplicationContext.getBean("one"));
   }

}
```





