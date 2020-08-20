import express from "express";

import * as common from './common';
import * as userManagement from "./userManagement";
import * as lab from "./lab"

let router = express.Router();

router.get('/',  (req, res) => {
    if (req.session.idNumber != null) {
        res.redirect('/manage/home');
        return;
    }
    res.render('manage');
});

router.get('/home', common.loggedIn, (req, res) => {
    res.render('home', {'user': req.user, 'title': 'Management'});
});

router.post('/getPermission', common.loggedIn, async (req, res) => {
    if (common.passphraseIsValid(req.body.passphrase)) {
        await userManagement.grantByIdNumber(common.getGrantFromPassphrase(req.body.passphrase),
            req.user.idNumber).then( () => {
                res.send('0').end();
            }, () => {
                res.send('1').end();
            });
    } else {
        res.send('1').end();
    }
});

router.post('/changeUsername', common.loggedIn, async (req, res) => {
    if (common.isValidUsername(req.body.username)) {
        await userManagement.getUserByUsername(req.body.username).then(
            () => {
                res.send('1').end();
            }, async () => {
                await userManagement.changeUsername(req.user.idNumber, req.body.username, req.user.username);
                await lab.updateList();
                res.send('0').end();
            });
    } else {
        res.send('1').end();
    }
});

router.post('/changeNickname', common.loggedIn, async (req, res) => {
    if (common.isValidNickname(req.body.nickname)) {
        await userManagement.changeNickname(req.user.idNumber, req.body.nickname);
        await lab.updateList();
        res.send('0').end();
    } else {
        res.send('1').end();
    }
});

router.post('/changeName', common.loggedIn, async (req, res) => {
    if (common.isValidName(req.body.name)) {
        await userManagement.changeName(req.user.idNumber, req.body.name);
        await lab.updateList();
        res.send('0').end();
    } else {
        res.send('1').end();
    }
});

router.post('/changePassword', common.loggedIn, async (req, res) => {
    if (req.body.password == null || req.body.newPassword == null) {
        res.end();
        return;
    }
    await userManagement.correctCreds(req.user.idNumber, req.body.password).then(
        async () => {
            await userManagement.setPassword(req.user.idNumber, req.body.newPassword);
            res.send('0').end();
        }, () => {
            res.send('1').end();
        });
});

router.post('/deleteSelf', common.loggedIn, async (req, res) => {
    if (req.body.password == null) {
        res.end();
        return;
    }
    await userManagement.correctCreds(req.user.idNumber, req.body.password,
         () => {
            userManagement.deleteUser(req.user.idNumber).then( () => {
                req.session.idNumber = null;
                res.send('0').end();
            });
        }, () => {
            res.send('1').end();
        });
});

router.post('/deleteAccount', common.loggedIn, async (req, res) => {
    const userID = req.body.userID;
    const user = req.user;
    if (user.exec !== true || user.admin !== true) {
        res.end();
        return;
    }
    if (common.isValidId(userID)) {
        await userManagement.deleteUser(userID).then( () => {
            res.send('0').end();
        });
    } else if (common.isValidUsername(userID)) {
        let tgtuser = await userManagement.getUserByUsername(userID);
        await deleteUser(tgtuser.idNumber).then( () => {
            res.send('0').end();
        }, () => {
            res.send('1').end();
        });
    } else {
        res.send('1').end();
    }
});

router.post('/resetPassword', common.loggedIn, async (req, res) => {
    const user = req.user;
    if (user.exec !== true && user.admin !== true) {
        res.end();
        return;
    }
    if (common.isValidId(req.body.userID)) {
        await userManagement.resetPassword(req.body.userID).then(function () {
            res.send('0').end();
        }, function () {
            res.send('1').end();
        });
    } else if (common.isValidUsername(req.body.userID)) {
        await userManagement.getUserByUsername(req.body.userID).then(
            function (user) {
                userManagement.resetPassword(user.idNumber).then(function () {
                    res.send('0').end();
                });
            }, function () {
                res.send('1').end();
            });
    } else {
        res.end();
    }
});

router.post('/grant', common.loggedIn, async (req, res) => {
    const grant = req.body.grant;
    const userID = req.body.userID;
    const user = req.user;
    if (common.isValidGrant(grant) && common.canGrant(user, grant)) {
        if (common.isValidId(userID)) {
            await userManagement.grantByIdNumber(grant, userID).then( () => {
                res.send('0').end();
            }, () => {
                res.send('1').end();
            });
        } else if (common.isValidUsername(userID)) {
            await userManagement.grantByUsername(grant, userID).then( () => {
                res.send('0').end();
            }, () => {
                res.send('1').end();
            });
        }
    } else {
        res.send('1').end();
    }
});

router.post('/resetDatabase', common.loggedIn, async (req, res) => {
    const password = req.body.password;
    const user = req.user;
    if (!password || password.length < 5 || user === undefined || user.admin !== true) {
        res.end();
        return;
    }
    await userManagement.correctCreds(req.user.idNumber, password).then( async () => {
        await common.resetDatabase();
        res.send('0').end();
    }, () => {
        res.send('1').end();
    });
});

router.post('/closeLab', common.loggedIn, async (req, res) => {
    const user = req.user;
    if (user.labMonitor === true || user.exec === true) {
        await lab.closeLab();
        res.send('0').end();
    } else {
        res.send('1').end();
    }
});



module.exports = {'routes': router};
