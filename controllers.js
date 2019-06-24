const fs = require('fs');
function addMapping(router, mapping) {
    for (let url in mapping) {
        if (url.startsWith('GET ')) {
            let path = url.substring(4);
            router.get(path, mapping[url]);
            console.log(`注册URL：GET ${path}`);
        } else if (url.startsWith('POST ')) {
            let path = url.substring(5);
            router.post(path, mapping[url]);
            console.log(`注册URL：POST ${path}`);
        } else {
            console.log(`无效URL：${url}`);
        }
    }
}

function addControllers(router, dir) {
    let
        files = fs.readdirSync(__dirname + dir),
        jsFiles = files.filter((f) => {
            return f.endsWith('.js');
        });
    for (let f of jsFiles) {
        console.log(`扫描到文件：${f}`);
        let mapping = require(__dirname + dir + f);
        addMapping(router, mapping);
    }
}
module.exports = function (dir) {
    let
        controllers_dir = dir || '/api/',
        router = require('koa-router')();
    addControllers(router, controllers_dir);
    return router.routes();
}