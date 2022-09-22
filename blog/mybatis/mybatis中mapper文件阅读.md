---
title: mybatis中mapper文件阅读
date: 2021-11-04 00:28:59
tags: 
  - java框架
  - mybatis
categories:
  - java框架
  - mybatis
---



#### 题记

MyBatis是如何对 Mapper 文件中的sql进行处理呢？ 虽然上篇解析 mybatis-config.xml 是有进行说明的, 但是应该拿出来单独仔细解析下. 因为这个里面涉及到动态sql, 加上mapper文件自身也有很多标签内容,然后MyBatis是怎么读取出这些内容的呢？读取出来后,又是做了怎么样的处理, 然后达到了sql那种执行效果的呢？

意思也就是,Mapper + 动态sql , 内容还是有点多的, 并且也很重要, 是非常有必要拿出来单独的仔细讲解下的.

#### Target

在之前对标签的进行解析的时候,是有对 标签进行一个初步的解析. 然后里面其实是很多内容还没填补很详细,所以特意记录下对 详细操作的. 那么，下文就开始操作吧.

**org.apache.ibatis.builder.xml.XMLMapperBuilder#parse**

主要来看这段解析的代码 :

```
public void parse() {
    
// 利用 org.apache.ibatis.session.Configuration 的 loadedResources
// 来判断是不是已经加载过了的.    
  if (!configuration.isResourceLoaded(resource)) {
    configurationElement(parser.evalNode("/mapper"));
// 这里添加到 loadedResources 中来,也就是用来控制是不是已经解析过了的.      
    configuration.addLoadedResource(resource);
    bindMapperForNamespace();
  }

// 这三个方法给我一种好像解析那种没有还没解析完的 ? 这个地方有待完善.    
  parsePendingResultMaps();
  parsePendingCacheRefs();
  parsePendingStatements();
}


// configurationElement 方法,
// 可以看到这个方法中,很多标签(namespace/parameterMa/resultMap/sql)
// 还有下面的select/insert/update/delete
// 这些熟悉的标签
  private void configurationElement(XNode context) {
    try {
      String namespace = context.getStringAttribute("namespace");
      if (namespace == null || namespace.equals("")) {
        throw new BuilderException("Mapper's namespace cannot be empty");
      }
// 将 namespace 赋值进去,也就是当前正在解析的 namespace.        
      builderAssistant.setCurrentNamespace(namespace);
        
// 这里是对缓存标签进行解析.        
      cacheRefElement(context.evalNode("cache-ref"));
      cacheElement(context.evalNode("cache"));
 
// 解析 parameterMap标签        
      parameterMapElement(context.evalNodes("/mapper/parameterMap"));
        
//         
      resultMapElements(context.evalNodes("/mapper/resultMap"));
      sqlElement(context.evalNodes("/mapper/sql"));
      buildStatementFromContext(context.evalNodes("select|insert|update|delete"));
    } catch (Exception e) {
      throw new BuilderException("Error parsing Mapper XML. The XML location is '" + resource + "'. Cause: " + e, e);
    }
  }
```

**resultMapElements 方法 :**

