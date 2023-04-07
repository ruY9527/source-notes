/**
 * 给你一个字符串 s，找到 s 中最长的回文子串。
 * 输入：s = "abcdedcba"
* 输出："bab"
* 解释："aba" 同样是符合题意的答案。
 */
let s = "abcdedcee"
const sloution_1 = (str) => {
    let len = str.length
    if (len < 2) {
        return str
    }
    let maxLen = 0
    let begin = 0
    let charArray = str.split('')
    //枚举所有长度严格大于1的字串
    for (let i = 0; i < len - 1; i++) {
        for (let j = i + 1; j < len; j++) {
            if (j - i + 1 > maxLen && isValidPalidromic(charArray, i, j)) {
                maxLen = j - i + 1
                begin = i
            }
        }
    }
    return str.substring(begin, begin + maxLen)


}
//验证字串是否为回文串
const isValidPalidromic = (charArray, left, right) => {
    while (left < right) {
        if (charArray[left] !== charArray[right]) {
            return false
        }
        left++
        right--
    }
    return true
}
console.log(sloution_1(s))

//动态规划 一个回文 去掉两头以后，剩下的部分依旧是回文（子串两头字符不相等，则不是回文）
/**
 * 状态：dp[i][j]表示字串s[i...j]是否是回文字串
 * 得到状态转移方程：dp[i][j]=(s[i]===s[j]&&dp[i+1][j-1])
 * 边界条件：j-1-(i+1)+1<2 ,即 j-i<3 (s[i...j]长度为2或3时，不用检查字串是否回文)
 * 初始化： dp[i][j]=true
 * 输出：在得到一个状态的值为true的时候，记录起始位置和长度
 * 
 */
const sloution_2 = (str) => {
    let len = str.length
    if (len < 2) {
        return str
    }
    let maxLen = 1
    let begin = 0
    let dp = []
    let charArray = str.split('')
    //初始化一个二维表格 
    for (let i = 0; i < len; i++) {
        dp[i][i] = true
    }
    //注意：左下角先填
    for (let j = 0; j < len; j++) {
        for (let i = 0; i < j; i++) {
            if (charArray[i] !== charArray[j]) {
                dp[i][j] === false
            } else {
                if (j - i < 3) {
                    dp[i][j] = true
                } else {
                    dp[i][j] = dp[i + 1][j - 1]
                }
            }
            //只要dp[i][j] = true 就表示是回文，此时记录回文长度和起始位置
            if(dp[i][j]&&j-i+1>maxLen){
                maxLen=j-i+1
                begin=i
            }
        }
    }
    return s.substring(begin,begin+maxLen)
}

console.log(sloution_2(s))