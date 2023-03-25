const fs=require('fs')
const data=fs.readdirSync('../code')
console.log(data,'data')


data.forEach((item,index)=>{
    let newname=index+item
    console.log(newname,'newname')
    //批量重命名
    fs.renameSync(`../code/${item}`,`./code/${newname}`)
})