```
// 这里的 list 是 xml 文件中的所有 <resultMap> 标签文件.
private void resultMapElements(List<XNode> list) {
  for (XNode resultMapNode : list) {
    try {
//  有点好奇,该方法返回的 ResultMap 这边好像并没有参数,有点尴尬.
//  不过是已经存储在 org.apache.ibatis.session.Configuration#resultMaps 中.       
      resultMapElement(resultMapNode);
    } catch (IncompleteElementException e) {
      // ignore, it will be retried
    }
  }
}

----------
// 最后跟进到这个方法中来.
  private ResultMap resultMapElement(XNode resultMapNode, List<ResultMapping> additionalResultMappings, Class<?> enclosingType) {
    ErrorContext.instance().activity("processing " + resultMapNode.getValueBasedIdentifier());
 
// 获取出 type , 这里我们获取出来的 type 是 TbBlog.    
    String type = resultMapNode.getStringAttribute("type",
        resultMapNode.getStringAttribute("ofType",
            resultMapNode.getStringAttribute("resultType",
                resultMapNode.getStringAttribute("javaType"))));
// 先判断 org.apache.ibatis.type.TypeAliasRegistry#typeAliases 中有没有,
// 如果没有的话,就会自己new一个出来.    
    Class<?> typeClass = resolveClass(type);
    if (typeClass == null) {
// TODO,如果没有话?        
      typeClass = inheritEnclosingType(resultMapNode, enclosingType);
    }
    Discriminator discriminator = null;
    List<ResultMapping> resultMappings = new ArrayList<>(additionalResultMappings);
    
 // 获取该 <resultMap> 下的子标签
// 那么这里也就是获取 <id> 和 <result> 这二个.    
    List<XNode> resultChildren = resultMapNode.getChildren();
    for (XNode resultChild : resultChildren) {
// 分为 constructor / discriminator / 其他 这三类情况        
      if ("constructor".equals(resultChild.getName())) {
        processConstructorElement(resultChild, typeClass, resultMappings);
      } else if ("discriminator".equals(resultChild.getName())) {
        discriminator = processDiscriminatorElement(resultChild, typeClass, resultMappings);
      } else {
 // 非前二者情况.         
        List<ResultFlag> flags = new ArrayList<>();
        if ("id".equals(resultChild.getName())) {
         // 如果标签是id的话,就会给flags添加ResultFlag.ID.
          flags.add(ResultFlag.ID);
        }
  //  将返回回来的 ResultMapping 添加进来.       
        resultMappings.add(buildResultMappingFromContext(resultChild, typeClass, flags));
      }
    }
// 这里获取的是 <resultMap> 标签的 id 字段.    
    String id = resultMapNode.getStringAttribute("id",
            resultMapNode.getValueBasedIdentifier());
// 这里还可以使用 extends 属性, 不是看到这里, 都好奇还有这种标签.    
    String extend = resultMapNode.getStringAttribute("extends");
    Boolean autoMapping = resultMapNode.getBooleanAttribute("autoMapping");
// 这里 new 了一个 ResultMapResolver 对象.   
    ResultMapResolver resultMapResolver = new ResultMapResolver(builderAssistant, id, typeClass, extend, discriminator, resultMappings, autoMapping);
    try {
// 这里最后就是 new 了一个 ResultMap 对象, 该对象的 id 是 namespace + 方法ID 拼接.
// 然后将该对象给添加到  org.apache.ibatis.session.Configuration#resultMaps 中来,
// key 就是其id, 最后就是根据 local / global 来分别进行二种情况检查.        
      return resultMapResolver.resolve();
    } catch (IncompleteElementException  e) {
      configuration.addIncompleteResultMap(resultMapResolver);
      throw e;
    }
  }    


//  buildResultMappingFromContext 方法
// 该方法是对 resultMap 中的字段进行解析.
  private ResultMapping buildResultMappingFromContext(XNode context, Class<?> resultType, List<ResultFlag> flags) {
    String property;
    if (flags.contains(ResultFlag.CONSTRUCTOR)) {
      property = context.getStringAttribute("name");
    } else {
      property = context.getStringAttribute("property");
    }
    String column = context.getStringAttribute("column");
    String javaType = context.getStringAttribute("javaType");
    String jdbcType = context.getStringAttribute("jdbcType");
    String nestedSelect = context.getStringAttribute("select");
    String nestedResultMap = context.getStringAttribute("resultMap", () ->
      processNestedResultMappings(context, Collections.emptyList(), resultType));
    String notNullColumn = context.getStringAttribute("notNullColumn");
    String columnPrefix = context.getStringAttribute("columnPrefix");
    String typeHandler = context.getStringAttribute("typeHandler");
    String resultSet = context.getStringAttribute("resultSet");
    String foreignColumn = context.getStringAttribute("foreignColumn");
    boolean lazy = "lazy".equals(context.getStringAttribute("fetchType", configuration.isLazyLoadingEnabled() ? "lazy" : "eager"));
      
// 获取 javaType , typeHandler , jdbcType 等对象.      
    Class<?> javaTypeClass = resolveClass(javaType);
    Class<? extends TypeHandler<?>> typeHandlerClass = resolveClass(typeHandler);
    JdbcType jdbcTypeEnum = resolveJdbcType(jdbcType);
// org.apache.ibatis.builder.MapperBuilderAssistant#buildResultMapping(java.lang.Class<?>, java.lang.String, java.lang.String, java.lang.Class<?>, org.apache.ibatis.type.JdbcType, java.lang.String, java.lang.String, java.lang.String, java.lang.String, java.lang.Class<? extends org.apache.ibatis.type.TypeHandler<?>>, java.util.List<org.apache.ibatis.mapping.ResultFlag>, java.lang.String, java.lang.String, boolean)
// 可以看到这里传递进来的参数还是很多的.
// 最后返回 ResultMapping 对象,也就是说这么多参数&buildResultMapping方法中的参数,
//都设置到该对象中来了.     
    return builderAssistant.buildResultMapping(resultType, property, column, javaTypeClass, jdbcTypeEnum, nestedSelect, nestedResultMap, notNullColumn, columnPrefix, typeHandlerClass, flags, resultSet, foreignColumn, lazy);
  }
```

**SqlElement 方法**

该方法可以很明显的感受到是对 标签进行解析的.

