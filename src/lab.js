import express from "express";

const lab = express.Router();
const external = express.Router();

import * as userManagement from './userManagement'
import * as common from './common'

let labStatus = {
    open: false,
    members: {}
};

let names = {};

lab.get('/status', function (req, res) {
    res.send({"open": labStatus.open, "members": names});
});

external.get('/status', function (req, res) {
    res.send({"open": labStatus.open, "members": names});
});

lab.post('/close',common.authInRequest, async (req, res) => {
    let user = await userManagement.getUser(req.user);
    if (user.labMonitor === true) {
        closeLab();
        res.send('0').end();
    } else {
        res.end();
    }
});

lab.post('/swipe',common.idNumberInRequest, async (req, res) => {
    let user = await userManagement.getUser(req.user);
    if(user === undefined)
        res.send('2').end();
    else
        await processSwipe(user, res);
});

external.post('/kick',common.loggedIn, async (req, res) => {
    let user = await userManagement.getUser(req.user);
    if (user.labMonitor !== true && user.exec !== true && user.admin !== true) {
        res.end();
    }
    await userManagement.getUserByUsername(req.body.idNumber).then( async (user) => {
        await processSwipe(user, res);
    });
});

function closeLab() {
    labStatus.open = false;
    labStatus.members = {};
    names = {};
}

async function updateList()  {
    names = {};
    for (let idNumber in labStatus.members) {
        await userManagement.getUser(idNumber).then( (user) => {
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
        }
        swipeIn(user);
    } else {
        const numLabMonitors = countLabMonitorsInLab();
        if (numLabMonitors > 1 || user.labMonitor === false || Object.keys(names).length === 1) {
            swipeOut(user)
        } else {
            res.send("3").end();
            return;
        }
    }
    res.send("0").end();
    labStatus.open = countLabMonitorsInLab() > 0;
}

function swipeIn(user) {
    labStatus.members[user.idNumber] = user;
    labStatus.open = true;
    names[user.username] = toDisp(user);
}

function toDisp(user) {
    if (common.isValidNickname(user.nickname)) {
        return user.name + " (" + user.nickname + ")";
    }
    return user.name;
}

function swipeOut(user) {
    delete labStatus.members[user.idNumber];
    delete names[user.username];
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

module.exports = {'internal': lab, 'external': external, 'closeLab': closeLab,'updateList': updateList};
