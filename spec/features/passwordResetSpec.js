'use strict';

const Browser = require('zombie');
const fixtures = require('pow-mongoose-fixtures');
const models = require('../../models'); 
const mailer = require('../../mailer');
const app = require('../../app'); 
const request = require('supertest');

Browser.localhost('example.com', 3001);

// For when system resources are scarce
jasmine.DEFAULT_TIMEOUT_INTERVAL = 10000;

describe('password reset', () => {

  let browser, agent;

  beforeEach((done) => {
    browser = new Browser({ waitDuration: '30s', loadCss: false });
    fixtures.load(__dirname + '/../fixtures/agents.js', models.mongoose, (err) => {
      models.Agent.findOne().then((results) => {
        agent = results;
        browser.visit('/', (err) => {
          if (err) done.fail(err);
          browser.assert.success();
          done();
        });
      }).catch((error) => {
        done.fail(error);
      });
    });
  });

  it('displays the password reset link', () => {
    expect(browser.query("a[href='/reset']")).not.toBeNull();
    browser.assert.text("a[href='/reset']", 'Reset Password');
  });

  describe('GET /reset', () => {
    beforeEach((done) => {
       browser.clickLink('Reset Password', (err) => {
        if (err) done.fail(err);
        browser.assert.success();
        done();
      });   
    });

    it('displays a form for resetting a password', () => {
      browser.assert.attribute('#reset-agent-password-form', 'action', '/reset');
      browser.assert.element('#reset-agent-password-form input[name=email]');
      browser.assert.element('#reset-agent-password-form button[type=submit]');
    });

    describe('POST /reset', () => {
      describe('registered agent', () => {
        beforeEach((done) => {
          expect(agent.resetPasswordToken).toBe(undefined);
          expect(agent.resetPasswordExpires).toBe(undefined);
          browser.fill('email', agent.email);
          browser.pressButton('Reset', (err) => {
            if (err) done.fail(err);
            browser.assert.success();
            done();
          });
        });

        afterEach((done) => {
          mailer.transport.sentMail = [];
          done();
        });
  
        it('displays success message', (done) => {
          browser.assert.text('.alert.alert-success',
                  'An email has been sent to ' + agent.email + ' with further instructions');
          done();
        });

        it('sets reset token and expiry in existing agent document', (done) => {
          models.Agent.findById(agent._id).then((results) => {
            expect(results.resetPasswordToken).not.toBe(undefined);
            expect(results.resetPasswordToken).not.toBeNull();
            expect(results.resetPasswordExpires).not.toBe(undefined);
            expect(results.resetPasswordExpires).not.toBeNull();
            done();
          }).catch((err) => {
            done.fail(err);
          });
        });
  
        it('sends an email containing the reset link to the agent', (done) => {
          expect(mailer.transport.sentMail.length).toEqual(1);
          expect(mailer.transport.sentMail[0].data.to).toEqual(agent.email);
          expect(mailer.transport.sentMail[0].data.from).toEqual(process.env.FROM);
          expect(mailer.transport.sentMail[0].data.subject).toEqual('Prayer Chain Password Reset');
          models.Agent.findById(agent._id).then((agent) => {
            expect(mailer.transport.sentMail[0].data.text).
              toContain('https://example.com/reset/' + agent.resetPasswordToken);
            done();
          }).catch((err) => {
            done.fail(err);
          });
        });

        describe('GET /reset/:token', () => {

          beforeEach((done) => {
            models.Agent.findById(agent._id).then((results) => {
              agent = results;
              browser.visit('/reset/' + agent.resetPasswordToken, (err) => {
                if (err) done.fail(err);
                browser.assert.success();
                done();
              });
            }).catch((err) => {
              done.fail(err);
            });
          });

          it('displays the form to reset the password', () => {
            browser.assert.attribute('#reset-password-form', 'action',
                    '/reset/' + agent.resetPasswordToken + '?_method=PUT');
            browser.assert.element('#reset-password-form input[name=password]');
            browser.assert.element('#reset-password-form input[name=confirm]');
            browser.assert.element('#reset-password-form button[type=submit]');
          });

          it('displays an error if token has expired', (done) => {
            agent.resetPasswordExpires = Date.now() - 3600000; // 1 hour go
            models.Agent.findByIdAndUpdate(agent._id, agent, {new: true}).then((agent) => {
              browser.visit('/reset/' + agent.resetPasswordToken, (err) => {
                if (err) done.fail(err);
                browser.assert.success();
                browser.assert.url({ pathname: '/reset' });
                browser.assert.text('.alert.alert-danger', 'Password reset token is invalid or has expired');
                done();
              });
            }).catch((err) => {
              done.fail(err);
            });
          });

          describe('PUT /reset/:token', () => {
            it('changes agent\'s password', (done) => {
              browser.fill('password', 'newpassword');
              browser.fill('confirm', 'newpassword');
              browser.pressButton('Reset', (err) => {
                if (err) done.fail(err);
                browser.assert.success();
                browser.assert.url({ pathname: '/' });
                browser.fill('email', agent.email);
                browser.fill('password', 'newpassword');
                browser.pressButton('Login', (err) => {
                  browser.assert.success();
                  done();
                });
              });
            });

            it('displays an error if passwords don\'t match', (done) => {
              browser.fill('password', 'password');
              browser.fill('confirm', 'newpassword');
              browser.pressButton('Reset', (err) => {
                if (err) done.fail(err);
                browser.assert.success();
                browser.assert.url({ pathname: '/reset/' + agent.resetPasswordToken });
                browser.assert.text('.alert.alert-danger', 'Passwords don\'t match');
                done();
              });
            });

            it('redirects if token has expired', (done) => {
              agent.resetPasswordExpires = Date.now() - 3600000; // 1 hour go
              models.Agent.findByIdAndUpdate(agent._id, agent, {new: true}).then((agent) => {
                request(app)
                  .put('/reset/' + agent.resetPasswordToken)
                  .send({ password: 'newPassword', confirm: 'newPassword' })
                  .expect('Location', /\/reset/)
                  .end((err, res) => {
                    if (err) done.fail(err);
                    done();        
                  });
              }).catch((err) => {
                done.fail(err);
              });
            });
          });
        });
      });

      describe('unknown agent', () => {
        beforeEach((done) => {
           browser.fill('email', 'nosuchagent@example.com');
           browser.pressButton('Reset', (err) => {
             if (err) done.fail(err);
             browser.assert.success();
             done();
           });
        }); 

        it('displays error message', (done) => {
          browser.assert.text('.alert.alert-danger', 'No account with that email address has been registered');
          done();
        });

        it('does not send an email', (done) => {
          expect(mailer.transport.sentMail.length).toEqual(0);
          done();
        });
      });
    });
  });
});
