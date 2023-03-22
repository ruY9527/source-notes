/**
 * 语法： 值 as 类型    或   <类型>值    （react中必须使用前者）
 */

//将一个联合类型断言为其中一个类型
interface Cat{
    name:string
    run():void
}
interface Fish{
    name:string
    swim():void
}
function getName(animal:Cat|Fish){
    console.log(animal)
}
/*有时候，我们确实需要在还不确定类型的时候就访问其中一个类型特有的属性或方法
 但是直接访问Cat的run()是会报错的，
 因此使用类型断言 将animal断言成Cat
*/

function isCat(animal:Cat|Fish){
    (animal as Cat).run()
}
isCat({
    name:'cat',
    run:()=>{console.log('running')}
})

//将一个父类断言为更加具体的子类
interface ApiError extends Error{
    code:number
}
interface HttpError extends Error{
    statusCode:number
}
function isApiError(error:Error){
    if(typeof(error as ApiError).code==='number'){
        return true
    }
    return false
}

//将任意一个类型断言为any
// window.foo=1           //ts会报错
(window as any).foo=2  


/**
 * 若 A 兼容 B，那么 A 能够被断言为 B，B 也能被断言为 A。
 */
interface Amimals {
    name: string;
}
interface dog {
    name: string;
    run(): void;
}
let tom: dog = {
    name: 'Tom',
    run: () => { console.log('run') }
}
let jerry: Amimals = tom;

/**
 * 双重断言  as any as foo
 */
interface PersonA {
    run(): void;
}
interface PersonB {
    swim(): void;
}

function testCat(per: PersonA) {
    return (per as any as PersonB);    //将任何一个类型断言为任何另一个类型
}



