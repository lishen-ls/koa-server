const cheerio = require('cheerio');
const axios = require('axios');
const MongoReader = require('./mongoReader');
const table = new MongoReader();
table.open();
const fs = require('fs');
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/73.0.3683.86 Safari/537.36';
let downloadIndex = -1;
let downloadFact = -1;
let autoDownload = 0;
let auto = false;

const getIThomeNewsUrl = async (startPage = 1, endPage = 3, speed = 3) => {
    let IThomeUrl = 'https://www.ithome.com/ithome/getajaxdata.aspx';
    let spiderUrls = new Array();
    let newSpiderUrls = new Array();
    newSpiderUrls[0] = new Array();
    let getUrl = axios.create({
        headers: {
            'user-agent': UA
        }
    });
    let reg = /www.ithome.com/;
    for (let i = startPage; i <= endPage; i++) {
        let res = await getUrl.get(IThomeUrl, {
            params: {
                page: i,
                type: 'indexpage',
                randnum: Math.random()
            }
        });
        $ = cheerio.load(res.data);
        $('li').each(function () {
            if (reg.test($(this).find('h2 a').attr('href'))) {
                let urlLi = {
                    title: $(this).find('h2 a').text(),
                    titleImg: $(this).find('img').attr('src'),
                    href: $(this).find('h2 a').attr('href')
                }
                spiderUrls.push(urlLi);
            }
        });
    }
    for (let i = 0, j = 0, k = 0; i < spiderUrls.length; i++, k++) {
        newSpiderUrls[j][k] = spiderUrls[i];
        if ((i + 1) % speed == 0) {
            j++;
            k = -1;
            newSpiderUrls[j] = new Array();
        }
    }
    return newSpiderUrls;
}

const getchuappNewsUrl = async (startPage = 1, endPage = 3, speed = 3) => {
    let chuappUrl1 = 'https://www.chuapp.com/category/index/id/zsyx/p/';
    let chuappUrl2 = 'https://www.chuapp.com/category/index/id/daily/p/'
    let chuappUrl3 = 'https://www.chuapp.com/category/index/id/pcz/p/'
    let spiderUrls = new Array();
    let newSpiderUrls = new Array();
    newSpiderUrls[0] = new Array();
    let getUrl = axios.create({
        headers: {
            'user-agent': UA
        }
    });
    for (let i = startPage; i <= endPage; i++) {
        let res = await getUrl.get(chuappUrl1 + i + '.html');
        $ = cheerio.load(res.data);
        $('.category-list a[class=fn-clear]').each(function () {
            let urlLi = {
                title: $(this).attr('title'),
                titleImg: $(this).find('img').attr('src'),
                href: 'https://www.chuapp.com' + $(this).attr('href')
            }
            spiderUrls.push(urlLi);
        });
        res = await getUrl.get(chuappUrl2 + i + '.html');
        $ = cheerio.load(res.data);
        $('.category-list a[class=fn-clear]').each(function () {
            let urlLi = {
                title: $(this).attr('title'),
                titleImg: $(this).find('img').attr('src'),
                href: 'https://www.chuapp.com' + $(this).attr('href')
            }
            spiderUrls.push(urlLi);
        });
        res = await getUrl.get(chuappUrl3 + i + '.html');
        $ = cheerio.load(res.data);
        $('.category-list a[class=fn-clear]').each(function () {
            let urlLi = {
                title: $(this).attr('title'),
                titleImg: $(this).find('img').attr('src'),
                href: 'https://www.chuapp.com' + $(this).attr('href')
            }
            spiderUrls.push(urlLi);
        });
    }
    for (let i = 0, j = 0, k = 0; i < spiderUrls.length; i++, k++) {
        newSpiderUrls[j][k] = spiderUrls[i];
        if ((i + 1) % speed == 0) {
            j++;
            k = -1;
            newSpiderUrls[j] = new Array();
        }
    }
    return newSpiderUrls;
}

