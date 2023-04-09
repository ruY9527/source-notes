



# 常用容器启动指令

### mongo

```
docker run --name mongo  -p 27017:27017 -v /home/luohong/coding/dockers/mongo/data:/data/db -v /home/luohong/coding/dockers/mongo/backup:/data/backup -v /home/luohong/coding/dockers/mongo/logs:/data/log -v /home/luohong/coding/dockers/mongo/conf:/data/conf -d mongo
```

### mysql

```
docker run -d --name myMysql -p 9506:3306 -v /home/luohong/coding/dockers/mysql/data:/var/lib/mysql -e MYSQL_ROOT_PASSWORD=123456 mysql:5.7
```

### Nacos

```
docker run -d --name nacos-server-8848 -p 8848:8848 --privileged=true -v /opt/nacos/init.d/custom.properties:/home/nacos/init.d/custom.properties -v /opt/nacos/logs:/home/nacos/logs --restart=always -e MODE=standalone -e PREFER_HOST_MODE=hostname nacos/nacos-server
```

```
sudo docker run -d --name nacos -p 8848:8848 -e MODE=standalone -p 8849:8848 -v /home/luohong/coding/dockers/nacos/logs:/home/nacos/logs -d nacos/nacos-server:2.0.2
```

