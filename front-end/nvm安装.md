# NVM安装

由于不同的前端项目,可能需要进行node版本的切换,所有nvm是一个不可少神器,来进行node版本的管理

## Win安装

1. 下载地址

   [nvm下载地址]: https://github.com/coreybutler/nvm-windows/releases

2.  配置加速

   nvm node_mirror https://npm.taobao.org/mirrors/node/

   nvm npm_mirror https://npm.taobao.org/mirrors/npm/

3. 安装node版本

   nvm install 16.4.0

   nvm install 14.15.0

4. 切换使用的版本

   nvm use14.1.5.0 , 然后进行 node -v 就可以看到现在对应使用的node版本是切换后的版本