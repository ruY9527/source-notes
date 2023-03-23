/**
 * 实现（implements）是面向对象中的一个重要概念。
 * 一般来讲，一个类只能继承自另一个类，有时候不同类之间可以有一些共有的特性，
 * 这时候就可以把特性提取成接口（interfaces），用 implements 关键字来实现。
 * 这个特性大大提高了面向对象的灵活性
*/

interface Alarm {
    alert(): void;
}

interface Light {
    lightOn(): void;
    lightOff(): void;
}
class Door {
}
class SecurityDoor extends Door implements Alarm,Light {
    alert() {
        console.log('SecurityDoor alert');
    }
    lightOn(){  console.log('Car light on');}
    lightOff(){ console.log('Car light off')}
}

class Car implements Alarm {
    alert() {
        console.log('Car alert');
    }
}
