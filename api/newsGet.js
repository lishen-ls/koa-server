const fs = require('fs');
const path = require('path');
const Segment = require('segment');
const MongoReader = require('../tools/mongoReader');
const table = new MongoReader();
table.open();

const getNewsList = async ctx => {
    let startIndex = Number(ctx.query.startIndex) || 0;
    let firstTag = ctx.query.firstTag;
    let res = new Array();
    let result
    if (firstTag) {
        result = await table.newsList.find({
            firstTag: firstTag,
            checkState: true
        }).sort({
            newsTime: -1
        }).limit(10).skip(startIndex).toArray();
    } else {
        result = await table.newsList.find({
            checkState: true
        }).sort({
            newsTime: -1
        }).limit(10).skip(startIndex).toArray();
    }

    for (let i = 0; i < result.length; i++) {
        res[i] = {
            newsId: result[i].newsId,
            newsTime: result[i].newsTime,
            title: result[i].title,
            hasImg: result[i].hasTitleImg,
            commentNum: result[i].permitComment ? result[i].commentNum : 0,
            praiseNum: result[i].praiseNum,
            firstTag: result[i].firstTag
        };
    }
    ctx.body = JSON.stringify(res);
}
const getImNews = async ctx => {
    let res = new Array();
    let result = await table.newsList.find({
        important: true
    }).sort({
        newsTime: -1
    }).limit(5).toArray();
    for (let i = 0; i < result.length; i++) {
        res[i] = {
            newsId: result[i].newsId,
            newsTime: result[i].newsTime,
            title: result[i].title,
            hasImg: result[i].hasImg,
            commentNum: result[i].commentNum,
            praiseNum: result[i].praiseNum,
            firstTag: result[i].firstTag
        };
    }
    ctx.body = JSON.stringify(res);
}
const getNewsContent = async ctx => {
    let Id = Number(ctx.query.newsId);
    let news = {};
    let res;
    let result = await table.newsList.findOne({
        newsId: Id
    });
    let exists = fs.existsSync(path.resolve(__dirname, `../static/newsSrc/${Id}.html`));
    if (result && exists) {
        if (result.checkState) {
            res = {
                title: result.title,
                commentNum: result.commentNum,
                praiseNum: result.praiseNum,
                origin: result.origin,
                newsTime: result.newsTime,
                firstTag: result.firstTag,
                secondTag: result.secondTag,
                checkState: result.checkState,
                permitComment: result.permitComment
            };
            news.content = fs.readFileSync(path.resolve(__dirname, `../static/newsSrc/${Id}.html`), 'utf-8');
            news.attr = res;
            news.success = true;
            ctx.body = JSON.stringify(news);
            await table.newsList.updateOne({
                newsId: Id
            }, {
                $inc: {
                    visited: 1
                }
            });
            if (ctx.loginState == 1)
                ctx.app.emit('readNewsLog', Id, ctx.ip, ctx.session.loginDetil.userId);
            else
                ctx.app.emit('readNewsLog', Id, ctx.ip);
        } else if (ctx.session.loginDetil && ctx.session.loginDetil.level == 'admin') {
            res = {
                title: result.title,
                commentNum: result.commentNum,
                praiseNum: result.praiseNum,
                origin: result.origin,
                newsTime: result.newsTime,
                firstTag: result.firstTag,
                secondTag: result.secondTag,
                checkState: result.checkState,
                permitComment: result.permitComment
            };
            news.content = fs.readFileSync(path.resolve(__dirname, `../static/newsSrc/${Id}.html`), 'utf-8');
            news.attr = res;
            news.success = true;
            ctx.body = JSON.stringify(news);
        } else {
            ctx.body = JSON.stringify({
                success: false,
                msg: '资源不存在'
            });
        }
    } else {
        ctx.body = JSON.stringify({
            success: false,
            msg: '资源不存在'
        });
    }
}
const homePage = async ctx => {
    let UA = ctx.header['user-agent'];
    let check = /Mobile/;
    if (check.test(UA)) {
        ctx.body = fs.readFileSync(path.resolve(__dirname, `../static/mobile.html`), 'utf-8');
    } else {
        ctx.body = fs.readFileSync(path.resolve(__dirname, `../static/pc.html`), 'utf-8');
    }
}
const getMostReadNews = async ctx => {
    let nowTime = new Date().getTime();
    let dayQ = {
        time: {
            $gte: nowTime - 1000 * 60 * 60 * 24
        },
        event: 'readNews',
    }
    let weekQ = {
        time: {
            $gte: nowTime - 1000 * 60 * 60 * 24 * 7
        },
        event: 'readNews'
    }
    if (ctx.query.classify != '') {
        dayQ['outer.firstTag'] = ctx.query.classify;
        weekQ['outer.firstTag'] = ctx.query.classify;
    }
    async function daySearch() {
        return new Promise(async function (resolve) {
            let res = await table.log.aggregate([{
                    $lookup: {
                        from: 'newsList',
                        localField: 'newsId',
                        foreignField: 'newsId',
                        as: 'outer'
                    }
                },
                {
                    $match: dayQ
                }, {
                    $group: {
                        _id: '$newsId',
                        readNum: {
                            $sum: 1
                        },
                        title: {
                            $first: '$outer.title'
                        },
                        firstTag: {
                            $first: '$outer.firstTag'
                        },
                        newsTime: {
                            $first: '$outer.newsTime'
                        }
                    }
                }
            ]).sort({
                readNum: -1
            }).limit(10).toArray();
            res.sort(async function (a, b) {
                if (a.readNum == b.readNum) {
                    return b.newsTime[0] - a.newsTime[0];
                } else {
                    return -1;
                }
            });
            let day = new Array();
            for (let i = 0; i < res.length; i++) {
                day.push({
                    newsId: res[i]._id,
                    title: res[i].title[0] ? res[i].title[0] : '资源不存在',
                    firstTag: res[i].firstTag[0]
                });
            }
            resolve(day);
        });
    }
    async function weekSearch() {
        return new Promise(async function (resolve) {
            let res = await table.log.aggregate([{
                $lookup: {
                    from: 'newsList',
                    localField: 'newsId',
                    foreignField: 'newsId',
                    as: 'outer'
                }
            }, {
                $match: weekQ
            }, {
                $group: {
                    _id: '$newsId',
                    readNum: {
                        $sum: 1
                    },
                    title: {
                        $first: '$outer.title'
                    },
                    firstTag: {
                        $first: '$outer.firstTag'
                    },
                    newsTime: {
                        $first: '$outer.newsTime'
                    }
                }
            }]).sort({
                readNum: -1
            }).limit(10).toArray();
            res.sort(async function (a, b) {
                if (a.readNum == b.readNum) {
                    return b.newsTime[0] - a.newsTime[0];
                } else {
                    return -1;
                }
            });
            let week = new Array();
            for (let i = 0; i < res.length; i++) {
                week.push({
                    newsId: res[i]._id,
                    title: res[i].title[0] ? res[i].title[0] : '资源不存在',
                    firstTag: res[i].firstTag[0]
                });
            }
            resolve(week);
        });
    }
    let day = daySearch();
    let week = weekSearch();
    day = await day;
    week = await week;
    let state = {
        success: true,
        msg: {
            day: day,
            week: week
        }
    };
    ctx.body = JSON.stringify(state);
}

