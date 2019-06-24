const mongo = require('mongodb').MongoClient;
const url = 'mongodb://localhost:27017/News';
const DB = Symbol('DB');
const user = Symbol('user');
const newsList = Symbol('newsList');
const comment = Symbol('comment');
const reply = Symbol('reply');
const praise = Symbol('praise');
const log = Symbol('log');
class MongoReader{
    constructor() {
        this[DB] = {};
        this[user] = {};
        this[newsList] = {};
        this[comment] = {};
        this[reply] = {};
        this[praise] = {};
        this[log] = {};
    }
    async open() {
        this[DB] = await mongo.connect(url, {
            useNewUrlParser: true
        });
        let db = this[DB].db('News');
        this[user] = db.collection('user');
        this[newsList] = db.collection('newsList');
        this[comment] = db.collection('comment');
        this[reply] = db.collection('reply');
        this[praise] = db.collection('praise');
        this[log] = db.collection('log');
    }
    close() {
        this[DB].close();
    }
    get user() {
        return this[user];
    }
    get newsList() {
        return this[newsList];
    }
    get comment() {
        return this[comment];
    }
    get reply() {
        return this[reply];
    }
    get praise() {
        return this[praise];
    }
    get log() {
        return this[log];
    }
}
module.exports = MongoReader;