const vm = require('node:vm');
const a=1
const context={
    a:2
}
vm.createContext(context)
const code=`a+=10;let y=2;`
vm.runInContext(code,context)
console.log(context.a)
console.log(context.y)