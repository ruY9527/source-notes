let fs=require('fs')
fs.readdir('./',(err,data)=>{
    if(err){
        console.log('失败')
        return
    }
    console.log(data)
})