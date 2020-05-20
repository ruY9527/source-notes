##                                 HashMap 源码阅读



HashMap 这种Key,Value 的存储结构,是我们在写代码中经常使用到的.可以说使用是非常频繁的,不过现在使用JSONObject也是非常多的,二者都是实现了Map接口。

所以看下HashMap源码是非常有必要的.

------



#### 结构

 这里我们要看下 HashMap的内部类.

 这里的 Node 节点就是 HashMap存放数据的结构. hash 计算出来的哈希值,key就是HashMap中的key,value就是key对应的value的值.  这个 next 就是 key 不一样,计算出来的hash却是一样的,这样就有了hash冲突,所以就将节点存放在next里面了,从尾部插入进去. java8 后,如果next的长度是大于8的话,就会转化了红黑树来存储,那样获取值的速度变快了。

```java
static class Node<K,V> implements Map.Entry<K,V> {
    final int hash;
    final K key;
    V value;
    Node<K,V> next;

    Node(int hash, K key, V value, Node<K,V> next) {
        this.hash = hash;
        this.key = key;
        this.value = value;
        this.next = next;
    }

    public final K getKey()        { return key; }
    public final V getValue()      { return value; }
    public final String toString() { return key + "=" + value; }

    public final int hashCode() {
        return Objects.hashCode(key) ^ Objects.hashCode(value);
    }

    public final V setValue(V newValue) {
        V oldValue = value;
        value = newValue;
        return oldValue;
    }

    public final boolean equals(Object o) {
        if (o == this)
            return true;
        if (o instanceof Map.Entry) {
            Map.Entry<?,?> e = (Map.Entry<?,?>)o;
            if (Objects.equals(key, e.getKey()) &&
                Objects.equals(value, e.getValue()))
                return true;
        }
        return false;
    }
}
```



TreeNode 这个内部类就是表示红黑树的. TODO 后续进行更新.



参数, 可以看到 HashMap 是使用了一个数组来进行存储 Node节点.

```java
transient Node<K,V>[] table;


transient int size;

static final int DEFAULT_INITIAL_CAPACITY = 1 << 4; // aka 16

static final int MAXIMUM_CAPACITY = 1 << 30;

static final float DEFAULT_LOAD_FACTOR = 0.75f;
```



------



####  方法

​	构造函数

​	

```java
/**
 * Constructs an empty <tt>HashMap</tt> with the default initial capacity
 * (16) and the default load factor (0.75).
 	当使用无参构造函数的时候,只是对 loadFactor 进行了赋值操作
 */
public HashMap() {
    this.loadFactor = DEFAULT_LOAD_FACTOR; // all other fields defaulted
}

// 传递一个int类型的参数时候,就会计息往下调用构造函数
public HashMap(int initialCapacity) {
        this(initialCapacity, DEFAULT_LOAD_FACTOR);
}

/**
	对值进行判断,怕你可能传入进来一个负数来测试玩玩哈哈哈。
	最后调用到了tableSizeFor方法,可以看到这个方法是对传入进来的参数,进行一连串的位运算.
*/
public HashMap(int initialCapacity, float loadFactor) {
        if (initialCapacity < 0)
            throw new IllegalArgumentException("Illegal initial capacity: " +
                                               initialCapacity);
        if (initialCapacity > MAXIMUM_CAPACITY)
            initialCapacity = MAXIMUM_CAPACITY;
        if (loadFactor <= 0 || Float.isNaN(loadFactor))
            throw new IllegalArgumentException("Illegal load factor: " +
                                               loadFactor);
        this.loadFactor = loadFactor;
        this.threshold = tableSizeFor(initialCapacity);
}

static final int tableSizeFor(int cap) {
        int n = cap - 1;
        n |= n >>> 1;
        n |= n >>> 2;
        n |= n >>> 4;
        n |= n >>> 8;
        n |= n >>> 16;
        return (n < 0) ? 1 : (n >= MAXIMUM_CAPACITY) ? MAXIMUM_CAPACITY : n + 1;
}

// 传入 Map 的实现类的话,就是往下继续调用 putMapEntries方法
public HashMap(Map<? extends K, ? extends V> m) {
        this.loadFactor = DEFAULT_LOAD_FACTOR;
        putMapEntries(m, false);
}

/**
	传入 m.size()的长度,长度大于0就会走逻辑代码.最后可以看到 迭代了m,然后调用putVal来将值放入Map中
*/
final void putMapEntries(Map<? extends K, ? extends V> m, boolean evict) {
        int s = m.size();
        if (s > 0) {
            if (table == null) { // pre-size
                float ft = ((float)s / loadFactor) + 1.0F;
                int t = ((ft < (float)MAXIMUM_CAPACITY) ?
                         (int)ft : MAXIMUM_CAPACITY);
                if (t > threshold)
                    threshold = tableSizeFor(t);
            }
            else if (s > threshold)
                resize();
            for (Map.Entry<? extends K, ? extends V> e : m.entrySet()) {
                K key = e.getKey();
                V value = e.getValue();
                putVal(hash(key), key, value, false, evict);
            }
        }
}
```



