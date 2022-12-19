## 				SpringMvc   debug  阅读记录



#### 题记

​    看过 Spring 的源码之后,难免会对 SpringMvc 的源码进行阅读.  其中不乏很多好奇的知识点阅读,当然了,就我现在记录的这些知识,肯定是最简单的记录操作.



####  方式

​      我们在   org.springframework.web.servlet.DispatcherServlet  这个类中的  doDispatch 方法给打上断点, 然后我们请求一个我们定义的 Controller 来进行访问.  当然了, 你肯定要看具体的堆栈信息.

 

#### 代码

  