const getsspaiNewsUrl = async (startPage = 1, endPage = 3, speed = 3) => {
    let spiderUrls = new Array();
    let newSpiderUrls = new Array();
    newSpiderUrls[0] = new Array();
    let getUrl = axios.create({
        headers: {
            'user-agent': UA
        }
    });
    for (let i = startPage; i <= endPage; i++) {
        let res = await getUrl.get(`https://sspai.com/api/v1/articles?offset=${startPage*20-20}&limit=20&has_tag=1&tag=%E5%BA%94%E7%94%A8%E6%8E%A8%E8%8D%90&include_total=false&type=recommend_to_home`);
        res = res.data.list;
        for (let i = 0; i < res.length; i++) {
            let urlLi = {
                title: res[i].title,
                titleImg: 'https://cdn.sspai.com/' + res[i].banner + '?imageMogr2/quality/80/thumbnail/!426x222r/gravity/Center/crop/426x222',
                href: 'https://sspai.com/post/' + res[i].id,
                time: res[i].released_at
            }
            spiderUrls.push(urlLi);
        }
    }
    for (let i = 0, j = 0, k = 0; i < spiderUrls.length; i++, k++) {
        newSpiderUrls[j][k] = spiderUrls[i];
        if ((i + 1) % speed == 0) {
            j++;
            k = -1;
            newSpiderUrls[j] = new Array();
        }
    }
    return newSpiderUrls;
}

const rewriteIThome = ($, newsId) => {
    let headerTag = $('a[class="s_tag"]').text();
    let newsTime = new Date($('#pubtime_baidu').text()).getTime();
    let firstTag = $('.current_nav a').eq(1).text();
    let secondTag = $('.current_nav a').last().text();
    let imgNum = $('#paragraph p img').toArray().length;
    let imgSrc = new Array();
    firstTag = firstTag.slice(0, firstTag.length - 2);
    if (firstTag == 'Win8.1' || firstTag == 'Win7' || firstTag == 'Vista' || firstTag == 'Office' || firstTag == 'IE' || firstTag == 'WP' || firstTag == 'Win10' || firstTag == 'Mac')
        firstTag = '系统';
    if (firstTag == 'iPhone' || firstTag == 'iPad') firstTag = 'iOS';
    if (firstTag == '主题' || secondTag == 'Win10软件应用推荐') firstTag = '软件';
    if (secondTag == 'Win10设备') firstTag = '数码';
    if (secondTag == '生活人文' || secondTag == '科普知识动态') firstTag = '科学';
    $('#paragraph img').removeAttr('h');
    $('#paragraph img').removeAttr('w');
    $('#paragraph img').removeAttr('class');
    $('#paragraph img').removeAttr('title');
    $('#paragraph img').removeAttr('width');
    $('#paragraph img').removeAttr('height');
    $('#paragraph img').removeAttr('referrerpolicy');
    $('a[class="s_tag"]').replaceWith(headerTag);
    $('#paragraph').removeAttr('class');
    $('#paragraph p img').each(function (i) {
        $(this).attr('data-src', `/newsSrc/${newsId}-${i + 1}.jpg`);
        if ($(this).attr('data-original'))
            imgSrc.push($(this).attr('data-original'));
        else
            imgSrc.push($(this).attr('src'));
    });
    $('#paragraph dir').each(function (i) {
        if ($(this).find('img').attr('data-original'))
            imgSrc.push($(this).find('img').attr('data-original'));
        else
            imgSrc.push($(this).find('img').attr('src'));
        let buy = cheerio.load(`<div class="app-card"><img class="app-card-left" data-src="/newsSrc/${newsId}-${imgNum + 1}.jpg"><div class="app-card-right"><h4 class="app-title">${$(this).find('.card-name').text()}</h4><div class="download-group"><a class="app-download" target="_blank" href="${$(this).find('a').attr('href')}">直达链接</a></div></div></div>`)
        $(this).replaceWith(buy.html());
        imgNum++;
    });
    $('#paragraph img').removeAttr('data-original');
    $('#paragraph img').removeAttr('src');
    return {
        imgSrc,
        content: $('#paragraph'),
        firstTag,
        secondTag,
        newsTime,
        imgNum
    };
}

