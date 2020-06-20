## 						 ReentrantLock 源码阅读



####  介绍

​		ReetrantLock 效果是和 synchronized 是一样的,只不过 synchronized 是内置锁,ReetrantLock是语法级别的锁, 相对于而言是比synchronized灵活性高些. 不过从我目前公司写代码角度来看,都是直接使用 synchronized . 但是不妨碍我们来看 ReetrantLock 里面的代码实现.



​    使用代码 : 有lock方法就一定要有 unlock方法来释放锁.  一般代码中这样写即可.

```java
public class ReentrantLockCaseMain {

    private ReentrantLock lock = new ReentrantLock();


    public void lockUseCase(){

        lock.lock();
        try {
            System.out.println("执行业务代码逻辑");
        }finally {
            lock.unlock();
        }


    }

}
```



#### 代码分析

​      ReetrantLock 中是没有什么全局参数,相比于集合,就没有那么多全局参数.但是我们要看其里面的内,这里有三个类,  Sync , NonfairSync , FairSync.     NonfairSync和FairSync 都是有继承 Sync. 可以看到NonfairSync 是非公平锁 , FairSync是公平锁.

​      Sync 又集成 AQS, 使用独占锁,  重写了 tryRelease 方法. 

   

-   构造函数:  默认是使用的非公平锁,如果传入进来的是true就会使用公平锁,否则就会使用非公平锁.

  ```java
     /**
     * Creates an instance of {@code ReentrantLock}.
     * This is equivalent to using {@code ReentrantLock(false)}.
     */
    public ReentrantLock() {
        sync = new NonfairSync();
    }

    /**
     * Creates an instance of {@code ReentrantLock} with the
     * given fairness policy.
     *
     * @param fair {@code true} if this lock should use a fair ordering policy
     */
    public ReentrantLock(boolean fair) {
        sync = fair ? new FairSync() : new NonfairSync();
    }
  ```

