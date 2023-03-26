const fs = require('fs')
const http = require('http')
const server = http.createServer((request, response) => {
    //设置响应头
    response.setHeader('content-type','text/html;charset=utf-8')
    //获取请求方法
    let { method } = request
    //获取请求路径
    let { pathname } = new URL(request.url, 'http://127.0.0.1')
    //处理请求接口
    if (method === 'GET' && pathname === '/login') {
        response.end('登录页')
    } else if(method === 'GET' && pathname === '/reg'){
        response.end('注册页')
    }else{
        response.end('not found')
    }
})
server.listen(3000, () => {
    console.log('服务已经启动！')
})