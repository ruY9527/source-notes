let fs=require('fs')
//创建文件
fs.mkdir('./test',err=>{})

//递归创建文件夹
fs.mkdir('./a/b/c',{recursive:true},err=>{})
