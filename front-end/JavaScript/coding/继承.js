//1. 原型继承
//问题 原型中包含的引用类型属性会被所有实例共享；子类也不能给构造函数传参
function Animal(){
    this.colors=['pink','red','yellow']
}
Animal.prototype.getColor=function(){
    return this.colors
}
function Dog(){

} 
Dog.prototype=new Animal()
//
let dog1=new Dog()
let dog2=new Dog()
dog1.colors.push('green')
console.log(dog2.colors,'dog')


//2. 构造函数继承
//问题 每次创建子类实例都会出现创建构造函数里面的方法
function Animal(name){
    this.name=name
    this.colors=['pink','red','yellow']
    this.getName=function(){
        return this.name
    }
}
function Dog(name){
    Animal.call(this,name)
}
Dog.prototype=new Animal()

//
let doga=new Dog('Peter')
doga.colors.push('green')
let dogb=new Dog('Amy')
console.log(doga.colors)


//3.组合继承 原型链继承原型上的属性和方法 构造函数继承实例属性
function Animal(name){
    this.name=name
    this.colors=['pink','red','yellow']
}
Animal.prototype.getName=function(){
    console.log(this.name) 
}
function Dog(name){
    return Animal.call(this,name)
}

Dog.prototype=new Animal()
Dog.prototype.constructor=Dog

let dogc=new Dog('Peter')
dogc.colors.push('green')
let dogd=new Dog('Amy')
console.log(dogd.colors)
dogc.getName()


//4.寄生式组合继承
function Animal(name){
    this.name=name
    this.colors=['pink','red','yellow']
}
Animal.prototype.getName=function(){
    console.log(this.name) 
}
function Dog(name){
    return Animal.call(this,name)
}

Dog.prototype=Object.create(Animal.prototype)
Dog.prototype.constructor=Dog


//5. class 实现继承
class Animal {
    constructor(name) {
        this.name = name
    } 
    getName() {
        return this.name
    }
}
class Dog extends Animal {
    constructor(name, age) {
        super(name)
        this.age = age
    }
}

