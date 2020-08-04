var should = require('should');
var assert = require('assert');
var request = require('supertest');
var redis = require('redis');
var config = require('../config.js');
var lab = require("../lab.js");
var client = redis.createClient();
describe('Endpoint', function () {
    var url = 'http://localhost:8080/lab/';
    var site;

    beforeEach(function (done) {
        client.flushall();
        site = require('../index.js');
        done();
    });

    afterEach(function (done) {
        site.internal.close(function () {
            site.external.close(done);
        });
    });

    describe('Lab', function () {
        it('Should allow admin user to swipe in.', function (done) {
            var swipeData = {
                idNumber: config.adminId
            };
            lab.labActions.closeLab();
            request(url)
                .post('/swipe')
                .send(swipeData)
                .end(function (err, res) {
                    res.text.should.be.exactly('0');
                    request(url)
                        .get('/status')
                        .end(function (err, res) {
                            res.body.open.should.be.exactly(true);
                            Object.keys(res.body.members).length.should.be.exactly(1);
                            res.body.members[config.adminUsername].should.be.exactly(config.adminName);
                            done();
                        });
                    if (err) {
                        throw err;
                    }
                });
        });
    });
});
