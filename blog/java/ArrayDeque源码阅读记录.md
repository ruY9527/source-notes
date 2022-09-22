---
title: ArrayDeque源码阅读记录
date: 2021-11-04 00:13:11
tags: 
  - java
  - java集合
categories:
  - java
  - java集合
---

ArrayDeque 在我目前做的项目中,使用是比较少的,基本都没有地方用到。可能是我太low了,也可能是业务没有一定要用到队列的情况. 但是这不影响我们对其进行源码阅读。

### 结构

结构还是可以看到, 使用一个Object的数组, 二个int类型的变量来记录头和尾(从单词的意思)

```
transient Object[] elements; // non-private to simplify nested class access

transient int head;

transient int tail;
```

### 方法

- 构造函数

  无参构造函数. 可以看到无参构造函数,默认是对数据进行初始化大小为16的操作.

  ```
  public ArrayDeque() {
      elements = new Object[16];
  }
  ```

  

  有参构造函数

  ```
  /**传递int类型的构造函数,最后是调用到了calculateSize方法返回值来初始化数组大小 */
  public ArrayDeque(int numElements) {
      allocateElements(numElements);
  }
  
  private void allocateElements(int numElements) {
          elements = new Object[calculateSize(numElements)];
  }
  
  /** 获取变量MIN_INITIAL_CAPACITY的值,如果传入进来的值是大于这个值,就会进行下面的运算操作,然后返回这个值出去.   */
  private static int calculateSize(int numElements) {
          int initialCapacity = MIN_INITIAL_CAPACITY;
          // Find the best power of two to hold elements.
          // Tests "<=" because arrays aren't kept full.
          if (numElements >= initialCapacity) {
              initialCapacity = numElements;
              initialCapacity |= (initialCapacity >>>  1);
              initialCapacity |= (initialCapacity >>>  2);
              initialCapacity |= (initialCapacity >>>  4);
              initialCapacity |= (initialCapacity >>>  8);
              initialCapacity |= (initialCapacity >>> 16);
              initialCapacity++;
  
              if (initialCapacity < 0)   // Too many elements, must back off
                  initialCapacity >>>= 1;// Good luck allocating 2 ^ 30 elements
          }
          return initialCapacity;
  }
  
  
  
  /**
     传递集合的构造函数
     使用传递进来的集合的长度来初始化数组的长度.
     然后调用addAll方法,这里说明下 addAll 是在其 AbstractCollection 里面,也就是子类调用父类的方法.然后add方法是在ArrayDeque里面调用
  */
  public ArrayDeque(Collection<? extends E> c) {
          allocateElements(c.size());
          addAll(c);
  }
  
  
  private void allocateElements(int numElements) {
          elements = new Object[calculateSize(numElements)];
  }
  
  /** 这里可以看到,定义给变量,迭代集合c,依次调用add方法,如果add方法返回的是true,变量modified就会变为true.最后addAll就会返回变量modified回去. */
  public boolean addAll(Collection<? extends E> c) {
          boolean modified = false;
          for (E e : c)
              if (add(e))
                  modified = true;
          return modified;
  }
  
  // 往下调用
  public boolean add(E e) {
          addLast(e);
          return true;
  }
  
  /**
  	这里的值是不能传入null进来的,否则的话就会报NPE的异常.
  	然后使用下标tail直接插入到最后,if 里面是对 tail 的值进行新赋值操作,如果满足条件就会调用doubleCapacity方法,目测这个方法就是进行扩容的方法.
  	这里就是看下  (tail = (tail + 1) & (elements.length - 1)) 这个赋值操作,就是给tail进行新的赋值。
  */
  public void addLast(E e) {
          if (e == null)
              throw new NullPointerException();
          elements[tail] = e;
          if ( (tail = (tail + 1) & (elements.length - 1)) == head)
              doubleCapacity();
  }
  ```

