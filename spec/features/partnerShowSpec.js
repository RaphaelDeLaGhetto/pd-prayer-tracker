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

describe("GET '/partner/:id'", () => {

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
     * GET /partner/:id
     */
    it('does not allow viewing partners', done => {
      request(app)
        .get('/partner/123')
        .end((err, res) => {
          if (err) return done.fail(err);
          expect(res.status).toEqual(302); //redirected
          done();
        });
    });

    
    it('redirects to home for login', done => {
      browser.visit('/partner/123', err => {
        if (err) done.fail(err);
        browser.assert.redirected();
        browser.assert.url({ pathname: '/' });
        browser.assert.attribute('form', 'action', '/login');
        browser.assert.text('.alert.alert-info', 'Login first');
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
            done();
          });
        }).catch(err => {
          done.fail(err);
        });
      });
    });

    it('provides an error message if partner does not exist', done => {
      browser.visit('/partner/123', err => {
        if (err) done.fail(err);
        browser.assert.redirected();
        browser.assert.url({ pathname: '/' });
        browser.assert.text('.alert.alert-danger', 'That partner does not exist');
        done();
      });
    });

    describe('components rendered', () => {
      beforeEach(done => {
        browser.clickLink(agent.partners[0].name, err => {
          if (err) return done.fail(err);
          browser.assert.success(); 
          done();
        });
      });

      it('correctly renders the partner info an component fields', () => {
        browser.assert.text('article.partner header h1', agent.partners[0].name);
        browser.assert.link('article.partner header h2 a', agent.partners[0].email, `mailto:${agent.partners[0].email}`);
        browser.assert.element('#notes');
        browser.assert.element('#prayers');
        browser.assert.element('#donations');
        browser.assert.element('#thank-yous');
      });

      it('displays one note, a form, and a link to more notes', () => {
        browser.assert.elements('#notes .note', 1);
        browser.assert.attribute('#notes form', 'action', '/note');
        browser.assert.link('#notes a', 'More notes...', '/note');
      });
    });
  });
});
