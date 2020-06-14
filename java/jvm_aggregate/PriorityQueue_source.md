##                       PriorityQueue源码阅读



​      PriorityQueue :  中文是优先队列 , 队列的特点就是数据 先进先出,   但是这个优先队列的特别是什么呢？ 首先肯定是有队列的基本特点，也就是有先进先出。  如果是先进先出的话,那么就和普通的有什么区别？优先二字又是体现在什么地方呢？  优先级队列的元素按照其自然顺序进行排序, 或者根据 构造队列时提供的 Comparator 进行排序.



------



####  结构

​    结构就是 PriorityQueue这个类的 全局变量参数, 因为这些参数是存储数据的, 所以只要理解了这些参数,就明白了这个 PriorityQueue这个是对数据是怎么样进行存储的, 还是比较好理解的. 



 这里可以看到 priorityQueue的数据结构还是很简单的, 一眼扫过去没什么需要特别的理解

```java

// 存储数据的数组
transient Object[] queue;

// 记录 priorityQueue的长度
private int size = 0;

// 这个就是之前说提到的  可以根据 Comparator 进行排序
private final Comparator<? super E> comparator;
```



------



####  构造方法

​    priorityQueue的构造方法相对于其他的集合的构造方法可能是比较多的.

​     

​    这里列举出来, 可以看到构造方法还是比较多的.

​    对构造函数的初始化赋值等操作还是很好理解的,并没有什么特别难理解的。  主要还是对数组/长度/或者传入进来的数组进行赋值操作.

```java

// 1   
// 这里是走到 4 的构造方法去了
public PriorityQueue() {
    this(DEFAULT_INITIAL_CAPACITY, null);
}

// 2
// 这里是走到 4 的构造方法去了
public PriorityQueue(int initialCapacity) {
        this(initialCapacity, null);
}

// 3
// 这里是走到 4 的构造方法去了
public PriorityQueue(Comparator<? super E> comparator) {
        this(DEFAULT_INITIAL_CAPACITY, comparator);
}

// 4 
/**  可以看到前面的三个都是走到了这里来了,
	 长度如果是小于1的话,就会报错.  
     this.queue 的数组长度就是 initialCapacity
     comparator 排序方法就是传入进来的
*/
public PriorityQueue(int initialCapacity,
                         Comparator<? super E> comparator) {
        // Note: This restriction of at least one is not actually needed,
        // but continues for 1.5 compatibility
        if (initialCapacity < 1)
            throw new IllegalArgumentException();
        this.queue = new Object[initialCapacity];
        this.comparator = comparator;
}

// 5
/**  对传入进来的集合进行判断. 分为   SortedSet  或者  PriorityQueue  或者其他
     如果是 SortedSet 的话, 对 comparator 的值赋值为 传入进来集合的排序方式,然后走 initElementsFromCollection() 方法, 这里应该是对集合进行赋值操作.
     如果是 PriorityQueue , comparator 处理方式是和 SortedSet一样,然后走 initFromPriorityQueue 方法. 
     否则就不上面的二种, comparator 复置为 null ,走 initFromCollection 方法.
     这里总结的话,就是传入进来不同的集合,走的方法也是不一样的,这个还是很好理解的.
	
*/
public PriorityQueue(Collection<? extends E> c) {
        if (c instanceof SortedSet<?>) {
            SortedSet<? extends E> ss = (SortedSet<? extends E>) c;
            this.comparator = (Comparator<? super E>) ss.comparator();
            initElementsFromCollection(ss);
        }
        else if (c instanceof PriorityQueue<?>) {
            PriorityQueue<? extends E> pq = (PriorityQueue<? extends E>) c;
            this.comparator = (Comparator<? super E>) pq.comparator();
            initFromPriorityQueue(pq);
        }
        else {
            this.comparator = null;
            initFromCollection(c);
        }
}

// 6  这个对应上面的, 如果是传入进来 PriorityQueue 的处理方法
public PriorityQueue(PriorityQueue<? extends E> c) {
        this.comparator = (Comparator<? super E>) c.comparator();
        initFromPriorityQueue(c);
}

// 7  这个也是对应上面的 SortedSet 处理方法
public PriorityQueue(SortedSet<? extends E> c) {
        this.comparator = (Comparator<? super E>) c.comparator();
        initElementsFromCollection(c);
}

----------------------   华丽分割线   --------------------
上面的if else 里面提到的走不同的方法,还是有必要取看看的. 
    
/**
  对传入进来是  PriorityQueue  进行处理, 先判断确认 class是PriorityQueue ,是的话,调用toArray() 将数组赋值给 queue , 并且长度也进行复置给size.
  否则就走  initFromCollection 方法, 这个 if else 还是比较严谨的.进行多次判断处理
*/    
private void initFromPriorityQueue(PriorityQueue<? extends E> c) {
        if (c.getClass() == PriorityQueue.class) {
            this.queue = c.toArray();
            this.size = c.size();
        } else {
            initFromCollection(c);
        }
}    

/**
   这个对传入进来的集合, 将值转化为 数组a (Object []), 如果 comparator不是null的话,就会根据comparator来进行排序. 也就是对a进行排序,并且这个的值不可以为null的,如果出现了null的话,就会有空指针的异常出现.
   然后将数组a赋值给queue,长度也是调用 a.length 复置给size
*/
private void initElementsFromCollection(Collection<? extends E> c) {
        Object[] a = c.toArray();
        // If c.toArray incorrectly doesn't return Object[], copy it.
        if (a.getClass() != Object[].class)
            a = Arrays.copyOf(a, a.length, Object[].class);
        int len = a.length;
        if (len == 1 || this.comparator != null)
            for (int i = 0; i < len; i++)
                if (a[i] == null)
                    throw new NullPointerException();
        this.queue = a;
        this.size = a.length;
}	

/**
 可以看到这个方法是走了  initElementsFromCollection 这个方法, 然后再走 headify 方法
*/
private void initFromCollection(Collection<? extends E> c) {
        initElementsFromCollection(c);
        heapify();
}
```



