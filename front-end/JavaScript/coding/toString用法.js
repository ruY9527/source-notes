/**
 * 1.数据转化为字符串 不同类型数据 调用类型原型链上的toString方法
 * 2.判断数据类型
 * 3.隐式转换  作比较的时候 ==
 */

function fn(){
    const fn1=function(){
        return fn1
    }
    fn1.toString=function(){
        return 1
    }
    return fn1
}
console.log(fn()==1)  //ture  比较时 隐式调用函数内部的toString方法
console.log(+fn())    //1

let obj={a:1}
let map=new Map()
map.set('aaa','hekko')
console.log([1,2,3].toString())
console.log(map.toString())
console.log(false.toString())



