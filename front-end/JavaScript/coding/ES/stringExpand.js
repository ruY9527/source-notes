function iteratorStr(){
    for(let codePoint of 'foo'){
        console.log(codePoint)
    }
}

function hello(){
    return "Hello World";
}

// 一行
let oneLine = `In JavaScript '\n' is a line-feed`
// 多行
let manyLines = `In JavaScript this is
not legal
`
let funStr = `foo ${hello()} bar`

const data = [
    { first: '<Jane>', last: 'Bond' },
    { first: 'Lars', last: '<Croft>' },
];

const tmp1 = addrs => `
    <table>
     ${addrs.map(addr => `
        <tr><td>${addr.first}</td></tr>
        <tr><td>${addr.last}</td></tr>
     `).join('')}
    </table>
`

let funcName = (name) => `Hello ${name}`

iteratorStr()
console.log(oneLine)
console.log(manyLines)
console.log(funStr)
console.log(tmp1(data))
console.log(funcName('Yang'))

console.log('----------  分割线  -----------')
// 新增方法
let sStr = 'Hello World!'
console.log(sStr.startsWith('Hello'))
console.log(sStr.endsWith('!'))
console.log(sStr.includes('Worl'))

console.log('x'.repeat(3))
console.log('hello'.repeat(2))
console.log('na'.repeat(0))

let trimStr = '    abc     '
console.log(trimStr.trim())
console.log(trimStr.trimStart().length)
console.log(trimStr.trimEnd())

