const http = require('http');

const hostname = '127.0.0.1';
const port = 3000;

const server = http.createServer((request, res) => {
 let body=''
 request.on('data',chunk=>{
  body+=chunk
 })
 request.on('end',()=>{
  console.log(body,'body')
 })
  console.log(request.url,'url')
  res.statusCode = 200;
  res.setHeader('Content-Type', 'text/plain');
  res.end('Hello World\n');
});
//监听端口 启动服务
server.listen(port, hostname, () => {
  console.log(`Server running at http://${hostname}:${port}/`);
});
