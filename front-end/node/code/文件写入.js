/**
 * 创建一个文件，file1.txt
 */
//1.导入 fs 模块
const fs=require('fs')

//2.写入文件
//异步
fs.writeFile('./file1.txt','三人行，必有我师',err=>{     
    //写入失败时，err为错误对象，成功时为null
    if(err){
        console.log('失败')
        return
    }
    console.log('成功')
})

//同步
fs.writeFileSync('./syncFile1.txt','三人行，同步写入的文件')

//文件追加：
fs.appendFile('./file1.txt','则其善者而从之，其不善着而改之',err=>{
    if(err){
        console.log('追加写入失败') 
        return
    }
    console.log('追加写入成功') 
})
fs.appendFileSync('./file1.txt','\n哈哈哈')


//fs 流式写入 

const ws=fs.createWriteStream('./爱莲说.txt')  //创建写入流对象
ws.write('出淤泥而不染，濯清涟而不妖\r\n')             //write
ws.write('只可远观，而不可亵渎\r\n')               
ws.close()                                      //关闭通道
