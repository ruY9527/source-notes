## 				    MySql Query 记录



#### 题记

​    还不是因为 sql 语句感觉自己太薄弱了,所以就需要开一个md来记录下. 那些优秀并且每秒的sql语句来躁动下.

   

#### 记录一 

​     创建表语句 :

​      

```
create table student(
                        id int unsigned primary key auto_increment,
                        name char(10) not null
);

create table course(
id int unsigned primary key auto_increment,
name char(20) not null
);

create table student_course(
sid int unsigned,
cid int unsigned,
score int unsigned not null,
foreign key (sid) references student(id),
foreign key (cid) references course(id),
primary key(sid, cid)
);

insert into student(name) values('张三'),('李四');
insert into course(name) values('语文'),('数学');
insert into student_course values(1,1,80),(1,2,90),(2,1,90),(2,2,70);
```



参考地址 :  https://www.yanxurui.cc/posts/mysql/2016-11-10-10-sql-interview-questions/

