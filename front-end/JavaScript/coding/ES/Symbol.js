//使用Symbol()生成一个独一无二的属性值 避免属性命名冲突
// let sym=new Symbol()

//Symbol()函数前不能使用new命令，否则会报错。
//这是因为生成的 Symbol 是一个原始类型的值，不是对象，所以不能使用new命令来调用。
//另外，由于 Symbol 值不是对象，所以也不能添加属性。基本上，它是一种类似于字符串的数据类型。


let sym=Symbol()
let obj={}
obj[sym]='hello'
console.log(obj[sym])   //'hello'

//1. symbol 作为对象属性时 不能使用点运算符
obj.sym='error'          //此时的sym 相当于一个普通的字符串
console.log(obj[sym])   //undefined

//2. 如果Symbol参数是一个对象 那么会调用对象内部的toString方法 将其转换为字符串
let a={
    toString(){
        return 123
    }
}
let test=Symbol(a)
console.log(test)   //Symbol(123)

//3. Symbol类型的值不能与其他类型值进行计算 否则报错  也不能转换为数值
let name=Symbol('gantian')

console.log('symbol is'+ name)  //Cannot convert a Symbol value to a string
console.log(2+ name)            //Cannot convert a Symbol value to a number

//但是可以显示转换
console.log('symbol is'+ name.toString())  //symbol is Symbol(gantian)

//也可以转换为bool值
console.log(Boolean(name))  //true
console.log(!name)    //false


//4. 使用 description  返回symbol值的描述
let des=Symbol('this is a desc...')
console.log(des.description)

//5. 遍历对象时 Symbol属性不会出现在for ..in ， for ...of， Object.keys() ,
// Object.getOwnPropertyNames(),JSON.stringify() 中
let x=Symbol('foo')
let y=Symbol('bar')
let object={
    [x]:'hello',
    [y]:'world',
    z:'!'
}
console.log(JSON.stringify(object) )    //{"z":"!"}

//使用 Object.getOwnPropertySymbols()
console.log(Object.getOwnPropertySymbols(object))  //[ Symbol(foo), Symbol(bar) ]

//使用 Reflect.ownKeys() 可以返回常规属性和symbol属性
console.log(Reflect.ownKeys(object))       //[ 'z', Symbol(foo), Symbol(bar) ]

/*6. Symbol.for()，Symbol.keyFor()
    Symbol.for()可以共用同一个symbol值 但是 Symbol()不行
    Symbol.keyFor()方法返回一个已登记的 Symbol 类型值的key。
*/
let s1=Symbol.for('foo')
let s2=Symbol.for('foo')
console.log(s1===s2)     //true
console.log(s1.description)   //foo
console.log(Symbol.keyFor(s1))   //foo


let a1={
    0:1,
    length:1
}
a1[Symbol.isConcatSpreadable]=true
console.log([1,2].concat(a1))


const xx = {};
xx[Symbol.replace] = (...s) => console.log(s);

'Hello'.replace(xx, 'World')   //[ 'Hello', 'World' ]
