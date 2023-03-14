---
title: SpringBoot动态添加接口
date: 2021-11-04 00:17:24
tags: 
  - java
  - springBoot
categories:
  - java
  - springBoot
---



## 背景

最近看了公司的产品,有一个这样的动态,就是根据input输入的内容,进行动态接口的添加.

比如 我在没有添加之前,访问 http://localhost:8080/test 该地址是404, 于是通过input的输入创建,就相当于动态添加了一个接口,于是就可以访问了.

实现的方式有很多种, 具体的想要的效果肯定是需要根据自己的业务角度来.

## 实现思路

这里是说下个人的实现思路 :

- 方案一 : 先定义好类,然后使用反射根据定义的类,创建好一个对象出来,然后将这个对象给注入到Spring容器中来,这里不仅仅是注入进来这么简单,还是需要经过 MVC(也就是Controller等注解的匹配操作)来实现
- 方案二 : 基于请求404的拦截来现实. 比如你新添加的接口访问肯定是404,于是我们可以定义一个拦截,然后获取出请求的路径,根据提前定好的一些设置,进行逻辑的处理.

这里肯定还会有很多好的实现思路,并且基于每个框架都是不一样的,这里更多的是基于 SpringBoot框架来实现这个思路的.

## 代码实现

### 基于反射创建bean注入代码实现

定义一个类的模板

```java
public String templateValue = "import org.springframework.web.bind.annotation.GetMapping;\n" +
        "import org.springframework.web.bind.annotation.RequestMapping;\n" +
        "import org.springframework.web.bind.annotation.RestController;\n" +
        "@RestController\n" +
        "@RequestMapping(\"/test\")\n" +
        "public class TestController {\n" +
        "    @GetMapping(\"/test\")\n" +
        "    public String test(){\n" +
        "        return \"测试Test接口\";\n" +
        "    }\n" +
        "}";
```

提供一个接口来反射创建对象并且注入到spring容器中来:

```java
@GetMapping("/create")
    public void createTemplate() throws Exception {

        Map<String, byte[]> bytecode = DynamicLoader.compile("TestController.java", templateValue);
        MemoryClassLoader classLoader = new MemoryClassLoader(bytecode);
        Class clazz = classLoader.loadClass("TestController");
        Object object = clazz.newInstance();

        // 注入 bean 容器的代码 : 容器中是存在这个 bean 对象的,但是Controller却没有访问到.
        BeanDefinitionBuilder builder = BeanDefinitionBuilder.genericBeanDefinition(object.getClass());
        ConfigurableApplicationContext context = springUtils.getContext();
        DefaultListableBeanFactory beanFactory = (DefaultListableBeanFactory) context.getBeanFactory();
        beanFactory.registerBeanDefinition("testController",builder.getBeanDefinition());

        RequestMappingHandlerMapping mappingHandlerMapping = context.getBean(RequestMappingHandlerMapping.class);
        Object oj = context.getBean("testController");
        Map<Method, RequestMappingInfo> methods = MethodIntrospector.selectMethods(oj.getClass(),(MethodIntrospector.MetadataLookup<RequestMappingInfo>) method ->{
            try{
                RequestMapping requestMapping = AnnotatedElementUtils.findMergedAnnotation(method, RequestMapping.class);
                RequestMappingInfo.Builder mappping = RequestMappingInfo.paths(requestMapping.path())
                                  .methods(requestMapping.method())
                                  .params(requestMapping.params())
                                  .headers(requestMapping.headers())
                                  .consumes(requestMapping.consumes())
                                  .produces(requestMapping.produces())
                                  .mappingName(requestMapping.name());
                return mappping.build();
            } catch (Exception e){
                e.printStackTrace();
            }
            return null;
        });

        Method rmhmMethod = mappingHandlerMapping.getClass()
                            .getDeclaredMethod("registerHandlerMethod",new Class[]{Object.class, Method.class, Object.class});

        rmhmMethod.setAccessible(true);
        methods.forEach((method,mapping) -> {
            try{
                rmhmMethod.invoke(mappingHandlerMapping,new Object[]{oj,method,mapping} );
            }catch (Exception e){
                e.printStackTrace();
            }
        });

    }
```

