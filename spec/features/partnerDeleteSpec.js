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

describe("GET '/partner/:id/delete'", () => {

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
    it('does not allow an unauthenticated agent to delete a partner', done => {
      request(app)
        .delete('/partner/123')
        .end((err, res) => {
          if (err) return done.fail(err);
          expect(res.status).toEqual(403);
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

    it('does not allow you to delete another agent\'s prayer partner', done => {
      expect(danny.partners.length).toEqual(1);
      expect(danny.partners[0]._id).not.toEqual(manny.partners[1]._id);

      request(app)
        .delete(`/partner/${manny.partners[1]._id}`)
        .set('Cookie', browser.cookies)
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

    it('shows the delete form', () => {
      browser.assert.attribute('#delete-partner-form', 'action', `/partner/${agent.partners[0]._id}?_method=DELETE`);
      browser.assert.element('form input[type=submit][value=Delete');
    });

    it('redirects home with success message', done => {
      browser.pressButton('Delete', err => {
        if (err) return done.fail(err);
        browser.assert.text('.alert.alert-success', `${agent.partners[0].email} removed for eternity`);
        done();
      });
    });

    it('updates the database with new info', done => {
      models.Agent.findOne({ email: 'manny@example.com' }).then(results => {
        expect(results.partners.length).toEqual(3);
        expect(results.partners[0].email).toEqual(agent.partners[0].email);
        expect(results.partners[1].email).toEqual(agent.partners[1].email);
        expect(results.partners[2].email).toEqual(agent.partners[2].email);

        browser.pressButton('Delete', err => {
          if (err) return done.fail(err);
          models.Agent.findOne({ email: 'manny@example.com' }).then(results => {
            expect(results.partners.length).toEqual(2);
            expect(results.partners[0].email).toEqual(agent.partners[1].email);
            expect(results.partners[1].email).toEqual(agent.partners[2].email);

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
