const MongoReader = require('../tools/mongoReader');
const table = new MongoReader();
table.open();
const fs = require('fs');
const path = require('path');

const userList = async ctx => {
    let startIndex = Number(ctx.request.body.startIndex) || 0;
    let pageSize = Number(ctx.request.body.pageSize);
    let level = ctx.request.body.level;
    let userId = Number(ctx.request.body.userId);
    let search = {};
    if (level != '') search.level = level;
    if (userId != '') search.userId = userId;
    let itemNum = await table.user.find(search).count();
    let result = await table.user.find(search).sort({
        userId: -1
    }).skip(startIndex).limit(pageSize).toArray();
    let res = new Array();
    for (let i = 0; i < result.length; i++) {
        res[i] = {
            userId: result[i].userId,
            userName: result[i].userName,
            commentNum: result[i].commentNum,
            mail: result[i].mail,
            phone: result[i].phone,
            qq: result[i].qq,
            level: result[i].level
        }
    }
    let state = {
        success: true,
        msg: res,
        total: itemNum
    };
    ctx.body = JSON.stringify(state);
}
const newsList = async ctx => {
    let startIndex = Number(ctx.request.body.startIndex) || 0;
    let pageSize = Number(ctx.request.body.pageSize);
    let firstTag = ctx.request.body.firstTag;
    let origin = ctx.request.body.origin;
    let checkState = ctx.request.body.checkState;
    let important = ctx.request.body.important;
    let hasContentImg = ctx.request.body.hasContentImg;
    let permitComment = ctx.request.body.permitComment;
    let newsId = Number(ctx.request.body.newsId);
    let search = {};
    if (origin != '') search.origin = origin;
    if (firstTag != '') search.firstTag = firstTag;
    if (checkState !== '') search.checkState = Boolean(checkState);
    if (important !== '') search.important = Boolean(important);
    if (hasContentImg !== '') search.hasContentImg = Boolean(hasContentImg);
    if (permitComment !== '') search.permitComment = Boolean(permitComment);
    if (newsId != '') search.newsId = newsId;
    let itemNum = await table.newsList.find(search).count();
    let result = await table.newsList.find(search).sort({
        newsGetTime: -1,
        newsId: -1
    }).skip(startIndex).limit(pageSize).toArray();
    let res = new Array();
    for (let i = 0; i < result.length; i++) {
        res[i] = {
            newsId: result[i].newsId,
            title: result[i].title,
            commentNum: result[i].commentNum,
            praiseNum: result[i].praiseNum,
            visited: result[i].visited,
            firstTag: result[i].firstTag,
            checkState: result[i].checkState ? '允许展示' : '被屏蔽',
            origin: result[i].origin,
            important: String(result[i].important),
            hasContentImg: String(result[i].hasContentImg),
            permitComment: result[i].permitComment ? '开放' : '关闭'
        }
    }
    let state = {
        success: true,
        msg: res,
        total: itemNum
    };
    ctx.body = JSON.stringify(state);
}
const shutdown = async ctx => {
    let target = Number(ctx.request.body.targetuserId);
    await table.user.updateOne({
        userId: target
    }, {
        $set: {
            level: 'shutdown'
        }
    });
    let state = {
        success: true,
    };
    ctx.body = JSON.stringify(state);
}
const cancelShutdown = async ctx => {
    let target = Number(ctx.request.body.targetuserId);
    await table.user.updateOne({
        userId: target
    }, {
        $set: {
            level: 'user'
        }
    });
    let state = {
        success: true,
    };
    ctx.body = JSON.stringify(state);
}
const shieldNews = async ctx => {
    let target = Number(ctx.request.body.targetnewsId);
    await table.newsList.updateOne({
        newsId: target
    }, {
        $set: {
            checkState: false
        }
    });
    let state = {
        success: true,
    };
    ctx.body = JSON.stringify(state);
}
const cancelShieldNews = async ctx => {
    let target = Number(ctx.request.body.targetnewsId);
    await table.newsList.updateOne({
        newsId: target
    }, {
        $set: {
            checkState: true
        }
    });
    let state = {
        success: true,
    };
    ctx.body = JSON.stringify(state);
}
const important = async ctx => {
    let target = Number(ctx.request.body.targetnewsId);
    await table.newsList.updateOne({
        newsId: target
    }, {
        $set: {
            important: true
        }
    });
    let state = {
        success: true,
    };
    ctx.body = JSON.stringify(state);
}
const cancelImportant = async ctx => {
    let target = Number(ctx.request.body.targetnewsId);
    await table.newsList.updateOne({
        newsId: target
    }, {
        $set: {
            important: false
        }
    });
    let state = {
        success: true,
    };
    ctx.body = JSON.stringify(state);
}
const offComment = async ctx => {
    let target = Number(ctx.request.body.targetnewsId);
    await table.newsList.updateOne({
        newsId: target
    }, {
        $set: {
            permitComment: false
        }
    });
    let state = {
        success: true,
    };
    ctx.body = JSON.stringify(state);
}
const canceloffComment = async ctx => {
    let target = Number(ctx.request.body.targetnewsId);
    await table.newsList.updateOne({
        newsId: target
    }, {
        $set: {
            permitComment: true
        }
    });
    let state = {
        success: true,
    };
    ctx.body = JSON.stringify(state);
}
const commentList = async ctx => {
    let targetuserId = Number(ctx.request.body.targetuserId);
    let startIndex = Number(ctx.request.body.startIndex) || 0;
    let pageSize = Number(ctx.request.body.pageSize);
    let checkState = ctx.request.body.checkState;
    let search = {
        userId: targetuserId
    };
    if (checkState !== '') search.checkState = Boolean(checkState);
    let itemNum = await table.comment.find(search).count();
    let result = await table.comment.find(search).sort({
        commentId: -1
    }).skip(startIndex).limit(pageSize).toArray();
    let res = new Array();
    for (let i = 0; i < result.length; i++) {
        res[i] = {
            commentId: result[i].commentId,
            userId: result[i].userId,
            userName: result[i].userName,
            newsId: result[i].newsId,
            floor: result[i].floor,
            content: result[i].content,
            checkState: result[i].checkState ? '允许展示' : '被屏蔽',
        }
        let avatarId = await table.user.findOne({
            userId: res[i].userId
        });
        let title = await table.newsList.findOne({
            newsId: res[i].newsId
        });
        avatarId = avatarId.avatarId;
        res[i].firstTag = title.firstTag;
        title = title.title;
        res[i].avatarId = avatarId;
        res[i].title = title;
    }
    let state = {
        success: true,
        msg: res,
        total: itemNum
    };
    ctx.body = JSON.stringify(state);
}
const replyList = async ctx => {
    let targetuserId = Number(ctx.request.body.targetuserId);
    let startIndex = Number(ctx.request.body.startIndex) || 0;
    let pageSize = Number(ctx.request.body.pageSize);
    let checkState = ctx.request.body.checkState;
    let search = {
        userId: targetuserId
    };
    if (checkState !== '') search.checkState = Boolean(checkState);
    let itemNum = await table.reply.find(search).count();
    let result = await table.reply.find(search).sort({
        commentId: -1
    }).skip(startIndex).limit(pageSize).toArray();
    let res = new Array();
    for (let i = 0; i < result.length; i++) {
        res[i] = {
            replyId: result[i].replyId,
            commentId: result[i].commentId,
            userId: result[i].userId,
            userName: result[i].userName,
            newsId: result[i].newsId,
            floor: result[i].floor,
            replyUserName: result[i].replyUserName,
            replyFloor: result[i].replyFloor,
            content: result[i].content,
            checkState: result[i].checkState ? '允许展示' : '被屏蔽',
        }
        let avatarId = await table.user.findOne({
            userId: res[i].userId
        });
        let title = await table.newsList.findOne({
            newsId: res[i].newsId
        });
        let relyFloor = await table.comment.findOne({
            commentId: res[i].commentId
        });
        res[i].avatarId = avatarId.avatarId;
        res[i].title = title.title;
        res[i].firstTag = title.firstTag;
        res[i].relyFloor = relyFloor.floor;
    }
    let state = {
        success: true,
        msg: res,
        total: itemNum
    };
    ctx.body = JSON.stringify(state);
}
const shieldComment = async ctx => {
    let target = Number(ctx.request.body.targetcommentId);
    await table.comment.updateOne({
        commentId: target
    }, {
        $set: {
            checkState: false
        }
    });
    let state = {
        success: true,
    };
    ctx.body = JSON.stringify(state);
}
const cancelShieldComment = async ctx => {
    let target = Number(ctx.request.body.targetcommentId);
    await table.comment.updateOne({
        commentId: target
    }, {
        $set: {
            checkState: true
        }
    });
    let state = {
        success: true,
    };
    ctx.body = JSON.stringify(state);
}
const shieldReply = async ctx => {
    let target = Number(ctx.request.body.targetreplyId);
    await table.reply.updateOne({
        replyId: target
    }, {
        $set: {
            checkState: false
        }
    });
    let state = {
        success: true,
    };
    ctx.body = JSON.stringify(state);
}
const cancelShieldReply = async ctx => {
    let target = Number(ctx.request.body.targetreplyId);
    await table.reply.updateOne({
        replyId: target
    }, {
        $set: {
            checkState: true
        }
    });
    let state = {
        success: true,
    };
    ctx.body = JSON.stringify(state);
}

