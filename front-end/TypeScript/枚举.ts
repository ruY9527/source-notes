/**
 * 枚举（Enum）类型用于取值被限定在一定范围内的场景
 */
enum Days{
    Monday,
    Tuseday,
    Thursday=4,
    Wednesday,
    Friday,
    Sat,
    Sun
}
console.log(Days['Friday'])

//手动赋值的枚举项可以不是数字，此时需要使用类型断言来让 tsc 无视类型检查
enum Days_ {Sun = 7, Mon=1.5, Tue, Wed, Thu, Fri, Sat = <any>"S"};
console.log(Days_['Tue'])   //2.5
console.log(Days_['Sat'])   // S

//计算所得项
enum Box {item='red'.length, green=4,yellow=<any>'4'}
console.log(Box['item']) 

//常数枚举 ：不能包含动态操作 在编译阶段被删除
const enum Directions{
    Up,
    Down=8,
    Left,
    Right
}