type Person={
    name:string
    age:number
    gender:string
    hobby:string[]
}

function printPerson(per:Person){
    console.log(per.name)
}
printPerson({
    name:'gt',
    age:24,
    gender:'female',
    hobby:['reading']
})

//通过 & 扩展类型
type Teacher =Person&{
    carrer:string
}
function printTeacher(per:Teacher){
    console.log(per)
}
printTeacher({
    name:'李老师',
    age:24,
    gender:'female',
    hobby:['reading'],
    carrer:'teaching'
})


//使用类型别名给类型添加别名
type fruit=string
type name=()=>string
type union=fruit|name
function getInfo(par:union){
    if(typeof par==='string'){
        return par
    }
    return par()
}


//定义字符串字面量类型
type Colors='red'|'pink'|'green'|'yellow'
function getColor(color:Colors){}