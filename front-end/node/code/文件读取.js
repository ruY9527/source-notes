let fs=require('fs')

//异步读取
fs.readFile('./file1.txt',(err,data)=>{
    if(err){
        console.log('读取失败！')
        return 
    }
    console.log(data.toString())
})

//同步
fs.readFileSync('./file1.txt',(err,data)=>{
    if(err){
        console.log('读取失败！')
        return 
    }
    console.log(data.toString())
})

//流式读取
let rs=fs.createReadStream('./爱莲说.txt')
//绑定事件
rs.on('data',chunk=>{
    console.log(chunk,)
})
//end 可选事件
rs.on('end',()=>{
    console.log('读取完成')
})