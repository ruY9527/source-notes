---
title: Java反射学习
date: 2021-11-03 23:18:57
tags: 
  - java
  - Java反射
categories:
  - java
  - [java反射]
---



#### 题记

 最近在看Spring源码的时候, 可以看到在加载类等的时候,都是大量使用的反射。估摸着MyBatis这种框架,其内部也是会大量的使用反射。所以看得出来反射在第三方的框架中使用是非常多的,于是说学习反射技术是很有必要的，不论是你写代码造轮子还是去理解第三方框架的底层实现.

 话不多bb,直接上代码看看是个什么操作.

#### 方法

我们这里写一个简单的pojo类,也就是我们经常使用的.

```
public class User {

    private Integer id;
    private String name;
	public String age;
    public User(){
    }
    public User(Integer id, String name) {
        this.id = id;
        this.name = name;
    }
    public Integer getId() {
        return id;
    }

    public void setId(Integer id) {
        this.id = id;
    }
    public String getName() {
        return name;
    }
    public void setName(String name) {
        this.name = name;
    }
    public void say(){
        System.out.println("User说");
    }
}
```

然后接着在写一个启动的Main类

```
public class UserClazzMain {
    public static void main(String[] args) {
        User u = new User();
        // 获取类的所有的构造方法
        Constructor<?>[] constructors = u.getClass().getConstructors();
        System.out.println(Arrays.asList(constructors).toString());
        // 根据传入进去的参数类型,获取出类的构造方法.
        Constructor<? extends User> constructor = u.getClass().getConstructor(Integer.class, String.class);
    }
}
// 打印结果:[public com.iyang.bootbasicio.pojo.User(), public com.iyang.bootbasicio.pojo.User(java.lang.Integer,java.lang.String)],
//可以看到这是一个获取类的构造方法的.
```

调用反射获取方法:

```
public class UserClazzMain {
    public static void main(String[] args) throws Exception {
        User u = new User();
        // 可以看到获取出来的全部方法,不仅仅包含我们写的,还有Object中的notify等方法.
        Method[] methods = u.getClass().getMethods();
        System.out.println(Arrays.asList(methods).toString());
        // 根据方法的名字来过去我们特定的方法.
        Method method = u.getClass().getMethod("say");
        System.out.println(method.toString());
        
        //getDeclaredMethods方法仅仅只获取除了我们这个类里面的方法,并没有获取全部的方法(也就是不包括Object的).
        Method[] declaredMethods = u.getClass().getDeclaredMethods();
        System.out.println(Arrays.asList(declaredMethods).toString());
        // 这里依然是获取我们自己写的方法
        Method say = u.getClass().getDeclaredMethod("say");
        System.out.println(say.toString());
        
        // 这样我们就可以调用了user的say方法
        Method say = u.getClass().getDeclaredMethod("say");
        say.invoke(u);
    }
}
[public void com.iyang.bootbasicio.pojo.User.setId(java.lang.Integer), public void com.iyang.bootbasicio.pojo.User.say(), public java.lang.String com.iyang.bootbasicio.pojo.User.getName(), public void com.iyang.bootbasicio.pojo.User.setName(java.lang.String), public java.lang.Integer com.iyang.bootbasicio.pojo.User.getId(), public final void java.lang.Object.wait(long,int) throws java.lang.InterruptedException, public final native void java.lang.Object.wait(long) throws java.lang.InterruptedException, public final void java.lang.Object.wait() throws java.lang.InterruptedException, public boolean java.lang.Object.equals(java.lang.Object), public java.lang.String java.lang.Object.toString(), public native int java.lang.Object.hashCode(), public final native java.lang.Class java.lang.Object.getClass(), public final native void java.lang.Object.notify(), public final native void java.lang.Object.notifyAll()]
----------------------------
public void com.iyang.bootbasicio.pojo.User.say()
```

调用获取字段：

