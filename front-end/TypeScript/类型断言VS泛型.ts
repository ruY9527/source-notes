/**
 * 可以通过类型断言 或者 泛型 来实现对函数返回值的约束
 */
function getData(key:string):any{
    return (window as any).cache[key]
}

interface Obj{
    name:string
    get():void
}
const obj1=getData('obj1') as Obj    //断言
obj1.get()


function getTdata<T>(key:string):T{
    return (window as any).cache[key]
}
let obj2=getTdata<Obj>('obj2')        //泛型