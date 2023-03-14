//时间响应函数在一段时间后才执行
const debounce=(fun,delay,immediate = false)=>{
    let timer=null
    let result 
    return function(...args){
        timer && clearTimeout(timer)
        if(immediate){
            //立即执行 
            let isCalledNow=!timer
            timer=setTimeout(()=>{
                timer=null
            },delay)
            if(isCalledNow) result=fun.apply(this,args)
        }else{
            timer=setTimeout(()=>{
                result=fun.apply(this,args)
                timer=null
            },delay)
        }
        return result
    }
}

let a = debounce((name)=>{console.log(name)},3,false)
a('gt')
a('gt')
a('gt')



