// 转换前：
let source = [{
    id: 1,
    pid: 0,
    name: 'body'
  }, {
    id: 2,
    pid: 1,
    name: 'title'
  }, {
    id: 3,
    pid: 2,
    name: 'test'
  }]

//1.利用浅拷贝
function toTree(source){
    let tree=[]
    let map=new Map()
    source.forEach((item,index)=>{
      return map.set(item.id,index)
    })
    source.forEach(item => {
        if(map.has(item.pid)){  
            //取父节点
            let parentIndex=map.get(item.pid)
            let obj=source[parentIndex]  
            let children=[]
            children.push(item)
            obj.children=children
        }else{   //根节点
            tree.push(item) 
        }
    });
    return tree
}
// console.log(JSON.stringify(toTree(source)) )


//2.
function test(arr,pid){
  return arr.filter(item=>item.pid===pid).map(item=>({...item,children:test(arr,item.id)}))
}
// console.log(JSON.stringify(test(source,0)) )