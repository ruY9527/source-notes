const fs = require('fs')
const http = require('http')
const server = http.createServer((request, response) => {
    //设置响应头
    response.setHeader('content-type','text/html;charset=utf-8')
    //设置响应体状态码
    response.statusCode=200
    //状态码后的描述信息
    response.statusMessage='this is a desc'
    //响应头
    response.setHeader('content-type','text/html;charset=utf-8')
    //响应体
    response.write('world')
    response.write('!!')
    response.end('hello')   //必须有且只有一个end方法执行
})
server.listen(3000, () => {
    console.log('服务已经启动！')
})