//类型断言只会影响 TypeScript 编译时的类型，类型断言语句在编译结果中会被删除：
//断言
function toBoolean(par:any):boolean{
    return par as boolean
}
console.log(toBoolean('123'))  //123

//转换
function transToBool(par:any):boolean{
    return Boolean(par)
}
console.log(transToBool('123'))   //true


//所以类型断言不是类型转换，它不会真的影响到变量的类型。