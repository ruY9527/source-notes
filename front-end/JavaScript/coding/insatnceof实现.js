//递归实现
  function myInstanceof(obj,fn){
    if(!obj || typeof obj!=='object'){
        return false
    }else{
       if(obj.__proto__===fn.prototype){      //[].__proto__ === Array.prototype
        return true
       } else{
        return myInstanceof(obj.__proto__)
       }
    }

  }
  let arr =[]
  console.log(myInstanceof(arr , Array))

