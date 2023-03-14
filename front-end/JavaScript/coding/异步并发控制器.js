
class Scheduler {
    constructor(limit) {
        this.limit = limit
        this.number = 0
        this.queue = []
    }
    addTask(timeout, str) {
        this.queue.push(
            ()=>{
                new Promise((resolve,reject)=>{
                    setTimeout(()=>{
                        resolve(str)
                    },timeout)
                }).then((str)=>{
                    console.log(str,'str')
                })
        }
        )
        this.start()
    }
   async  start() {
        if (this.number < this.limit&&this.queue.length) {
            var run = this.queue.shift()
            this.number++
            await run()
            this.number--
                this.start()
            return
            
        }
    }
}
let sch=new Scheduler(2)
sch.addTask(1,'1')
sch.addTask(5,'2')
sch.addTask(3,'3')
sch.addTask(2,'5')
sch.addTask(4,'4')


// function createAsyncWorker(capacity) {
//     let number = 0   //并发数
//     let quene = []
//     async function start () {
//         if(number < capacity&&quene.length){
//             number++
//             new Promise (
//                 await quene.shift()()
//             )
//             number--
//             start()
//             // return result
//         }
    
//     }
//     return function executor(task) {
//         quene.push(task)
//         console.log(quene.length,'len')
//         return start()
//     }
//   }
// const executor=createAsyncWorker(2)
// const runTask = ( delay, fail) => {
//     executor(
//         () =>
//           new Promise((resolve, reject) => {
//             setTimeout(() => {
//               if (fail) {
//                 reject(delay);
//               } else {
//                 resolve(delay);
//               }
//             }, delay);
//           }),
//     )
//       .then((val)=>{console.log(val,'e')}, (delay)=>{console.log(delay,'delay')})
//       .catch((e) => {
//         console.error(e);
//       });
//   };

//   runTask(2000,true)
//   runTask(4000,true)
//   runTask(5000,true)
//   runTask(1000,true)
//   runTask(3000,true)