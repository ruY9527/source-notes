# JavaScript面试题

1. typeof和instanceOf的区别？

   typeof: 检测数据类型 

   * typeof(null/symbol/new Date()/...)=>object（对象类型）

   instanceOf: 检测对象之间的关联性（什么类型的对象）,instance左边一定要是引用类型的值，例如：

   * let a=new Number(888);  a instanceof Number===true; 888 instanceof Number===false;

   * [1,2] instanceof Array === true

   <img src="C:\Users\firefly-g\AppData\Roaming\Typora\typora-user-images\image-20230305104142962.png" alt="image-20230305104142962" style="zoom: 33%;" />

2. Set 和 Map 的区别?es6中还有那个方法可以代替map，weakMap有什么优点?

   * `Map` 对象保存键值对，并且能够记住键的原始插入顺序。任何值（对象或者原始值）都可以作为一个键或一个值

   * `Set` 对象允许你存储任何类型的唯一值，无论是原始值或者是对象引用。

   * `Map`和`Set`查找速度都非常快，时间复杂度为`O(1)`，而数组查找的时间复杂度为`O(n)`。

     `Map`对象初始化的值为一个二维数组，`Set`对象初始化的值为一维数组。

     `Map`对象和Set对象都不允许键重复（可以将`Set`对象的键想象成值）。

     `Map`对象的键是不能改的，但是值能改，`Set`对象只能通过迭代器来更改值。

3. 什么是微前端，怎么理解？

4. 相等运算符== 和 ===的底层理解？ 123+‘ ‘ 隐式转换的原理？

5. 获取函数参数个数的方法？ calle

6. react.Memo() 底层实现？

7. script的defer和async?

   * 决定了浏览器对js的解析和执行是否会阻塞html解析
   * src=""时：
   * <img src="C:\Users\firefly-g\AppData\Roaming\Typora\typora-user-images\image-20230308173025660.png" alt="image-20230308173025660" style="zoom: 50%;" />
   * src='async' 时：下载时异步 执行时阻塞
   * ![image-20230308173151746](C:\Users\firefly-g\AppData\Roaming\Typora\typora-user-images\image-20230308173151746.png)

   * src='defer' 时:
   * ![image-20230308173353571](C:\Users\firefly-g\AppData\Roaming\Typora\typora-user-images\image-20230308173353571.png)

8. flex:1 flex:auto flex:0 flex:none的差别？ （flex-grow:有剩余空间时是否扩大 flex-shrink:是否缩小 flex-basis: 项目本事大小 默认auto）

   * flex：1 对应的是1 1 0% 相当于 可扩大可缩小

   * flex:auto  对应 1 1 auto 可扩大可缩小

   * 区别 felx:1时 item平分空间大小  而auto是根据item自身大小来分的

   * flex：0 对应 0 1 0% 

   * flex:none 对应 0 1 auto   两者都是 相当于不可扩大 可缩小

   * 区别:

   * felx:0 <img src="C:\Users\firefly-g\AppData\Roaming\Typora\typora-user-images\image-20230308174900532.png" alt="image-20230308174900532" style="zoom:33%;" />

   * flex:none

     <img src="C:\Users\firefly-g\AppData\Roaming\Typora\typora-user-images\image-20230308175026645.png" alt="image-20230308175026645" style="zoom:33%;" />

9. 

   

   

   

