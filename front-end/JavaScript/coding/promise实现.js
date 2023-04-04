/**
 * 1.手写promise.all
 */
class myPromise {
	constructor(executor) {
		this.state = 'pending'
		this.result = null
		this.reason = null
		this.onFulfilledCallbacks = []
		this.onRejectedCallbacks = []
		try {
			executor(this.resolve.bind(this), this.reject.bind(this))
		} catch (e) {
			this.reject(e)
		}

	}
	resolve(result) {
		if (this.state === 'pending') {
			this.state = 'fulfilled'
			this.result = result
			this.onFulfilledCallbacks.forEach(callback =>
				callback(result)
			)
		}
	}
	reject(reason) {
		if (this.state === 'pending') {
			this.state = 'rejected'
			this.reason = reason
			this.onRejectedCallbacks.forEach(callback =>
				callback(reason)
			)
		}
	}
	//要将value解析为promise对象的值
	static resolve(value){
		if(value instanceof myPromise){
			return value
		}else if(value instanceof Object && 'then' in value){
			//如果这个值带有then方法 返回的promise会跟随then状态
			return new myPromise((resolve,reject)=>{
				value.then(resolve,reject)
			})
		}
		//其他情况下 都执行resolve
		return new myPromise((resolve,reject)=>{
			resolve(value)
		})
	}
	//返回一个带有拒绝愿意的promise对象
	static reject(value){
		return new myPromise((resolve,reject)=>{
			return reject(value)
		})
	} 
	static then(onFulfilled, onRejected) {
		// onFulfilled = typeof onFulfilled === 'function' ? onFulfilled : value => value
		// onRejected = typeof onRejected === 'function' ? onRejected : reason => { throw reason }
		// if (this.state === 'pending') {
		// 	this.onFulfilledCallbacks.push(
		// 		() => {
		// 			setTimeout(() => {
		// 				onFulfilled(this.result)
		// 			})
		// 		}
		// 	)
		// 	this.onRejectedCallbacks.push(() => {
		// 		setTimeout(() => {
		// 			onRejected(this.reason)
		// 		})
		// 	})
		// }
		// if (this.state === 'fulfilled') {
		// 	setTimeout(() => {
		// 		onFulfilled(this.result)
		// 	})
		// }
		// else if (this.state === 'rejected') {
		// 	setTimeout(() => {
		// 		onRejected(this.reason)
		// 	})
		// }
		//实现then的链式调用
		const promise2 = new myPromise((resolve, reject) => {
			if (this.state === 'fulfilled') {
				setTimeout(() => {
					try {
						if (typeof onFulfilled !== 'function') {
							resolve(this.result)
						} else {
							let x = onFulfilled(this.result)
							//[[Resolve]](promise2, x)
							resolvePromise(promise2, x, resolve, reject)
						}
					} catch (e) {
						reject(e)
					}
				})

			} else if (this.state === 'rejected') {
				setTimeout(() => {
					try {
						if (typeof onRejected !== 'function') {
							reject(this.reason)
						} else {
							let x = onRejected(this.reason)
							resolvePromise(promise2, x, resolve, reject)
						}
					} catch (e) {
						reject(e)
					}
				})
			} else if (this.state === 'pending') {
				this.onFulfilledCallbacks.push(
					setTimeout(() => {
						try {
							if (typeof onFulfilled !== 'function') {
								resolve(this.result)
							} else {
								let x = onFulfilled(this.result)
								resolvePromise(promise2, x, resolve, reject)
							}
						} catch (e) {
							reject(e)
						}
					})
				)
				this.onRejectedCallbacks.push(
					setTimeout(() => {
						try {
							if (typeof onRejected !== 'function') {
								reject(this.reason)
							} else {
								let x = onRejected(this.reason)
								resolvePromise(promise2, x, resolve, reject)
							}
						} catch (e) {
							reject(e)
						}
					})
				)
			}
		})
		return promise2
	}
	//catch是调用then方法的别名
	static catch(onRejected){
		return this.then(undefined,onRejected)
	}
	//无论状态为fulfilled还是rejected时，都需要执行的回调
	static finally(callback){
		return this.then(callback,callback)
	}
	//接受一个可以iterable的类型
	static all(promises) {
		return new myPromise((resolve, reject) => {
			//参数校验
			if (Array.isArray(promises)) {
				let result = []
				let count = 0
				//传入的是一个空对象时，返回已完成
				if (promises.length === 0) {
					return resolve(promises)
				}
				promises.forEach((item, index) => {
					//判断参数是否为promise
					if (item instanceof myPromise) {
						myPromise.resolve(item).then(value => {
							count++
							//每个promise结果存入数组
							result[index] = value
							count === promises.length && resolve(result)
						}, reason => {
							reject(reason)
						})
					} else {    //参数中有非promise的值，原样返回到数组
						count++
						result[index] = item
						count === promises.length && resolve(result)
					}
				})
			} else {
				return reject(new TypeError('Argument is not iterable'))
			}
		})
	}
	
}
// /**
//  * 对resolve()、reject() 进行改造增强 针对resolve()和reject()中不同值情况 进行处理
//  * @param  {promise} promise2 promise1.then方法返回的新的promise对象
//  * @param  {[type]} x         promise1中onFulfilled或onRejected的返回值
//  * @param  {[type]} resolve   promise2的resolve方法
//  * @param  {[type]} reject    promise2的reject方法
//  */
// function resolvePromise(promise2, x, resolve, reject) {
// 	if (x == promise2) {
// 		throw new TypeError('chaining cycle detetced for promise')
// 	}
// 	if (x instanceof myPromise) {
// 		x.then(y => {
// 			resolvePromise(promise2, y, resolve, reject)
// 		}, reject)
// 	} else if (x !== null && (typeof x === 'object' || typeof x === 'function')) {
// 		try {
// 			var then = x.then
// 		} catch (e) {
// 			return reject(e)
// 		}
// 		if (typeof then === 'function') {     //then为函数时，将x作为函数作用域this调用
// 			let called = false
// 			try {
// 				then.call(x, y => {
// 					if (called) return
// 					called = true
// 					resolvePromise(promise2, y, resolve, reject)
// 				}, r => {
// 					if (called) return
// 					called = true
// 					reject(r)
// 				})
// 			} catch (error) {
// 				if (called) return
// 				called = true
// 				reject(r)
// 			}
// 		} else {
// 			resolve(x)
// 		}

