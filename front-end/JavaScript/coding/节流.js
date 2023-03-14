//每隔一段时间执行一次
//1.第一次触发 最后一次不触发

const throttle = (fun, delay) => {
    let pre = 0
    return function (...args) {
        let cur = new Date().valueOf()
        if (cur - old > delay) {
            fun.apply(this, args)
            pre = cur
        }
    }
}

//2. 第一次不触发 最后一次触发
const _throttle=(fun,delay)=>{
    let timer=null
    return function(...args){
        if(!timer){
            timer=setTimeout(()=>{
                timer=null
                fun.apply(this,args)
            },delay)
        }
    }

}

//3.第一次触发 最后一次触发

const __throttle=(fun,delay)=>{
    let timer=null
    let pre=0
    return function(...args){
        let cur=new Date().valueOf()
        if(cur-pre>delay){       //第一次执行，同时清除掉定时器
            if(timer){
                clearTimeout(timer)
                timer=null
            }
            fun.apply(this,args)
            pre=cur
        }
        if(!timer){
            timer=setTimeout(()=>{
                pre=new Date().valueOf()
                timer=null
                fun.apply(this,args)
            },delay)
        }
    }

}
