'use strict';
const _ = require('lodash');
const expect = require('expect.js');
const Swagger2Postman = require('../');
const fs = require('fs');
const path = require('path');

/* global describe, it */
describe('converter tests', function () {
    let samples = fs.readdirSync(path.join(__dirname, 'data'));

    samples.map(function (sample) {
        let samplePath = path.join(__dirname, 'data', sample);
        it('must convert ' + samplePath + ' to a postman collection', function (done) {
            let converter = new Swagger2Postman();
            converter.convert(samplePath, function (err, result) {
                expect(result).to.be.ok();
                done(err);
            });
        });
        return null;
    });

    it('must read values from the "x-postman-meta" key - auth (promise)', function (done) {
        let samplePath = path.join(__dirname, 'data', 'swagger_aws.json');
        let converter = new Swagger2Postman();
        converter.convert(samplePath).then(function (result) {
            expect(result.item[0].item[0].request).to.have.key('auth');
            expect(result.item[0].item[0].request.auth).to.have.key('awsv4');
            done();
        }).catch(function (err) {
            done(err);
        });
    });

    it('must read values from the "x-postman-meta" key - auth', function (done) {
        let samplePath = path.join(__dirname, 'data', 'swagger_aws.json');
        let converter = new Swagger2Postman();
        converter.convert(samplePath, function (err, result) {
            if (err) {
                done(err);
                return;
            }
            expect(result.item[0].item[0].request).to.have.key('auth');
            expect(result.item[0].item[0].request.auth).to.have.key('awsv4');
            done();
        });
    });

    it('must read values from the "x-postman-meta" key - tests', function (done) {
        let samplePath = path.join(__dirname, 'data', 'no_definitions.yaml');
        let converter = new Swagger2Postman();
        converter.convert(samplePath, function (err, result) {
            if (err) {
                done(err);
                return;
            }
            expect(result.item[1].item[0].events[0]).to.have.key('script');
            expect(result.item[1].item[0].events[0].script.exec).to.contain(
                'postman.setEnvironmentVariable(\'username\', data.name);');
            done();
        });
    });

    it('should return an error on invalid api spec', function (done) {
        let samplePath = path.join(__dirname, 'invalid', 'no-paths.json');
        let converter = new Swagger2Postman();
        converter.convert(samplePath, function (err, result) {
            expect(err).to.be.ok();
            expect(result).not.to.be.ok();
            done();
        });
    });

    it('should return an error on invalid api spec (promise)', function (done) {
        let samplePath = path.join(__dirname, 'invalid', 'no-paths.json');
        let converter = new Swagger2Postman();
        converter.convert(samplePath).then(function (result) {
            expect(result).not.to.be.ok();
            done();
        }).catch(function (err) {
            expect(err).to.be.ok();
            done();
        });
    });

    it('should obey the excludeQueryParams option', function (done) {
        let options = {
            excludeQueryParams: true,
        };
        let samplePath = path.join(__dirname, 'data', 'sampleswagger.json');
        let converter = new Swagger2Postman(options);
        converter.convert(samplePath, function (err, result) {
            expect(result.item[0].item[3].request.url).not.to.have.key('query');
            done(err);
        });
    });

    it('should obey the excludeOptionalQueryParams option', function (done) {
        let opts = {
            excludeOptionalQueryParams: true,
        };
        let samplePath = path.join(__dirname, 'data', 'sampleswagger.json');
        let converter = new Swagger2Postman(opts);
        converter.convert(samplePath, function (err, result) {
            expect(result.item[0].item[3].request.url).not.to.have.key('query');
            done(err);
        });
    });

    it('should obey the excludeBodyTemplate option', function (done) {
        let options = {
            excludeBodyTemplate: true,
            excludeTests: true,
        };
        let samplePath = path.join(__dirname, 'data', 'sampleswagger.json');
        let converter = new Swagger2Postman(options);
        converter.setLogger(_.noop);
        converter.convert(samplePath, function (err, result) {
            expect(result.item[0].item[0].request.body.raw).to.be('Pet object that needs to be added to the store');
            done(err);
        });
    });

    it('should obey the excludeBodyTemplate option - another', function (done) {
        let options = {
            excludeBodyTemplate: false,
            excludeTests: true,
        };
        let samplePath = path.join(__dirname, 'data', 'swagger2.json');
        let converter = new Swagger2Postman(options);
        converter.convert(samplePath, function (err, result) {
            expect(result.item[1].item[0].request.body.raw).to.contain('rating');
            done(err);
        });
    });

    it('should obey the disableCollectionValidation option', function (done) {
        let options = {
            disableCollectionValidation: true,
        };
        let samplePath = path.join(__dirname, 'data', 'swagger2.json');
        let converter = new Swagger2Postman(options);
        converter.convert(samplePath, function (err, result) {
            expect(result).to.be.ok();
            done(err);
        });
    });

    it('should convert path paramters to postman-compatible paramters', function (done) {
        let samplePath = path.join(__dirname, 'data', 'swagger2-with-params.json');
        let converter = new Swagger2Postman();
        converter.convert(samplePath, function (err, result) {
            expect(result.item[0].item[0].request.url.path).to.contain(':ownerId');
            expect(result.item[0].item[0].request.url.path).to.contain(':petId');
            done(err);
        });
    });

    it('should obey the tagFilter option - tag not found', function (done) {
        let options = {
            tagFilter: 'FOO',
        };
        let samplePath = path.join(__dirname, 'data', 'swagger2.json');
        let converter = new Swagger2Postman(options);
        converter.convert(samplePath, function (err, result) {
            // one operation has a tag but the other does not; therefore the list should
            // only contain the operation with no tags.
            expect(result.item).to.have.length(1);
            expect(result.item[0].name).to.equal('Data');
            done(err);
        });
    });

    it('should obey the tagFilter option - tag found', function (done) {
        let options = {
            tagFilter: 'SampleTag',
        };
        let samplePath = path.join(__dirname, 'data', 'swagger2.json');
        let converter = new Swagger2Postman(options);
        converter.convert(samplePath, function (err, result) {
            expect(result.item.length > 0).to.be.ok();
            done(err);
        });
    });

    it('should default the host to "localhost"', function (done) {
        let samplePath = path.join(__dirname, 'data', 'swagger2.json');
        let converter = new Swagger2Postman();
        converter.convert(samplePath, function (err, result) {
            expect(result.item[0].item[0].request.url.host).to.be('localhost');
            done(err);
        });
    });

    it('should obey the host option', function (done) {
        let options = {
            host: 'my.example.com',
        };
        let samplePath = path.join(__dirname, 'data', 'swagger2.json');
        let converter = new Swagger2Postman(options);
        converter.convert(samplePath, function (err, result) {
            expect(result.item[0].item[0].request.url.host).to.be('my.example.com');
            done(err);
        });
    });

    it('should obey the defaultProducesType option', function (done) {
        let options = {
            defaultProducesType: 'application/json',
        };
        let samplePath = path.join(__dirname, 'data', 'sampleswagger.json');
        let converter = new Swagger2Postman(options);
        converter.convert(samplePath, function (err, result) {
            expect(result.item[0].item[6].request.header[0].value).to.be('application/json');
            done(err);
        });
    });

    it('should obey the defaultProducesType option - unknown value', function (done) {
        let options = {
            defaultProducesType: 'application/fake',
        };
        let samplePath = path.join(__dirname, 'data', 'sampleswagger.json');
        let converter = new Swagger2Postman(options);
        converter.convert(samplePath, function (err, result) {
            expect(result.item[0].item[6].request.header[0].value).to.be('application/xml');
            done(err);
        });
    });

    it('should obey the defaultSecurity option', function (done) {
        let options = {
            defaultSecurity: 'petstore_auth',
        };
        let samplePath = path.join(__dirname, 'data', 'sampleswagger.json');
        let converter = new Swagger2Postman(options);
        converter.convert(samplePath, function (err, result) {
            expect(result.item[0].item[0].request).to.have.key('auth');
            expect(result.item[0].item[0].request.header[1].value).to.be('Bearer {{petstore_auth_access_token}}');
            done(err);
        });
    });

    it('should obey the envfile option', function (done) {
        let filename = '/tmp/sampleswagger-env.json';
        let options = {
            envfile: filename,
        };
        let samplePath = path.join(__dirname, 'data', 'sampleswagger.json');
        let converter = new Swagger2Postman(options);
        converter.convert(samplePath, function (err, result) {
            expect(converter.envfile.name).to.be('sampleswagger-env');
            expect(converter.envfile._postman_variable_scope).to.be('environment');
            expect(converter.envfile.timestamp).to.be.ok();
            expect(converter.envfile.values.length).to.be.greaterThan(0);
            expect(result).to.be.ok();
            done(err);
        });
    });

});
