import express from "express";
import session from "express-session";
import redis from "redis";
import {createConnection,getConnectionManager} from 'typeorm'

import * as config from './config'
import * as users from './users'
import * as lab from './lab'
import * as manage from './manage'
import * as common from './common'
import {User} from "./models/user";
import {Swipe} from "./models/swipe";
const sites = {};

//when running unit tests connection is already created there.
if(!getConnectionManager().has("default")) {
    createConnection().then(async (connection) => {
        User.useConnection(connection);
        Swipe.useConnection(connection);
        if (config.nukeOnRestart) {
            await common.resetDatabase();
        }
    });
}

//redis still needed for cookie store.
const redisClient = redis.createClient();
let RedisStore = require('connect-redis')(session);

const internal = express();
const external = express();

internal.use(express.static('public'));
external.use(express.static('public'));

internal.set('view engine', 'pug');
external.set('view engine', 'pug');

const bodyParser = require('body-parser');
internal.use(bodyParser.json());
external.use(bodyParser.json());

external.use(session({
    store: new RedisStore({client: redisClient}),
    secret: config.cookieSecret,
    resave: false,
    saveUninitialized: false
}));

internal.get('/schedule', function (req, res) {
    res.render('schedule');
});

internal.get('/', function (req, res) {
    res.render('internalIndex');
});

external.get('/schedule', function (req, res) {
    res.render('schedule');
});

external.get('/', common.getLogin, function (req, res) {
    res.render('externalIndex', {'user': req.user});
});

internal.use('/lab', lab.internal);
external.use('/lab', lab.external);

internal.use('/users', users.router);
external.use('/users', users.router);

external.use('/manage', manage.routes);

internal.set('domain', 'localhost');
sites.internal = internal.listen(config.internalPort);
sites.external = external.listen(config.externalPort);
module.exports = sites;
