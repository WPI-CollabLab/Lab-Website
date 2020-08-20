import crypto from 'crypto'

import {Visit} from "./models/visit";
import {User} from "./models/user";

function hash(password, salt) {
    let shasum = crypto.createHash('sha256');
    shasum.update(salt);
    shasum.update(password);
    return shasum.digest('hex');
}

export async function setPassword(idNumber, password, needsPassword = false) : Promise<boolean> {
    return User.findOne({idNumber: idNumber}).then(
        async (user) => {
           if(user !== undefined) {
               const salt = crypto.randomBytes(8).toString('hex');
               user.password = hash(password, salt);
               user.salt = salt;
               user.needsPassword = needsPassword;
               await user.save();
               return true;
           }
           return false;
        }, false)
}

export async function getUser(idNumber) : Promise<User | undefined> {
    return User.findOne({idNumber: idNumber});
}

export async function getUserByUsername(username) : Promise<User | undefined> {
    return User.findOne({username: username.toLowerCase()});
}

export async function doesUserExist(idNumber) : Promise<boolean> {
    return User.findOne({idNumber: idNumber}).then(
        (user) => {
            return user !== undefined;
        },
        (err) => {
            return false;
        })
}

export async function createUser(idNumber, username, name, password, labMonitor, exec, admin) : Promise<boolean> {
    return doesUserExist(idNumber).then(
            async (exists) => {
                if(exists) {
                    return false;
                } else {
                    const isAvailable = await isUsernameAvailable(username);
                        if(isAvailable) {
                            const salt = crypto.randomBytes(8).toString('hex');
                            const hashSum = hash(password, salt);
                            let newUser = new User();
                            newUser.idNumber = idNumber;
                            newUser.username = username;
                            newUser.name = name;
                            newUser.password = hashSum;
                            newUser.salt = salt;
                            newUser.labMonitor = labMonitor;
                            newUser.exec = exec;
                            newUser.admin = admin;
                            await newUser.save();
                            return true;
                        }
                        return false;
                    }
            },new Error('Unable to create user.'));
}

export async function correctCreds(idNumber, password) : Promise<boolean> {
    return getUser(idNumber).then((user) => {
        return user.password === hash(password, user.salt);
    },new Error("Unable to communicate with database."));
}



export async function isUsernameAvailable(username) : Promise<boolean> {
    return getUserByUsername(username).then((user) => {
        return user === undefined;
    },() => {
        return true;
    })
}

export async function expirePassword(idNumber) : Promise<boolean> {
    return getUser(idNumber).then((user) => {
        if(user !== undefined) {
            user.needsPassword = true;
            return user.save();
        }
        return Promise.reject(new Error("Unable to retrieve specified user."))
    },Promise.reject(new Error("Unable to communicate with database.")));
}

export async function deleteUser(idNumber) {
    return getUser(idNumber).then((user) => {
            if (user !== undefined) {
                return user.remove();
            }
        },Promise.reject(new Error("Unable to communicate with database.")));
}

export async function grantByIdNumber(grant, idNumber) {
    return getUser(idNumber).then((user) => {
        if(user !== undefined) {
            if (grant === 'labMonitor') {
                user.labMonitor = true;
                return user.save();
            } else if (grant === 'exec') {
                user.exec = true;
                return user.save();
            } else if (grant === 'admin') {
                user.admin = true;
                return user.save();
            } else {
                return false;
            }
        }
    },() => { return false; });

}

export async function grantByUsername(grant, username) {
    return getUserByUsername(username).then((user) => {
        return grantByIdNumber(grant, user.idNumber);
    });
}

export async function changeNickname(idNumber, newNickname) {
    return getUser(idNumber).then((user) => {
        user.nickname = newNickname;
        return user.save();
    });
}

export async function changeUsername(idNumber, newUsername) {
    return getUser(idNumber).then((user) => {
        user.username = newUsername;
        return user.save();
    });
}

export async function changeName(idNumber, newName) {
    return getUser(idNumber).then((user) => {
        user.name = newName;
        return user.save();
    });
}

export async function clearDatabase() {
    let users = await User.find();
    for(let user of users) {
        await user.remove();
    }
    let swipes = await Visit.find();
    for(let swipe of swipes) {
        await swipe.remove();
    }
    return true;
}

export async function resetPassword(idNumber) {
    return doesUserExist(idNumber).then(() => {
        return setPassword(idNumber, idNumber, false);
    });
}
