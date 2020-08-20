import {Router} from "express";
export let router = Router();

import * as userManagement from './userManagement';
import * as common from './common';

router.post('/changePassword',common.authInRequest, async (req, res) => {
    if (req.body.newPassword != null && req.body.newPassword.length > 4) {
        await userManagement.setPassword(req.user.idNumber, req.body.newPassword);
        res.send('0').end();
    } else {
        res.end();
    }
});

router.post('/login',common.authInRequest, (req, res) => {
    req.session.idNumber = req.user.idNumber;
    req.session.save(function () {
        res.send('0').end();
    });
});

router.post('/logout',common.loggedIn, (req, res) => {
    req.session.idNumber = null;
    res.send('0').end();
});

router.post('/register', async (req, res) => {
    const name = req.body.name;
    const username = req.body.username;
    const idNumber = req.body.newId;
    const approverId = req.body.approverId;
    const passphrase = req.body.passphrase || '';
    const password = req.body.password || '';
    if (!(common.isValidId(idNumber) && common.isValidUsername(username) &&
        common.isValidName(name) && password.length > 4)) {
        res.end();
    }
    if (passphrase !== '' && common.passphraseIsValid(passphrase)) {
        await userManagement.createUser(idNumber, username, name, password,
            passphrase === config.labMonitorPassphrase,
            passphrase === config.execPassphrase,
            passphrase === config.adminPassphrase).then(
            function () {
                res.send('0').end();
            }, function (error) {
                if (error.message === "Username taken") {
                    res.send('3').end();
                } else {
                    res.send('1').end();
                }
            });
    } else if (passphrase !== '' && !common.passphraseIsValid(passphrase)) {
        res.send('4').end();
    }

    if (common.isValidId(approverId)) {
        await userManagement.getUser(approverId).then( async (approver) => {
            if (approver !== undefined && approver.labMonitor === true) {
                return userManagement.createUser(idNumber, username, name, password, false, false, false).then(
                    function () {
                        res.send('0').end();
                    }, function (error) {
                        if (error.message === "Username taken") {
                            res.send('3').end();
                        } else {
                            res.send('1').end();
                        }
                    });
            }
            res.send('2').end();
        }, function () {
            res.send('2').end();
        });
    }
});
