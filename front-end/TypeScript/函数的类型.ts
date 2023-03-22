//函数声明的类型定义
function func(x: number, y: number): number {
    return x + y;
}

//函数表达式的类型定义
const myAdd = function add(x: number, y: number): number {
    return x + y
}
//以上操作只是对代码右侧的函数进行定义 需要手动给myFunc添加类型
const myFunc: (x: number, y: number) => number = func


//用接口定义函数的形状
interface AddFunc{
    (a:number,b:number):number
}
let addOne:AddFunc
addOne=(x:number,y:number):number=>x+y

//可选参数必须接在必需参数后面。换句话说，可选参数后面不允许再出现必需参数了


/*参数默认值：TypeScript 会将添加了默认值的参数识别为可选参数：
此时不受可选参数必须在后面的限制了*/
function printName(first:string='tian',last:String='Gan'){
    console.log(`我是${last} ${first}`)
}
printName(undefined,'wang')

//重载：允许一个函数接受不同数量或类型的参数时，作出不同的处理。
function reverse(x:number):number
function reverse(x:string):string
function reverse(x:number|string):void|number|string{
    if(typeof x==='number'){
        return Number(x.toString().split('').reverse().join(''))
    }else if(typeof x==='string'){
        return x.split('').reverse().join('')
    }
}
console.log(reverse(12334))   //43321


