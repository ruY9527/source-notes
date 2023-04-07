/**
 * let arr=[1,2,-3,4,-5,6,-7]  
 */
let arr=[-2,1,-3,4,-1,2,1,-5,4]
const test=(arr)=>{
    let sum=[]
    let pre=0
    arr.forEach((item,index)=>{
        if(sum[index-1]>0){
            sum[index]=item+sum[index-1]
        }else{
            sum[index]=item
        }
    })
    return Math.max(...sum)
}
console.log(test(arr))


const maxSubArray=(arr)=>{
    let pre=0;
    let sum=arr[0]
    arr.forEach(item=>{
        pre=Math.max(pre+item,item)
        sum=Math.max(pre,sum)
    })
    return sum
}
console.log(test(arr))
//思路：
// pre =-2,max=-2
// pre=1,max=1
// pre=-2,max=1
// pre=4,max=4
// pre=3,max=4
// pre=5,max=5
// pre=6,max=6
// pre=1,max=6
// pre=5,max=6

