const express = require('express');
const router = express.Router();
const common = require('./common');
const userManagement = require('./userManagement');
let lab = {};

router.get('/', function (req, res) {
    if (req.session.idNumber != null) {
        res.redirect('/manage/home');
        return;
    }
    res.render('manage');
});

router.get('/home', common.loggedIn, function (req, res) {
    res.render('home', {'user': req.user, 'title': 'Management'});
});

router.post('/getPermission', common.loggedIn, function (req, res) {
    if (common.passphraseIsValid(req.body.passphrase)) {
        userManagement.grantByIdNumber(common.getGrantFromPassphrase(req.body.passphrase),
            req.user.idNumber, function () {
                res.send('0').end();
            }, function () {
                res.send('1').end();
            });
    } else {
        res.send('1').end();
    }
});

router.post('/changeUsername', common.loggedIn, function (req, res) {
    if (common.isValidUsername(req.body.username)) {
        userManagement.getUserByUsername(req.body.username,
            function () {
                res.send('1').end();
            }, function () {
                userManagement.changeUsername(req.user.idNumber, req.body.username, req.user.username);
                lab.updateList();
                res.send('0').end();
            });
    } else {
        res.send('1').end();
    }
});

router.post('/changeNickname', common.loggedIn, function (req, res) {
    if (common.isValidNickname(req.body.nickname)) {
        userManagement.changeNickname(req.user.idNumber, req.body.nickname);
        lab.updateList();
        res.send('0').end();
    } else {
        res.send('1').end();
    }
});

router.post('/changeName', common.loggedIn, function (req, res) {
    if (common.isValidName(req.body.name)) {
        userManagement.changeName(req.user.idNumber, req.body.name);
        lab.updateList();
        res.send('0').end();
    } else {
        res.send('1').end();
    }
});

router.post('/changePassword', common.loggedIn, function (req, res) {
    if (req.body.password == null || req.body.newPassword == null) {
        res.end();
        return;
    }
    userManagement.correctCreds(req.user.idNumber, req.body.password,
        function () {
            userManagement.setPassword(req.user.idNumber, req.body.newPassword);
            res.send('0').end();
        }, function () {
            res.send('1').end();
        });
});

router.post('/deleteSelf', common.loggedIn, function (req, res) {
    if (req.body.password == null) {
        res.end();
        return;
    }
    userManagement.correctCreds(req.user.idNumber, req.body.password,
        function () {
            userManagement.delete(req.user.idNumber, function () {
                req.session.idNumber = null;
                res.send('0').end();
            });
        }, function () {
            res.send('1').end();
        });
});

router.post('/deleteAccount', common.loggedIn, function (req, res) {
    const userID = req.body.userID;
    if (req.user.exec !== 'true' || req.user.admin !== 'true') {
        res.end();
        return;
    }
    if (common.isValidId(userID)) {
        userManagement.delete(userID, function () {
            res.send('0').end();
        });
    } else if (common.isValidUsername(userID)) {
        userManagement.getUserByUsername(userID, function () {
            res.send('0').end();
        }, function () {
            res.send('1').end();
        });
    } else {
        res.send('1').end();
    }
});

router.post('/resetPassword', common.loggedIn, function (req, res) {
    if (req.user.exec !== 'true' && req.user.admin !== 'true') {
        res.end();
        return;
    }
    if (common.isValidId(req.body.userID)) {
        userManagement.resetPassword(req.body.userID, function () {
            res.send('0').end();
        }, function () {
            res.send('1').end();
        });
    } else if (common.isValidUsername(req.body.userID)) {
        userManagement.getUserByUsername(req.body.userID,
            function (user) {
                userManagement.resetPassword(user.idNumber, function () {
                    res.send('0').end();
                });
            }, function () {
                res.send('1').end();
            });
    } else {
        res.end();
    }
});

router.post('/grant', common.loggedIn, function (req, res) {
    const grant = req.body.grant;
    const userID = req.body.userID;
    if (common.isValidGrant(grant) && common.canGrant(req.user, grant)) {
        if (common.isValidId(userID)) {
            userManagement.grantByIdNumber(grant, userID, function () {
                res.send('0').end();
            }, function () {
                res.send('1').end();
            });
        } else if (common.isValidUsername(userID)) {
            userManagement.grantByUsername(grant, userID, function () {
                res.send('0').end();
            }, function () {
                res.send('1').end();
            });
        }
    } else {
        res.send('1').end();
    }
});

router.post('/resetDatabase', common.loggedIn, function (req, res) {
    const password = req.body.password;
    if (!password || password.length < 5 || req.user.admin !== 'true') {
        res.end();
        return;
    }
    userManagement.correctCreds(req.user.idNumber, password, function () {
        common.resetDatabase();
        res.send('0').end();
    }, function () {
        res.send('1').end();
    });
});

router.post('/closeLab', common.loggedIn, function (req, res) {
    if (req.user.labMonitor === 'true' || req.user.exec === 'true') {
        lab.closeLab();
        res.send('0').end();
    } else {
        res.send('1').end();
    }
});


function setLab(toSet) {
    lab = toSet;
}

module.exports = {'routes': router, 'setLab': setLab};
