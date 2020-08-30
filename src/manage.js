import express from "express";

import {loggedIn,
    canGrant,
    getGrantFromPassphrase,
    isValidGrant,
    isValidId,
    isValidName,
    isValidNickname,
    isValidUsername,
    passphraseIsValid,
    resetDatabase} from './common';
import {
    getUser,
    changeName,
    changeNickname,
    changeUsername,
    correctCreds,
    deleteUser,
    getUserByUsername,
    grantByIdNumber,
    grantByUsername,
    resetPassword,
    setPassword,
} from "./userManagement";
import {updateList,closeLab} from "./lab";

let router = express.Router();

router.get('/',  (req, res) => {
    if (req.session.idNumber != null) {
        res.redirect('/manage/home');
        return;
    }
    res.render('manage');
});

router.get('/home', loggedIn, (req, res) => {
    res.render('home', {'user': req.user, 'title': 'Management'});
});

router.post('/getPermission', loggedIn, async (req, res) => {
    if (passphraseIsValid(req.body.passphrase)) {
        await grantByIdNumber(getGrantFromPassphrase(req.body.passphrase),
            req.user.idNumber).then( () => {
                res.send('0').end();
            }, () => {
                res.send('1').end();
            });
    } else {
        res.send('1').end();
    }
});

router.post('/changeUsername', loggedIn, async (req, res) => {
    if (isValidUsername(req.body.username)) {
        await changeUsername(req.user, req.body.username);
        await updateList();
        res.send('0').end();
    } else {
        res.send('1').end();
    }
});

router.post('/changeNickname', loggedIn, async (req, res) => {
    if (isValidNickname(req.body.nickname)) {
        await changeNickname(req.user, req.body.nickname);
        await updateList();
        res.send('0').end();
    } else {
        res.send('1').end();
    }
});

router.post('/changeName', loggedIn, async (req, res) => {
    if (isValidName(req.body.name)) {
        await changeName(req.user, req.body.name);
        await updateList();
        res.send('0').end();
    } else {
        res.send('1').end();
    }
});

router.post('/changePassword', loggedIn, async (req, res) => {
    if (req.body.password == null || req.body.newPassword == null) {
        res.end();
        return;
    }
    if (correctCreds(req.user, req.body.password)) {
        await setPassword(req.user, req.body.newPassword);
        res.send('0').end();
    } else {
        res.send('1').end();
    }
});

router.post('/deleteSelf', loggedIn, async (req, res) => {
    if (req.body.password == null) {
        res.end();
        return;
    }
    if(correctCreds(req.user, req.body.password)) {
        deleteUser(req.user).then(() => {
            req.session.idNumber = null;
            res.send('0').end();
        }, () => {
            res.send('1').end();
        });
    } else {
        res.send('1').end();
    }
});

router.post('/deleteAccount', loggedIn, async (req, res) => {
    const userID = req.body.userID;
    const user = req.user;
    if (user.exec !== true || user.admin !== true) {
        res.end();
        return;
    }
    if (isValidId(userID)) {
        await getUser(userID).then(() => {
            return deleteUser(userID).then( () => {
                res.send('0').end();
            },() => {
                res.send('1').end();
            });
        });
    } else if (isValidUsername(userID)) {
        let targetUser = await getUserByUsername(userID);
        await deleteUser(targetUser).then( () => {
            res.send('0').end();
        }, () => {
            res.send('1').end();
        });
    } else {
        res.send('1').end();
    }
});

router.post('/resetPassword', loggedIn, async (req, res) => {
    const user = req.user;
    if (user.exec !== true && user.admin !== true) {
        res.end();
        return;
    }
    if (isValidId(req.body.userID)) {
        await getUser(req.body.userID).then((user)=> {
            return resetPassword(user).then(() => {
                res.send('0').end();
            }, () => {
                res.send('1').end();
            });
        });
    } else if (isValidUsername(req.body.userID)) {
        await getUserByUsername(req.body.userID).then(
             (user) => {
                return resetPassword(user).then(() => {
                    res.send('0').end();
                });
            }, () => {
                res.send('1').end();
            });
    } else {
        res.end();
    }
});

router.post('/grant', loggedIn, async (req, res) => {
    const grant = req.body.grant;
    const userID = req.body.userID;
    const user = req.user;
    if (isValidGrant(grant) && canGrant(user, grant)) {
        if (isValidId(userID)) {
            await grantByIdNumber(grant, userID).then( () => {
                res.send('0').end();
            }, () => {
                res.send('1').end();
            });
        } else if (isValidUsername(userID)) {
            await grantByUsername(grant, userID).then( () => {
                res.send('0').end();
            }, () => {
                res.send('1').end();
            });
        }
    } else {
        res.send('1').end();
    }
});

router.post('/resetDatabase', loggedIn, async (req, res) => {
    const password = req.body.password;
    const user = req.user;
    if (!password || password.length < 5 || user === undefined || user.admin !== true) {
        res.end();
        return;
    }
    if(correctCreds(req.user, password)) {
        await resetDatabase();
        res.send('0').end();
    } else {
        res.send('1').end();
    }
});

router.post('/closeLab', loggedIn, async (req, res) => {
    const user = req.user;
    if (user.labMonitor === true || user.exec === true) {
        await closeLab();
        res.send('0').end();
    } else {
        res.send('1').end();
    }
});

module.exports = {'routes': router};
