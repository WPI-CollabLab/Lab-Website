import {createConnection} from "typeorm";
import * as config from "../config"
import {expect} from "chai"
import {User} from "../models/user";
import {Swipe} from "../models/swipe";
import * as common from "../common";
import session from "supertest-session"

describe('Endpoint', () => {
    let site;
    let extSession;
    let intSession;
    const TEST_USER_ID = '420696969';
    const TEST_USER_NAME = "Test User";
    const TEST_USER_USERNAME = "testing";
    const TEST_USER_PASSWORD = "t3st_us3r";
    const TEST_USER_NICKNAME = "New Guy";

    before( async () => {
        await createConnection().then(async (connection) => {
            User.useConnection(connection);
            Swipe.useConnection(connection);
            if (config.nukeOnRestart) {
                await common.resetDatabase();
            }

        })
        site = require('../index');
        extSession = session(site.external);
        intSession = session(site.internal);
    });

    after(function (done) {
        site.internal.close(function () {
            site.external.close(done);
        });
    });

    describe('Lab Swiping', function () {
        it('Should allow admin user to swipe in w/ id number.', function (done) {
            intSession
                .post('/lab/swipe')
                .send({idNumber: config.adminUsername})
                .end(function (err, res) {
                    expect(res.text).to.equal('0');
                    return intSession
                        .get('/lab/status')
                        .end((err, res) => {
                            expect(res.body.open).to.equal(true);
                            expect(Object.keys(res.body.members).length).to.equal(1);
                            expect(res.body.members[config.adminUsername]).to.equal(config.adminName);
                            done();
                        });
                });
        });
        it('Should allow admin user to swipe out w/ id number.', function (done) {
            intSession
                .post('/lab/swipe')
                .send({idNumber: config.adminUsername})
                .end(function (err, res) {
                    expect(res.text).to.equal('0');
                    return intSession
                        .get('/lab/status')
                        .end(function (err, res) {
                            expect(res.body.open).to.equal(false);
                            expect(Object.keys(res.body.members).length).to.equal(0);
                            done();
                        });
                });
        });
        it('Should allow admin user to swipe in w/ username.', function (done) {
            intSession
                .post('/lab/swipe')
                .send({idNumber: config.adminUsername})
                .end(function (err, res) {
                    expect(res.text).to.equal('0');
                    return intSession
                        .get('/lab/status')
                        .end(function (err, res) {
                            expect(res.body.open).to.equal(true);
                            expect(Object.keys(res.body.members).length).to.equal(1);
                            expect(res.body.members[config.adminUsername]).to.equal(config.adminName);
                            done();
                        });
                });
        });
        it('Should allow admin user to swipe out w/ username.', function (done) {
            intSession
                .post('/lab/swipe')
                .send({idNumber: config.adminUsername})
                .end(function (err, res) {
                    expect(res.text).to.equal('0');
                    return intSession
                        .get('/lab/status')
                        .end(function (err, res) {
                            expect(res.body.open).to.equal(false);
                            expect(Object.keys(res.body.members).length).to.equal(0);
                            done();
                        });
                })
        });
        it('Should allow admin user to close lab from lab system.', function (done) {
            before(async () => {
                return intSession
                    .post('/lab/swipe')
                    .send({idNumber: config.adminUsername})
                    .end(function (err, res) {
                        expect(res.text).to.equal('0');
                        return intSession
                            .get('/lab/status')
                            .end(function (err, res) {
                                expect(res.body.open).to.equal(false);
                                expect(Object.keys(res.body.members).length).to.equal(0);

                            });
                    });
            })
            let closeData = {
                idNumber: config.adminId,
                password: config.defaultAdminPassword
            };

            intSession
                .post('/lab/close')
                .send(closeData)
                .end((err, res) => {
                    expect(res.text).to.equal('0');
                    return intSession
                        .get('/lab/status')
                        .end(function (err, res) {
                            expect(res.body.open).to.equal(false);
                            expect(Object.keys(res.body.members).length).to.equal(0);
                            done();
                        });
                })
        });
    });

    describe('User Settings', function () {
        it('New user can be created.', (done) => {
           extSession
               .post('/users/register')
               .send({
                   name: TEST_USER_NAME,
                   username: TEST_USER_USERNAME,
                   newId: TEST_USER_ID,
                   approverId: config.adminId,
                   password: TEST_USER_PASSWORD,
               }).end((err,res) => {
                   expect(res.text).to.equal('0');
                   done();
           })
        });

        it('Can login as new user.', (done) => {
            extSession
                .post('/users/login')
                .send({idNumber: TEST_USER_ID, password: TEST_USER_PASSWORD})
                .end((err,res) =>{
                    expect(res.text).to.equal('0');
                    done();
            })
        });

        it('New user can\'t swipe in, bc they arent a lab monitor yet.', (done) => {
            intSession
                .post('/lab/swipe')
                .send({idNumber: TEST_USER_ID})
                .end(function (err, res) {
                    expect(res.text).to.equal('1');
                    return intSession
                        .get('/lab/status')
                        .end(function (err, res) {
                            expect(res.body.open).to.equal(false);
                            expect(Object.keys(res.body.members).length).to.equal(0);
                            done();
                        });
                });
        });

        it('New user can become lab monitor.', (done) => {
            extSession
                .post('/manage/getPermission')
                .send({passphrase: config.labMonitorPassphrase})
                .end((err, res) => {
                    expect(res.text).to.equal('0');
                    done();
                });
        });

        it('New user can swipe in, bc they just got promoted to lab monitor.', (done) => {
            intSession
                .post('/lab/swipe')
                .send({idNumber: TEST_USER_ID})
                .end(function (err, res) {
                    expect(res.text).to.equal('0');
                    return intSession
                        .get('/lab/status')
                        .end(function (err, res) {
                            expect(res.body.open).to.equal(true);
                            expect(Object.keys(res.body.members).length).to.equal(1);
                            done();
                        });
                });
        });

        it('Should allow new user to set a nickname.', function (done) {
            extSession
                .post('/manage/changeNickname')
                .send({nickname: TEST_USER_NICKNAME}).end((err,res) => {
                    expect(res.text).to.equal('0');
                    return extSession
                    .get('/lab/status')
                    .end(function (err, res) {
                        expect(res.body.open).to.equal(true);
                        expect(res.body.members[TEST_USER_USERNAME]).to.equal(TEST_USER_NAME+' ('+TEST_USER_NICKNAME+')');
                        done();
                    });
            })

        });

        it('Should allow new user to close lab from management system.', function (done) {
            extSession
                .post('/manage/closeLab')
                .end((err, res) => {
                    expect(res.text).to.equal('0');
                    return intSession
                        .get('/lab/status')
                        .end(function (err, res) {
                            expect(res.body.open).to.equal(false);
                            expect(Object.keys(res.body.members).length).to.equal(0);
                            done();
                        });
                });
        });
    });
});
