let fs=require('fs')
fs.stat('./file1.txt',(err,data)=>{
    if(err){
        console.log('失败')
        return
    }
    console.log('data',data)
    console.log('data',data.isFile())   //true
    console.log('data',data.isDirectory())  //false
})