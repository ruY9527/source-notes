//区别
interface Color {
    name: string;
}
interface Pink {
    name: string;
    run(): void;
}

const colors: Color = {
    name: 'yellow'
};
let color1 = colors as Pink 

//由于 Color 兼容 Pink ，故可以将 Color 断言为 Pink 赋值给 color1

//但若使用类型声明的形式就会有问题

const colorCopy: Color = {
    name: 'green'
};
// let color2:Pink=Color  //ts error

/*
它们的核心区别就在于：
Color 断言为 Pink，只需要满足 Color 兼容 Pink 或 Pink 兼容 Color 即可
Color 赋值给 color2 ,Pink 兼容 Color 才行

*/