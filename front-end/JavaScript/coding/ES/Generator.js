/**
 * Generator 函数是一个状态机，封装了多个内部状态。
    执行 Generator 函数会返回一个遍历器对象
 */
function* stringGenerator() {
    yield 'hello'
    yield 'world'
    return 'ending'
}
//调用 Generator 函数后，该函数并不执行，返回的也不是函数运行结果，而是一个指向内部状态的指针对象，
//也就是上一章介绍的遍历器对象（Iterator Object）。
var gen = stringGenerator()

//调用遍历器对象的next方法，使得指针移向下一个状态
console.log(gen.next(), 'gen')   //{ value: 'hello', done: false }
console.log(gen.next(), 'gen')   //{ value: 'world', done: false }
console.log(gen.next(), 'gen')   //{ value: 'ending', done: true }


//场景 数组扁平化
let arr = [1, 2, 3, [4, 5, 6, [7, 4]]]
let flat = function* (arr) {
    for (let i = 0; i < arr.length; i++) {    //yield表达式不能用在forEach中
        if (typeof arr[i] !== 'number') {
            yield* flat(arr[i])
        } else {
            yield arr[i]
        }
    }

}
for (let i of flat(arr)) {
    console.log(i)
}       //1 2 3 4 5 6 7 4


//与 Iterator 接口的关系 
var iterable = {}
let obj = {
    a: 1
}
iterable[Symbol.iterator] = function* () {
    yield 1
    yield 2
    yield 3
}
console.log([...iterable])  //[1,2,3]
console.log([...obj])       //obj is not iterable


/**next 方法的参数  
yield表达式本身没有返回值，或者说总是返回undefined。
next方法可以带一个参数，该参数就会被当作上一个yield表达式的返回值。
*/
function* f() {
    for (let i = 0; true; i++) {
        var reset = yield i
        if (reset) {
            i = -1
        }
    }
}
var g = f()
console.log(g.next()) //{ value: 0, done: false }
console.log(g.next())   //{ value: 1, done: false }
console.log(g.next())
console.log(g.next())
console.log(g.next())           //{ value: 4, done: false }
console.log(g.next(true))  //{ value: 0, done: false }
console.log(g.next(true))   //{ value: 0, done: false }


//通过next方法的参数，向 Generator 函数内部输入值的例子。
function* foo(x) {
    let y = 2 * (yield (x + 1))
    let z = yield (y / 3)
    return x + y + z
}
let b = foo(2)
console.log(b.next())  //{ value: 3, done: false }
console.log(b.next(12)) //{ value: 8, done: false }
console.log(b.next(10))  //{ value: 36, done: true }


//如果想要第一次调用next方法时，就能够输入值，可以在 Generator 函数外面再包一层。
function* generateFunc() {
    console.log(`first input: ${yield}`)
    return 'done'
}
function wrapper(generateFunc) {
    return function (...args) {
        let gen = generateFunc(...args)
        gen.next()
        return gen
    }
}
const res = wrapper(generateFunc)()
console.log(res.next('111'))       //first input: 111



//for...of遍历
function* foo() {
    yield 1;
    yield 2;
    yield 3;
    yield 4;
    yield 5;
    return 6;
}

for (let v of foo()) {
    console.log(v);
}
// 1 2 3 4 5


//为原生的对象添加遍历接口
function* objectArray(obj) {
    let keys = Reflect.ownKeys(obj)
    for (let key of keys) {
        yield [key, obj[key]]
    }
}
let perosn = {
    name: 'gt',
    age: 24,
    gender: 'female'
}
let objToArr = objectArray(perosn)
for (let [key, value] of objToArr) {
    console.log(`key:${key},value:${value}`)
}
console.log([...objToArr])  //[ [ 'name', 'gt' ], [ 'age', 24 ], [ 'gender', 'female' ] ]

//throw命令抛出的错误不会影响到遍历器的状态
var gen = function* gen() {
    yield console.log('hello');
    yield console.log('world');
}
var g = gen();
console.log(g.next());
console.log(g.next());
try {
    throw new Error();
} catch (e) {
    g.next();
}