put 添加方法

```java
public V put(K key, V value) {
    return putVal(hash(key), key, value, false, true);
}

// 根据传入进来的key来计算对应的hash值
static final int hash(Object key) {
        int h;
        return (key == null) ? 0 : (h = key.hashCode()) ^ (h >>> 16);
}

/**
	putVal 就是 
*/
final V putVal(int hash, K key, V value, boolean onlyIfAbsent,
                   boolean evict) {
        // 定义一些变量
        Node<K,V>[] tab; Node<K,V> p; int n, i;
    	// table 赋值给 tab 并判断是否等于null 或者 tab的长度是否等于0,如果是的话，就会调用resize来进行扩容
        if ((tab = table) == null || (n = tab.length) == 0)
            n = (tab = resize()).length;
    
        if ((p = tab[i = (n - 1) & hash]) == null)
            tab[i] = newNode(hash, key, value, null);
        else {
            Node<K,V> e; K k;
            if (p.hash == hash &&
                ((k = p.key) == key || (key != null && key.equals(k))))
                e = p;
            else if (p instanceof TreeNode)
                e = ((TreeNode<K,V>)p).putTreeVal(this, tab, hash, key, value);
            else {
                for (int binCount = 0; ; ++binCount) {
                    if ((e = p.next) == null) {
                        p.next = newNode(hash, key, value, null);
                        if (binCount >= TREEIFY_THRESHOLD - 1) // -1 for 1st
                            treeifyBin(tab, hash);
                        break;
                    }
                    if (e.hash == hash &&
                        ((k = e.key) == key || (key != null && key.equals(k))))
                        break;
                    p = e;
                }
            }
            if (e != null) { // existing mapping for key
                V oldValue = e.value;
                if (!onlyIfAbsent || oldValue == null)
                    e.value = value;
                afterNodeAccess(e);
                return oldValue;
            }
        }
        ++modCount;
        if (++size > threshold)
            resize();
        afterNodeInsertion(evict);
        return null;
}

/**
	扩容方法
	table使用 oldTab来进行存储,拿出oldTab的长度(如果oldTab是null的话,对应的长度就是为0).
	oldThr 是 记录 threshold 之前的值, newCap / newThr就是需要扩容使用到的变量命名.
	这里分为 
	1 : oldCap 是大于0的。 如果比 MAXIMUM_CAPACITY 还是要大的话,就说明里面存储的元素是太多了,就直接返回oldTab.  还有一种就是 newCap等于oldCap的1.5倍并且小于MAXIMUM_CAPACITY和oldCap是大于默认16的,就会进行1.5倍的扩容
	2 : oldThr 大于 0, newCap(扩容新长度) 就是等于 oldThe的值.
	3 : 否则就是都使用默认的值大小
*/
final Node<K,V>[] resize() {
        Node<K,V>[] oldTab = table;
        int oldCap = (oldTab == null) ? 0 : oldTab.length;
        int oldThr = threshold;
        int newCap, newThr = 0;
        if (oldCap > 0) {
            if (oldCap >= MAXIMUM_CAPACITY) {
                threshold = Integer.MAX_VALUE;
                return oldTab;
            }
            else if ((newCap = oldCap << 1) < MAXIMUM_CAPACITY &&
                     oldCap >= DEFAULT_INITIAL_CAPACITY)
                newThr = oldThr << 1; // double threshold
        }
        else if (oldThr > 0) // initial capacity was placed in threshold
            newCap = oldThr;
        else {               // zero initial threshold signifies using defaults
            newCap = DEFAULT_INITIAL_CAPACITY;
            newThr = (int)(DEFAULT_LOAD_FACTOR * DEFAULT_INITIAL_CAPACITY);
        }
        if (newThr == 0) {
            float ft = (float)newCap * loadFactor;
            newThr = (newCap < MAXIMUM_CAPACITY && ft < (float)MAXIMUM_CAPACITY ?
                      (int)ft : Integer.MAX_VALUE);
        }
        threshold = newThr;
    	
    	/**
    	使用扩容后的newCap来创建一个数组,oldTab不是null,然后就需要将老的值赋值到新的newTab里面来.
        使用下标来进行迭代,获取每个下标的Node节点的值,然oldTab[j]赋值给e后,然后将oldTab[j]重置为null.
        这里面的进行Node复制是有分为下面几种, Node的next节点是没有值得,next下面是由值,e节点转化为了红黑树.
        1 : 如果e.next是null,也就是没有值,newTab[e.hash & (newCap - 1)] = e来赋值.
        2 : 如果e是TreeNode的话,就会调用((TreeNode<K,V>)e).split(this, newTab, j, oldCap)方法.
        3 : 然后可以看到 do while 循环里面, while 里面的条件是 e.next != null 才会进去,也就是next是由值得情况下才会进入到这里面来.然后可以看到一些系取节点啊,赋值给变量啊,然后赋值给新创建的Node数组下标然后将之前的node节点重置为null。 这里就需要读者对这些代码来慢慢消化了.仔细想看,就是对node节点的取值,赋值,重置等操作.
    	*/
        @SuppressWarnings({"rawtypes","unchecked"})
        Node<K,V>[] newTab = (Node<K,V>[])new Node[newCap];
        table = newTab;
        if (oldTab != null) {
            for (int j = 0; j < oldCap; ++j) {
                Node<K,V> e;
                if ((e = oldTab[j]) != null) {
                    oldTab[j] = null;
                    if (e.next == null)
                        newTab[e.hash & (newCap - 1)] = e;
                    else if (e instanceof TreeNode)
                        ((TreeNode<K,V>)e).split(this, newTab, j, oldCap);
                    else { // preserve order
                        Node<K,V> loHead = null, loTail = null;
                        Node<K,V> hiHead = null, hiTail = null;
                        Node<K,V> next;
                        do {
                            next = e.next;
                            if ((e.hash & oldCap) == 0) {
                                if (loTail == null)
                                    loHead = e;
                                else
                                    loTail.next = e;
                                loTail = e;
                            }
                            else {
                                if (hiTail == null)
                                    hiHead = e;
                                else
                                    hiTail.next = e;
                                hiTail = e;
                            }
                        } while ((e = next) != null);
                        if (loTail != null) {
                            loTail.next = null;
                            newTab[j] = loHead;
                        }
                        if (hiTail != null) {
                            hiTail.next = null;
                            newTab[j + oldCap] = hiHead;
                        }
                    }
                }
            }
        }
        return newTab;
}
```





