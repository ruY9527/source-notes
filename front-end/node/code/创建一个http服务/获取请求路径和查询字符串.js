const http = require('http');
const url = require('url')

const hostname = '127.0.0.1';
const port = 3000;

const server = http.createServer((request, res) => {
    //解析url
    let result = url.parse(request.url, true)
    console.log(result, 'result')
    //路径
    let path = result.pathname
    console.log(path, 'path')
    //查询字符串
    let keyword = result.query.keyword
    console.log(keyword, 'keyword')

    res.statusCode = 200;
    res.setHeader('Content-Type', 'text/plain');
    res.end('Hello World\n');
});
//监听端口 启动服务
server.listen(port, hostname, () => {
    console.log(`Server running at http://${hostname}:${port}/`);
});