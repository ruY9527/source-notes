/**
 * Proxy 可以理解成，在目标对象之前架设一层“拦截”，外界对该对象的访问，都必须先通过这层拦截，
 * 因此提供了一种机制，可以对外界的访问进行过滤和改写
 */

//target参数表示所要拦截的目标对象，handler参数也是一个对象，用来定制拦截行为

let proxy=new Proxy(target,handler)

let obj=new Proxy({},{
    get:function(target,propKey,receiver){
        console.log(`get ${propKey}`)
        return Reflect.get(target,propKey,receiver)
    },
    set:function(target,propKey,value,receiver){
        console.log(`set ${propKey}`)
        return Reflect.set(target,propKey,value,receiver)
    },
})
obj.count=1      //set count
obj.count++      //set count  get count


//应用：获取对象时，不存在的话一般只会返回undefined ，可以通过Proxy让其返回错误
let obj={
    name:'gt'
} 
let pro=new Proxy(obj,{
    get:function(target,propKey){
        if(propKey in target){
            return target[propKey]
        }else{
            return new ReferenceError('该属性不存在！')
        }
    }
})
console.log(pro.name)
console.log(pro.count)