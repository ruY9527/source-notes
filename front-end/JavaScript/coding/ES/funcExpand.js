// 如果没有传递y,则使用默认值 World
function log(x, y='World') {
    console.log(x, y)
}

function Point(x = 0, y = 0) {
    this.x = x;
    this.y = y;
}

// 解构默认值
function foo({x = 4, y = 5}) {
    console.log(x, y)
}

function f(x, y = x) {
    console.log(x * y)
}

var sum = (n1, n2) => n1 + n2;
let getTempItem = id => ({ id: id, name: 'BaoYang' });
const fullName = ({ first, last }) => first + ' ' + last;
let arrMap = [1,2,3].map(x => x * x);


log('Yang')
log('Yang','Bao')
const p = new Point(2,3)
console.log(p.x * p.y)
foo({})
foo({x:1})
foo({x:6,y:6})
f(3)
console.log(foo.name)
console.log('--------- 箭头函数分割 -----------')
console.log(sum(1,2))
console.log(fullName({first:'Bao',last:'Yang'}))
console.log(arrMap)

// 尾调用： 某个函数的最后一步是调用另外一个函数;比如下面
/***
 * function f(x){
 *  return g(x);
 * }
 * 
 */

function factorial(n) {
    if(n === 1) return 1;
    return n * factorial(n - 1)
}

console.log(factorial(6))

console.log('----       数组切割  ---------')
const a1 = [1,2];
const a2 = [...a1];

// 合并数组
const a3 = a1.concat(a2)
console.log(a3)