- 添加方法

  add(E e) 这里添加调用的方法,我们主要看下 doubleCapacity 这个方法

  ```
  public boolean add(E e) {
      addLast(e);
      return true;
  }
  
  public void addLast(E e) {
          if (e == null)
              throw new NullPointerException();
          elements[tail] = e;
          if ( (tail = (tail + 1) & (elements.length - 1)) == head)
              doubleCapacity();
  }
  
  /**
  	这里对 head / elements的长度都进行值存储操作, 一 是便于后面使用System.arraycopy 来进行copy数组的值,好从对应下标开始复制值. 二是 head /  tail 等赋值.
  	可以看到扩容后的的大小,来new了一个新的数组,后面调用System.arraycopy来进行复制.
  */
  private void doubleCapacity() {
          assert head == tail;
          int p = head;
          int n = elements.length;
          int r = n - p; // number of elements to the right of p
          int newCapacity = n << 1;
          if (newCapacity < 0)
              throw new IllegalStateException("Sorry, deque too big");
          Object[] a = new Object[newCapacity];
          System.arraycopy(elements, p, a, 0, r);
          System.arraycopy(elements, 0, a, r, p);
          elements = a;
          head = 0;
          tail = n;
  }
  ```

  

  addFirst 从头部插入 , 可以看到 使用 head = (head - 1) & (elements.length - 1) 是计算出头部下标的位置,并且对值进行覆盖. 如果 head 与 tail 是相等的话,就会调用 doubleCapacity来进行扩容

  ```
  public void addFirst(E e) {
      if (e == null)
          throw new NullPointerException();
      elements[head = (head - 1) & (elements.length - 1)] = e;
      if (head == tail)
          doubleCapacity();
  }
  ```

addLast 尾部插入, 这个方法上面都是有提到的。

```
public void addLast(E e) {
    if (e == null)
        throw new NullPointerException();
    elements[tail] = e;
    if ( (tail = (tail + 1) & (elements.length - 1)) == head)
        doubleCapacity();
}
```



```
offerLast / offerFirst  内部都是分别调用到了 addLast / addFirst 方法
```

 push 方法也是调用的 addFirst 方法

- get 获取值方法

  getFirst / getLast 方法

  ```
  /** 从head对应的数组中直接获取出值,如果值是null的话,就会抛出一个异常,否则就会返回*/
  public E getFirst() {
      @SuppressWarnings("unchecked")
      E result = (E) elements[head];
      if (result == null)
          throw new NoSuchElementException();
      return result;
  }
  
  /**
  	(tail - 1) & (elements.length - 1) 得出尾部元素的下标位置,然后用数组下标返回对应的值.
  */
  public E getLast() {
          @SuppressWarnings("unchecked")
          E result = (E) elements[(tail - 1) & (elements.length - 1)];
          if (result == null)
              throw new NoSuchElementException();
          return result;
      }
  ```

peekFirst / peekLast 中的操作,是与 getFirst / getLast 是一样的

peek 方法里面是走的 peekFirst 方法

- remove 方法

  removeFirst 方法, 走的是 pollFirst 方法

  removeLast 方法

  ```
  public E removeFirst() {
      E x = pollFirst();
      if (x == null)
          throw new NoSuchElementException();
      return x;
  }
  
  /**
   头节点 head 使用变量 h 来记录, 直接elements[h]下标来获取值,如果值是null的话,就执行返回(这里直接返回的逻辑处理是,初始化一个集合,但是没任何值,就调用removeFirst方法,这个时候数组里面是没有值的,于是就直接返回即可).
   如果不是null的话,就会走下面的,将h的下标值设置为null,也就是进行删除,然后重新计算出 head 的值.
  */
  public E pollFirst() {
          int h = head;
          @SuppressWarnings("unchecked")
          E result = (E) elements[h];
          // Element is null if deque empty
          if (result == null)
              return null;
          elements[h] = null;     // Must null out slot
          head = (h + 1) & (elements.length - 1);
          return result;
  }
  
  
  public E removeLast() {
          E x = pollLast();
          if (x == null)
              throw new NoSuchElementException();
          return x;
  }
  
  /**
  	先计算出尾节点的下标,然后用值result来进行记录.如果是null的话,就直接方法(这里想法和上面一样).将t的下标的值重置为null进行删除,然后tail的值就是等t的值.
  */
  public E pollLast() {
          int t = (tail - 1) & (elements.length - 1);
          @SuppressWarnings("unchecked")
          E result = (E) elements[t];
          if (result == null)
              return null;
          elements[t] = null;
          tail = t;
          return result;
  }
  ```

remove 方法是直接调用的 removeFirst 方法.

- removeFirstOccurrence / removeLastOccurrence TODO 后续更新

------

### 总结

ArrayDeque 队列， 队列的特性就是对数据是先进先出。 而栈的特性是先进后出(比如枪打出去的子弹).

这里的理解就是, 使用二个变量，然后每次进行 add / get / remove 都是利用这二个变量来进行 添加 / 删除 / 获取等操作.
