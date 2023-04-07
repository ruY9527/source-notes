/**
 * 给定一个字符串 s ，请你找出其中不含有重复字符的 最长子串 的长度。
 * s='abcabcbb'
 */

/**
 * 
 * while(右指针没到结尾){
 * 窗口扩大，加入right元素，更新当前result
 * while(result不满足要求){
 * 窗口缩小，移除left对应元素，left右移
 * }
 * 更新最优结果bestResult
 * right++
 * } 
 */
let arr="abcabcbb"
//68ms
let sloution_1 = (str) => {
    let left=0
    let right=0
    let maxLength=0
    let strList =[]
    while(right<str.length){
        while(strList.indexOf(str.charAt(right))!==-1){
            strList.splice(strList.indexOf(str.charAt(right)),1)
            left++
        }
        maxLength=Math.max(right-left+1)
        strList.push(str.charAt(right)) 
        right++
    }
    return maxLength

}
console.log(sloution_1(arr))

//56ms
let sloution_2 = (str) => {
    let left=0
    let right=0
    let maxLength=0
    let strList =new Set()
      while(left<str.length){
        left!==0&&strList.delete(str.charAt(left-1)) 
        while(right<str.length&&!strList.has(str.charAt(right))){
            strList.add(str.charAt(right))
            right++
        }
        maxLength=Math.max(maxLength,right-left)
        left++
    }

}
console.log(sloution_1(arr))
