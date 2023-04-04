const { constants } = require("buffer")

function deepClone(obj) {
    //排除基本数据类型 和函数（可以不用深拷贝 不会发生变化）
    if (typeof obj !== 'object' || obj === null) {   //null的类型为object
        return obj                           //null 1 'a' undefined
    }
    //缓存
    if (!deepClone.cached) {
        deepClone.cached = new Map()
    }
    //判断是否缓存过
    if (deepClone.cached.has(obj)) {
        return deepClone.cached.get(obj)
    }
    let temp
    if (obj instanceof Map) {
        temp = new Map()
        deepClone.cached.set(obj, temp)
        for (let [key, value] of obj) {
            temp.set(deepClone(key), deepClone(value))   //map的key也可以是引用类型
        }
    } else if (obj instanceof Set) {
        temp = new Set()
        deepClone.cached.set(obj, temp)
        for (let value of obj) {
            temp.add(deepClone(value))
        }
    } else if (obj instanceof RegExp) {
        temp = new RegExp(obj)
        deepClone.cached.set(obj, temp)
    } else {
        //对象或数组
        temp = new obj.constructor()
        deepClone.cached.set(obj, temp)
        for (let key in obj) {
            temp[key] = deepClone(obj[key])
        }
    }

    return temp
}
let testObj = {
    arr: [1, 2, 3, 4],
    arrOfObj: [{ a: 1 }, { b: 2 }, { c: 3 }],
    date: new Date(),
    obj: {
        a: 1,
        b: 2,
        c: {
            x: 1,
            y: 2,
            z: 3
        }
    },
    fun: function () {
        return 7
    },
    set: new Set([3, 4, 5, 6]),
    map: new Map([
        ['a', 1], ['b', '123'], ['c', 222]
    ]),
    reg: /[2345]/
}
//制造环形对象
let obj2 = {
    to: testObj
}
testObj.to = obj2
console.log(testObj)


const newObj = deepClone(testObj)
console.log(newObj)


// function deepCloneReview(obj){
//     //obj为基本量类型时，直接返回
//     if(typeof obj!=='object'&&obj!==null){
//         return obj
//     }
//     //obj为引用类型
//     let temp
//     if(obj instanceof Map){
//         temp=new Map()
//         for(let [key,val] of obj){
//             temp.set(deepCloneReview(key),deepCloneReview(val))
//         }
//     }else if(obj instanceof Set){
//         temp=new Set()
//         for(let val in obj){
//             temp.add(deepCloneReview(val))
//         }

//     }else if(obj instanceof RegExp){
//         temp=new RegExp(obj)
//     }else{      //数组或对象
//         temp = new obj.constructor()
//         for(let key in obj){
//             temp[key]=deepCloneReview(obj[key])
//         }
//     }


//     return temp
// }


console.log([...[...'abc']])