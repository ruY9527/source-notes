const fs=require('fs')
fs.rmdir('../document',err=>{
    if(err){
        console.log('删除失败')
        return
    }
    console.log('删除成功')
})