const express = require('express');
const config = require('./config');
const redis = require('redis')

const users = require('./users');
const lab = require('./lab');
const manage = require('./manage');
const session = require('express-session');
const redisClient = redis.createClient()
const RedisStore = require('connect-redis')(session);
const common = require('./common');
const sites = {};

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

internal.get('/about', function(req, res){
  res.render('about');
});

internal.get('/', function (req, res){
    res.render('internalIndex');
});

external.get('/schedule', function (req, res) {
    res.render('schedule');
});

external.get('/about', function(req, res){
  res.render('about');
});

external.get('/', common.getLogin, function (req, res) {
    res.render('externalIndex', {'user': req.user});
});

internal.use('/lab', lab.internal);
external.use('/lab', lab.external);

internal.use('/users', users);
external.use('/users', users);

manage.setLab(lab.labActions);
external.use('/manage', manage.routes);

setup();
internal.set('domain', 'localhost');
sites.internal = internal.listen(config.internalPort);
sites.external = external.listen(config.externalPort);

function setup() {
    if (config.nukeOnRestart) {
        common.resetDatabase();
    }
}


module.exports = sites;
