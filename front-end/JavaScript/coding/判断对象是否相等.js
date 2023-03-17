let objOne={
    a:'1',
    // b:[1,2,3,[4,4,4],{x:1,y:{s:1,q:2}}],
    // c:function(){return 1},
    // d:null,
    // e:undefined,
    f:{
        name:'gt',
        age:24
    }

}
let objTwo={
    a:'1',
    // b:[1,2,3,[4,4,4],{x:1,y:{s:1,q:2}}],
    // d:null,
    // e:undefined,
    f:{
        name:'gt',
        age:24
    },
    // c:function(){return 1},

}

function isEqual(left,right){
    if(typeof left!=='object'&&left!==null) return left===right
    if(left===null) return left===right
    //判断当前两个是否是对象
    if(Object.keys(left).length!==Object.keys(right).length) return false
    Object.keys(left).forEach(key=>{
        let value=left[key]
        if(value instanceof Object||value instanceof Array){
            return isEqual(value,right[key])
        }else {
            console.log(value,'value')
            console.log(right[key],'right[key]')
            console.log(value===right[key],'value===right[key]')
            return value===right[key]
        }
    })
}
console.log(isEqual(objOne,objTwo))


let range = {
    from: 1,
    to: 5
  };

  for(let val in range){
    console.log(val)
  }