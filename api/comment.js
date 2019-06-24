const MongoReader = require('../tools/mongoReader');
const table = new MongoReader();
table.open();

const getComment = async ctx => {
    let Id = Number(ctx.query.newsId);
    let startIndex = Number(ctx.query.startIndex) || 0;
    let res = new Array();
    let result = await table.comment.find({
        newsId: Id
    }).sort({
        commentId: -1
    }).limit(20).skip(startIndex).toArray();
    for (let i = 0; i < result.length; i++) {
        let user = await table.user.findOne({
            userId: result[i].userId
        });
        let avatarId;
        if (!user) avatarId = 'default';
        else avatarId = user.avatarId;
        res[i] = {
            commentId: result[i].commentId,
            userId: result[i].userId,
            userName: result[i].userName,
            content: result[i].content,
            praiseNum: result[i].praiseNum,
            replied: result[i].replied,
            avatarId: avatarId,
            floor: result[i].floor
        };
        if (result[i].checkState == false || (user && user.level == 'shutdown')) {
            res[i].content = '该用户被禁言或该评论被屏蔽';
        }
    }
    ctx.body = JSON.stringify(res);
}
const getReply = async ctx => {
    let Id = Number(ctx.query.commentId);
    let res = new Array();
    let result = await table.reply.find({
        commentId: Id
    }).sort({
        relpyId: -1
    }).toArray();
    for (let i = 0; i < result.length; i++) {
        let user = await table.user.findOne({
            userId: result[i].userId
        });
        let avatarId;
        if (!user) avatarId = 'default';
        else avatarId = user.avatarId;
        res[i] = {
            replyId: result[i].replyId,
            userId: result[i].userId,
            userName: result[i].userName,
            avatarId: avatarId,
            replyUserName: result[i].replyUserName,
            content: result[i].content,
            praiseNum: result[i].praiseNum,
            floor: result[i].floor,
            replyFloor: result[i].replyFloor
        };
        if (result[i].checkState == false || (user && user.level == 'shutdown')) {
            res[i].content = '该用户被禁言或该评论被屏蔽';
        }
    }
    ctx.body = JSON.stringify(res);
}
const addComment = async ctx => {
    let request = ctx.request.body;
    let insertData = {
        newsId: Number(request.newsId),
        commentId: Number(request.commentId),
        content: request.content,
        userId: Number(ctx.session.loginDetil.userId),
        userName: ctx.session.loginDetil.userName,
        praiseNum: 0,
        replied: 0,
        checkState: true
    }
    let check = await table.user.findOne({
        userId: insertData.userId
    });
    if (check.level != 'shutdown') {
        let floor = await table.newsList.findOne({
            newsId: insertData.newsId
        });
        insertData.floor = floor.commentNum + 1;
        await table.newsList.updateOne({
            newsId: insertData.newsId
        }, {
            $inc: {
                commentNum: 1
            }
        });
        await table.comment.insertOne(insertData);
        await table.user.updateOne({
            userId: insertData.userId
        }, {
            $inc: {
                commentNum: 1
            }
        });
        ctx.body = JSON.stringify({
            success: true,
            msg: '评论成功'
        });
        ctx.app.emit('comment');
    } else {
        ctx.body = JSON.stringify({
            success: false,
            msg: '您已被禁言'
        });
    }
}
const addReply = async ctx => {
    let request = ctx.request.body;
    let insertData = {
        newsId: Number(request.newsId),
        commentId: Number(request.commentId),
        replyId: Number(request.replyId),
        userId: Number(ctx.session.loginDetil.userId),
        userName: ctx.session.loginDetil.userName,
        replyUserId: Number(request.replyUserId),
        replyUserName: request.replyUserName,
        content: request.content,
        replyFloor: Number(request.replyFloor),
        praiseNum: 0,
        checkState: true
    }
    let check = await table.user.findOne({
        userId: insertData.userId
    });
    if (check.level != 'shutdown') {
        await table.user.updateOne({
            userId: insertData.userId
        }, {
            $inc: {
                commentNum: 1
            }
        });
        if (insertData.replyUserId != insertData.userId) {
            await table.user.updateOne({
                userId: insertData.replyUserId
            }, {
                $inc: {
                    messageNum: 1
                }
            });
        }
        await table.comment.updateOne({
            commentId: insertData.commentId
        }, {
            $inc: {
                replied: 1
            }
        });
        let res = await table.comment.findOne({
            commentId: insertData.commentId
        });
        insertData.floor = res.replied;
        await table.reply.insertOne(insertData);
        ctx.body = JSON.stringify({
            success: true,
            msg: '评论成功',
            data: {
                floor: insertData.floor
            }
        });
        ctx.app.emit('reply', insertData.replyUserId, insertData.userId, insertData.userName);
    } else {
        ctx.body = JSON.stringify({
            success: false,
            msg: '您已被禁言',
        });
    }
}
const praiseNews = async ctx => {
    let request = ctx.request.body;
    let newsId = Number(request.newsId);
    let userId = Number(ctx.session.loginDetil.userId);
    if (await table.praise.findOne({
            type: 'news',
            Id: newsId,
            userId: userId
        })) {
        ctx.body = JSON.stringify({
            success: false,
            msg: '已点赞'
        });
    } else {
        table.praise.insertOne({
            praiseId: new Date().getTime(),
            userId: userId,
            Id: newsId,
            type: 'news',
        });
        table.newsList.updateOne({
            newsId: newsId
        }, {
            $inc: {
                praiseNum: 1
            }
        });
        ctx.body = JSON.stringify({
            success: true,
            msg: '点赞成功'
        });
    }
}
const commentNum = async ctx => {
    let userId = Number(ctx.session.loginDetil.userId);
    let result = await table.user.findOne({
        userId: userId
    });
    ctx.body = JSON.stringify({
        success: true,
        msg: {
            commentNum: result.commentNum,
            messageNum: result.messageNum
        }
    });
}
const praiseComment = async ctx => {
    let request = ctx.request.body;
    let commentId = Number(request.commentId);
    let userId = Number(ctx.session.loginDetil.userId);
    if (await table.praise.findOne({
            userId: userId,
            Id: commentId,
            type: 'comment'
        })) {
        ctx.body = JSON.stringify({
            success: false,
            msg: '已点过赞'
        });
    } else {
        table.praise.insertOne({
            praiseId: new Date().getTime(),
            userId: userId,
            Id: commentId,
            type: 'comment'
        });
        table.comment.updateOne({
            commentId: commentId
        }, {
            $inc: {
                praiseNum: 1
            }
        });
        ctx.body = JSON.stringify({
            success: true,
            msg: '点赞成功'
        });
    }
}
const praiseReply = async ctx => {
    let request = ctx.request.body;
    let replyId = Number(request.replyId);
    let userId = Number(ctx.session.loginDetil.userId);
    if (await table.praise.findOne({
            userId: userId,
            Id: replyId,
            type: 'reply'
        })) {
        ctx.body = JSON.stringify({
            success: false,
            msg: '已点过赞'
        });
    } else {
        table.praise.insertOne({
            praiseId: new Date().getTime(),
            userId: userId,
            Id: replyId,
            type: 'reply'
        });
        table.reply.updateOne({
            replyId: replyId
        }, {
            $inc: {
                praiseNum: 1
            }
        });
        ctx.body = JSON.stringify({
            success: true,
            msg: '点赞成功'
        });
    }
}
module.exports = {
    'GET /api/getComment': getComment,
    'GET /api/getReply': getReply,
    'POST /logined/addComment': addComment,
    'POST /logined/addReply': addReply,
    'POST /logined/praiseNews': praiseNews,
    'POST /logined/commentNum': commentNum,
    'POST /logined/praiseComment': praiseComment,
    'POST /logined/praiseReply': praiseReply
};