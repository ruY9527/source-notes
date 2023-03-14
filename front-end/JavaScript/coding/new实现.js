function foo(name, age) {
    this.name = name
    this.age = age
    console.log('new.target:', new.target);
}
const a = new foo('gt', '24')
console.log(a, 'a')

function _new(fun, ...args) {
    let obj = Object.create({})
    Object.setPrototypeOf(obj,fun.prototype)
    let res = fun.apply(obj, args)
    return res instanceof Object ? res : obj
}
 function person(name){
    this.name=name
    console.log('new.target:', new.target);
 }
 let man=_new(person,'gt')
 console.log(man,'man')