// 	} else {
// 		return resolve(x)     //x不为函数/对象时，以x为参数执行promise
// 	}
// }

// function all(promises) {
// 	return new myPromise((resolve, reject) => {
// 		//参数是否为数组
// 		if (Array.isArray(promises)) {
// 			//参数是一个空的可迭代对象
// 			if (promises.length === 0) {
// 				return resolve(promises)
// 			}
// 			const count = 0
// 			const result = []
// 			promises.forEach((item, index) => {
// 				//参数是否为promise
// 				if (item instanceof myPromise) {
// 					myPromise.resolve(item).then(value => {
// 						count++
// 						result[index] = value
// 						count === promises.length && resolve(result)
// 					}, reason => {
// 						reject(reason)
// 					})
// 				} else {
// 					count++
// 					result[index] = item
// 					count === promises.length && resolve(result)
// 				}
// 			})
// 		} else {   //返回类型错误
// 			return reject(new TypeError('argument is not iterable'))
// 		}
// 	})
// }

// class newPromise {
// 	constructor(executor) {
// 		let state = 'pending'
// 		let result = null
// 		let reason = null
// 		let onFulfilledCallbacks = []
// 		let onRejectedCallbacks = []
// 		try {
// 			executor(this.resolve.bind(this), this.reject.bind(this))
// 		} catch (e) {
// 			this.reject(e)
// 		}

// 	}
// 	resolve(result) {
// 		if (this.state === "pending") {
// 			this.state = "fufilled"
// 			this.result = result
// 			this.onFulfilledCallbacks.forEach((callback) => {
// 				callback(result)
// 			})
// 		}

// 	}
// 	reject(reason) {
// 		if (this.state === "pending") {
// 			this.state = "rejected"
// 			this.reason = reason
// 			this.onRejectedCallbacks.forEach((callback) => {
// 				callback(reason)
// 			})
// 		}
// 	}
// 	then(onFulfilled, onRejected) {
// 		// onFulfilled = typeof onFulfilled === 'function' ? onFulfilled : value => value
// 		// onRejected = typeof onRejected === 'function' ? onRejected : reason => { throw reason }
// 		let promise2 = new newPromise((resolve, reject) => {
// 			if (this.state === 'fulfilled') {
// 				setTimeout(() => {
// 					try {
// 						if (typeof onFulfilled !== 'function') {
// 							resolve(this.result)
// 						} else {
// 							let x = onFulfilled(this.result)
// 							resolvePromiseReview(promise2, x, resolve, reject)
// 						}
// 					} catch (e) {
// 						reject(e)
// 					}

