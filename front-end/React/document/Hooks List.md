Hooks List:

1. useState()
   * 问题：如果直接修改旧的state对象，由于对象还是那个对象不会生效
   * 解决：浅拷贝一个新的对象进行set 或者setState()里使用回调
2. memo()
   * 对组件进行缓存，避免由于setState()引起不必要的重复渲染
   * (避免父组件修改造成的子组件重复渲染)
3. useCallback()
   * （避免子组件向父组件通信时，由于父组件更新造成的子组件重复渲染）
4. useMemo()
   * 和useCallback()一样 ，都是缓存；解决子组件的重新渲染
   * 只是用法不一样
5. useContext()
   * 跨层级通信 相当于vue中的eventBus

