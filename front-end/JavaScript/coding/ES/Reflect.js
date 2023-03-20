/**
 * Reflect对象与Proxy对象一样，也是 ES6 为了操作对象而提供的新 API
 * 作用：
 */

/*
  （1） 将object对象中的一些属于语言内部的方法 放到reflect上部署
  （2） 修改某些object方法的返回结果 
   比如，Object.defineProperty(obj, name, desc)在无法定义属性时，会抛出一个错误，
   而Reflect.defineProperty(obj, name, desc)则会返回false。
*/
//老写法
// Object.defineProperty(target,property,attributes)
let obj={}      
Object.defineProperty(obj,'a',{
    value:1,
    writable:true
})

//新写法
Reflect.defineProperty(obj,'c',{
    value:2
})
console.log(obj.c,'obj')


//(3) 让Object操作都变成函数行为
//旧：
let person={
    name:'gt',
    age:3
}
'name' in person    //true

//新
Reflect.has(person,'name')
Reflect.deleteProperty(person,'age')

//(4)Reflect对象的方法与Proxy对象的方法一一对应,不管Proxy怎么修改默认行为，你总可以在Reflect上获取默认行为。

var myObj={
    foo:1,
    bar:2,
    get baz(){
        return this.foo+this.bar
    }
}
Reflect.get(myObj,'foo')
Reflect.get(myObj,'foo')
Reflect.get(myObj,'baz')


/**
 * 注意，如果 Proxy对象和 Reflect对象联合使用，前者拦截赋值操作，后者完成赋值的默认行为，
 * 而且传入了receiver，那么Reflect.set会触发Proxy.defineProperty拦截。
 */
let  p={
    a:1
}
let handler={
    set(target,prop,value,receiver){   //添加了receiver 触发了defineProperty 拦截
        console.log(target,'target')
        console.log(prop,'prop')
        console.log(value,'value')
        console.log(receiver,'receiver')
        Reflect.set(target,prop,value,receiver)
    },
    defineProperty(target,prop,attribute){
        console.log(prop,'prop---')
        Reflect.set(target,prop,attribute)
    }
}
let obj =new Proxy(p,handler)
obj.c=333
console.log(obj,'obj')


//可以代替 new来调用构造函数
function Hello(s){
 this.name=s
}
let a=new Hello('world')

let b=Reflect.construct(Hello,['gt'])

console.log(a.name)   //world
console.log(b.name)    //gt



//使用 Proxy 实现观察者模式