```
private void sqlElement(List<XNode> list) {
 // configuration 获取出来 dataBaseId是null,跳过此方法  
  if (configuration.getDatabaseId() != null) {
    sqlElement(list, configuration.getDatabaseId());
  }
//    
  sqlElement(list, null);
}

// 有点好奇写代码风格:  sqlElement(list,configuration.getDatabaseId());
------------------------

//  sqlElement 方法
  private void sqlElement(List<XNode> list, String requiredDatabaseId) {
    for (XNode context : list) {
        
 // 获取 databaseId 和 id 这二个属性的值.       
      String databaseId = context.getStringAttribute("databaseId");
      String id = context.getStringAttribute("id");
 //  org.apache.ibatis.builder.MapperBuilderAssistant#applyCurrentNamespace   
 // 该方法最后返回的id的值是: namespace + id       
      id = builderAssistant.applyCurrentNamespace(id, false);
//sqlFragments 不包含该id就返回true,也就说该Map是确定是否已经解析过了的.         
      if (databaseIdMatchesCurrent(id, databaseId, requiredDatabaseId)) {
// 添加到 org.apache.ibatis.builder.xml.XMLMapperBuilder#sqlFragments 中来.          
        sqlFragments.put(id, context);
      }
    }
  }
```

最后 解析后的值,是使用 namespace + id 存放在 org.apache.ibatis.builder.xml.XMLMapperBuilder#sqlFragments 的属性中的.

**buildStatementFromContext() 方法 :**

这里是对 select / insert / update / delete 标签进行解析.

