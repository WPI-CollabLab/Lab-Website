import crypto from 'crypto'

import {Visit} from "./models/visit";
import {User} from "./models/user";

function hash(password : string , salt : string ) {
    let hash = crypto.createHash('sha256');
    hash.update(salt);
    hash.update(password);
    return hash.digest('hex');
}

export async function setPassword(user : User, password : string, needsPassword : boolean = false) : Promise<boolean> {
       const salt = crypto.randomBytes(8).toString('hex');
       user.password = hash(password, salt);
       user.salt = salt;
       user.needsPassword = needsPassword;
       await user.save();
       return true;
}

export async function getUser(idNumber) : Promise<User | undefined> {
    return User.findOne({idNumber: idNumber}).then((user) => {
            if(user !== undefined) {
                return user;
            } else {
                return Promise.reject(new Error("No such user."));
            }
        }
    );
}

export async function getUserByUsername(username) : Promise<User> {
    return User.findOne({username: username}).then((user) => {
        if(user !== undefined) {
            return user;
        } else {
            return Promise.reject(new Error("No such user."));
        }
    });
}

export async function userExists(idNumber : Number) : Promise<void> {
    return User.findOne(idNumber).then(
        (user) => {
            if(user !== undefined) {
                return user;
            } else {
                return Promise.reject(new Error("No such user."));
            }
        });
}

export async function createUser(idNumber, username, name, password, labMonitor, exec, admin) : Promise<boolean> {
    return userExists(idNumber).then(() => new Error("ID already in system!"), () => {
        return usernameAvailable(username).then(async () => {
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
        },() => new Error("Username already in system!"));
    });
}

export function correctCreds(user : User, password : string) : boolean {
    return user.password === hash(password, user.salt);
}



export async function usernameAvailable(username : string) : Promise<void> {
    return getUserByUsername(username).then(() => {
            return Promise.reject(new Error("User exists."));
    },() => {
        return Promise.resolve();
    });
}

export async function expirePassword(user  : User) : Promise<void> {
    user.needsPassword = true;
    return user.save();
}

export async function deleteUser(user : User) {
    return user.remove();
}

function applyGrant(grant : string, user : User) {
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

export async function grantByIdNumber(grant : string , idNumber : Number) {
    return getUser(idNumber).then((user) => {
        return applyGrant(grant,user);
    },() => false);
}

export async function grantByUsername(grant : string, username : string) {
    return getUserByUsername(username).then((user) => {
        return applyGrant(grant,user);
    },() => false);
}

export async function changeNickname(user : User, newNickname : string) {
    user.nickname = newNickname;
    return user.save();
}

export async function changeUsername(user : User , newUsername : string) {
    user.username = newUsername;
    return user.save();
}

export async function changeName(user : User, newName : string) {
    user.name = newName;
    return user.save();
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

export async function resetPassword(user : User) {
    return setPassword(user, user.idNumber, true);
}
