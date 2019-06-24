let socketPool = new Object();
const MongoReader = require('./mongoReader');
const table = new MongoReader();
table.open();

const functionPool = {
    async highest(event, add = 1) {
        let time = new Date();
        let year = time.getFullYear();
        let month = time.getMonth();
        let date = time.getDate();
        time = new Date(year, month, date).getTime();
        if (await table.log.findOne({
                time: time,
                event: event
            })) {
            table.log.updateOne({
                time: time,
                event: event
            }, {
                $inc: {
                    num: add
                }
            });
        } else {
            table.log.insertOne({
                time: time,
                ip: '系统',
                userId: '系统',
                event: event,
                num: add
            });
        }
    },
    reply(replyUserId, userId, userName) {
        replyUserId = String(replyUserId);
        for (let obj in socketPool[replyUserId]) {
            if (socketPool[replyUserId][obj].readyState == 1 && socketPool[replyUserId][obj].userId != userId) {
                let msg = {
                    type: 'replied',
                    userName: userName
                }
                socketPool[replyUserId][obj].send(JSON.stringify(msg));
            }
        }
        functionPool.highest('commentHighest');
    },
    readNewsLog(newsId, ip, userId = '游客') {
        let insertData = {
            time: new Date().getTime(),
            ip: ip,
            userId: userId,
            event: 'readNews',
            newsId: newsId
        };
        table.log.insertOne(insertData);
        functionPool.highest('readNewsHighest');
    },
    getNewsLog(downloadNum, ip = '定时任务', userId = '定时任务') {
        let insertData = {
            time: new Date().getTime(),
            ip: ip,
            userId: userId,
            event: 'getNews',
            downloadNum: downloadNum
        };
        table.log.insertOne(insertData);
        functionPool.highest('getNewsHighest', downloadNum);
    },
    register(ip, userId, userName) {
        let insertData = {
            time: new Date().getTime(),
            ip: ip,
            userId: userId,
            event: 'register',
            userName: userName
        };
        table.log.insertOne(insertData);
        functionPool.highest('registerHighest');
    },
    comment() {
        functionPool.highest('commentHighest');
    }
}

const addEvent = app => {
    app.on('reply', functionPool['reply']);
    app.on('readNewsLog', functionPool['readNewsLog']);
    app.on('getNewsLog', functionPool['getNewsLog']);
    app.on('register', functionPool['register']);
    app.on('comment', functionPool['comment']);
}

const notify = async (ctx, next) => {
    ctx.websocket.on('message', msg => {
        state = JSON.parse(msg);
        if (state.type == 'user') {
            let connectIndex = String(new Date().getTime());
            ctx.websocket['connectIndex'] = connectIndex;
            let userId = state.userId;
            ctx.websocket['userId'] = userId;
            if (!socketPool[userId]) {
                socketPool[userId] = new Object();
            }
            socketPool[userId][connectIndex] = ctx.websocket;
        }
    });
    ctx.websocket.on('close', () => {
        let index = ctx.websocket['connectIndex'];
        let userId = ctx.websocket['userId'];
        if (socketPool[userId][index])
            delete socketPool[userId][index];
    });
    await next();
}

module.exports = {
    notify,
    addEvent
};