```
buildStatementFromContext(context.evalNodes("select|insert|update|delete"));


// 可以看到 databaseId 的获取与 sql 标签是一样的操作
private void buildStatementFromContext(List<XNode> list) {
  if (configuration.getDatabaseId() != null) {
    buildStatementFromContext(list, configuration.getDatabaseId());
  }
  buildStatementFromContext(list, null);
}


// 所以我们可以跟进到这个方法来.
  private void buildStatementFromContext(List<XNode> list, String requiredDatabaseId) {
    for (XNode context : list) {
// 先 new 了一个 XMLStatementBuilder 对象, 紧接着就调用该对象的 解析 方法.        
      final XMLStatementBuilder statementParser = new XMLStatementBuilder(configuration, builderAssistant, context, requiredDatabaseId);
      try {
        statementParser.parseStatementNode();
      } catch (IncompleteElementException e) {
        configuration.addIncompleteStatement(statementParser);
      }
    }
  }


// 解析方法
  public void parseStatementNode() {
    String id = context.getStringAttribute("id");
    String databaseId = context.getStringAttribute("databaseId");
// 用 namespace + id 组合为 id
// org.apache.ibatis.session.Configuration#mappedStatements
// 接着就是判断在 mappedStatements 中是不是有该id,如果不存在就返回ture,
// 存在就返回false,这里也就会直接return出去,也就是不会往后面执行了.      
    if (!databaseIdMatchesCurrent(id, databaseId, this.requiredDatabaseId)) {
      return;
    }
// 获取标签名字,  select / insert/ update /delete.
    String nodeName = context.getNode().getNodeName();
// 转化为大写的 SELECT      
    SqlCommandType sqlCommandType = SqlCommandType.valueOf(nodeName.toUpperCase(Locale.ENGLISH));
    boolean isSelect = sqlCommandType == SqlCommandType.SELECT;
// 是否刷新 cache,也就是select是不刷新的,那么其他的就应该是要刷新的.      
    boolean flushCache = context.getBooleanAttribute("flushCache", !isSelect);
// 使用使用 cache,这里应该是一级缓存，默认开启的.      
    boolean useCache = context.getBooleanAttribute("useCache", isSelect);
// 结果排序, 如果没有配置的话,默认就是false.      
    boolean resultOrdered = context.getBooleanAttribute("resultOrdered", false);

    // Include Fragments before parsing
// 创建了一个 XMLIncludeTransformer 对象,该对象应该是进行转化的.      
    XMLIncludeTransformer includeParser = new XMLIncludeTransformer(configuration, builderAssistant);
 //  TODO ? 该方法有待更新     
    includeParser.applyIncludes(context.getNode());

//获取 parameterType 属性,如果有的话,也会获取出该属性对应的 Class.    
    String parameterType = context.getStringAttribute("parameterType");
    Class<?> parameterTypeClass = resolveClass(parameterType);

// lang : null,这里是没有设置的.      
    String lang = context.getStringAttribute("lang");
    LanguageDriver langDriver = getLanguageDriver(lang);

    // Parse selectKey after includes and remove them.
// 这里对是否有 selectKey 进行处理.我们这里目前没有使用 selectKey
    processSelectKeyNodes(id, parameterTypeClass, langDriver);

    // Parse the SQL (pre: <selectKey> and <include> were parsed and removed)
    KeyGenerator keyGenerator;
 // selectBlog!selectKey     
    String keyStatementId = id + SelectKeyGenerator.SELECT_KEY_SUFFIX;
// 这里拼接上 namespace :  com.iyang.mybatis.mapper.BlogMapper.selectBlog!selectKey      
    keyStatementId = builderAssistant.applyCurrentNamespace(keyStatementId, true);

// 这里是判断是否有 主键自动生成. 这里是查询语句,应该是没有的. 
    if (configuration.hasKeyGenerator(keyStatementId)) {
      keyGenerator = configuration.getKeyGenerator(keyStatementId);
    } else {
      keyGenerator = context.getBooleanAttribute("useGeneratedKeys",
          configuration.isUseGeneratedKeys() && SqlCommandType.INSERT.equals(sqlCommandType))
          ? Jdbc3KeyGenerator.INSTANCE : NoKeyGenerator.INSTANCE;
    }

// 创建一个 XMLScriptBuilder 对象,使用该对象的parseScriptNode方法来解析
// org.apache.ibatis.scripting.xmltags.XMLScriptBuilder#parseScriptNode
// 获取出sql, 有个 isDynamic 参数,来判断是不是动态sql语句.
// 这里不是动态sql,最后new了一个RawSqlSource.
// org.apache.ibatis.builder.SqlSourceBuilder#parse,我们的#{id} 替换成 ? 就是在
// 这里进行替换的.
// 如果是动态 sql 的话,就会创建出 DynamicSqlSource 该对象来.
// 可以看到 SqlSource 下面是有 四个实现类的.
// 这里返回的 SqlSource里面有sql语句的,和返回类型的.      
    SqlSource sqlSource = langDriver.createSqlSource(configuration, context, parameterTypeClass);
 
// 获取属性.      
    StatementType statementType = StatementType.valueOf(context.getStringAttribute("statementType", StatementType.PREPARED.toString()));
    Integer fetchSize = context.getIntAttribute("fetchSize");
    Integer timeout = context.getIntAttribute("timeout");
    String parameterMap = context.getStringAttribute("parameterMap");
// 获取返回类型. 获取出来的 resultTypeClass 是 class com.iyang.mybatis.pojo.TbBlog      
    String resultType = context.getStringAttribute("resultType");
    Class<?> resultTypeClass = resolveClass(resultType);
    String resultMap = context.getStringAttribute("resultMap");      
    String resultSetType = context.getStringAttribute("resultSetType");
    ResultSetType resultSetTypeEnum = resolveResultSetType(resultSetType);
    if (resultSetTypeEnum == null) {
      resultSetTypeEnum = configuration.getDefaultResultSetType();
    }
// 获取属性的值      
    String keyProperty = context.getStringAttribute("keyProperty");
    String keyColumn = context.getStringAttribute("keyColumn");
    String resultSets = context.getStringAttribute("resultSets");

// 创建一个 MappedStatement.Builder 对象出来.
// 再通过 builder 构建出一个 MappedStatement 对象来.
// 最后放入到 org.apache.ibatis.session.Configuration#mappedStatements 中来.      
    builderAssistant.addMappedStatement(id, sqlSource, statementType, sqlCommandType,
        fetchSize, timeout, parameterMap, parameterTypeClass, resultMap, resultTypeClass,
        resultSetTypeEnum, flushCache, useCache, resultOrdered,
        keyGenerator, keyProperty, keyColumn, databaseId, langDriver, resultSets);
  }

  private void processSelectKeyNodes(String id, Class<?> parameterTypeClass, LanguageDriver langDriver) {
    List<XNode> selectKeyNodes = context.evalNodes("selectKey");
    if (configuration.getDatabaseId() != null) {
      parseSelectKeyNodes(id, selectKeyNodes, parameterTypeClass, langDriver, configuration.getDatabaseId());
    }
    parseSelectKeyNodes(id, selectKeyNodes, parameterTypeClass, langDriver, null);
    removeSelectKeyNodes(selectKeyNodes);
  }
```

#### 总结

总结下 MyBatis 解析 Mapper的xml 文件流程。 可以感受到,对于Mybatis处理Mapper,对其字段属性都是挨个解析的,还是下了很大的功夫.

先是有一个集合来控制是否已经解析过了,算是一种是否解析的开关配置. 可以看到其先后的解析顺序,

namespace –> cache-ref –> cache —> mapper/parameterMap —> mapper/resultMap —> mapper/sql —> select/insert/update/detele.

当解析这些标签的时候, 又会对标签里面的属性进行解析. 这里,主要看下我们平常使用到最多的标签, MyBatis 对这些标签解析了后,其后有是怎么利用的呢？可以看到目前MyBatis是存放在一些configuration等类信息里面,那么等到真正去查询sql语句的时候, MyBatis 又是怎么用上的呢？ 这里目前只讲了如何解析.

解析完了，没异常，那就是解析都ok了，剩下的就是看当 MyBatis 去查询的时候, 是怎么利用上这些资源的呢？所以看接下来的更新.