```
public class UserClazzMain {
    public static void main(String[] args) throws Exception {
        User u = new User();
        //获取全部的字段,是public修饰的字段,private修饰的是获取不到的.
        Field[] fields = u.getClass().getFields();
        System.out.println(Arrays.asList(fields).toString());
        //获取字段,私有的不能获取,会抛出异常,只能获取public修饰的字段.
        Field field = u.getClass().getField("age");
        System.out.println(field.toString());
        
        // 获取全部的字段,private修饰的也是可以获取出来的
        Field[] declaredFields = u.getClass().getDeclaredFields();
        System.out.println(Arrays.asList(declaredFields).toString());

        // 根据字段的名字获取字段,不管什么修饰的,都是可以获取出来的.
        Field name = u.getClass().getDeclaredField("name");
        System.out.println(name.toString());
       }
 }
```

获取注解:

我们先定义二个注解, 然后记得加在User类上. GavinYang 和 PeterWong 这二个注解是可以加在类上的, GavinYangFiledAnno是加在字段上面的.

```
@Documented
@Retention(RetentionPolicy.RUNTIME)
@Target({ElementType.TYPE})
public @interface GavinYang {

    String lwf() default "lwf";

}
@Documented
@Retention(RetentionPolicy.RUNTIME)
@Target({ElementType.TYPE})
public @interface PeterWong {

    String name() default "peterWong";

}
@Documented
@Retention(RetentionPolicy.RUNTIME)
@Target({ElementType.FIELD})
public @interface GavinYangFiledAnno {
    String desc() default "";
}
    // 从结果来看,获取注解还是蛮顺利的
    public static void main(String[] args) throws Exception {
        User u = new User();
        // 获取这个类上面的注解
        Annotation[] annotations = u.getClass().getAnnotations();
        System.out.println(Arrays.asList(annotations).toString());
        // 根据注解名字获取,可以看到返回的也直接是注解的Obejct了
        GavinYang gavinYang = u.getClass().getAnnotation(GavinYang.class);
        System.out.println(gavinYang.toString());
        
        // 获取字段上面使用的注解.
        Field field = u.getClass().getDeclaredField("name");
        Annotation[] fieldAnnotations = field.getAnnotations();
        System.out.println(Arrays.asList(fieldAnnotations).toString());
        }
      }
      
[@com.iyang.bootbasicio.pojo.GavinYang(lwf=baoyang), @com.iyang.bootbasicio.pojo.PeterWong(name=gavinyang)]
@com.iyang.bootbasicio.pojo.GavinYang(lwf=baoyang)     
[@com.iyang.bootbasicio.pojo.GavinYangFiledAnno(desc=秒啊)]
```

#### 小站一下

UserService 无参构造方法 User说使用依赖注入完成一个简单的注入

认一下Spring写一个差不多的注入注解. 在写一个虚假的 UserService,当然了,我们这里先不使用扫描,就使用简单的UserServcie去操作即可.

```
@Documented
@Retention(RetentionPolicy.RUNTIME)
@Target({ElementType.FIELD})
public @interface GavinYangAutowired {

    String alias() default "";

}
public class UserService {

    @GavinYangAutowired
    private User user;

    public UserService(){
        System.out.println("UserService 无参构造方法");
    }

    public void hello(){
        user.say();
    }

}
```

UserClassMain 类来启动发车 , 这里看结果是可以成功的启动 UserService 并且也是用hello方法来调用user的say,都是成功. 但是真实的框架复杂程度不是这几行就可以ok了的. 这只是一个简单易学的demo.

```
public class UserClazzMain {

    public static void main(String[] args) throws Exception {
        UserService u  = new UserService();
        Field[] fields = u.getClass().getDeclaredFields();
        for(Field f : fields){
            GavinYangAutowired autowired = f.getDeclaredAnnotation(GavinYangAutowired.class);
            if(autowired != null){
                Class<?> fType = f.getType();
                Constructor<?> typeConstructor = fType.getConstructor();
                Object instance = typeConstructor.newInstance();

                f.setAccessible(true);
                f.set(u,instance);
            }
        }

        u.hello();
    }
}

// UserService 无参构造方法
// User说
```

#### 总结

可以看到反射的功能还是蛮强大的, 但是项目里面一般是CRUD,目前也没有什么特别的地方看到使用反射的情况比较多.就是最近一直看Spring源码中,是可以看到有大量使用反射的情况.
