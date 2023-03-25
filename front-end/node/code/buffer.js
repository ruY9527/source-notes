/**
 * 创建buffer
 */
//1. alloc
let buf=Buffer.alloc(10)
// console.log(buf,'buf')


//2.allocUnsafe   可能会包含旧的内存地址
let buf_1=Buffer.allocUnsafe(10)
// console.log(buf_1,'buf')

//3.from
//通过字符串创建buffer
let buf_2=Buffer.from('hello')
// console.log(buf_2,'buf_2')

//通过数组创建buffer
let buf_3=Buffer.from([105,108,111,118,101,121,111,117])
console.log(buf_3,'buf_3')

/**
 * 操作buffer
 */

//1.buffer与字符串的转换
console.log(buf_3.toString(),'buf_3')   //utf-8

//2.buffer元素的读写
console.log(buf_2[0].toString(2),'buf_2')   //toString执行数字的进制转换
buf_2[0]=95
console.log(buf_2.toString())    //_ello 修改字符串

//3.buffer 溢出
let buf_4=Buffer.from('hello')
buf[0]=361   //一个元素的二进制位 最大不超过255 超出时会舍弃高位 0001 0110 1001=>0110 1001
console.log(buf_4,'buf_4')

//中文
let buf_5=Buffer.from('你好')
console.log(buf_5,'buf_5')    //<Buffer e4 bd a0 e5 a5 bd>
