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

describe("GET '/'", () => {

  let browser;

  beforeEach((done) => {
    browser = new Browser({ waitDuration: '30s', loadCss: false });
    browser.visit('/', (err) => {
      if (err) done.fail(err);
      browser.assert.success();
      done();
    });
  });


  afterEach((done) => {
    models.mongoose.connection.db.dropDatabase().then((err, result) => {
      done();
    }).catch((err) => {
      done.fail(err);         
    });
  });

  describe('unauthenticated access', () => {

    it('does not show form to submit partner', () => {
      expect(browser.query("form[action='/partner']")).toBeNull();
    });

    /**
     * POST /partner
     */
    it('does not allow posting partners', (done) => {
      request(app)
        .post('/partner')
        .field('name', 'The Rock')
        .field('email', 'dwayne@example.com')
        .end((err, res) => {
          if (err) return done.fail(err);
          expect(res.status).toEqual(401);
          done();
        });
    });

    /**
     * GET /partner/:id
     */
    it('does not allow viewing partners', (done) => {
      request(app)
        .get('/partner/123')
        .end((err, res) => {
          if (err) return done.fail(err);
          expect(res.status).toEqual(401);
          done();
        });
    });
  });

  describe('authenticated access', () => {

    let agent;

    beforeEach((done) => {
      fixtures.load(__dirname + '/../fixtures/agents.js', models.mongoose, (err) => {
        models.Agent.findOne({ email: 'manny@example.com' }).then((results) => {
          agent = results;
  
          browser.fill('email', agent.email);
          browser.fill('password', 'topsecret');
          browser.pressButton('Login', (err) => {
            if (err) done.fail(err);
            browser.assert.success();
            done();
          });
        });
      });
    });

    it('orders partners as they appear in an agent\'s partner list', (done) => {
      expect(agent.partners.length).toEqual(3);
      browser.visit('/', (err) => {
        if (err) done.fail(err);
        browser.assert.success();
        expect(browser.queryAll('article.partner').length).toEqual(3);

        // Ensure partner names are displayed
        browser.assert.link('article.partner:nth-child(1) header h1 a',
                            agent.partners[0].name, `/partner/${agent.partners[0]._id}`);
        browser.assert.text('article.partner:nth-child(1) header h2', agent.partners[0].email);

        browser.assert.link('section article.partner:nth-child(2) header h1 a',
                            agent.partners[1].name, `/partner/${agent.partners[1]._id}`);
        browser.assert.text('section article.partner:nth-child(2) header h2', agent.partners[1].email);

        browser.assert.link('section article.partner:nth-child(3) header h1 a',
                            agent.partners[2].name, `/partner/${agent.partners[2]._id}`);
        browser.assert.text('section article.partner:nth-child(3) header h2', agent.partners[2].email);

        done();
      });
    });

    /**
     * POST /partner
     */
    describe('submit partner', () => {
      it('shows form to submit partner', () => {
        browser.assert.attribute('#new-partner-form', 'action', '/partner');
        browser.assert.element('form input[name=name]');
      });
  
      describe('successful partner submission by member agent', () => {
        it('adds a new partner to the database', (done) => {
          expect(agent.partners.length).toEqual(3);
          browser.fill('name', 'John the Jolly Giant');
          browser.fill('email', 'john@example.com');
          browser.pressButton('Add New', (err) => {
            if (err) return done.fail(err);
    
            models.Agent.findById(agent._id).then((agent) => {
              if (err) done.fail(err);
              expect(agent.partners.length).toEqual(4);
              expect(agent.partners[0].name).toEqual('John the Jolly Giant');
              expect(agent.partners[0].email).toEqual('john@example.com');
              done();
             }).catch((err) => {
               done.fail(err);
            });
          });
        });

        it('lands on new partner page with a success message', (done) => {
          browser.fill('name', 'John the Jolly Giant');
          browser.fill('email', 'john@example.com');
          browser.pressButton('Add New', (err) => {
            if (err) done.fail(err);
            browser.assert.success();
            models.Agent.findById(agent._id).then((agent) => {
              if (err) done.fail(err);
              expect(agent.partners.length).toEqual(4);
              browser.assert.url({ pathname: `/partner/${agent.partners[0]._id}` });
              browser.assert.text('.alert.alert-success', `Added ${agent.partners[0].name} to prayer chain`);
              done();
            }).catch((err) => {
              done.fail(err);
            });
          });
        });
      });

      describe('unsuccessful partner submission', () => {

        it('does not create an partner unless a name is provided', (done) => {
          browser.assert.elements('.partner', 3);
          browser.fill('name', '   ');
          browser.fill('email', 'noName@example.com');
          browser.pressButton('Add New', (err) => {
            if (err) return done.fail(err);
            browser.assert.success();
            browser.assert.url({ pathname: '/' });
            browser.assert.elements('.partner', 3);
            models.Agent.findById(agent._id).then((agent) => {
              expect(agent.partners.length).toEqual(3);
              browser.assert.text('.alert.alert-danger', 'No name supplied');
 
              done();
            }).catch((err) => {
              done.fail(err);
            });
          });
        });

        it('does not create an partner unless an email is provided', (done) => {
          browser.assert.elements('.partner', 3);
          browser.fill('name', 'Some Guy   ');
          browser.fill('email', '   ');
          browser.pressButton('Add New', (err) => {
            if (err) return done.fail(err);
            browser.assert.success();
            browser.assert.url({ pathname: '/' });
            browser.assert.elements('.partner', 3);
            models.Agent.findById(agent._id).then((agent) => {
              expect(agent.partners.length).toEqual(3);
              browser.assert.text('.alert.alert-danger', 'No email supplied');
 
              done();
            }).catch((err) => {
              done.fail(err);
            });
          });
        });
      });
    });
  });
});
