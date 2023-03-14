
const currying = (fn) => {
    var arg = []
    return function curry(...args) {
        if (args.length === 0) {
            return fn(...arg)
        } else {
            arg.push(...args)
            return curry
        }
    }

}
function add(...args){
    return args.reduce((a,b)=> a+b)
}
function sort(...args) {
    return args.sort((a, b) => {
        return a - b
    })
}
const curryingReview=(fun,...last)=>{
    const value=[...last]
    value.push([].last)
    return function result(...args){
        if(args.length===0){
            return fun(...value)
        }else{
            value.push(...args)
            return result
        }
    }

}
console.log(curryingReview(sort,1, 1, 1)(2,4)(3)())