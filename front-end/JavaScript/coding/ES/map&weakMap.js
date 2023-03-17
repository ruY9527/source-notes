//遍历map
let cd=new Map([['name','perfect'],['age',24],['like','reading']])
//1. for ...of
for(let [key,value ]of cd){
    console.log(`${key}:${value}`)
}

//2. keys() values() entries()
console.log(cd.keys())   
console.log(cd.values()) 
console.log(cd.entries()) 

//3. forEach
cd.forEach((item,index)=>{
    console.log(item)   
})


//map转化为数组
let map=new Map([['name','perfect'],['age',24],['like','reading']])
console.log([...map]) 
//[ [ 'name', 'perfect' ], [ 'age', 24 ], [ 'like', 'reading' ] ]


/**
 * weakMap中的键 必须是对象
 * 
 */
let weak = new WeakMap()
let a={x:1}
// weak.set('a',1)    //Invalid value used as weak map key
weak.set([],'hello')
console.log(weak)

let mmap=new Map()
mmap.set([1],'a')
mmap.set([1],'b')
mmap.set('c',1)
mmap.set('c',123)
console.log(mmap)