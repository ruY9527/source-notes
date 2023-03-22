interface  Animal{
    name:string
    age:number
    gender:string
    hobby:string[]
}

function printAnimal(per:Animal){
    console.log(per)
}


//通过extend 扩展接口
interface Animal{
    exrea:string
}
printAnimal({
    name:'gt',
    age:24,
    gender:'female',
    hobby:['reading'],
    exrea:'eating',
})


//为接口添加任意属性
// 一旦定义了任意属性，那么确定属性和可选属性的类型都必须是它的类型的子集：
interface Animal{
    [propName:string]:string|number|string[]
}
printAnimal({
    name:'gt',
    age:24,
    gender:'female',
    hobby:['reading'],
    exrea:'eating',
    color:'red'
})