const adminCheck = async ctx => {
    if (ctx.session.loginDetil.level == 'admin') {
        ctx.body = JSON.stringify({
            success: true
        });
    } else {
        ctx.body = JSON.stringify({
            success: false,
            msg: '非管理员用户不允许访问'
        });
    }
}

const deleteUser = async ctx => {
    let userId = Number(ctx.request.body.userId);
    await table.comment.updateOne({
        userId: userId
    }, {
        $set: {
            userName: '账户已注销'
        }
    });
    await table.reply.updateOne({
        userId: userId
    }, {
        $set: {
            userName: '账户已注销'
        }
    });
    await table.user.deleteOne({
        userId: userId
    });
    if (fs.existsSync(path.resolve(__dirname, '..') + '/static/user/' + userId + '.jpeg'))
        fs.unlinkSync(path.resolve(__dirname, '..') + '/static/user/' + userId + '.jpeg');
    let state = {
        success: true,
        msg: '删除成功'
    };
    ctx.body = JSON.stringify(state);
}

const weekReadNum = async ctx => {
    let timeArr = ctx.request.body.time;
    let searchArr = new Array();
    for (let i = 0; i < timeArr.length; i++) {
        searchArr.push(
            new Promise(async (resolve) => {
                let num = await table.log.find({
                    event: 'readNews',
                    time: {
                        $lte: i == 6 ? new Date().getTime() : timeArr[i + 1],
                        $gte: timeArr[i]
                    }
                }).count();
                resolve(num);
            }));
    }
    let result = await Promise.all(searchArr);
    ctx.body = JSON.stringify({
        success: true,
        msg: result
    });
}