const rewritechuapp = ($, newsId) => {
    let newsTime = Number($('span[data-time]').attr('data-time') + '000');
    let firstTag = '游戏';
    let secondTag = '游戏';
    let imgNum = $('.the-content img').toArray().length;
    let imgSrc = new Array();
    $('.the-content figure').removeAttr('class');
    $('.the-content h3').removeAttr('id');
    $('.the-content img').each(function (i) {
        $(this).attr('data-src', `/newsSrc/${newsId}-${i + 1}.jpg`);
        imgSrc.push($(this).attr('src'));
    });
    $('.the-content img').removeAttr('src');
    $('.the-content iframe').each(function () {
        let reg = new RegExp('steam');
        if (!reg.test($(this).attr('src'))) {
            let src = $(this).attr('src');
            let n = src.indexOf('?');
            src = 'https://v.qq.com/txp/iframe/player.html' + src.slice(n);
            $(this).attr('src', src);
        }
    });
    return {
        imgSrc,
        content: $('.the-content'),
        firstTag,
        secondTag,
        newsTime,
        imgNum
    };
}

const rewritesspai = async ($, newsId, time) => {
    let getApp = axios.create({
        headers: {
            'user-agent': UA
        }
    });
    let newsTime = Number(time + '000');
    let firstTag = '软件';
    let secondTag = '软件快报';
    let imgNum = $('.content.wangEditor-txt.clock img[data-original]').toArray().length;
    let imgSrc = new Array();
    $('.content.wangEditor-txt.clock').removeAttr('data-v-efa83452');
    $('.content.wangEditor-txt.clock img[data-original]').removeAttr('src');
    $('.content.wangEditor-txt.clock img[data-original]').removeAttr('data-index');
    $('.content.wangEditor-txt.clock img[data-original]').each(function (i) {
        $(this).attr('data-src', `/newsSrc/${newsId}-${i + 1}.jpg`);
        imgSrc.push($(this).attr('data-original'));
    });
    $('.content.wangEditor-txt.clock img[data-original]').removeAttr('data-original');
    $('.content.wangEditor-txt.clock img[data-original]').removeAttr('width');
    $('.content.wangEditor-txt.clock figure').removeAttr('tabindex');
    $('.content.wangEditor-txt.clock figure').removeAttr('draggable');
    $('.content.wangEditor-txt.clock figure').removeAttr('contenteditable');
    $('.content.wangEditor-txt.clock figure').removeAttr('class');
    $('.content.wangEditor-txt.clock figure figcaption').removeAttr('class');
    $('.content.wangEditor-txt.clock figure figcaption').removeAttr('data-enpassusermodified');
    let app = $('.content.wangEditor-txt.clock span[app-id]').toArray();
    for (let i = 0; i < app.length; i++) {
        let res = await getApp(`https://sspai.com/api/v1/applications/${$(app[i]).attr('app-id')}`);
        res = res.data;
        let appCard = cheerio.load(`<div class="app-card"><img class="app-card-left" data-src="/newsSrc/${newsId}-${i + imgNum + 1}.jpg"><div class="app-card-right"><h4 class="app-title">${res.title}</h4><div class="download-group"></div></div></div>`);
        for (let j = 0; j < res.apps_at_platform.length; j++) {
            appCard('.app-card-right .download-group').append(`<a class="app-download" target="_blank" href="${res.apps_at_platform[j].url}">${res.apps_at_platform[j].store}</a>`);
        }
        imgSrc.push(`https://cdn.sspai.com/${res.icon}`);
        $(app[i]).replaceWith(appCard.html());
    }
    imgNum += app.length;
    let appBuy = $('.content.wangEditor-txt.clock .ss-app-card.tb-custom').toArray();
    for (let i = 0; i < appBuy.length; i++) {
        let title = $(appBuy[i]).find('h4:first-child').text();
        let href = $(appBuy[i]).find('a.btn-all').attr('href');
        let src = $(appBuy[i]).find('.ss-icon').attr('data-original');
        let appCard = cheerio.load(`<div class="app-card"><img class="app-card-left" data-src="/newsSrc/${newsId}-${i + imgNum + 1}.jpg"><div class="app-card-right"><h4 class="app-title">${title}</h4><div class="download-group"><a class="app-download" target="_blank" href="${href}">立即购买</a></div></div></div>`);
        imgSrc.push(src);
        $(appBuy[i]).replaceWith(appCard.html());
    }
    return {
        imgSrc,
        content: $('.content.wangEditor-txt.clock'),
        firstTag,
        secondTag,
        newsTime,
        imgNum
    };
}

