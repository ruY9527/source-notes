//类的定义
/**
 * TypeScript 可以使用三种访问修饰符（Access Modifiers）
 * ，分别是 public、private 和 protected
 */

//使用 private 修饰的属性或方法，在子类中也是不允许访问

class Animal {
    public name;
    private constructor(name) {
      this.name = name;
    }
  }
  
//   class Cat extends Animal {   //error 不允许被继承
//     constructor(name) {
//       super(name);
//       console.log(this.name);
//     }
//   }
  

  //当构造函数修饰为 protected 时，该类只允许被继承：
  class Anima {
    public name;
    protected constructor(name) {
      this.name = name;
    }
  }
  class Cat extends Anima {
    constructor(name) {
      super(name);
    }
  }
  
//   let a = new Animal('Jack');    //error


  //abstract 用于定义抽象类和其中的抽象方法。
  //首先，抽象类是不允许被实例化的
  //抽象类中的抽象方法必须被子类实现：
  abstract class Person {
    public name;
    public constructor(name) {
      this.name = name;
    }
    public abstract sayHi();
  }
  class Student extends Person{
    public sayHi(){
        console.log(` i am a ${this.name}`)
    }
  }
  let stu:Student=new Student('gt')
  stu.sayHi()