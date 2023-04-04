//1.Promise封装Ajax

function getJson(url){ 
    return new Promise((resolve,reject)=>{
        const handler=()=>{
            if(this.readyState!==4){   //4 表示 请求完成
                return
            }
            if(this.status===200){
                resolve(this.response)
            }else{
                reject(new Error(this.statusText))
            }

        }
        let xhr=new XMLHttpRequest()
        xhr.open('get',url,true)
        xhr.send(null)   //请求参数
        //设置状态监听函数
        xhr.onreadystatechange=handler
        //设置错误的监听函数
        xhr.onerror=function(){
            reject(new Error(xhr.statusText))
        }
        //设置响应数据的类型
        xhr.responseType='json'
    })
}

getJson('http://').then((value)=>{
    console.log(value)
}).catch(error=>{
    console.log(error)
})


//2. 对于含有thenable对象(含有then方法)
let obj={
    then:function(resolve,reject){
        resolve(2)
    }
}
//Promise.resolve()会将obj转为promsie对象，然后立即执行里面的then方法

Promise.resolve(obj).then((value)=>console.log(value))     //2


