---
title: ThreadLocal源码阅读
date: 2021-11-04 00:15:45
tags: 
  - java
  - java线程
categories:
  - java
  - java线程
---



ThreadLocal 是来这个公司有过使用一次的感受,所以就学习阅读下源码。 其实Thread 这个里面,就有一个 Map(这里是用ThreadLocal内部类中实现的) , 里面的key就是 ThreadLocal, value 就是存储的值,所以一个Thread是有多个 ThreadLocal。

------

#### 参数

参数部分

```
private final int threadLocalHashCode = nextHashCode();

/**
 * The next hash code to be given out. Updated atomically. Starts at
 * zero.
   AtomicInteger 是一个线程安全的,实现原理是采用了cas.	
 */
private static AtomicInteger nextHashCode =
    new AtomicInteger();
```

#### 方法

set 赋值

```
/**
*	首先获取当前线程.
	调用 getMap 方法, 直接调用 t.trheadLocals来获取 ThreadLocalMap。(ThreadLocalMap这里是ThreadLocal内部自己实现的类)
	如果map不是null的话,就进行set值,这里可以看到 set 的key是this,也就是ThreadLocal它自己.
	否则就是调用createMap方法,走这个方法是可以确认 currentThread中的threadLocals的值是null,所以直接new了一个进行赋值即可.
*/
public void set(T value) {
    Thread t = Thread.currentThread();
    ThreadLocalMap map = getMap(t);
    if (map != null)
        map.set(this, value);
    else
        createMap(t, value);
}

ThreadLocalMap getMap(Thread t) {
        return t.threadLocals;
}

void createMap(Thread t, T firstValue) {
        t.threadLocals = new ThreadLocalMap(this, firstValue);
}
```

#### Get 方法

get 方法,获取值.

```
/**
	这里可以看到,获取ThreadLocalMap,如果ThreadLocalMap的是null的话,就会走setInitialValue方法。
	如果有值的话,就会进行获取值并且返回.
*/
public T get() {
    Thread t = Thread.currentThread();
    ThreadLocalMap map = getMap(t);
    if (map != null) {
        ThreadLocalMap.Entry e = map.getEntry(this);
        if (e != null) {
            @SuppressWarnings("unchecked")
            T result = (T)e.value;
            return result;
        }
    }
    return setInitialValue();
}

/**
	如果获取出来的ThreadLocalMap 不是null的话,就会进行set,这个时候set进去的值,value就是null了.
	如果获取出来是nulld
*/
private T setInitialValue() {
        T value = initialValue();
        Thread t = Thread.currentThread();
        ThreadLocalMap map = getMap(t);
        if (map != null)
            map.set(this, value);
        else
            createMap(t, value);
        return value;
}

protected T initialValue() {
        return null;
}
```

#### remove 方法

remove 方法就是获取map,如果map不是null的话,就调用m.remove(this)，根据当前this来删除.

```
public void remove() {
    ThreadLocalMap m = getMap(Thread.currentThread());
    if (m != null)
        m.remove(this);
}
```

------

#### 总结

ThreadLocal里面的方法也比较少,还是比较好理解的。只要弄清楚ThreadLocal和Thread是怎么在存储的,就很好的理解了。

注意 : 使用ThreadLocal一定要进行remove,否则容易出现内存泄漏，从而导致内存溢出。