------



####  方法

​     添加元素方法 ： 

​      

```java
public boolean add(E e) {
    return offer(e);
}

/**
	这里可以看到,如果值是null的话,就会抛出NPE的异常.
	如果size的大小比 queue数组的长度还大的话,就会进行扩容.
	然后size长度+1,如何i是0的话,就说明是第一个元素,不需要任何拍寻处理,直接赋值给第一个即可.
	如果不是第一个的话,就会走siftUp方法
*/
public boolean offer(E e) {
        if (e == null)
            throw new NullPointerException();
        modCount++;
        int i = size;
        if (i >= queue.length)
            grow(i + 1);
        size = i + 1;
        if (i == 0)
            queue[0] = e;
        else
            siftUp(i, e);
        return true;
}

/**
	如果 comparator是null的话,就走  siftUpUsingComparator 方法.
	否则就会走 siftUpComparable 方法
*/
private void siftUp(int k, E x) {
        if (comparator != null)
            siftUpUsingComparator(k, x);
        else
            siftUpComparable(k, x);
}

/**
	这里先判断k是大于0的,也就是不是第一个的意思.
	然后通过 (k - 1) >>> 1 计算出来下标位置,下标是parent的值,调用 comparator.compare(x,e)来进行比较,如果是大于0的话,就不需要做任何处理。
	否则的话,就会 queue[k] = e ; k = parent; 来进行下标数值的替换处理.
	最后queue[k] = x 的值
*/
private void siftUpUsingComparator(int k, E x) {
        while (k > 0) {
            int parent = (k - 1) >>> 1;
            Object e = queue[parent];
            if (comparator.compare(x, (E) e) >= 0)
                break;
            queue[k] = e;
            k = parent;
        }
        queue[k] = x;
}

/**
	这个方法其实也是和上面的处理方式是类似的,通过比较值来进行处理.
*/
private void siftUpComparable(int k, E x) {
        Comparable<? super E> key = (Comparable<? super E>) x;
        while (k > 0) {
            int parent = (k - 1) >>> 1;
            Object e = queue[parent];
            if (key.compareTo((E) e) >= 0)
                break;
            queue[k] = e;
            k = parent;
        }
        queue[k] = key;
}


/**
	这里顺路看下 grow 扩容方法吧。 
	肯定是根据 queue的长度来进行扩容,如果值太小了的话,就会进行 二倍扩容.  否则的话,就是1.5倍扩容.
	最后调用 Arrays.copyOf() 来进行扩容数组操作
	这个扩容还是想对比较简单的
*/
private void grow(int minCapacity) {
        int oldCapacity = queue.length;
        // Double size if small; else grow by 50%
        int newCapacity = oldCapacity + ((oldCapacity < 64) ?
                                         (oldCapacity + 2) :
                                         (oldCapacity >> 1));
        // overflow-conscious code
        if (newCapacity - MAX_ARRAY_SIZE > 0)
            newCapacity = hugeCapacity(minCapacity);
        queue = Arrays.copyOf(queue, newCapacity);
}
```





