const fs=require('fs')
//调用rename方法
fs.rename('./copy.txt','./newname.txt',err=>{
    if(err){
        console.log('重命名失败')
        return
    }
    console.log('重命名成功')
})

//文件移动
fs.rename('./newname.txt','../document/data.txt',err=>{})