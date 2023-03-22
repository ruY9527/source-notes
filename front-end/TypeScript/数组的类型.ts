// 类型+[] 表示
let person:number[]=[1,2,3,4]


//数组泛型 表示
let animal:Array<number>=[1,2,3,4,5]

//用接口表示
interface NumberArr{
    [index:number]:string   //只要索引的类型是数字时，那么值的类型必须是字符串
}
let color:NumberArr=['red','pink','yellow']


//类数组用接口来表示
function sum(){
    let args:{
        [index:number]:number
        length:number
        callee:Function
    }=arguments
    console.log(args)
}
//IArguments 是ts内置好的类数组接口
interface IArguments {
    [index: number]: any;
    length: number;
    callee: Function;
}

//用 any 表示数组中允许出现任意类型：
let arr:any=['1',{a:'222'}]