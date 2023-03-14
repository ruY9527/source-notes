/*已知如下数组：var arr = [ [1, 2, 2], [3, 4, 5, 5], [6, 7, 8, 9, [11, 12, [12, 13, [14] ] ] ], 10];

编写一个程序将数组扁平化去并除其中重复部分数据，最终得到一个升序且不重复的数组*/
var arr = [[1, 2, 2], [3, 4, 5, 5], [6, 7, 8, 9, [11, 12, [12, 13, [14]]]], 10]

function test(arr) {
  return arr.reduce((pre, cur) => {
    return pre.concat(Array.isArray(cur) ? test(cur) : cur)
  }, [])
}
// console.log(test(arr))

//递归思想：
function flatter(arr) {
  if (!arr.length) return
  return arr.reduce((pre, cur) => {
    return Array.isArray(cur) ? [...pre, ...flatter(cur)] : [...pre, cur]
  }, [])
}
console.log(flatter(arr));


//迭代思想：
function _flatter(arr) {
  if (!arr.length) return;
  while (arr.some((item) => Array.isArray(item))) {
   
    arr = [].concat(...arr);      //concat是关键
    console.log(arr,'arr')
  }
  return arr;
}


console.log(1=='1')