Spring工具类

```java
@Component
public class SpringUtils implements ApplicationContextAware {

    private ApplicationContext context;

    @Override
    public void setApplicationContext(ApplicationContext applicationContext) throws BeansException {
        context = applicationContext;
    }

    public ConfigurableApplicationContext getContext() {
        return (ConfigurableApplicationContext)context;
    }

    public void setContext(ApplicationContext context) {
        this.context = context;
    }
}
```

到此,就可以动态的创建出一个接口来了。

当然了,这里的代码都是写固定在代码里面的,可以提供 template 或者 通过页面定义给添加进来, 然后调用 反射/注入到Spring容器中等操作即可.

### 基于 404 拦截请求

这是 SpringBoot 本来就有的 404 拦截实现, 如果不做什么处理的话,那么进入到这里来的url地址就会是/error,是无法满足实现的.

```java
@Slf4j
@RestController
public class SelfErrorController implements ErrorController {

    private final static String ERROR_PATH = "/error";

    /**
     * Supports the HTML Error View
     *
     * @param request
     * @return
     */
    @RequestMapping(value = ERROR_PATH)
    public String errorHtml(HttpServletRequest request) {
        Integer statusCode = (Integer) request.getAttribute("javax.servlet.error.status_code");
        String requestURI = request.getRequestURI();
        log.info("在SelfErrorController中请求的路径 : {} " ,requestURI);

        // 拿到路径后就可以执行相应的代码逻辑.
        String realUrlName = request.getAttribute("realName").toString();
        log.info("在SelfErrorController中真实存在的请求路径是 : --> {} " , realUrlName);

        if(statusCode == 401){
            return  "{ \"code\": \"401\"}";
        }else if(statusCode == 404){
            return "{ \"code\": \"404\"}";
        }else if(statusCode == 403){
            return "{ \"code\": \"403\"}";
        }else{
            return "{ \"code\": \"500\"}";
        }
    }
    @Override
    public String getErrorPath() {
        return null;
    }
}
```

因为上面无法满足的前提下,所以我们可以使用拦截来配置原来的路径.

配置类:

```java
@Configuration
public class MyWebAppConfigurer implements WebMvcConfigurer {

    @Override
    public void addInterceptors(InterceptorRegistry registry) {
        registry.addInterceptor(new SelfInterceptor()).addPathPatterns("/**");
    }
}
```

自定义拦截器:

这里可以看到将原有的路径给set字段realName了.

所以在上面的error接口,我们调用这个realName字段就可以获取到了原有的路径.

```java
@Component
@Slf4j
public class SelfInterceptor implements HandlerInterceptor {
    
    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response,
                             Object handler) throws Exception {
        // 前置拦截器
        log.info("前置拦截器调用 : com.iyang.hello.boot.config.SelfInterceptor.preHandle 中来." );
        String requestURI = request.getRequestURI();
        log.info("在preHandle方法中捕捉到的请求路径 : ---> {} " , requestURI);
        // handler 是 ResourceHttpRequestHandler
        return true;
    }

    @Override
    public void postHandle(HttpServletRequest request, HttpServletResponse response,
                           Object handler, ModelAndView modelAndView) throws Exception {
        String requestURI = request.getRequestURI();
        request.setAttribute("realName",requestURI);
        if(response.getStatus() == 404){
            log.info("状态是404正常操作");
        }
        log.info("请求的url路径是 ---> {} " , requestURI);
    }

    @Override
    public void afterCompletion(HttpServletRequest request, HttpServletResponse response,
                                Object handler, Exception ex) throws Exception {

    }
}
```

## 总结

该技能看到比较有意思,具体的实现和设计思路其实是有很多种的,具体得看项目的业务是不是需要使用.

并且实现的思路并不是只有这一种,肯定是还有很多种的.

适合自己的业务是最好的.
