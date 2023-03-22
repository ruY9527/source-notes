/**
 * 声明语句：declare var a:string
 */
/*ts中无法识别 $('#foo') 或者 jQuery('#foo');
这时 需要使用declare var 来定义他的类型
*/
declare var jQuery:(selector:string)=>any


/**
 * 声明文件：把声明语句放到一个单独的文件（jQuery.d.ts）中，这就是声明文件
    推荐的是使用 @types 统一管理第三方库的声明文件
*/