peek 方法

这里可以看清楚的看到，出队列方法的值,就是默认的第一个嘛，这么一眼看下去就是很清楚明了的.

```java
public E peek() {
    return (size == 0) ? null : (E) queue[0];
}
```



remove 方法 :



```java
/**
	删除元素的方法。
	indexOf 如果返回的不是-1的话,就说明是有值得,就会走到 removeAt 方法
*/
public boolean remove(Object o) {
    int i = indexOf(o);
    if (i == -1)
        return false;
    else {
        removeAt(i);
        return true;
    }
}

/**
	indexOf 这个方法就是判断在这个集合里面有没有 o 这个值, 如果有的话就会返回对应的下标,如果不存在的话,就会返回-1的值
*/
private int indexOf(Object o) {
        if (o != null) {
            for (int i = 0; i < size; i++)
                if (o.equals(queue[i]))
                    return i;
        }
        return -1;
}

/**
	removeAt 方法就会将传入进来的i的下标的值重置为null,这是满足 i == --size 的情况下.
	然后会将要删除的下标 i 和 对应的值 moved 传入到 siftDown 这个方法中.
	siftUp()是在前面有讲解到的.
	这里还是很明显的看到, priorityQueue是一直在维护这排序的关系。
*/
private E removeAt(int i) {
        // assert i >= 0 && i < size;
        modCount++;
        int s = --size;
        if (s == i) // removed last element
            queue[i] = null;
        else {
            E moved = (E) queue[s];
            queue[s] = null;
            siftDown(i, moved);
            if (queue[i] == moved) {
                siftUp(i, moved);
                if (queue[i] != moved)
                    return moved;
            }
        }
        return null;
}

/**
	根据comparator走不同的方法
	可以看到走的二个方法，其中的区别是 comparator.compare 和 comparator.compareTo 调用的api是不一样的
*/
private void siftDown(int k, E x) {
        if (comparator != null)
            siftDownUsingComparator(k, x);
        else
            siftDownComparable(k, x);
}


private void siftDownUsingComparator(int k, E x) {
        int half = size >>> 1;
        while (k < half) {
            int child = (k << 1) + 1;
            Object c = queue[child];
            int right = child + 1;
            if (right < size &&
                comparator.compare((E) c, (E) queue[right]) > 0)
                c = queue[child = right];
            if (comparator.compare(x, (E) c) <= 0)
                break;
            queue[k] = c;
            k = child;
        }
        queue[k] = x;
}

private void siftDownComparable(int k, E x) {
        Comparable<? super E> key = (Comparable<? super E>)x;
        int half = size >>> 1;        // loop while a non-leaf
        while (k < half) {
            int child = (k << 1) + 1; // assume left child is least
            Object c = queue[child];
            int right = child + 1;
            if (right < size &&
                ((Comparable<? super E>) c).compareTo((E) queue[right]) > 0)
                c = queue[child = right];
            if (key.compareTo((E) c) <= 0)
                break;
            queue[k] = c;
            k = child;
        }
        queue[k] = key;
}
```



------



####  总结

​       PriorityQueue 的存储数据结构是采用一个数据来进行存储,也就是一直在操作这个数组，只是每次都对数据进行了维护排序的关系。

​        PriorityQueue  是线程不安全的队列，这里还是提一下吧,因为添加元素和删除元素的方法都是没有进行加锁处理，当然了,如果不使用作为全局变量的话，自然是没有任何问题的,在局部变量里面.

​        