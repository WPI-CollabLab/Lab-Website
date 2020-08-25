import express from "express";

export const internal = express.Router();
export const external = express.Router();

import {getUser,getUserByUsername} from './userManagement'
import {authInRequest,idNumberInRequest,loggedIn,isValidNickname} from "./common";
import {Visit} from "./models/visit";

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

external.get('/visits', function (req, res) {
    updateVisits().then(visits => {
        res.send({"visits": visits});
    });

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

export async function updateVisits() {
    await Visit.find().then( (visits) => {
        return visits;
    });
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
    delete labStatus.members[user.idNumber];
    delete names[user.username];
    let visit = await Visit.findOne({"user": user, "order": {"id": "DESC"}});
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