const download = (element, getPage, getImg, origin, ws) => {
    let choose = {
        IThome: rewriteIThome,
        chuapp: rewritechuapp,
        sspai: rewritesspai
    }
    return new Promise(async (resolve) => {
        let index = ++downloadIndex;
        let newsId = new Date().getTime() * (Math.floor(Math.random() * 100 + 1));
        let newsGetTime = new Date().getTime();
        console.log(`${element.title} 开始下载……`);
        let state = JSON.stringify({
            title: element.title,
            newsId: newsId,
            index: index,
            state: 'start',
        });
        if (ws && ws.readyState == 1) ws.send(state);
        if (await table.newsList.findOne({
                title: element.title
            }) != null) {
            console.log(`${element.title} 已存在！`);
            state = JSON.stringify({
                title: element.title,
                newsId: newsId,
                index: index,
                state: 'exist'
            });
            if (ws && ws.readyState == 1) ws.send(state);
        } else {
            try {
                let pageRes = await getPage(String(element.href)).catch(function (error) {
                    if (error.response) {
                        console.log(error.response.status);
                    } else if (error.request) {
                        console.log(error.request);
                    } else {
                        console.log('Error', error.message);
                    }
                });
                let $ = cheerio.load(pageRes.data);
                let insertData = {
                    newsId: newsId,
                    newsGetTime: newsGetTime,
                    title: element.title,
                    checkTime: 0,
                    checkState: true,
                    important: false,
                    hasTitleImg: !(element.titleImg == null),
                    commentNum: 0,
                    praiseNum: 0,
                    visited: 0,
                    origin: origin,
                    permitComment: true
                };
                let pageDetil;
                if (origin == 'sspai') pageDetil = await choose[origin]($, insertData.newsId, element.time);
                else pageDetil = choose[origin]($, insertData.newsId);
                insertData.newsTime = pageDetil.newsTime;
                insertData.firstTag = pageDetil.firstTag;
                insertData.secondTag = pageDetil.secondTag;
                insertData.hasContentImg = !(pageDetil.imgNum == 0);
                table.newsList.insertOne(insertData);
                if (insertData.hasTitleImg) {
                    let titleImgRes = await getImg(String(element.titleImg));
                    titleImgRes.data.pipe(fs.createWriteStream(`./static/newsSrc/${insertData.newsId}-0.jpg`));
                }
                if (insertData.hasContentImg) {
                    pageDetil.imgSrc.forEach(async (item, i) => {
                        item = String(item);
                        let contenImgRes = await getImg(item.split('@')[0])
                            .catch(function (error) {
                                console.log(element);
                                if (error.response) {
                                    console.log(error.response.status);
                                } else if (error.request) {
                                    console.log(error.request);
                                } else {
                                    console.log('Error', error.message);
                                }
                            });
                        contenImgRes.data.pipe(fs.createWriteStream(`./static/newsSrc/${insertData.newsId}-${i + 1}.jpg`));
                    });
                }
                fs.writeFileSync(`./static/newsSrc/${insertData.newsId}.html`, pageDetil.content);
                console.log(`${element.title} 下载完成！`);
                state = JSON.stringify({
                    title: element.title,
                    newsId: newsId,
                    index: index,
                    state: 'success'
                });
                if (ws && ws.readyState == 1) ws.send(state);
                downloadFact++;
                resolve(1);
            } catch (e) {
                console.log(`${element.title} 下载失败！`);
                state = JSON.stringify({
                    title: element.title,
                    newsId: newsId,
                    index: index,
                    state: 'fail'
                });
                if (ws && ws.readyState == 1) ws.send(state);
                resolve(0);
            }
        }
        resolve(0);
    });
}
const createDownload = async (spiderUrls, origin, ws) => {
    let downloadNum = 0;
    let spiderUlrsLength = spiderUrls.length;
    let getImg = axios.create({
        headers: {
            'user-agent': UA
        },
        responseType: 'stream'
    });
    let getPage = axios.create({
        headers: {
            'user-agent': UA
        }
    });
    for (let i = 0; i < spiderUlrsLength; i++) {
        let reqArr = new Array();
        for (let j = 0; j < spiderUrls[i].length; j++) {
            reqArr.push(download(spiderUrls[i][j], getPage, getImg, origin, ws));
        }
        let num = await Promise.all(reqArr);
        for (let i = 0; i < num.length; i++) {
            downloadNum += num[i];
        }
        reqArr = new Array();
    }
    return downloadNum;
}
let choose = {
    IThome: getIThomeNewsUrl,
    chuapp: getchuappNewsUrl,
    sspai: getsspaiNewsUrl
};
const startCrawl = async ctx => {
    ctx.websocket.on('message', async function (msg) {
        msg = JSON.parse(msg);
        if (msg.startPage > msg.endPage || msg.startPage <= 0 || msg.endPage <= 0 || msg.origin == '') {
            let state = JSON.stringify({
                msg: '参数错误',
                state: 'false'
            });
            ctx.websocket.send(state)
        } else {
            let spiderUlrs = await choose[msg.origin](msg.startPage, msg.endPage, msg.speed);
            await createDownload(spiderUlrs, msg.origin, ctx.websocket);
            let state = JSON.stringify({
                msg: '下载完成',
                predict: downloadIndex + 1,
                state: 'end'
            });
            if (ctx.websocket.readyState == 1) ctx.websocket.send(state);
            console.log('本次下载已完成！');
            ctx.app.emit('getNewsLog', downloadFact + 1, ctx.ip, ctx.session.loginDetil.userId);
            downloadIndex = -1;
            downloadFact = -1;
        }
    });
    ctx.websocket.on('close', () => {
        console.log('下载已结束');
    });
}

