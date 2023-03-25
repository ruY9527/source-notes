# Nodejs

1. node中的javaScript包含：

* 核心语法：ES
* Node API: fs 、 url 、http、 util、 path 、定时器 、console等 （不可以操作浏览器的API）

2. Buffer 缓冲区:

   * 是一个类似Array对象，表示固定长度的字节序列（内存空间，处理二进制数据）

   * 特点：

     * 大小固定不可调整

     * 性能较好，可以直接对计算机内存操作

     * 每个元素大小为1字节

3. fs 文件系统  ：

   * 实现与硬盘的交互（文件的创建、删除、重命名、移动、写入、读取、文件夹相关操作）
   * fs工作模式：异步与同步
   * **文件写入：**
     * 异步：fs.writeFileSync(filename,data,option,callback)=>undefined
     * 同步：fs.writeFile(filename,data,option)=>undefined
   * appendFile/appendFileSync追加写入：
     * 在文件尾部追加内容，语法与writeFile完全相同
   * fs 流式写入：
     * createWriteStream(filename,options)
     * 程序打开一个文件需要消耗资源，流失写入可以减少打开关闭文件的次数
   * **文件读取：**
     * fs.readFile(filename,option,callback)  异步读取
     * fs.readFileSync(filename,option)  同步读取
     * fs.createReadFile(filename,option)   流式读取
   * **文件重命名：**
     * fs.rename(filename,newName,callback) 
   * **文件删除：**
     * fs.unlink(filename,callback) 
     * 或者 fs.rm(filename,callback)

4. 文件夹操作：

   * 创建文件夹
     * fs.mkdir(filename,callback)
   * 读取文件夹
     * fs.readdir(filename,callback)
   * 删除文件夹
     * fs.rmdir(filename,callback)

5. 查看资源状态：

   * fs.stat(filename,option,callback)

6. 路径补充说明：

   * 相对路径
   * 绝对路径

7. 

8. www