const weekNewsGet = async ctx => {
    let timeArr = ctx.request.body.time;
    let searchArr = new Array();
    for (let i = 0; i < timeArr.length; i++) {
        searchArr.push(
            new Promise(async (resolve) => {
                let num = await table.newsList.find({
                    newsGetTime: {
                        $lte: i == 6 ? new Date().getTime() : timeArr[i + 1],
                        $gte: timeArr[i]
                    }
                }).count();
                resolve(num);
            }));
    }
    let result = await Promise.all(searchArr);
    ctx.body = JSON.stringify({
        success: true,
        msg: result
    });
}

const weekComment = async ctx => {
    let timeArr = ctx.request.body.time;
    let commentSearchArr = new Array();
    let replySearchArr = new Array();
    for (let i = 0; i < timeArr.length; i++) {
        commentSearchArr.push(
            new Promise(async (resolve) => {
                let num = await table.comment.find({
                    commentId: {
                        $lte: i == 6 ? new Date().getTime() : timeArr[i + 1],
                        $gte: timeArr[i]
                    }
                }).count();
                resolve(num);
            }));
    }
    for (let i = 0; i < timeArr.length; i++) {
        replySearchArr.push(
            new Promise(async (resolve) => {
                let num = await table.reply.find({
                    replyId: {
                        $lte: i == 6 ? new Date().getTime() : timeArr[i + 1],
                        $gte: timeArr[i]
                    }
                }).count();
                resolve(num);
            }));
    }
    let comment = await Promise.all(commentSearchArr);
    let reply = await Promise.all(replySearchArr);
    let total = new Array();
    for (let i = 0; i < comment.length; i++) {
        total[i] = comment[i] + reply[i];
    }
    ctx.body = JSON.stringify({
        success: true,
        msg: {
            comment,
            reply,
            total
        }
    });
}

