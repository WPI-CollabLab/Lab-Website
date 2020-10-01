import express from "express";
import session from "express-session";
import redis from "redis";
import bodyParser from "body-parser";
import {createConnection,getConnectionManager} from 'typeorm'
import {nukeOnRestart,cookieSecret,internalPort,externalPort} from './config'
import {router as userRouter} from './users'
import {internal as labInt, external as labExt, reloadOccupancyFromDB} from './lab'
import {routes as manageRoutes} from './manage'
import {getLogin,resetDatabase} from './common'
import {User} from "./models/user";
import {Visit} from "./models/visit";

//when running unit tests connection is already created there.
if(!getConnectionManager().has("default")) {
    createConnection().then(async (connection) => {
        User.useConnection(connection);
        Visit.useConnection(connection);
        if (nukeOnRestart) {
            await resetDatabase();
        }
        await reloadOccupancyFromDB();
    });
}

//redis still needed for cookie store.
const redisClient = redis.createClient();
const RedisStore = require('connect-redis')(session);

const internal = express();
const external = express();
const sites = {};

internal.use(express.static('public'));
external.use(express.static('public'));

internal.set('view engine', 'pug');
external.set('view engine', 'pug');

internal.use(bodyParser.json());
external.use(bodyParser.json());

external.use(session({
    store: new RedisStore({client: redisClient}),
    secret: cookieSecret,
    resave: false,
    saveUninitialized: false
}));

internal.get('/schedule', function (req, res) {
    res.render('schedule');
});

internal.get('/about', function(req, res){
  res.render('about');
});

internal.get('/', function (req, res) {
    res.render('internalIndex');
});

external.get('/schedule', function (req, res) {
    res.render('schedule');
});

external.get('/about', function(req, res){
    res.render('about');
});

external.get('/', getLogin, async (req, res) => {
    res.render('externalIndex', {'user': req.user});
});

internal.use('/lab', labInt);
external.use('/lab', labExt);

external.use('/users', userRouter);
internal.use('/users', userRouter);

external.use('/manage', manageRoutes);

internal.set('domain', 'localhost');

sites.internal = internal.listen(internalPort);
sites.external = external.listen(externalPort);
module.exports = sites;