const autoCrawl = async ctx => {
    let timeOptions = [10, 30, 60];
    let timeSelect = Number(ctx.request.body.time);
    if (timeSelect != 1 && timeSelect != 2 && timeSelect != 0) {
        ctx.body = JSON.stringify({
            success: false,
            msg: '参数错误'
        });
    } else {
        let time = timeOptions[timeSelect] * 60 * 1000;
        clearInterval(autoDownload);
        autoDownload = setInterval(async () => {
            console.log('开始下载');
            let url = await choose['IThome']();
            await createDownload(url, 'IThome', ctx.websocket);
            url = await choose['chuapp']();
            await createDownload(url, 'chuapp', ctx.websocket);
            url = await choose['sspai']();
            await createDownload(url, 'sspai', ctx.websocket);
            console.log('下载结束');
            ctx.app.emit('getNewsLog', downloadFact + 1);
            downloadIndex = -1;
            downloadFact = -1;
        }, time);
        auto = true;
        console.log(`每${time/60/1000}分钟下载一次`);
        ctx.body = JSON.stringify({
            success: true,
            msg: '已开启自动下载'
        });
    }
}

const offAutoCrawl = async ctx => {
    if (auto) {
        clearInterval(autoDownload);
        console.log('关闭自动下载');
        ctx.body = JSON.stringify({
            success: true,
            msg: '已关闭自动下载'
        });
    } else {
        console.log('未开启自动下载');
        ctx.body = JSON.stringify({
            success: false,
            msg: '未开启自动下载'
        });
    }
}

module.exports = {
    startCrawl: startCrawl,
    autoCrawl: autoCrawl,
    offAutoCrawl: offAutoCrawl
}