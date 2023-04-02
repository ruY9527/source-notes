/**
 * 创建一个服务 满足：
 * GET /index.html  响应 page/index.html 文件内容
 * GET /css/app.css  响应 page/css/app.css 文件内容
 * GET /images/logo.png  响应 page/images/logo.png 文件内容
 */
const fs=require('fs')
const http = require('http')
const server=http.createServer((request,response)=>{
//设置响应头
response.setHeader('content-type', 'text/html;charset=utf-8')
//设置响应体状态码
response.statusCode = 200
//状态码后的描述信息
response.statusMessage = 'this is a desc'
//获取请求路径
const {pathname}=new URL(request.url,'http://127.0.0.1')
//根目录
let root = __dirname+'/page'
//拼接文件路径
let filePath=root+pathname
//响应头
// let ext =path.extname(filePath).slice(1)
response.setHeader('content-type', 'text/html;charset=utf-8')
//异步读取文件
fs.readFileSync(filePath,(err,data)=>{
    if(err){
        response.statusCode=500
        response.end('文件读取失败')
        return
    }
    response.end(data)
})
 response.end('not found')
})

server.listen(3000, () => {
    console.log('服务已经启动！')
})