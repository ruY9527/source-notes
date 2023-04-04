/**
 * async 函数是什么？一句话，它就是 Generator 函数的语法糖。
 * async函数对 Generator 函数的改进，体现在以下四点。
 * 1.内置执行器
 * 2.更好的语义。
 * 3.更广的适用性。
 * (co模块约定，yield命令后面只能是 Thunk 函数或 Promise 对象，而async函数的await命令后面，可以是 Promise 对象和原始类型的值)
 * 4.返回值是 Promise。
 * (async函数完全可以看作多个异步操作，包装成的一个 Promise 对象，而await命令就是内部then命令的语法糖。)
 */

const { resolve } = require("path")

//async的错误处理机制
async function f() {
    throw new Error('bug')
}
f().then((value => console.log(value), err => console.log(err)))


//await 实现休眠
const sleep = (delay) => {
    return new Promise((resolve, reject) => {
        setTimeout(resolve, delay)
    })
}
async function print() {
    for (let i = 0; i < 5; i++) {
        console.log(i)
        await sleep(1000)
    }
}
print()

/**
 * note：
 * 第一点，前面已经说过，await命令后面的Promise对象，运行结果可能是rejected，
 * 所以最好把await命令放在try...catch代码块中。
 * 第二点，多个await命令后面的异步操作，如果不存在继发关系，最好让它们同时触发。
 */

let one=await getA()
let two=await getB()
//one和two是两个独立的异步操作（即互不依赖），被写成继发关系。这样比较耗时，
//因为只有getFoo完成以后，才会执行getBar，完全可以让它们同时触发。用promise.all
//写法一
// let [foo, bar] = await Promise.all([getFoo(), getBar()]);

// 写法二
// let fooPromise = getFoo();
// let barPromise = getBar();
// let foo = await fooPromise;
// let bar = await barPromise;


//note:async 函数可以保留运行堆栈。
const a = () => {
    b().then(() => c());
  };  //当b执行完成时 可能a早已运行完毕，此时如果b()或c()报错，错误堆栈将不包括a()

 // 优化
 const qq = async () => {
    await b();
    c();
  };

  //b()运行的时候，qq()是暂停执行，上下文环境都保存着。一旦b()或c()报错，错误堆栈将包括qq()。