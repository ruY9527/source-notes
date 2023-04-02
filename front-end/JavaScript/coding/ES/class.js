/**
 * 类的特点：属性 方法  封装  继承
 * 类的所有代码都会在严格模式下进行（函数的this不再指向window 而是undefined）
 * note:
 * 类中的this不是固定的：
 *  以方法的形式调用时，this就是当前实例
 *  以函数的形式调用时，this就是undefined
 * 
 * 若 类中的方法是以箭头函数定义的 则方法中的this恒为箭头函数
*/

class Person {
    constructor(name, age) {
        this.name = name
        this.age = age
    }
    eat = () => {
        console.log('want to eat')
    }
}

class Teacher extends Person {
    //子类在重写构造函数时，必须在子类构造函数中第一时间调用父类构造函数
    constructor(name, age, length) {
        super(name, age)
        this.length = length

    }
    //子类可以通过创建同名属性或方法对父类进行重写
    eat = () => {
        console.log('teacher want to eat')
    }
}
let teacher = new Teacher('gt', 24,'165')
teacher.eat()