-  lock 方法:  lock方法是加锁的方法

  lock方法是调用的 Sync 的lock方法, 然后我们可以看到上锁的时候,走的Sync,然后根据FairSync/NonfairSync取走各自的加锁方法,所以说公平锁和非公平锁是加锁的方式是不一样的.

  

  非公平锁获取锁的时候,会获取state这个状态标识,然后再去走对应的逻辑,这里多了比非公平锁多了一个从队列中获取信息和不能获取锁的线程就会被挂起进入队列中排队.

  ```java
  public void lock() {    sync.lock();}
  
  // Sync 
  abstract void lock();
  
  
      /**
      * 公平锁
       * Sync object for fair locks
       */
  tatic final class FairSync extends Sync {
          private static final long serialVersionUID = -3000897897090466540L;
  
      	/* 
      	acquire(1) 调用到AQS中,最后还是调用到下面的tryAcquire方法.
      	那些没有获取到锁的线程,就会按照队列的方式排队,满足先进先出的效果的,也就是先来的线程先执行,
      	果然这就很公平
      	**/
          final void lock() {
              acquire(1);
          }
  
          /**
           * Fair version of tryAcquire.  Don't grant access unless
           * recursive call or no waiters or is first.
           */
          protected final boolean tryAcquire(int acquires) {
              final Thread current = Thread.currentThread();
              int c = getState();
              if (c == 0) {
                  /**
                  	hasQueuedPredecessors() 方法,先判断头结点和尾结点是不相等的,因为相等的话,就重复了,就是同一个. 然后在判断头结点的 thread是不是当前线程,如果不是当前的前程的话,那么就是在这个线程钱面还有一个等待获取锁时间更久的线程,于是就先抛弃这个线程,去执行那个等待更久的线程.
                  	
                  	compareAndSetState 就是用cas来获取锁的代码,如果获取成功的话,就会走setExclusiveOwnerThread方法,这里set进去的值是在释放锁的时候会用到.
                  	最后返回true,说明获取锁成功了.
                  */
                  if (!hasQueuedPredecessors() &&
                      compareAndSetState(0, acquires)) {
                      setExclusiveOwnerThread(current);
                      return true;
                  }
              }
              /**
              	获取从setExclusiveOwnerThread里面的thread,来判断是否与当前线程相等,如果相等的话,就说明重入了.
              */
              else if (current == getExclusiveOwnerThread()) {
                  int nextc = c + acquires;
                  if (nextc < 0)
                      throw new Error("Maximum lock count exceeded");
                  setState(nextc);
                  return true;
              }
              return false;
          }之前
  }
  
  public final boolean hasQueuedPredecessors() {
          // The correctness of this depends on head being initialized
          // before tail and on head.next being accurate if the current
          // thread is first in queue.
          Node t = tail; // Read fields in reverse initialization order
          Node h = head;
          Node s;
          return h != t &&
              ((s = h.next) == null || s.thread != Thread.currentThread());
  }
  
  /**
  	非公平锁:
  */
  static final class NonfairSync extends Sync {
          private static final long serialVersionUID = 7316153563782823691L;
  
          /**
           * Performs lock.  Try immediate barge, backing up to normal
           * acquire on failure.
           可以看到非公平锁是没有从队列中获取说明结点信息,而是直接获取锁的.
           获取成功了就会走 setExclusiveOwnerThread 方法
           */
          final void lock() {
              if (compareAndSetState(0, 1))
                  setExclusiveOwnerThread(Thread.currentThread());
              else
                  acquire(1);
          }
  
          protected final boolean tryAcquire(int acquires) {
              return nonfairTryAcquire(acquires);
          }
  }
  
  /**
  	Sync类中
  	这段代码的逻辑也是和 公平锁后来的处理一样的了. c如果是0的话,就会走获取锁的代码,如果不是0的话,就说明重入了,所以就++
  */
  final boolean nonfairTryAcquire(int acquires) {
              final Thread current = Thread.currentThread();
              int c = getState();
              if (c == 0) {
                  if (compareAndSetState(0, acquires)) {
                      setExclusiveOwnerThread(current);
                      return true;
                  }
              }
              else if (current == getExclusiveOwnerThread()) {
                  int nextc = c + acquires;
                  if (nextc < 0) // overflow
                      throw new Error("Maximum lock count exceeded");
                  setState(nextc);
                  return true;
              }
              return false;
  }
  ```

  

  

  unlock方法:   unlock是释放锁的方法. 可以看到释放锁是走的 Sync的release方法,所以不管公平锁还是非公平锁起走的释放锁方法是不一样的.

  ```java
  public void unlock() {    sync.release(1);}  
  
  /**
  	Sync 中方法. 
  */
  public final boolean release(int arg) {
          // tryRelease()方法返回true的话,就说明锁都释放完了.
          
          if (tryRelease(arg)) {
              Node h = head;
              // 恢复线程
              if (h != null && h.waitStatus != 0)
                  unparkSuccessor(h);
              return true;
          }
          return false;
  }
  
  
  protected final boolean tryRelease(int releases) {
              // 释放锁
              int c = getState() - releases;
              // 如果当前线程不是自己的话,就会抛出异常.这里可以理解为,独占锁,肯定是自己.
              // 也就是说,如果不是独占锁的话,就会抛出异常.
              if (Thread.currentThread() != getExclusiveOwnerThread())
                  throw new IllegalMonitorStateException();
              boolean free = false;
              // 如果你调用了一次lock的话,那么会加一,所以这个地方要等这个lock方法全部被释放掉.
      		// 也就是由于重入锁的原因.
              if (c == 0) {
                  free = true;
                  // 释放完了,就设置了null.  
                  // 然后AbstractOwnableSynchronizer中的thread标记也就是null,
                  // 所以下个线程判断是null的话,就可以获取到执行权,也就是获取到锁.
                  setExclusiveOwnerThread(null);
              }
              setState(c);
              return free;
  }
  ```

​         

- ​    isLocked () 方法, 判断这个线程是不是被锁了:

  ​    调用Sync中isLock方法,如果不是0的话,就说明是被锁了,如果是0的话,就说明没有被锁.

  ```java
      /**
       * Queries if this lock is held by any thread. This method is
       * designed for use in monitoring of the system state,
       * not for synchronization control.
       *
       * @return {@code true} if any thread holds this lock and
       *         {@code false} otherwise
       */
      public boolean isLocked() {
          return sync.isLocked();
      }
      
   final boolean isLocked() {
              return getState() != 0;
  }
  ```

  

  hasQueuedThreads()  :  是否有线程在等待队列中

  hasQueuedThread(Thread thread) :  线程是否在等待队列中

  getQueueLength() :  获取队列中线程个数

  等这些方法都是比较好理解的,可以自行点进去仔细看下.  

   

  ####  总结

     Sync  /  NonfairSync  /  FairSync  这个三个类就是 ReetrantLock中的三个类,都是围绕这这三个类在做文章.

    公平锁和非公平锁的获取锁方式不一样,但是释放方式是一样的. 公平锁获取锁的时候,如果有线程持有了的话,那么其他的会被挂起并且进入等待队列. 而非公平锁,直接获取锁,就是抢占式.