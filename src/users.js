import {Router} from "express";
export let router = Router();

import {createUser, getUser, setPassword} from './userManagement';
import {authInRequest,loggedIn,isValidId,passphraseIsValid,isValidUsername,isValidName} from './common';
import {adminPassphrase, execPassphrase, labMonitorPassphrase} from "./config";

router.post('/changePassword',authInRequest, async (req, res) => {
    if (req.body.newPassword != null && req.body.newPassword.length > 4) {
        await setPassword(req.user.idNumber, req.body.newPassword);
        res.send('0').end();
    } else {
        res.end();
    }
});

router.post('/login',authInRequest, async (req, res) => {
    req.session.idNumber = req.user.idNumber;
    await req.session.save();
    res.send('0').end();
});

router.post('/logout',loggedIn, (req, res) => {
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
    if (!(isValidId(idNumber) && isValidUsername(username) &&
        isValidName(name) && password.length > 4)) {
        res.end();
    }
    if (passphrase !== '' && passphraseIsValid(passphrase)) {
        await createUser(idNumber, username, name, password,
            passphrase === labMonitorPassphrase,
            passphrase === execPassphrase,
            passphrase === adminPassphrase).then(() => {
                res.send('0').end();
            }, (error) => {
                if (error.message === "Username taken") {
                    res.send('3').end();
                } else {
                    res.send('1').end();
                }
            });
    } else if (passphrase !== '' && !passphraseIsValid(passphrase)) {
        res.send('4').end();
    } else if (isValidId(approverId)) {
        await getUser(approverId).then( async (approver) => {
            if (approver.labMonitor === true) {
                await createUser(idNumber, username, name, password, false, false, false).then(
                    () => {
                        res.send('0').end();
                    }, (error) => {
                        if (error.message === "Username taken") {
                            res.send('3').end();
                        } else {
                            res.send('1').end();
                        }
                    });
            }
        },  () => {
            res.send('2').end();
        });
    }
});
