// 原生具备 Iterator 接口的数据结构如下。

// Array
// Map
// Set
// String
// TypedArray
// 函数的 arguments 对象
// NodeList 对象
/**
 * 
 * 调用Iterator接口的场合
 * 1.解构赋值
 * 2.扩展运算符
 * 3.yield*
 *  
 */
//遍历器生成函数

function idMaker(arr) {
    let index = 0
    return {
        next: function () {
            return index < arr.length ? { value: arr[index++], done: false }
                : {
                    value: undefined,
                    done: true
                }
        }
    }
}
const it = idMaker(['a', 'b'])
console.log(it.next())   //{ value: 'a', done: false }
console.log(it.next())   //{ value: 'b', done: false }
console.log(it.next())   //{{ value: undefined, done: true }


let arr = ['a', 'b', 'c']
arr['name'] = 'gt'
//for...of循环调用遍历器接口，数组的遍历器接口只返回具有数字索引的属性。
//这一点跟for...in循环也不一样。
for (let a in arr) {
    console.log(a)   //0 1 2 name
}
for (let a of arr) {
    console.log(a)   //a b c
}

//entries() 返回一个遍历器对象，用来遍历[键名, 键值]组成的数组
let array = ['a', 'b', 'c']
// console.log(array.entries())   //Object [Array Iterator] {}
for (let item of array.entries()) {
    console.log(item)      //[10,'a'] [ 1, 'b' ] [ 2, 'c' ]
}



let iter = arr[Symbol.iterator]()
console.log(iter.next())   //{ value: 'a', done: false }
console.log(iter.next())    //{ value: 'b', done: false }
console.log(iter.next())    //{ value: 'c', done: false }
console.log(iter.next())    //{ value: undefined, done: true }


let str = 'hello'
for (let val of str) {
    console.log(val)    // h   e   l   l   o
}
//应用：将可遍历的数据转换为数组
console.log([...str])     //[ 'h', 'e', 'l', 'l', 'o' ]


// yield* 后面跟着一个可遍历的结构
let generator = function* () {
    yield 1
    yield* [2, 3, 4]
    yield 5
}
var a = generator()
console.log(a.next())
console.log(a.next())
console.log(a.next())
console.log(a.next())
console.log(a.next())
console.log(a.next())
console.log(a.next())

//类似数组的对象 可以调用数组的遍历器
let aaa = {
    0: '111',
    1: '222',
    length: 2,
    [Symbol.iterator]: Array.prototype[Symbol.iterator]
}
for (let item of aaa) {
    console.log(item)
}

//使用Array.from方法将对象转换为可iterator的对象
let b = {
    0: '1',
    1: '2',
    2: 'c',
    length: 3
}
console.log(Array.from(b))[1, 2, 'c']
for (let item of Array.from(b)) {
    console.log(item)      //1 2 c
}

function aa(){
    console.log('aaa')
}
aa.animal='dog'
console.log(aa)