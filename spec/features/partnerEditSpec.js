'use strict';

const Browser = require('zombie');
const fixtures = require('pow-mongoose-fixtures');
const models = require('../../models'); 
const path = require('path');

const app = require('../../app'); 
const request = require('supertest');

Browser.localhost('example.com', 3001);

// For when system resources are scarce
jasmine.DEFAULT_TIMEOUT_INTERVAL = 10000;

describe("GET '/partner/:id/edit'", () => {

  let browser;

  beforeEach(done => {
    browser = new Browser({ waitDuration: '30s', loadCss: false });
    browser.visit('/', err => {
      if (err) done.fail(err);
      browser.assert.success();
      done();
    });
  });


  afterEach(done => {
    models.mongoose.connection.db.dropDatabase().then((err, result) => {
      done();
    }).catch(err => {
      done.fail(err);         
    });
  });

  describe('unauthenticated access', () => {
    /**
     * GET /partner/:id/edit
     */
    it('does not allow access to partners edit form', done => {
      request(app)
        .get('/partner/123/edit')
        .end((err, res) => {
          if (err) return done.fail(err);
          expect(res.status).toEqual(302); //redirected
          done();
        });
    });

    
    it('redirects to home for login', done => {
      browser.visit('/partner/123/edit', err => {
        if (err) done.fail(err);
        browser.assert.redirected();
        browser.assert.url({ pathname: '/' });
        browser.assert.attribute('form', 'action', '/login');
        browser.assert.text('.alert.alert-info', 'Login first');
        done();
      });
    });
  });

  describe('unauthorized access', () => {
    let danny, manny;
    beforeEach(done => {
      fixtures.load(__dirname + '/../fixtures/agents.js', models.mongoose, err => {
        models.Agent.findOne({ email: 'manny@example.com' }).then(results => {
          manny = results;
 
          models.Agent.findOne({ email: 'danny@example.com' }).then(results => {
            danny = results;

            browser.fill('email', danny.email);
            browser.fill('password', 'secret');
            browser.pressButton('Login', err => {
              if (err) return done.fail(err);
              browser.assert.success();
              done();
            });
          }).catch(err => {
            done.fail(err);
          });
        }).catch(err => {
          done.fail(err);
        });
      });
    });

    it('does not allow you to view another agent\'s prayer partner edit form', done => {
      expect(danny.partners.length).toEqual(1);
      expect(danny.partners[0]._id).not.toEqual(manny.partners[1]._id);

      browser.visit(`/partner/${manny.partners[1]._id}/edit`, err => {
        if (err) return done.fail(err);
        browser.assert.redirected();
        browser.assert.url({ pathname: '/' });
        browser.assert.text('.alert.alert-danger', 'You have no such partner');
        done();
      });
    });

    it('does not allow you to update another agent\'s prayer partner', done => {
      expect(danny.partners.length).toEqual(1);
      expect(danny.partners[0]._id).not.toEqual(manny.partners[1]._id);

      request(app)
        .put(`/partner/${manny.partners[1]._id}`)
        .set('Cookie', browser.cookies)
        .send({
          email: 'newaddress@example.com',
        })
        .end((err, res) => {
          if (err) return done.fail(err);
          expect(res.status).toEqual(401);
          done();
        });
    });
  });

  describe('authenticated access', () => {

    let agent;
    beforeEach(done => {
      fixtures.load(__dirname + '/../fixtures/agents.js', models.mongoose, err => {
        models.Agent.findOne({ email: 'manny@example.com' }).then(results => {
          agent = results;
 
          browser.fill('email', agent.email);
          browser.fill('password', 'topsecret');
          browser.pressButton('Login', err => {
            if (err) return done.fail(err);
            browser.assert.success();

            browser.clickLink(agent.partners[0].name, err => {
              if (err) return done.fail(err);
              browser.assert.success();
              browser.clickLink('edit', err => {
                if (err) return done.fail(err);
                browser.assert.success();
                done();
              });
            });
          });
        }).catch(err => {
          done.fail(err);
        });
      });
    });

    it('shows the edit form', () => {
      browser.assert.attribute('#edit-partner-form', 'action', `/partner/${agent.partners[0]._id}?_method=PUT`);
      browser.assert.element('form input[name=name]');
    });

    it('does not allow duplicate emails', done => {
      browser.fill('email', agent.partners[1].email);
      browser.pressButton('Update', err => {
        if (err) return done.fail(err);
        browser.assert.text('.alert.alert-danger', `You already have a partner with email: ${agent.partners[1].email}`);
        done();
      });
    });

    it('does not update the database with duplicate emails', done => {
      models.Agent.findOne({ email: 'manny@example.com' }).then(results => {
        expect(results.partners.length).toEqual(3);
        expect(results.partners[1].email).not.toEqual(agent.partners[0].email);
 
        browser.fill('email', agent.partners[1].email);
        browser.pressButton('Update', err => {
          if (err) return done.fail(err);
          models.Agent.findOne({ email: 'manny@example.com' }).then(results => {
            expect(results.partners.length).toEqual(3);
            expect(results.partners[1].email).not.toEqual(agent.partners[0].email);
            expect(results.partners[0].email).toEqual(agent.partners[0].email);
 
            done();
          }).catch(err => {
            done.fail(err);
          });
        });
      }).catch(err => {
        done.fail(err);
      });
    });

    it('provides an error message if partner does not exist', done => {
      browser.visit('/partner/123/edit', err => {
        if (err) done.fail(err);
        browser.assert.redirected();
        browser.assert.url({ pathname: '/' });
        browser.assert.text('.alert.alert-danger', 'You have no such partner');
        done();
      });
    });

    it('allows a partner update', done => {
      browser.fill('email', 'somenewemail@example.com');
      browser.fill('name', 'Pastor Hank');
      browser.pressButton('Update', err => {
        if (err) return done.fail(err);
        browser.assert.redirected();
        browser.assert.url({ path: `/partner/${agent.partners[0]._id}` });
        browser.assert.text('.alert.alert-success', 'Update successful');
        done();
      });
    });

    it('updates the database with new info', done => {
      models.Agent.findOne({ email: 'manny@example.com' }).then(results => {
        expect(results.partners.length).toEqual(3);
        expect(results.partners[1].email).not.toEqual(agent.partners[0].email);
 
        browser.fill('email', 'somenewemail@example.com');
        browser.fill('name', 'Pastor Hank');
        browser.pressButton('Update', err => {
          if (err) return done.fail(err);
          models.Agent.findOne({ email: 'manny@example.com' }).then(results => {
            expect(results.partners.length).toEqual(3);
            expect(results.partners[0].email).toEqual('somenewemail@example.com');
            expect(results.partners[0].name).toEqual('Pastor Hank');
 
            done();
          }).catch(err => {
            done.fail(err);
          });
        });
      }).catch(err => {
        done.fail(err);
      });
    });
  });
});
