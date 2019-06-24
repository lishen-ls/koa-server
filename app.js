const staticPath = './static';
const Koa = require('koa');
const webSocket = require('koa-websocket');
const app = webSocket(new Koa());
const compress = require('koa-compress');
const body = require('koa-body');
const path = require('path');
const static = require('koa-static');
const session = require('koa-session');
const controllers = require('./controllers');
const router = require('koa-router')();
const router2 = require('koa-router')();
const spider = require('./tools/spider');
const notify = require('./tools/notify');
const loginCheck = require('./tools/logined');

app.keys = ['myproject'];
app.use(async (ctx, next) => {
    console.log(`${ctx.method}:${ctx.url}`);
    await next();
});
app.use(body({
    multipart: true,
    formidable: {
        uploadDir: path.join(__dirname, 'static/user/'),
        keepExtensions: true,
        maxFieldsSize: 5 * 1024 * 1024,
    }
}));
app.use(session({
    key: 'myproject',
    maxAge: 36000000,
    autoCommit: true,
    overwrite: true,
    httpOnly: true,
    signed: true,
    renew: true
}, app));
app.use(compress());
app.use(static(path.join(__dirname, staticPath)));
app.ws.use(loginCheck);
app.use(loginCheck);
app.use(controllers());
notify.addEvent(app);
router.get('/system/startCrawl', spider.startCrawl);
router2.post('/system/autoCrawl', spider.autoCrawl);
router2.post('/system/offAutoCrawl', spider.offAutoCrawl);
router.get('/notify', notify.notify);
app.ws.use(router.routes());
app.use(router2.routes());
app.use(async ctx => {
    if (ctx.status == 404) {
        ctx.response.redirect('/#/NotFound');
    }
});
app.listen(80);
console.log('开始监听');