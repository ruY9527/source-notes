/***
 * 
 */
/**
 while(右指针没有到结尾){
    窗口扩大，加入到right对应元素，更新当前result
    while(result满足要求){
        更新最优结果besrResult
        窗口缩小，移除left对应元素，left右移
    }
    right++
 }
 return bestResult
 
 */
const min=(target,arr)=>{
    let left=0
    let right=0
    let minLength=0   //最小长度
    let result=0      //总和
    while(right<arr.length){
        result=result+arr[right]
        while(result>=target){
            if(right-left+1<minLength||minLength===0){
                minLength=right-left+1
            }
            result=result-arr[left]
            left++
        }
        right++
    }
    return minLength

}
let arr=[1,2,3,4,5]
console.log(min(5,arr))