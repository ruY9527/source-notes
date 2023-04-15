async function async1() {
    console.log('async1 start');
    await async2();                     //await下一行之后的所有代码都会变成微任务！！(await后面的表达式会立即执行)
    console.log('async1 end');
  }
  async function async2() {
    console.log('async2');
  }
  
  console.log('script start');
  
  setTimeout(function() {
    console.log('setTimeout');
  }, 0)
  
  async1();
  
  new Promise(function(resolve) {
    console.log('promise1');
    resolve();
  }).then(function() {
    console.log('promise2');
  });
  
  console.log('script end');

  //2.
  async function async1() {
    console.log('async1 start');
    await async2();
    console.log('async1 end');
  }
  async function async2() {
    new Promise(function(resolve) {
      console.log('promise1');
      resolve();
    }).then(function() {
      console.log('promise2');
    });
  }
  
  console.log('script start');   //script start  async1 start  promise1  promise3  script end  promise2  async1 end  promise4  setTimeout
  
  setTimeout(function() {
    console.log('setTimeout');
  }, 0)
  
  async1();
  
  new Promise(function(resolve) {
    console.log('promise3');
    resolve();
  }).then(function() {
    console.log('promise4');
  });
  
  console.log('script end');


  //3.
  async function async1() {
    console.log('async1 start');
    await async2();
    setTimeout(function() {
      console.log('setTimeout1');
    }, 0)
  }
  async function async2() {
    setTimeout(function() {
      console.log('setTimeout2');
    }, 0)
  }
  
  console.log('script start');   
  
  setTimeout(function() {
    console.log('setTimeout3');
  }, 0)
  
  async1();
  
  new Promise(function(resolve) {
    console.log('promise1');
    resolve();
  }).then(function() {
    console.log('promise2');
  });
  
  console.log('script end');


  //4.
  async function async1 () {
    console.log('async1 start')
    await async2()
    console.log('async1 end')
  }
  async function async2 () {
    console.log('async2')
  }
  
  console.log('script start')    //script start、async1 start、async2、promise2、script end、promise1、async1 end、promise2.then、promise3
  
  setTimeout(() => {
    console.log('setTimeout')
  }, 0)
  
  Promise.resolve().then(() => {
    console.log('promise1')
  })
  
  async1()
  
  let promise2 = new Promise((resolve) => {
    resolve('promise2.then')
    console.log('promise2')
  })
  
  promise2.then((res) => {
    console.log(res)
    Promise.resolve().then(() => {
      console.log('promise3')
    })
  })
  
  console.log('script end')