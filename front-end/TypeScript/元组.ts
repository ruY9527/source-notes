/*数组合并了相同类型的对象，而元组（Tuple）合并了不同类型的对象。
*/
let info:[number,string]=[24,'gt']

info[0]=33 //可以只赋值其中一种

//越界的元素
info.push(1)
info.push('hello') //只能传入已经声明过得类型

