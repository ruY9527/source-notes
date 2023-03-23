/**
 * 泛型（Generics）是指在定义函数、接口或类的时候，
 * 不预先指定具体的类型，而在使用的时候再指定类型的一种特性。
 */

function creatArr<T>(lenght:number,value:T):Array<T>{
    let result:T[]=[]
    for(let i =0;i<lenght;i++){
        result[i]=value
    }
    return result
}

console.log(creatArr<string>(3,'x'))  //[ 'x', 'x', 'x' ]

//定义泛型的时候，可以一次定义多个类型参数：
function swap<U,T>(tuple:[T,U]):[U,T]{
    return [tuple[1],tuple[0]]
}
console.log([1,'str'])  //[ 1, 'str' ]

//泛型约束:
//函数内部使用泛型变量的时候，由于事先不知道它是哪种类型，
//所以不能随意的操作它的属性或方法：

interface LengthScope{
    length:number
}
function print<T extends LengthScope>(arg:T):T{
    console.log(arg.length)
    return arg
}
print({length:20})  //20


//多个类型参数之间也可以互相约束：
function copy<T extends U,U>(target:T,source:U):T{
    for(let id in source){
        target[id]=(<T>source)[id]     //<T>source 就是 source as T，把 source 断言成 T 类型
    }
    return target
}
let x={a:1,b:2,c:'3',d:4}
console.log(copy(x,{b:32,c:'453'}))   //{ a: 1, b: 32, c: '453', d: 4 }


//定义一个函数的形状不仅可以通过接口定义，也可以通过泛型接口
interface Func{
    (x:number,y:number):void
}
let funcA:Func=(x,y)=>{
    return x+y
}
//通过泛型接口
interface CreatFunc{
    <T>(x:T,y:number):Array<T>
}
let creatArray:CreatFunc=<T>(value:T,length:number):Array<T>=>{
    let result:T[]=[]
    for (let i = 0; i < length; i++) {
        result[i] = value;
    }
    return result;

    
}


//泛型也可以用于类的类型定义中：
class GetNum<T=string>{    //默认为string类型
    count:T
    add:(x:T,y:number)=>T
    // constructor(count:T,add:(x:T,y:number)=>T){
    //     this.count=count
    //     this.add=add
    // }
}
let num=new GetNum<number>()  //将T设置为number
num.count=0
num.add=(x,y)=>{
    return x+y+this.count
}
console.log(num.add(1,2))