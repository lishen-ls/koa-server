const MongoReader = require('./mongoReader');
const dbReader = new MongoReader();
dbReader.open();
const reg1 = /system/;
const reg2 = /logined/;
const url = require('urlencode');

const loginCheck = async (ctx, next) => {
    let userId = ctx.cookies.get('userid');
    let userName = ctx.cookies.get('username');
    userName = url.decode(userName);
    if (ctx.loginState == undefined) ctx.loginState = 0;
    if (!ctx.session.loginDetil) {
        ctx.loginState = 0;
    } else if (!(userId == ctx.session.loginDetil.userId) || !(userName == ctx.session.loginDetil.userName)) {
        ctx.loginState = 2;
    } else {
        ctx.loginState = 1;
    }
    if (ctx.url == '/system/startCrawl') {
        if (ctx.loginState === 1) {
            if (ctx.session.loginDetil.level == 'admin') {
                await next();
            } else {
                let state = JSON.stringify({
                    msg: '非管理员用户不允许访问',
                    state: 'false'
                });
                ctx.websocket.send(state);
            }
        } else if (ctx.loginState === 0) {
            let state = JSON.stringify({
                msg: '未登录或登录已过期',
                state: 'false'
            });
            ctx.websocket.send(state);
        } else if (ctx.loginState === 2) {
            let state = JSON.stringify({
                msg: '登录异常，请重新登陆',
                state: 'false'
            });
            ctx.websocket.send(state);
        }
    } else if (reg1.test(ctx.url)) {
        if (ctx.loginState === 1) {
            if (ctx.url == '/system/adminCheck') {
                await next();
            } else if (ctx.session.loginDetil.level == 'admin') {
                await next();
            } else {
                ctx.body = JSON.stringify({
                    success: true,
                    msg: '非管理员用户不允许访问'
                });
            }
        } else if (ctx.loginState === 0) {
            ctx.body = JSON.stringify({
                success: false,
                msg: '未登录或登录已过期'
            });
        } else if (ctx.loginState === 2) {
            ctx.body = JSON.stringify({
                success: false,
                msg: '登录异常，请重新登录'
            });
        }
    } else if (reg2.test(ctx.url)) {
        if (ctx.url == '/logined/loginCheck') {
            await next();
        } else if (ctx.loginState === 1) {
            await next();
        } else if (ctx.loginState === 0) {
            ctx.body = JSON.stringify({
                success: false,
                msg: '未登录或登录已过期'
            });
        } else {
            ctx.body = JSON.stringify({
                success: false,
                msg: '登录异常，请重新登录'
            });
        }
    } else {
        await next();
    }
};
module.exports = loginCheck;