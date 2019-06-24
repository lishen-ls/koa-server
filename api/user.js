const fs = require('fs');
const MongoReader = require('../tools/mongoReader');
const table = new MongoReader();
table.open();
const crypto = require('crypto');

const register = async ctx => {
    let request = ctx.request.body;
    let userDetil = {
        userId: new Date().getTime(),
        userName: request.userName,
        level: 'user',
        commentNum: 0,
        avatarId: 'default',
        messageNum: 0,
        mail: '',
        phone: '',
        qq: ''
    };
    if (await table.user.findOne({
            userName: userDetil.userName
        }) == null) {
        let hash = crypto.createHash('md5');
        let salt = String(Math.floor(Math.random() * 999999 + Math.random() * 999999));
        let userPwd = request.userPwd;
        userPwd = hash.update(userPwd + salt).digest('hex');
        userDetil.userPwd = userPwd;
        userDetil.salt = salt;
        await table.user.insertOne(userDetil);
        let state = {
            success: true,
            msg: '注册成功',
            id: userDetil.userId
        };
        ctx.session.loginDetil = {
            userName: userDetil.userName,
            userId: userDetil.userId
        };
        ctx.loginState = 1;
        ctx.body = JSON.stringify(state);
        ctx.app.emit('register', ctx.ip, userDetil.userId, userDetil.userName);
    } else {
        let state = {
            success: false,
            msg: '该用户名已存在'
        };
        ctx.body = JSON.stringify(state);
    }
}
const login = async ctx => {
    let loginDetil = {
        userName: ctx.request.body.userName,
        userPwd: ctx.request.body.userPwd
    };
    let detil = await table.user.findOne({
        userName: loginDetil.userName
    });
    if (detil == null) {
        let state = {
            success: false,
            msg: '用户名不存在'
        };
        ctx.body = JSON.stringify(state);
        return;
    }
    let salt = detil.salt;
    loginDetil.userPwd = crypto.createHash('md5').update(loginDetil.userPwd + salt).digest('hex');
    let user = await table.user.findOne(loginDetil);
    if (user) {
        ctx.session.loginDetil = {
            userName: loginDetil.userName,
            userId: user.userId
        };
        ctx.loginState = 1;
        if (user.level == 'admin') ctx.session.loginDetil.level = 'admin';
        else ctx.session.loginDetil.level = 'other';
        let state = {
            success: true,
            detil: {
                userId: user.userId,
                username: user.userName,
                level: user.level,
                commentNum: user.commentNum,
                messageNum: user.messageNum,
                avatarId: user.avatarId
            }
        }
        ctx.body = JSON.stringify(state);
    } else {
        let state = {
            success: false,
            msg: '密码错误'
        };
        ctx.body = JSON.stringify(state);
    }
}
const logout = async ctx => {
    ctx.session.userName = null;
    ctx.session.loginDetil = null;
    ctx.loginState = 0;
    ctx.body = {
        msg: 'success'
    };
}
const userDetil = async ctx => {
    let userId = Number(ctx.session.loginDetil.userId);
    let result = await table.user.findOne({
        userId: userId
    });
    delete result.userPwd;
    let state = {
        success: true,
        msg: result
    };
    ctx.body = JSON.stringify(state);
}
const subUserDetil = async ctx => {
    let userId = Number(ctx.session.loginDetil.userId);
    let req = ctx.request.body.req;
    await table.user.updateOne({
        userId: userId
    }, {
        $set: {
            mail: req.mail,
            phone: req.phone,
            qq: req.qq
        }
    });
    let state = {
        success: true,
        msg: '联系方式修改成功'
    };
    ctx.body = JSON.stringify(state);
}
const changePwd = async ctx => {
    let userId = Number(ctx.session.loginDetil.userId);
    let userPwd = ctx.request.body.userPwd;
    let newPwd = ctx.request.body.newPwd;
    let userDetil = await table.user.findOne({
        userId: userId
    });
    userPwd = crypto.createHash('md5').update(userPwd + userDetil.salt).digest('hex');
    if (userPwd == userDetil.userPwd) {
        newPwd = crypto.createHash('md5').update(newPwd + userDetil.salt).digest('hex');
        await table.user.updateOne({
            userId: userId
        }, {
            $set: {
                userPwd: newPwd
            }
        });
        let state = {
            success: true,
            msg: '密码修改成功'
        };
        ctx.body = JSON.stringify(state);
    } else {
        let state = {
            success: false,
            msg: '旧密码错误'
        };
        ctx.body = JSON.stringify(state);
    }
}
const changeAv = async ctx => {
    let userId = Number(ctx.session.loginDetil.userId);
    fs.renameSync(ctx.request.files.img.path, './static/user/' + userId + '.jpeg');
    await table.user.updateOne({
        userId: userId
    }, {
        $set: {
            avatarId: userId
        }
    });
    let state = {
        success: true,
        msg: '头像修改成功'
    };
    ctx.body = JSON.stringify(state);
}
const myComment = async ctx => {
    let startIndex = ctx.request.body.startIndex || 0;
    let userId = Number(ctx.session.loginDetil.userId);
    let result = await table.comment.find({
        userId: userId
    }).sort({
        commentId: -1
    }).limit(20).skip(startIndex).toArray();
    let res = new Array();
    for (let i = 0; i < result.length; i++) {
        let avatarId = await table.user.findOne({
            userId: result[i].userId
        });
        res[i] = {
            newsId: result[i].newsId,
            commentId: result[i].commentId,
            userId: result[i].userId,
            userName: result[i].userName,
            content: result[i].content,
            praiseNum: result[i].praiseNum,
            replied: result[i].replied,
            avatarId: avatarId.avatarId,
            floor: result[i].floor
        };
        if (avatarId.level == 'shutdown' || result[i].checkState == false) {
            res[i].content = '该用户被禁言或该评论被屏蔽';
        }
    }
    for (let i = 0; i < result.length; i++) {
        let title = await table.newsList.findOne({
            newsId: result[i].newsId
        });
        res[i].title = title.title;
        res[i].firstTag = title.firstTag;
    }
    let state = {
        success: true,
        msg: res
    };
    ctx.body = JSON.stringify(state);
}
const myReply = async ctx => {
    let startIndex = ctx.request.body.startIndex || 0;
    let userId = Number(ctx.session.loginDetil.userId);
    let result = await table.reply.find({
        userId: userId
    }).sort({
        replyId: -1
    }).limit(20).skip(startIndex).toArray();
    let res = new Array();
    for (let i = 0; i < result.length; i++) {
        let avatarId = await table.user.findOne({
            userId: result[i].userId
        });
        res[i] = {
            newsId: result[i].newsId,
            commentId: result[i].commentId,
            replyId: result[i].replyId,
            userId: result[i].userId,
            userName: result[i].userName,
            replyUserId: result[i].replyUserId,
            replyUserName: result[i].replyUserName,
            content: result[i].content,
            praiseNum: result[i].praiseNum,
            avatarId: avatarId.avatarId,
            replyFloor: result[i].replyFloor,
            floor: result[i].floor
        };
        if (avatarId.level == 'shutdown' || result[i].checkState == false) {
            res[i].content = '该用户被禁言或该评论被屏蔽';
        }
    }
    for (let i = 0; i < result.length; i++) {
        let relyFloor = await table.comment.findOne({
            commentId: result[i].commentId
        });
        res[i].relyFloor = relyFloor.floor;
    }
    for (let i = 0; i < result.length; i++) {
        let title = await table.newsList.findOne({
            newsId: result[i].newsId
        });
        res[i].title = title.title;
        res[i].firstTag = title.firstTag;
    }
    let state = {
        success: true,
        msg: res
    };
    ctx.body = JSON.stringify(state);
}
const replyMe = async ctx => {
    let startIndex = ctx.request.body.startIndex || 0;
    let userId = Number(ctx.session.loginDetil.userId);
    let result = await table.reply.find({
        replyUserId: userId,
        userId: {
            $ne: userId
        }
    }).sort({
        replyId: -1
    }).limit(20).skip(startIndex).toArray();
    let res = new Array();
    for (let i = 0; i < result.length; i++) {
        let user = await table.user.findOne({
            userId: result[i].userId
        });
        let avatarId;
        if (user) avatarId = user.avatarId;
        else avatarId = 'default';
        res[i] = {
            newsId: result[i].newsId,
            commentId: result[i].commentId,
            replyId: result[i].replyId,
            userId: result[i].userId,
            userName: result[i].userName,
            replyUserId: result[i].replyUserId,
            replyUserName: result[i].replyUserName,
            content: result[i].content,
            praiseNum: result[i].praiseNum,
            avatarId: avatarId,
            replyFloor: result[i].replyFloor,
            floor: result[i].floor
        };
        if (result[i].checkState == false && (user && user.level == 'shutdown')) {
            res[i].content = '该用户被禁言或该评论被屏蔽';
        }
    }
    for (let i = 0; i < result.length; i++) {
        let relyFloor = await table.comment.findOne({
            commentId: result[i].commentId
        });
        res[i].relyFloor = relyFloor.floor;
    }
    for (let i = 0; i < result.length; i++) {
        let title = await table.newsList.findOne({
            newsId: result[i].newsId
        });
        res[i].title = title.title;
        res[i].firstTag = title.firstTag;
    }
    for (let i = 0; i < result.length; i++) {
        let reply;
        if (result[i].replyFloor == 0) {
            reply = await table.comment.findOne({
                commentId: result[i].commentId
            });
            res[i].replied = {
                relyFloor: reply.floor,
                content: reply.content,
                time: reply.commentId
            }
        } else {
            reply = await table.reply.findOne({
                commentId: result[i].commentId,
                floor: result[i].replyFloor
            });
            res[i].replied = {
                replyFloor: reply.replyFloor,
                content: reply.content,
                time: reply.replyId
            }
            reply = await table.comment.findOne({
                commentId: result[i].commentId
            });
            res[i].replied.relyFloor = reply.floor;
        }

    }
    let state = {
        success: true,
        msg: res
    };
    ctx.body = JSON.stringify(state);
}
const clearMsg = async ctx => {
    let userId = Number(ctx.session.loginDetil.userId);
    await table.user.updateOne({
        userId: userId
    }, {
        $set: {
            messageNum: 0
        }
    });
    ctx.body = 'ok';
}
const loginCheck = ctx => {
    if (ctx.loginState === 1) {
        ctx.body = JSON.stringify({
            success: true
        });
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
}
module.exports = {
    'POST /api/register': register,
    'POST /api/login': login,
    'POST /api/logout': logout,
    'POST /logined/loginCheck': loginCheck,
    'POST /logined/userDetil': userDetil,
    'POST /logined/subUserDetil': subUserDetil,
    'POST /logined/changePwd': changePwd,
    'POST /logined/changeAv': changeAv,
    'POST /logined/myComment': myComment,
    'POST /logined/myReply': myReply,
    'POST /logined/replyMe': replyMe,
    'POST /logined/clearMsg': clearMsg
}