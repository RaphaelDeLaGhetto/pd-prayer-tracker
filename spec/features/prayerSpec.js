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

    /**
     * POST /prayer
     */
    it('does not allow posting prayers', (done) => {
      request(app)
        .post('/partner/123/prayer')
        .field('text', 'Praise you, Jesus!')
        .end((err, res) => {
          if (err) return done.fail(err);
          expect(res.status).toEqual(403);
          done();
        });
    });

    /**
     * GET /prayer/:id
     */
    it('does not allow viewing prayers', (done) => {
      browser.visit('/partner/123/prayer', (err) => {
        if (err) done.fail(err);
        browser.assert.success();
        browser.assert.redirected();
        browser.assert.url('/');
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

    it('does not allow you to view another agent\'s partner prayers', done => {
      expect(danny.partners.length).toEqual(1);
      expect(danny.partners[0]._id).not.toEqual(manny.partners[1]._id);

      browser.visit(`/partner/${manny.partners[1]._id}/prayer`, err => {
        if (err) return done.fail(err);
        browser.assert.redirected();
        browser.assert.url({ pathname: '/' });
        browser.assert.text('.alert.alert-danger', 'You have no such partner');
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

    it('orders prayers as they appear in an agent\'s prayer list', (done) => {
      expect(agent.partners[0].prayers.length).toEqual(4);
      browser.visit(`/partner/${agent.partners[0]._id}/prayer`, (err) => {
        if (err) done.fail(err);
        browser.assert.success();
        expect(browser.queryAll('article.prayer').length).toEqual(4);

        // Ensure prayers are displayed
        browser.assert.text('article.prayer:nth-of-type(1) p.date-time',
                            agent.partners[0].prayers[0].createdAt.toString());
        browser.assert.text('article.prayer:nth-of-type(1) p:nth-child(2)', agent.partners[0].prayers[0].text);
        browser.assert.link('article.prayer:nth-of-type(1) a', 'edit',
                            `/partner/${agent.partners[0]._id}/prayer/${agent.partners[0].prayers[0]._id}`);

        browser.assert.text('article.prayer:nth-of-type(2) p.date-time',
                            agent.partners[0].prayers[1].createdAt.toString());
        browser.assert.text('article.prayer:nth-of-type(2) p:nth-child(2)', agent.partners[0].prayers[1].text);
        browser.assert.link('article.prayer:nth-of-type(2) a', 'edit',
                            `/partner/${agent.partners[0]._id}/prayer/${agent.partners[0].prayers[1]._id}`);

        browser.assert.text('article.prayer:nth-of-type(3) p.date-time',
                            agent.partners[0].prayers[2].createdAt.toString());
        browser.assert.text('article.prayer:nth-of-type(3) p:nth-child(2)', agent.partners[0].prayers[2].text);
        browser.assert.link('article.prayer:nth-of-type(3) a', 'edit',
                            `/partner/${agent.partners[0]._id}/prayer/${agent.partners[0].prayers[2]._id}`);

        browser.assert.text('article.prayer:nth-of-type(4) p.date-time',
                            agent.partners[0].prayers[3].createdAt.toString());
        browser.assert.text('article.prayer:nth-of-type(4) p:nth-child(2)', agent.partners[0].prayers[3].text);
        browser.assert.link('article.prayer:nth-of-type(4) a', 'edit',
                            `/partner/${agent.partners[0]._id}/prayer/${agent.partners[0].prayers[3]._id}`);

        done();
      });
    });

    /**
     * POST /prayer
     */
    describe('submit prayer', () => {
      beforeEach(done => {
        browser.visit(`/partner/${agent.partners[0]._id}/prayer`, (err) => {
          if (err) done.fail(err);
          browser.assert.success();
          done();
        });
      });

      it('shows form to submit prayer', () => {
        browser.assert.attribute('#new-prayer-form', 'action', `/partner/${agent.partners[0]._id}/prayer`);
        browser.assert.element('form textarea[name=text]');
      });
  
      describe('successful prayer submission by member agent', () => {
        it('adds a new prayer to the database', (done) => {
          expect(agent.partners[0].prayers.length).toEqual(4);
          browser.fill('text', 'Please bless their house');
          browser.pressButton('Add', (err) => {
            if (err) return done.fail(err);
    
            models.Agent.findById(agent._id).then((agent) => {
              if (err) done.fail(err);
              expect(agent.partners[0].prayers.length).toEqual(5);
              expect(agent.partners[0].prayers[0].text).toEqual('Please bless their house');
              done();
             }).catch((err) => {
               done.fail(err);
            });
          });
        });

        it('lands on prayer list page with a success message', (done) => {
          browser.fill('text', 'Please bless their house');
          browser.pressButton('Add', (err) => {
            if (err) done.fail(err);
            browser.assert.success();
            models.Agent.findById(agent._id).then((agent) => {
              if (err) done.fail(err);
              browser.assert.url({ pathname: `/partner/${agent.partners[0]._id}/prayer` });
              expect(agent.partners[0].prayers.length).toEqual(5);

              browser.assert.text('article.prayer:nth-of-type(1) p.date-time',
                                  agent.partners[0].prayers[0].createdAt.toString());
              browser.assert.text('article.prayer:nth-of-type(1) p:nth-child(2)', agent.partners[0].prayers[0].text);
              browser.assert.link('article.prayer:nth-of-type(1) a', 'edit',
                                  `/partner/${agent.partners[0]._id}/prayer/${agent.partners[0].prayers[0]._id}`);

              browser.assert.text('.alert.alert-success', `Prayer added`);

              done();
            }).catch((err) => {
              done.fail(err);
            });
          });
        });
      });

      describe('unsuccessful prayer submission', () => {

        it('does not create an prayer unless text is provided', (done) => {
          browser.assert.elements('article.prayer', 4);
          browser.fill('text', '   ');
          browser.pressButton('Add', (err) => {
            if (err) return done.fail(err);
            browser.assert.success();
            browser.assert.url({ pathname: `/partner/${agent.partners[0]._id}/prayer` });
            browser.assert.elements('article.prayer', 4);
            models.Agent.findById(agent._id).then((agent) => {
              expect(agent.partners[0].prayers.length).toEqual(4);
              browser.assert.text('.alert.alert-danger', 'No prayer text supplied');
 
              done();
            }).catch((err) => {
              done.fail(err);
            });
          });
        });

        it('does not create a prayer unless text is provided', (done) => {
          browser.assert.elements('article.prayer', 4);
          browser.fill('text', '   ');
          browser.pressButton('Add', (err) => {
            if (err) return done.fail(err);
            browser.assert.success();
            browser.assert.url({ pathname: `/partner/${agent.partners[0]._id}/prayer` });
            browser.assert.elements('article.prayer', 4);
            models.Agent.findById(agent._id).then((agent) => {
              expect(agent.partners[0].prayers.length).toEqual(4);
              browser.assert.text('.alert.alert-danger', 'No prayer text supplied');
 
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
