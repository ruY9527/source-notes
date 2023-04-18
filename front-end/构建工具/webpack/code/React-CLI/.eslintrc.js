module.export = {
    extends: ["react-app"],
    parseOptions: {
        babelOptions: {
            presets: [
                //解决页面报错问题
                ["babel-preset-react-app",false],
                "babel-preset-react-app/prod"
            ]
        }

    }
}