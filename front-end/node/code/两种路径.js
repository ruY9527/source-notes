//
let fs=require('fs')
const { resolve } = require('path')
const path = require('path')

// //相对路径写入
fs.writeFileSync('./new.txt','hello world')   //当前目录
fs.writeFileSync('new.html','hello world')


//绝对路径  '__dirname: 所在文件的所在目录的绝对路径
console.log(__dirname,'path')
fs.writeFileSync(__dirname+'/new.txt','hello world') 
//D:\note\source-notes\front-end\node\code

//使用resolve统一路径分隔符
console.log(path.resolve(__dirname,'/index.html'))
//D:\index.html