const getMostCommentNews = async ctx => {
    let time = new Date().getTime();
    let dayQ = {
        commentId: {
            $gte: time - 1000 * 60 * 60 * 24
        }
    }
    let weekQ = {
        commentId: {
            $gte: time - 1000 * 60 * 60 * 24 * 7
        }
    }
    if (ctx.query.classify != '') {
        dayQ['outer.firstTag'] = ctx.query.classify;
        weekQ['outer.firstTag'] = ctx.query.classify;
    }
    async function daySearch() {
        return new Promise(async function (resolve) {
            let res = await table.comment.aggregate([{
                $lookup: {
                    from: 'newsList',
                    localField: 'newsId',
                    foreignField: 'newsId',
                    as: 'outer'
                }
            }, {
                $match: dayQ
            }, {
                $group: {
                    _id: '$newsId',
                    commentNum: {
                        $sum: 1
                    },
                    title: {
                        $first: '$outer.title'
                    },
                    firstTag: {
                        $first: '$outer.firstTag'
                    },
                    newsTime: {
                        $first: '$outer.newsTime'
                    }
                }
            }]).sort({
                commentNum: -1
            }).limit(10).toArray();
            res.sort(async function (a, b) {
                if (a.commentNum == b.commentNum) {
                    return b.newsTime[0] - a.newsTime[0];
                } else {
                    return -1;
                }
            });
            let day = new Array();
            for (let i = 0; i < res.length; i++) {
                day.push({
                    newsId: res[i]._id,
                    title: res[i].title[0] ? res[i].title[0] : '资源不存在',
                    firstTag: res[i].firstTag[0]
                });
            }
            resolve(day);
        });
    }
    async function weekSearch() {
        return new Promise(async function (resolve) {
            let res = await table.comment.aggregate([{
                $lookup: {
                    from: 'newsList',
                    localField: 'newsId',
                    foreignField: 'newsId',
                    as: 'outer'
                }
            }, {
                $match: weekQ
            }, {
                $group: {
                    _id: '$newsId',
                    commentNum: {
                        $sum: 1
                    },
                    title: {
                        $first: '$outer.title'
                    },
                    firstTag: {
                        $first: '$outer.firstTag'
                    },
                    newsTime: {
                        $first: '$outer.newsTime'
                    }
                }
            }]).sort({
                commentNum: -1
            }).limit(10).toArray();
            res.sort(async function (a, b) {
                if (a.commentNum == b.commentNum) {
                    return b.newsTime[0] - a.newsTime[0];
                } else {
                    return -1;
                }
            });
            let week = new Array();
            for (let i = 0; i < res.length; i++) {
                week.push({
                    newsId: res[i]._id,
                    title: res[i].title[0] ? res[i].title[0] : '资源不存在',
                    firstTag: res[i].firstTag[0]
                });
            }
            resolve(week);
        });
    }
    let day = daySearch();
    let week = weekSearch();
    day = await day;
    week = await week;
    let state = {
        success: true,
        msg: {
            day: day,
            week: week
        }
    };
    ctx.body = JSON.stringify(state);
}
const searchNews = async ctx => {
    let segment = new Segment();
    segment.useDefault();
    let queryStr = ctx.query.queryStr;
    let startIndex = Number(ctx.query.startIndex);
    let queryArr = segment.doSegment(queryStr, {
        simple: true,
        stripStopword: true,
        stripPunctuation: true
    });
    let regArr = new Array();
    for (let i = 0; i < queryArr.length; i++) {
        regArr.push(new RegExp(queryArr[i]));
    }
    let itemNum = await table.newsList.find({
        title: {
            $in: regArr
        },
        checkState: true
    }).count();
    let result = await table.newsList.find({
        title: {
            $in: regArr
        },
        checkState: true
    }).sort({
        newsTime: -1
    }).skip(startIndex).limit(20).toArray();
    let res = new Array();
    for (let i = 0; i < result.length; i++) {
        res[i] = {
            newsId: result[i].newsId,
            title: result[i].title,
            time: result[i].newsTime,
            firstTag: result[i].firstTag
        }
    }
    let state = {
        success: true,
        msg: res,
        itemNum: itemNum
    };
    ctx.body = JSON.stringify(state);
}
module.exports = {
    'GET /api/getNewsList': getNewsList,
    'GET /api/getNewsContent': getNewsContent,
    'GET /api/getImNews': getImNews,
    'GET /api/getMostReadNews': getMostReadNews,
    'GET /api/getMostCommentNews': getMostCommentNews,
    'GET /api/searchNews': searchNews,
    'GET /': homePage
};