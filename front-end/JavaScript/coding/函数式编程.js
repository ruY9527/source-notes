const data = [
    { id: 1, food: "手撕面包", price: 34 },
    { id: 2, food: "牛奶", price: 20 },
    { id: 3, food: "拿铁", price: 26 },
    { id: 4, food: "卡布奇诺", price: 28 },
    { id: 5, food: "馥芮白", price: 40 },
    { id: 6, food: "摩卡", price: 32 },
    { id: 7, food: undefined, price: 128 },
];
let arr=data.map(item=>{if(item.price>30){return item.food}}).filter(Boolean)
// console.log(arr1)

//对条件和数据进行抽象
const select=(condition)=>(data)=>{
    return data.reduce((pre,cur)=>{
        if(condition(cur))   pre=[...pre,cur]
        return pre
    },[])

}
const condition=(item)=>item.price>30
const getDataByCondition=select(condition)
const result =getDataByCondition(data)
// console.log(result.map(item=>item.food))

//进一步优化
const conditions=item=>item.price>30
const getFilter=(pre,cur)=>{
    if(conditions(cur)) pre=[...pre,cur]
    return pre
}
const selectItem=(data)=>data.reduce(getFilter,[])
const resArr=selectItem(data)

console.log(resArr.map(item=>item.food))