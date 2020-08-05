const express = require('express');
const lab = express.Router();
const external = express.Router();

const userManagement = require('./userManagement');
const common = require('./common');

let labActions = {};

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

lab.post('/close', common.authInRequest, function (req, res) {
    let user = req.user;
    if (user.labMonitor === 'true') {
        res.send('0').end();
        labActions.closeLab();
    } else {
        res.end();
    }
});

lab.post('/swipe', common.idNumberInRequest, function (req, res) {
    processSwipe(req.user, res);
});

external.post('/kick', common.loggedIn, function (req, res) {
    if (req.user.labMonitor !== 'true' && req.user.exec !== 'true' && req.user.admin !== 'true') {
        res.end();
    }
    userManagement.getUserByUsername(req.body.idNumber, function (user) {
        processSwipe(user, res);
    });
});

labActions.closeLab = function () {
    labStatus.open = false;
    labStatus.members = {};
    names = {};
};

labActions.updateList = function () {
    names = {};
    for (let idNumber in labStatus.members) {
        userManagement.getUser(idNumber, function (user) {
            names[user.username] = toDisp(user);
            labStatus.members[user.idNumber] = user;
        });
    }
};

function processSwipe(user, res) {
    if (!labStatus.open && user.labMonitor === 'false') {
        res.send("1").end();
        return;
    }
    if (labStatus.members[user.idNumber] === undefined) {
        if (user.needsPassword === 'true') {
            res.send("4").end();
            return;
        }
        swipeIn(user);
    } else {
        const numLabMonitors = countLabMonitorsInLab();
        if (numLabMonitors > 1 || user.labMonitor === 'false' || Object.keys(names).length === 1) {
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
        if (labStatus.members[i].labMonitor === 'true') {
            count += 1;
        }
    }
    return count;
}

module.exports = {'internal': lab, 'external': external, 'labActions': labActions};
