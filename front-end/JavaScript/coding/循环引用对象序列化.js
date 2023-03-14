const user = {
    name: 'gantian',
    age: 24,
    books: ['book1', 'book2', 'book3', 'book4']
}
//添加循环引用
user.self = user
user.pet = {
    name: 'dog',
    like: user.books[0]
}
user.weath = [user.pet, user.books]

//使用WeakMap打破循环引用
/**
 * WeakMap结构不存在iterator 所以不可以遍历
 * JSON.stringfy() 会忽略WeakMap结构的弱引用部分
 * 
 */

let pathRef = new WeakMap()

function isObject(obj) {
    return obj && typeof obj === 'object' && !(obj instanceof Function)
        && !(obj instanceof Date) && !(obj instanceof Map) && !(obj instanceof Set)
}

function formatCircleRef(obj, jsonPath) {
    if (!jsonPath) {
        console.warn('jsonPath不存在')
    }
    if (isObject(obj)) {
        //存储对象的path
        let path = pathRef.get(obj)
        if (path) {
            return path
        } else {
            pathRef.set(obj, jsonPath)
        }
        //遍历对象及子属性
        if (Array.isArray(obj)) {
            //数组
            return obj.map((item, index) => {
                return formatCircleRef(item, `${jsonPath}["${index}"]`)
            })
        } else {
            //对象
            const temp = {}
            Object.keys(obj).forEach(key => {
                let value = obj[key]
                temp[key] = formatCircleRef(value, `${jsonPath}["${key}"]`)
            })
            return temp
        }
    } else {
        return obj
    }

}

console.log(formatCircleRef(user, '$'))