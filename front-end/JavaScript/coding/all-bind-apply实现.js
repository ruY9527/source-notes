function person() {
    console.log(this)
    console.log(arguments)
}
var gt = {
    name: 'gantian'
}

//this的显示调用：相当于在gt中加入了一个person函数，this则默认指向gt
Function.prototype._call = function (obj=window, ...args) {
    //此时的this指向Function
    obj.fun = this
    const result= obj.fun(...args)
    delete obj.fun
    return result

}
person._call(gt,123,12333)

Function.prototype._apply = function (obj=window, ...args) {
    //此时的this指向Function
    obj.fun = this
    const result= obj.fun(...args)
    delete obj.fun
    return result

}
person._apply(gt,[123,12333])


Function.prototype._bind = function (obj = window, ...args) {
    const thisFn = this //保存当前调用的函数
    let thisFnBind = function (...secondArgs) {
        const isNew = this instanceof thisFnBind
        const thisArg = isNew ? this : obj
        return thisFn.call(thisArg, ...args, ...secondArgs)
    }
    thisFnBind.prototype=Object.create(thisFn.prototype)
    return thisFnBind
}

const per = person._bind(gt, 1, 2, 3)
per(4, 5)
