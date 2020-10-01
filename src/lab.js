import express from "express";

export const internal = express.Router();
export const external = express.Router();
export const reloadOccupancyFromDB = async () => {
    let openVisits = await Visit.find({where: {outTime: null},relations: ["user"], order: {id: "DESC"}});
    for(let visit of openVisits) {
        console.log(visit);
        if (labStatus.members[visit.user.idNumber] === undefined) {
            labStatus.members[visit.user.idNumber] = visit.user;
            labStatus.open = true;
            names[visit.user.username] = toDisp(visit.user);

        }
    }
}

import {getUser,getUserByUsername} from './userManagement'
import {authInRequest,idNumberInRequest,loggedIn,isValidNickname} from "./common";
import {Visit} from "./models/visit";
import {MoreThan, LessThan} from "typeorm";

let labStatus = {
    open: false,
    members: {}
};

let names = {};

internal.get('/status', function (req, res) {
    res.send({"open": labStatus.open, "members": names});
});

external.get('/status', function (req, res) {
    res.send({"open": labStatus.open, "members": names});
});

external.post('/visits', async (req, res) => {
    let visits = await getVisits(req.body.startDate,req.body.endDate);
    res.send(visits).end();
})

internal.post('/close',authInRequest, async (req, res) => {
    let user = req.user;
    if (user.labMonitor === true) {
        await closeLab();
        res.send('0').end();
    } else {
        res.end();
    }
});

internal.post('/swipe',idNumberInRequest, async (req, res) => {
    let user = req.user;
    if(user === undefined || user === null)
        res.send('2').end();
    else
        return await processSwipe(user, res);
});

external.post('/kick',loggedIn, async (req, res) => {
    let user = req.user;
    if (user.labMonitor !== true && user.exec !== true && user.admin !== true) {
        res.end();
    }
    await getUserByUsername(req.body.idNumber).then( async (user) => {
        await processSwipe(user, res);
    });
});

export async function closeLab() {
    labStatus.open = false;
    for(const user of Object.values(labStatus.members)) {
        await swipeOut(user);
    }
}

export async function getVisits(startDate = new Date(0), endDate = new Date()) {
    return await Visit.find({inTime: MoreThan(startDate),outTime:LessThan(endDate),relations: ["user"],order: {id: "DESC"}});
}

export async function updateList()  {
    names = {};
    for (let idNumber in labStatus.members) {
        await getUser(idNumber).then( (user) => {
            names[user.username] = toDisp(user);
            labStatus.members[user.idNumber] = user;
        });
    }
}

async function processSwipe(user, res) {
    if (!labStatus.open && user.labMonitor === false) {
        res.send("1").end();
        return;
    }

    if (labStatus.members[user.idNumber] === undefined) {
        if (user.needsPassword === true) {
            res.send("4").end();
        } else {
            await swipeIn(user);
            res.send("0").end();
        }
    } else {
        const numLabMonitors = countLabMonitorsInLab();
        if (numLabMonitors > 1 || user.labMonitor === false || Object.keys(names).length === 1) {
            await swipeOut(user);
            res.send("0").end();
        } else {
            res.send("3").end();
        }
    }
    labStatus.open = countLabMonitorsInLab() > 0;
}

async function swipeIn(user) {
    labStatus.members[user.idNumber] = user;
    labStatus.open = true;
    names[user.username] = toDisp(user);
    let visit = new Visit();
    visit.user = user;
    visit.inTime = new Date();
    await visit.save();
}

function toDisp(user) {
    if (isValidNickname(user.nickname)) {
        return user.name + " (" + user.nickname + ")";
    }
    return user.name;
}

async function swipeOut(user) {
    console.log(user);
    delete labStatus.members[user.idNumber];
    delete names[user.username];
    let visit = await Visit.findOne({where:{outTime: null,user: user},relations:["user"], order: {id: "DESC"}});
    console.log(visit);
    visit.outTime = new Date();
    await visit.save();
}

function countLabMonitorsInLab() {
    let count = 0;
    for (let i in labStatus.members) {
        if (labStatus.members[i].labMonitor === true) {
            count += 1;
        }
    }
    return count;
}