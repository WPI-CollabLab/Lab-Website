import {
    usernameRegex,
    nameRegex,
    labMonitorPassphrase,
    execPassphrase,
    adminPassphrase,
    defaultAdminPassword, adminUsername, adminId, adminName
} from "./config"
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
    return username != null && usernameRegex.test(username) && username.length < 31;
}

export function isValidName(str) {
    return nameRegex.test(str) && str.length < 31;
}

export async function authInRequest(req, res, next) {
    if (req.body.password === null) {
        res.end();
    }
    if (isValidId(req.body.idNumber)) {
        return await getUser(req.body.idNumber).then((user) => {
            if(correctCreds(user,req.body.password)) {
                req.user = user;
                next();
            } else {
                req.user = null;
                res.send('1').end();
            }
        }, () => {
            res.send('1').end();
        });
    } else if (isValidUsername(req.body.idNumber)) {
        return await getUserByUsername(req.body.idNumber).then((user) => {
                if(correctCreds(user, req.body.password)) {
                    req.user = user;
                    next();
                } else {
                    req.user = null;
                    res.send('1').end();
                }
            }, () => {
                res.send('1').end();
            });
    } else {
        res.end();
    }
}

export async function idNumberInRequest(req, res, next) {
    if (isValidId(req.body.idNumber)) {
        await getUser(req.body.idNumber).then((user) => {
            req.user = user;
            next();
        }, () => {
            res.send('2').end();
        });
    } else if (isValidUsername(req.body.idNumber)) {
            await getUserByUsername(req.body.idNumber).then((user) => {
                req.user = user;
                next();
        }, () => {
            res.send('2').end();
        });
    } else {
        res.send('2').end();
    }
}

export async function loggedIn(req, res, next)  {
    if (req.session.idNumber !== null) {
            await getUser(req.session.idNumber).then((user) => {
                req.user = user;
                next();
        },  () => {
            res.redirect('/manage');
        });
    } else {
         res.redirect('/manage');
    }
}

export async function getLogin(req, res, next) {
    if (req.session.idNumber !== null) {
        return await getUser(req.session.idNumber).then((user) => {
            req.user = user;
            next();
        }, () => {
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
        passphrase === labMonitorPassphrase ||
        passphrase === execPassphrase ||
        passphrase === adminPassphrase);
}

export function getGrantFromPassphrase (passphrase) {
    switch (passphrase) {
        case labMonitorPassphrase:
            return 'labMonitor';
        case execPassphrase:
            return 'exec';
        case adminPassphrase:
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
    return clearDatabase().then (() => {
        return createUser(adminId, adminUsername, adminName,
            defaultAdminPassword, true, true, true);
    })
}