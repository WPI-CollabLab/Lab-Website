import * as config from "./config"
import {
    correctCreds,
    getUserByUsername,
    getUser,
    createUser,
    clearDatabase
} from './userManagement'


export function isValidId(idNumber) {
    return idNumber != null && idNumber.trim().length === 9 && !isNaN(idNumber);
}

export function isValidUsername(username) {
    return username != null && config.usernameRegex.test(username) && username.length < 31;
}

export function isValidName(str) {
    return config.nameRegex.test(str) && str.length < 31;
}

export async function authInRequest(req, res, next) : Promise<Response> {
    if (req.body.password === null) {
        res.end();
    }
    if (isValidId(req.body.idNumber)) {
        return await correctCreds(req.body.idNumber, req.body.password).then(function () {
            req.user = req.body.idNumber;
            next();
        }, function () {
            res.send('1').end();
        });
    } else if (isValidUsername(req.body.idNumber)) {
        return await getUserByUsername(req.body.idNumber).then(
            async (lookup) => {
                if(lookup === undefined) {
                    res.send('1').end();
                } else {
                    return await correctCreds(lookup.idNumber, req.body.password).then(() => {
                        req.user = lookup.idNumber;
                        next();
                    }, function () {
                        res.send('1').end();
                    })
                }
            }, function () {
                res.send('1').end();
            });
    } else {
        res.end();
    }
}

export async function idNumberInRequest(req, res, next) : Response {
    if (isValidId(req.body.idNumber)) {
            req.user = req.body.idNumber;
            next();
    } else if (isValidUsername(req.body.idNumber)) {
            return await getUserByUsername(req.body.idNumber).then(function (user) {
                if(user !== undefined) {
                    req.user = user.idNumber;
                    next();
                } else {
                    res.send('2').end();
                }
        }, () => {
            res.send('2').end();
        });
    } else {
        res.send('2').end();
    }
}

export async function loggedIn(req, res, next)  {
    if (req.session.idNumber != null) {
            await getUser(req.session.idNumber).then(function (user) {
                if(user !== undefined) {
                    req.user = user.idNumber;
                    next();
                } else {
                    res.redirect('/manage');
                }
        },  () => {
            res.redirect('/manage');
        })
    } else {
        return res.redirect('/manage');
    }
}

export function getLogin(req, res, next) : Promise<Response> {
    if (req.session.idNumber !== null) {
        return getUser(req.session.idNumber).then(function (user) {
            if(user !== undefined) {
                req.user = user.idNumber;
                next();
            }
        }, function () {
            req.user = null;
            next();
        })
    } else {
        req.user = null;
        next();
    }
}

export function isValidNickname(nickname) {
    const regex = /^[\d\w ]{4,30}$/;
    return nickname != null && regex.test(nickname);
}

export function passphraseIsValid(passphrase) {
    return passphrase != null && (
        passphrase === config.labMonitorPassphrase ||
        passphrase === config.execPassphrase ||
        passphrase === config.adminPassphrase);
}

export function getGrantFromPassphrase (passphrase) {
    switch (passphrase) {
        case config.labMonitorPassphrase:
            return 'labMonitor';
        case config.execPassphrase:
            return 'exec';
        case config.adminPassphrase:
            return 'admin';
        default:
            return false;
    }
}

export function isValidGrant(grant) {
    return grant != null && (
        grant === 'labMonitor' ||
        grant === 'exec' ||
        grant === 'admin');
}

export function canGrant(user, grant) {
    if (user.admin === true) {
        return true;
    } else if (user.exec === true) {
        return grant === 'labMonitor';
    }
}

export async function resetDatabase() {
    return clearDatabase().then (()=>{
        return createUser(config.adminId, config.adminUsername, config.adminName,
            config.defaultAdminPassword, true, true, true);
    })
}