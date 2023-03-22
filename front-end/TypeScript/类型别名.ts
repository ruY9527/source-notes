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
