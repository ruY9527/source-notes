# 常用容器启动指令

### mongo

```
docker run --name mongo  -p 27017:27017 -v /home/luohong/coding/dockers/mongo/data:/data/db -v /home/luohong/coding/dockers/mongo/backup:/data/backup -v /home/luohong/coding/dockers/mongo/logs:/data/log -v /home/luohong/coding/dockers/mongo/conf:/data/conf -d mongo
```

### mysql

```
docker run -d --name myMysql -p 9506:3306 -v /home/luohong/coding/dockers/mysql/data:/var/lib/mysql -e MYSQL_ROOT_PASSWORD=123456 mysql:5.7
```

