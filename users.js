const express = require('express');
const router = express.Router();

const userManagement = require('./userManagement');
const common = require('./common');
const config = require('./config');

router.post('/changePassword', common.authInRequest, function (req, res) {
    if (req.body.newPassword != null && req.body.newPassword.length > 4) {
        userManagement.setPassword(req.user.idNumber, req.body.newPassword);
        res.send('0').end();
    } else {
        res.end();
    }
});

router.post('/login', common.authInRequest, function (req, res) {
    req.session.idNumber = req.user.idNumber;
    req.session.save(function () {
        res.send('0').end();
    });
});

router.post('/logout', common.loggedIn, function (req, res) {
    req.session.idNumber = null;
    res.send('0').end();
});

router.post('/register', function (req, res) {
    const name = req.body.name;
    const username = req.body.username;
    const idNumber = req.body.newId;
    const approverId = req.body.approverId;
    const passphrase = req.body.passphrase || '';
    const password = req.body.password || '';
    if (!(common.isValidId(idNumber) && common.isValidUsername(username) &&
        common.isValidName(name) && password.length > 4)) {
        res.end();
        return;
    }
    if (passphrase !== '' && common.passphraseIsValid(passphrase)) {
        userManagement.createUser(idNumber, username, name, password,
            passphrase === config.labMonitorPassphrase,
            passphrase === config.execPassphrase,
            passphrase === config.adminPassphrase,
            function () {
                res.send('0').end();
            }, function (error) {
                if (error.message === "Username taken") {
                    res.send('3').end();
                } else {
                    res.send('1').end();
                }
            });
        return;
    } else if (passphrase !== '' && !common.passphraseIsValid(passphrase)) {
        res.send('4').end();
        return;
    }

    if (common.isValidId(approverId)) {
        userManagement.getUser(approverId, function (approver) {
            if (approver.labMonitor === 'true') {
                userManagement.createUser(idNumber, username, name, password, false, false, false,
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
        }, function () {
            res.send('2').end();
        });
    }
});


module.exports = router;
