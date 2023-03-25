let fs=require('fs')

let process = require('process')

//1.
let data=fs.readFileSync('./file1.txt')
fs.writeFile('./copy.txt',data,err=>{
    if(err){
        console.log('复制失败')
        return
    }
    console.log('复制成功')
})
console.log(process.memoryUsage())
//2. 流式绑定
let rs =fs.createReadStream('./file1.txt')
let ws=fs.createWriteStream('./copy.txt')
//绑定data事件
rs.on('data',chunk=>{
    ws.write(chunk)
})
rs.on('end',()=>{
    console.log(process.memoryUsage())
})
//简便写法
rs.pipe(ws)