// 				}, 0)
// 			} else if (this.state === 'rejected') {
// 				setTimeout(() => {
// 					try {
// 						if (typeof onRejected !== 'function') {
// 							reject(this.reason)
// 						} else {
// 							let x = onRejected(this.reason)
// 							resolvePromiseReview(promise2, x, resolve, reject)
// 						}

// 					} catch (e) {
// 						reject(e)
// 					}

// 				}, 0)
// 			} else if (this.state === 'pending') {
// 				this.onFulfilledCallbacks.push(() => {
// 					setTimeout(() => {
// 						try {
// 							if (typeof onFulfilled !== 'function') {
// 								resolve(this.result)
// 							} else {
// 								let x = onFulfilled(this.result)
// 								resolvePromiseReview(promise2, x, resolve, reject)
// 							}
// 						} catch (e) {
// 							reject(e)
// 						}

// 					}, 0)

// 				})
// 				this.onRejectedCallbacks.push(() => {
// 					setTimeout(() => {
// 						try {
// 							if (typeof onRejected !== 'function') {
// 								reject(this.reason)
// 							} else {
// 								let x = onRejected(this.reason)
// 								resolvePromiseReview(promise2, x, resolve, reject)
// 							}
// 						} catch (e) {
// 							reject(e)
// 						}

// 					}, 0)
// 				})

// 			}
// 		})
// 		return promise2
// 	}
// }
// function resolvePromiseReview(promise2, x, resolve, reject) {
// 	//promise2和x指向同一对象时，抛出typeError异常 即：onFulfilled/onRejected中返回x的是 promise2时，会导致循环引用报错
// 	if (x === promise2) {
// 		throw new TypeError('Chaining Cycle detected for promise')
// 	}
// 	//如果x为Promise，则使promise2接收x的状态，也就是继续执行x 如果执行的时候有一个y 还要继续执行y
// 	if(X instanceof myPromise){
//       x.then((resolve,reject)=>{
// 		resolvePromiseReview(promise2,y,resolve,reject)
// 	  },reject)
// 	}
// 	//如果x为对象或者函数
// 	if(X!==null&&(typeof x=='object'||(typeof x==='function'))){
// 		try {
// 			var then=x.then
// 		} catch (e) {
// 			return reject(e)
// 		}
// 		//then为函数时，将x作为函数作用域this调用
// 		if(typeof then==='function'){
// 			let called=false
// 			try {
// 				then.call(x,y=>{
// 					if(called) return
// 					resolvePromiseReview(promise2,y,resolve,reject)
// 				},r=>{
// 					if(called)return
// 					called=true
// 					reject(r)
// 				})
// 			} catch (e) {
// 				if(called)return
// 				called=true
// 				reject(e)
// 			}
// 		}else{
// 			resolve(x)
// 		}
// 	}else{
// 		return resolve(x)
// 	}
// }

// 测试代码
// 测试代码
// return 
// let p ={state:'fufilled',value:3}
// let a=myPromise.resolve(p)
// console.log(a,'a')

console.log(1);
let promise1 = new myPromise((resolve, reject) => {
	console.log(2);
	setTimeout(() => {
		console.log('A', promise1.state);
		reject('这次一定');
		console.log('B', promise1.state);
		console.log(4);
	});
})
promise1.then(
	result => {
		console.log('C', promise1.state);
		console.log('fulfilled:', result);
	},
	reason => {
		console.log('rejected:', reason)
		return reason
	}
).catch(()=>{
	console.log('catch')
}).then((val)=>{
	console.log('then')
}).then(val=>console.log(val,'val'))
console.log(3);




Promise.prototype._all=(promises)=>{
	let count=0
	let result
	return new Promise((resolve,reject)=>{
		if(Array.isArray(promises)){
			if(promises.length===0) return
			promises.forEach((item,index)=>{
				if(item instanceof Promise){
					Promise.resolve(item).then(value=>{
						count++
						result[index]=value
						count===promises.length&&resolve(result)
					},reason=>{
						reject(reason)
					})

				}else{
					count++
					result[index]=item
					count===promises.length&&resolve(result)

				}
			})
		}
	})

}

