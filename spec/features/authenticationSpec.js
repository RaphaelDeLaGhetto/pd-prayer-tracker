'use strict';

const Browser = require('zombie');
const fixtures = require('pow-mongoose-fixtures');
const models = require('../../models'); 
const app = require('../../app'); 
const path = require('path');

Browser.localhost('example.com', 3001);

// For when system resources are scarce
jasmine.DEFAULT_TIMEOUT_INTERVAL = 10000;

describe('authentication', () => {

  let browser;

  beforeEach(done => {
    browser = new Browser();
    browser.visit('/', err => {
      if (err) return done.fail(err);
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

  it('shows the home page', () => {
    browser.assert.text('h1', 'PD Prayer Tracker');
  });

  it('displays the login form if not logged in', () => {
    browser.assert.attribute('form', 'action', '/login');
  });

  it('does not display the logout button if not logged in', () => {
    expect(browser.query("a[href='/logout']")).toBeNull();
  });

  it('does not display the logout button if not logged in', () => {
    expect(browser.query("a[href='/logout']")).toBeNull();
  });

  it('does not display any partners if not logged in', () => {
    expect(browser.queryAll('.partner').length).toEqual(0);
  });

  describe('login process', () => {

    let agent;
    beforeEach((done) => {
      fixtures.load(__dirname + '/../fixtures/agents.js', models.mongoose, (err) => {
        models.Agent.findOne({ email: 'danny@example.com' }).then((results) => {
          agent = results;

          browser.fill('email', agent.email);
          browser.fill('password', 'secret');
          browser.pressButton('Login', (err) => {
            if (err) done.fail(err);
            browser.assert.success();
            done();
          });
        });
      });
    });

    it('does not display the login form', () => {
      expect(browser.query("form[action='/login']")).toBeNull();
    });

    it('displays a friendly greeting', () => {
      browser.assert.text('.alert', 'Hello, ' + agent.email + '!');
    });

    it('displays partner prayer history', () => {
      expect(agent.partners.length > 0).toBe(true);
      browser.assert.text('#partners', 'Prayer Partners');
      expect(browser.queryAll('.partner').length).toEqual(agent.partners.length);
    });

    describe('logout', () => {
      it('does not display the logout button if not logged in', (done) => {
        browser
          .clickLink('Logout', (err) => {
            browser.assert.success();
            expect(browser.query("a[href='/logout']")).toBeNull();
            browser.assert.attribute('form', 'action', '/login');
            done();
          });
      });
    });
  });
});
