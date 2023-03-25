let fs=require('fs')


//调用unlink方法
fs.unlink('../document/data.txt',err=>{
    if(err){
        console.log('删除失败')
        return
    }
    console.log('删除成功')
})


//调用 rm方法 
fs.rm('../document/123.txt',err=>{})
