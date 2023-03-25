const http = require('http');


const hostname = '127.0.0.1';
const port = 3000;

const server = http.createServer((request, res) => {
   //实例化url对象
   let url= new URL(request.url,'http://127.0.0.1')
    //输出路径
   console.log(url.pathname,'path')
    //输出字符串
    console.log(url.searchParams.get('keyword'))
    
    res.end('Hello World\n');
});
//监听端口 启动服务
server.listen(port, hostname, () => {
    console.log(`Server running at http://${hostname}:${port}/`);
});