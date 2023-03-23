/**
 * 接口继承接口,接口与接口之间可以是继承关系：
 */

interface Alarm {
    alert(): void;
}

interface LightableAlarm extends Alarm {
    lightOn(): void;
    lightOff(): void;
}

/**
 * TypeScript 中:接口可以继承类
 * 当我们在声明 class Point 时，除了会创建一个名为 Point 的类之外，同时也创建了一个名为 Point 的类型（实例的类型）。
 * 所以我们既可以将 Point 当做一个类来用（使用 new Point 创建它的实例）：
 * 也可以将 Point 当做一个类型来用（使用 : Point 表示参数的类型）：
*/
class Point {
    x: number;
    y: number;
    constructor(x: number, y: number) {
        this.x = x;
        this.y = y;
    }
}

const p = new Point(1, 2);  //
interface Point3d extends Point {  //表示类型，只包含其中的实例属性和实例方法：
    z: number;
}

let point3d: Point3d = {x: 1, y: 2, z: 3};
