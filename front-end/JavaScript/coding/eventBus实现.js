

function EventBus(){
    this._events={}
}
EventBus.prototype.addListener=function(eventname,callback){
    if(!this._events[eventname]){
        this._events[eventname]=[callback]     //一个event事件可能对应多个callback
    }else{
        this._events[eventname].push(callback)
    }
}
EventBus.prototype.emit=function (eventname,...args){
    const callbackList=this._events[eventname]
    if(!callbackList) return 
    callbackList.forEach(callback=>callback.apply(this,...args))
}
EventBus.prototype.removeListener=function(eventname,fun){
    let callbackList=this._events[eventname]
    if(!callbackList) return 
    this._events[eventname]=callbackList.filter(callback=>{
        if(callback!==fun)
        return callback
    })
}



//引用型
function func1(){
    console.log(1)
    console.log(this)
}

const bus=new EventBus()
bus.addListener('sayHello',()=>{
    console.log(0)
    console.log(this)
})
bus.addListener('sayHello',func1)
bus.emit('sayHello')
bus.removeListener('sayHello',func1)
bus.emit('sayHello')