const weekRegister = async ctx => {
    let timeArr = ctx.request.body.time;
    let searchArr = new Array();
    for (let i = 0; i < timeArr.length; i++) {
        searchArr.push(
            new Promise(async (resolve) => {
                let num = await table.log.find({
                    event: 'register',
                    time: {
                        $lte: i == 6 ? new Date().getTime() : timeArr[i + 1],
                        $gte: timeArr[i]
                    }
                }).count();
                resolve(num);
            }));
    }
    let result = await Promise.all(searchArr);
    ctx.body = JSON.stringify({
        success: true,
        msg: result
    });
}

const highest = async ctx => {
    function register() {
        return new Promise(async resolve => {
            let highDetil = await table.log.find({
                event: 'registerHighest'
            }).sort({
                num: -1
            }).limit(1).toArray();
            resolve(highDetil[0]);
        });
    }

    function getNews() {
        return new Promise(async resolve => {
            let highDetil = await table.log.find({
                event: 'getNewsHighest'
            }).sort({
                num: -1
            }).limit(1).toArray();
            resolve(highDetil[0]);
        });
    }

    function comment() {
        return new Promise(async resolve => {
            let highDetil = await table.log.find({
                event: 'commentHighest'
            }).sort({
                num: -1
            }).limit(1).toArray();
            resolve(highDetil[0]);
        });
    }

    function readNews() {
        return new Promise(async resolve => {
            let highDetil = await table.log.find({
                event: 'readNewsHighest'
            }).sort({
                num: -1
            }).limit(1).toArray();
            resolve(highDetil[0]);
        });
    }

    function readNewsTotal() {
        return new Promise(async resolve => {
            let highDetil = await table.log.find({
                event: 'readNews'
            }).count();
            resolve(highDetil);
        });
    }

    function newsTotal() {
        return new Promise(async resolve => {
            let highDetil = await table.newsList.find({}).count();
            resolve(highDetil);
        });
    }

    function commentTotal() {
        return new Promise(async resolve => {
            let highDetil = await table.reply.find({}).count();
            let highDetil2 = await table.comment.find({}).count()
            resolve(highDetil + highDetil2);
        });
    }

    function registerTotal() {
        return new Promise(async resolve => {
            let highDetil = await table.user.find({}).count();
            resolve(highDetil);
        });
    }
    let readTotal = readNewsTotal();
    let newsNum = newsTotal();
    let commentNum = commentTotal();
    let userNum = registerTotal();
    let registerHigh = register();
    let getNewsHigh = getNews();
    let commentHigh = comment();
    let readNewsHigh = readNews();
    readTotal = await readTotal;
    newsNum = await newsNum;
    commentNum = await commentNum;
    userNum = await userNum;
    registerHigh = await registerHigh;
    getNewsHigh = await getNewsHigh;
    commentHigh = await commentHigh;
    readNewsHigh = await readNewsHigh;
    ctx.body = JSON.stringify({
        success: true,
        msg: {
            registerHigh,
            getNewsHigh,
            commentHigh,
            readNewsHigh,
            total: {
                read: readTotal,
                news: newsNum,
                comment: commentNum,
                register: userNum
            }
        }
    });
}

module.exports = {
    'POST /system/userList': userList,
    'POST /system/newsList': newsList,
    'POST /system/shutdown': shutdown,
    'POST /system/cancelShutdown': cancelShutdown,
    'POST /system/shieldNews': shieldNews,
    'POST /system/cancelShieldNews': cancelShieldNews,
    'POST /system/important': important,
    'POST /system/cancelImportant': cancelImportant,
    'POST /system/commentList': commentList,
    'POST /system/replyList': replyList,
    'POST /system/shieldComment': shieldComment,
    'POST /system/shieldReply': shieldReply,
    'POST /system/cancelShieldComment': cancelShieldComment,
    'POST /system/cancelShieldReply': cancelShieldReply,
    'POST /system/offComment': offComment,
    'POST /system/canceloffComment': canceloffComment,
    'POST /system/adminCheck': adminCheck,
    'POST /system/deleteUser': deleteUser,
    'POST /system/weekReadNum': weekReadNum,
    'POST /system/weekNewsGet': weekNewsGet,
    'POST /system/weekComment': weekComment,
    'POST /system/weekRegister': weekRegister,
    'POST /system/highest': highest
}