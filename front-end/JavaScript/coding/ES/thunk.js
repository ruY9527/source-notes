/**
 * 编译器基于'传名调用'：将参数放到一个临时函数，在将临时函数传入函数体
 * 这个临时函数就是Thunk函数
 * 这就是 Thunk 函数的定义，它是“传名调用”的一种实现策略，用来替换某个表达式。
 */
function f(m) {
    return m * 2
}
f(x + 5)
//等同于
let thunk = () => {
    return x + 5
}
function f(thunk) {
    return thunk() * 2
}

/**
 * javaScript是传值调用
 * 在 JavaScript 语言中，Thunk 函数替换的不是表达式，而是多参数函数，
 * 将其替换成一个只接受回调函数作为参数的单参数函数。
 */

//正常版本的readFile（多参数）
fs.readFile(fileName, callback)

//Thunk版本的readFile（单参数）
let _thunk = (fileName) => {
    return function (callback) {
        return fs.readFile(fileName, callback)
    }
}

let readFileThunk = _thunk(fileName)
readFileThunk(callback)

/**
 * Thunk函数转化器
 */
let Thunk = function (fn) {
    return function (...args) {
        return function (callback) {
            return fn.call(this, ...args, callback)
        }
    }
}

function f(a, cb) {
    cb(a)
}
const ft = Thunk(f)
ft(1)(console.log)

/**
 * Thunk 函数现在可以用于 Generator 函数的自动流程管理
 * Thunk 函数真正的威力，在于可以自动执行 Generator 函数
 */

function run(fn) {
    var gen = fn()
    function next(err, data) {
        var result = gen.next(data)
        if (result.done) return
        next.value(next)
    }
    next()
}
let g = function* () {
    let f1 = yield* readFileThunk('file1')
    let f2 = yield* readFileThunk('file2')
    let f3 = yield* readFileThunk('file3')
}

run(g)


//基于 Promise 对象的自动执行
//将readFile包装为promise对象
var readFile = (fileName) => {
    return new Promise((resolve, reject) => {
        fs.readFile(fileName, (err, data) => {
            if (err) return reject(error)
            resolve(data)
        })
    })
}

let gener = function () {
    let f1 = yield readFile('f1')
    let f2 = yield readFile('f2')
    let f3 = yield readFile('f3')
}
let run = (fn) => {
    let gen = fn()
    function next() {
        let result = gen.next()
        if (result.done) return
        result.value.then((data) => next(data))
    }
    next()
}
run(gener)


co(function* () {
    var res = yield [
      Promise.resolve(1),
      Promise.resolve(2)
    ];
    console.log(res);
  }).catch(onerror);